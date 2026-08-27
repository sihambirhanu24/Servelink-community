import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TeacherProgressService } from '../progress/teacher-progress.service';
import { NotificationEvent } from '../notification/notification.types';
import { UpgradeLevelDto } from './dto/upgrade-level.dto';
import { TeachersQueryDto } from './dto/teachers-query.dto';
import { CreateCommunityDto, UpdateCommunityDto } from './dto/community.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly progressService: TeacherProgressService,
  ) {}

  async dashboard() {
    const [teachers, communities, posts, reports, unverifiedTeachers] = await Promise.all([
      this.prisma.teacher.count(),
      this.prisma.community.count(),
      this.prisma.communityPost.count(),
      this.prisma.communityReport.count(),
      this.prisma.teacher.count({ where: { verified: false } }),
    ]);

    const teacherLevels = await this.prisma.teacher.groupBy({
      by: ['level'],
      _count: true,
    });

    const recentTeachers = await this.prisma.teacher.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        level: true,
        createdAt: true,
      },
    });

    // Get real recent activity: new registrations and recent posts
    const [recentRegistrations, recentPosts, recentReports] = await Promise.all([
      this.prisma.teacher.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),
      this.prisma.communityPost.findMany({
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          createdAt: true,
          community: { select: { name: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.communityReport.findMany({
        take: 2,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reason: true,
          createdAt: true,
          post: { select: { title: true } },
        },
      }),
    ]);

    return {
      statistics: {
        teachers,
        communities,
        posts,
        reports,
        pendingVerification: unverifiedTeachers,
      },
      teacherLevels,
      recentTeachers,
      recentActivity: {
        registrations: recentRegistrations,
        posts: recentPosts,
        reports: recentReports,
      },
    };
  }

  async getTeachers(query: TeachersQueryDto) {
    const skip = ((query.page ?? 1) - 1) * (query.pageSize ?? 20);
    const where: any = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.teacherLevel) where.level = query.teacherLevel;

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take: query.pageSize ?? 20,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          level: true,
          status: true,
          school: true,
          woreda: true,
          zone: true,
          region: true,
          subject: true,
          department: true,
          verified: true,
          verificationStatus: true,
          rejectionReason: true,
          approvedAt: true,
          createdAt: true,
          verificationDocuments: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              fileSize: true,
              uploadedAt: true,
            },
          },
        },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return {
      data: teachers,
      meta: { total, page: query.page ?? 1, pageSize: query.pageSize ?? 20 },
    };
  }

  async upgradeLevel(dto: UpgradeLevelDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
      select: { id: true, firstName: true, lastName: true, level: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const updated = await this.prisma.teacher.update({
      where: { id: dto.teacherId },
      data: { level: dto.level as any },
      select: { id: true, firstName: true, lastName: true, level: true },
    });

    const levelLabel = dto.level.replace('_', ' ');
    await this.notificationService
      .create({
        receiverId: dto.teacherId,
        title: 'Level Upgrade!',
        message: `Congratulations ${teacher.firstName}! You have been upgraded to ${levelLabel}.`,
        type: NotificationEvent.LEVEL_UPGRADE,
      })
      .catch(() => {});

    return updated;
  }

  async suspendTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { status: 'SUSPENDED' as any },
    });
  }

  async activateTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    return this.prisma.teacher.update({
      where: { id: teacherId },
      data: { status: 'ACTIVE' as any },
    });
  }

  async getReports(query?: {
    page?: number;
    pageSize?: number;
    search?: string;
    reason?: string;
    status?: string;
  }) {
    const skip = ((query?.page ?? 1) - 1) * (query?.pageSize ?? 10);
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { post: { title: { contains: query.search, mode: 'insensitive' } } },
        { teacher: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { teacher: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { post: { community: { name: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    if (query?.reason) {
      where.reason = query.reason;
    }

    if (query?.status) {
      where.status = query.status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.communityReport.findMany({
        where,
        skip,
        take: query?.pageSize ?? 10,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              community: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.communityReport.count({ where }),
    ]);

    return {
      data: reports,
      meta: {
        total,
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 10,
        totalPages: Math.ceil(total / (query?.pageSize ?? 10)),
      },
    };
  }

  async updateReportStatus(reportId: string, status: string) {
    const report = await this.prisma.communityReport.findUnique({
      where: { id: reportId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            teacherId: true,
          },
        },
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const updatedReport = await this.prisma.communityReport.update({
      where: { id: reportId },
      data: { status: status as any },
      include: {
        teacher: { select: { firstName: true, lastName: true, email: true } },
        post: { select: { id: true, title: true, teacherId: true } },
      },
    });

    // Points are only deducted when admin explicitly deletes/removes the post,
    // NOT when the status is merely updated to RESOLVED or any other value.
    // The penalty is applied in removeContentFromReport() below.

    return updatedReport;
  }

  /**
   * Resolve a report by ID: action was taken.
   * - Marks report RESOLVED with reviewer info
   * - Notifies reporter that their report was reviewed
   * - Notifies post owner that their post was reviewed (no reporter info revealed)
   */
  async resolveReportById(reportId: string, adminId: string) {
    const report = await this.prisma.communityReport.findUnique({
      where: { id: reportId },
      include: {
        post: { select: { id: true, title: true, teacherId: true } },
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.communityReport.update({
      where: { id: reportId },
      data: {
        status: 'RESOLVED' as any,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        post: { select: { id: true, title: true, teacherId: true } },
      },
    });

    // Notify REPORTER — action was taken (never expose who owns the post)
    this.notificationService
      .create({
        receiverId: report.teacherId,
        title: 'Report Reviewed',
        message: 'Your report has been reviewed by an administrator.',
        type: NotificationEvent.REPORT,
        referenceId: report.postId,
      })
      .catch(() => {});

    // Notify POST OWNER — reviewed, action taken (never expose reporter)
    if (report.post?.teacherId) {
      this.notificationService
        .create({
          receiverId: report.post.teacherId,
          title: 'Your Post Was Reviewed',
          message:
            'Your post was reviewed by an administrator following a report.',
          type: NotificationEvent.REPORT,
          referenceId: report.postId,
        })
        .catch(() => {});
    }

    return updated;
  }

  /**
   * Dismiss a report: no action taken.
   * - Marks report DISMISSED with reviewer info
   * - Notifies reporter (no action taken)
   * - Notifies post owner (cleared — no action taken, no reporter info)
   */
  async dismissReport(reportId: string, adminId: string) {
    const report = await this.prisma.communityReport.findUnique({
      where: { id: reportId },
      include: {
        post: { select: { id: true, title: true, teacherId: true } },
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.communityReport.update({
      where: { id: reportId },
      data: {
        status: 'DISMISSED' as any,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } },
        post: { select: { id: true, title: true, teacherId: true } },
      },
    });

    // Notify REPORTER — no action taken
    this.notificationService
      .create({
        receiverId: report.teacherId,
        title: 'Report Reviewed',
        message:
          'Your report has been reviewed and no action was taken.',
        type: NotificationEvent.REPORT,
        referenceId: report.postId,
      })
      .catch(() => {});

    // Notify POST OWNER — reviewed, no action (never expose reporter)
    if (report.post?.teacherId) {
      this.notificationService
        .create({
          receiverId: report.post.teacherId,
          title: 'Your Post Was Reviewed',
          message:
            'Your post was reviewed by an administrator. No action was taken.',
          type: NotificationEvent.REPORT,
          referenceId: report.postId,
        })
        .catch(() => {});
    }

    return updated;
  }

  /**
   * Warn the user: marks report RESOLVED but does NOT deduct points.
   * The teacher receives a notification warning without any point penalty.
   */
  async warnUserFromReport(reportId: string) {
    const report = await this.prisma.communityReport.findUnique({
      where: { id: reportId },
      include: {
        post: { select: { id: true, title: true, teacherId: true } },
      },
    });
    if (!report) throw new NotFoundException('Report not found');

    const updated = await this.prisma.communityReport.update({
      where: { id: reportId },
      data: { status: 'RESOLVED' as any },
      include: {
        teacher: { select: { firstName: true, lastName: true, email: true } },
        post: { select: { id: true, title: true, teacherId: true } },
      },
    });

    // Send a warning notification — no point deduction
    if (report.post?.teacherId) {
      this.notificationService
        .create({
          receiverId: report.post.teacherId,
          title: 'Content Warning',
          message: `Your post "${report.post.title}" has been reviewed and received a warning from the ServeLink administrators. Please review our community guidelines.`,
          type: NotificationEvent.REPORT,
        })
        .catch((err) => {
          console.error(`Failed to send warning notification: ${err.message}`);
        });
    }

    return updated;
  }

  async removeContentFromReport(reportId: string) {
    const report = await this.prisma.communityReport.findUnique({
      where: { id: reportId },
      include: { post: true }
    });

    if (!report) throw new NotFoundException('Report not found');

    if (report.post) {
      const postId = report.post.id;
      // Also apply violation penalty
      this.progressService
        .applyViolationPenalty(report.post.teacherId, postId, reportId)
        .catch((err) => console.error(`Failed to apply violation penalty: ${err.message}`));

      await this.prisma.$transaction(async (tx) => {
        await tx.attachment.deleteMany({ where: { postId } });
        await tx.communityComment.deleteMany({ where: { postId } });
        await tx.communityLike.deleteMany({ where: { postId } });
        await tx.communityBookmark.deleteMany({ where: { postId } });
        await tx.communityReport.deleteMany({ where: { postId } });
        await tx.postTag.deleteMany({ where: { postId } });
        await tx.communityPost.delete({ where: { id: postId } });
      });
    }

    return { message: 'Content removed successfully' };
  }

  // ─── Community CRUD (admin-only) ─────────────────────────────────────────

  async getCommunities(query?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    subtype?: string;
    isActive?: boolean;
  }) {
    const skip = ((query?.page ?? 1) - 1) * (query?.pageSize ?? 20);
    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { department: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.type)    where.type    = query.type.toUpperCase();
    if (query?.subtype) where.subtype = query.subtype.toUpperCase();
    if (query?.isActive !== undefined) where.isActive = query.isActive;

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        skip,
        take: query?.pageSize ?? 20,
        orderBy: [{ type: 'asc' }, { subtype: 'asc' }, { name: 'asc' }],
        include: {
          _count: { select: { communityMembers: true, posts: true } },
          chatRoom: { select: { id: true } },
        },
      }),
      this.prisma.community.count({ where }),
    ]);

    return {
      data: communities,
      meta: {
        total,
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
        totalPages: Math.ceil(total / (query?.pageSize ?? 20)),
      },
    };
  }

  async getCommunityById(id: string) {
    const community = await this.prisma.community.findUnique({
      where: { id },
      include: {
        communityMembers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                level: true,
                school: true,
                department: true,
              },
            },
          },
        },
        _count: { select: { communityMembers: true, posts: true } },
        chatRoom: { select: { id: true } },
      },
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async createCommunity(dto: CreateCommunityDto) {
    // Validate uniqueness before creating — provide a clear error
    const existing = await this.prisma.community.findFirst({
      where: {
        type:       dto.type as any,
        subtype:    (dto.subtype ?? 'COMMON') as any,
        school:     dto.school     ?? null,
        woreda:     dto.woreda     ?? null,
        zone:       dto.zone       ?? null,
        region:     dto.region     ?? null,
        department: dto.department ?? null,
      },
    });
    if (existing) {
      throw new ConflictException(
        `A community with this type, subtype, geographic scope, and department already exists (id: ${existing.id}).`,
      );
    }

    return this.prisma.community.create({
      data: {
        name:        dto.name,
        type:        dto.type as any,
        subtype:     (dto.subtype ?? 'COMMON') as any,
        department:  dto.department ?? null,
        school:      dto.school     ?? null,
        woreda:      dto.woreda     ?? null,
        zone:        dto.zone       ?? null,
        region:      dto.region     ?? null,
        description: dto.description ?? null,
        isActive:    true,
      },
    });
  }

  async updateCommunity(id: string, dto: UpdateCommunityDto) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community) throw new NotFoundException('Community not found');

    return this.prisma.community.update({
      where: { id },
      data: {
        ...(dto.name        !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive    !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async toggleCommunityActive(id: string) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community) throw new NotFoundException('Community not found');
    return this.prisma.community.update({
      where: { id },
      data: { isActive: !community.isActive },
    });
  }

  async getCommunityStats() {
    const [byType, bySubtype, total, totalMembers, totalPosts, pendingReports] = await Promise.all([
      this.prisma.community.groupBy({ by: ['type'], _count: true }),
      this.prisma.community.groupBy({ by: ['subtype'], _count: true }),
      this.prisma.community.count(),
      this.prisma.communityMember.count({ where: { status: 'APPROVED' } }),
      this.prisma.communityPost.count(),
      this.prisma.communityReport.count({ where: { status: 'PENDING' } }),
    ]);

    // Convert byType array to object for easier frontend consumption
    const byTypeObj = byType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all types are present even if count is 0
    const allTypes = ['NETWORK', 'NATIONAL', 'REGION', 'ZONE', 'WOREDA', 'SCHOOL'];
    allTypes.forEach(type => {
      if (!byTypeObj[type]) byTypeObj[type] = 0;
    });

    const active = await this.prisma.community.count({ where: { isActive: true } });
    const inactive = total - active;

    return {
      total,
      active,
      inactive,
      byType: byTypeObj,
      bySubtype,
      totalMembers,
      totalPosts,
      pendingReports,
    };
  }

  // ─── Post Moderation (admin-only) ─────────────────────────────────────────

  async getPostStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, todayPosts, reported, underReview, removed, hidden] = await Promise.all([
      this.prisma.communityPost.count(),
      this.prisma.communityPost.count({ where: { createdAt: { gte: today } } }),
      this.prisma.communityPost.count({ where: { moderationStatus: 'REPORTED' } }),
      this.prisma.communityPost.count({ where: { moderationStatus: 'UNDER_REVIEW' } }),
      this.prisma.communityPost.count({ where: { moderationStatus: 'REMOVED' } }),
      this.prisma.communityPost.count({ where: { moderationStatus: 'HIDDEN' } }),
    ]);

    return {
      total,
      todayPosts,
      reported,
      underReview,
      removed,
      hidden,
    };
  }

  async getPosts(query?: {
    page?: number;
    pageSize?: number;
    search?: string;
    communityId?: string;
    communityType?: string;
    teacherLevel?: string;
    moderationStatus?: string;
    postType?: string;
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
    reportStatus?: string;
  }) {
    const skip = ((query?.page ?? 1) - 1) * (query?.pageSize ?? 20);
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { teacher: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { teacher: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { teacher: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query?.communityId) where.communityId = query.communityId;
    if (query?.communityType) where.community = { type: query.communityType };
    if (query?.teacherLevel) where.teacher = { level: query.teacherLevel };
    if (query?.moderationStatus) where.moderationStatus = query.moderationStatus;
    if (query?.postType) where.postType = query.postType;
    if (query?.categoryId) where.categoryId = query.categoryId;

    if (query?.reportStatus) {
      if (query.reportStatus === 'NO_REPORTS') {
        where.communityReports = { none: {} };
      } else if (query.reportStatus === 'REPORTED') {
        where.communityReports = { some: {} };
      } else if (query.reportStatus === 'UNRESOLVED') {
        where.communityReports = { some: { status: 'PENDING' } };
      } else if (query.reportStatus === 'RESOLVED') {
        // Find posts where there are reports, and NONE of them are PENDING
        // This means they have all been reviewed.
        where.communityReports = {
          some: {}, // Has at least one report
          none: { status: 'PENDING' } // But none are pending
        };
      }
    }

    if (query?.dateFrom || query?.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: query?.pageSize ?? 20,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              level: true,
              verified: true,
              status: true,
              profileImage: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              type: true,
              school: true,
              woreda: true,
              zone: true,
              region: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              communityLikes: true,
              comments: true,
              communityBookmarks: true,
              communityReports: true,
            },
          },
          attachments: true,
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: {
        total,
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
        totalPages: Math.ceil(total / (query?.pageSize ?? 20)),
      },
    };
  }

  async getPostById(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            verified: true,
            status: true,
            profileImage: true,
            school: true,
            department: true,
            suspensionReason: true,
            suspensionStart: true,
            suspensionUntil: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            type: true,
            school: true,
            woreda: true,
            zone: true,
            region: true,
            department: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            communityLikes: true,
            comments: true,
            communityBookmarks: true,
            communityReports: true,
          },
        },
        attachments: true,
        comments: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        communityReports: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        moderationHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async moderatePost(id: string, adminId: string, action: 'REMOVE' | 'HIDDEN' | 'RESTORE', reason?: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: { teacher: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    let moderationStatus: any;
    let moderationAction: any;
    let notificationTitle = '';
    let notificationMessage = '';

    if (action === 'REMOVE') {
      moderationStatus = 'REMOVED';
      moderationAction = 'POST_REMOVED';
      notificationTitle = 'Post Removed';
      notificationMessage = reason
        ? `Your post "${post.title}" has been removed because: ${reason}`
        : `Your post "${post.title}" has been removed by an administrator.`;
    } else if (action === 'HIDDEN') {
      moderationStatus = 'HIDDEN';
      moderationAction = 'POST_HIDDEN';
      notificationTitle = 'Post Hidden';
      notificationMessage = `Your post "${post.title}" has been hidden by an administrator.`;
    } else if (action === 'RESTORE') {
      moderationStatus = 'ACTIVE';
      moderationAction = 'POST_RESTORED';
      notificationTitle = 'Post Restored';
      notificationMessage = `Your post "${post.title}" has been restored and is now visible again.`;
    }

    // Update post moderation status
    const updatedPost = await this.prisma.communityPost.update({
      where: { id },
      data: {
        moderationStatus,
        moderatedById: adminId,
        moderationReason: reason,
        moderatedAt: new Date(),
      },
    });

    // Create moderation history record
    await this.prisma.moderationHistory.create({
      data: {
        postId: id,
        teacherId: post.teacherId,
        adminId,
        action: moderationAction,
        reason,
      },
    });

    // Resolve related reports if post is removed/hidden
    if (action === 'REMOVE' || action === 'HIDDEN') {
      await this.prisma.communityReport.updateMany({
        where: { postId: id, status: 'PENDING' },
        data: {
          status: 'RESOLVED',
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
    }

    // Send notification to post author
    try {
      await this.notificationService.create({
        receiverId: post.teacherId,
        title: notificationTitle,
        message: notificationMessage,
        type: NotificationEvent.SYSTEM,
        referenceId: id,
      });
    } catch (error) {
      // Log error but don't fail the moderation action
      console.error('Failed to send notification:', error);
    }

    return updatedPost;
  }

  async getPostModerationHistory(postId: string) {
    const history = await this.prisma.moderationHistory.findMany({
      where: { postId },
      include: {
        post: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }

  async resolvePostReport(postId: string, reportId: string, adminId: string, action: 'RESOLVE' | 'DISMISS') {
    const report = await this.prisma.communityReport.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');

    const status = action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED';

    const updatedReport = await this.prisma.communityReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    // Add moderation history
    await this.prisma.moderationHistory.create({
      data: {
        postId: postId,
        teacherId: report.teacherId, // Note: This logs the reporter, which is standard for tracking action taken on their report
        adminId,
        action: action === 'RESOLVE' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED',
      },
    });

    return updatedReport;
  }
}