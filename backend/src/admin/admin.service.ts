import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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
    const [teachers, communities, posts, reports, unverifiedTeachers] =
      await Promise.all([
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
    const [recentRegistrations, recentPosts, recentReports] = await Promise.all(
      [
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
      ],
    );

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
          suspensionReason: true,
          suspensionStart: true,
          suspensionUntil: true,
          suspendedBy: true,
          suspensionCount: true,
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

  // Teacher suspension / restoration is owned by SuspensionService (history,
  // notifications, auto-expiry). AdminController delegates to it directly.

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
        {
          teacher: {
            firstName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          teacher: {
            lastName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          post: {
            community: {
              name: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
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
        message: 'Your report has been reviewed and no action was taken.',
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
      include: { post: true },
    });

    if (!report) throw new NotFoundException('Report not found');

    if (report.post) {
      const postId = report.post.id;
      // Also apply violation penalty
      this.progressService
        .applyViolationPenalty(report.post.teacherId, postId, reportId)
        .catch((err) =>
          console.error(`Failed to apply violation penalty: ${err.message}`),
        );

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
    if (query?.type) where.type = query.type.toUpperCase();
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
        type: dto.type as any,
        subtype: (dto.subtype ?? 'COMMON') as any,
        school: dto.school ?? null,
        woreda: dto.woreda ?? null,
        zone: dto.zone ?? null,
        region: dto.region ?? null,
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
        name: dto.name,
        type: dto.type as any,
        subtype: (dto.subtype ?? 'COMMON') as any,
        department: dto.department ?? null,
        school: dto.school ?? null,
        woreda: dto.woreda ?? null,
        zone: dto.zone ?? null,
        region: dto.region ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateCommunity(id: string, dto: UpdateCommunityDto) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community) throw new NotFoundException('Community not found');

    return this.prisma.community.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
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
    const [byType, bySubtype, total, totalMembers, totalPosts, pendingReports] =
      await Promise.all([
        this.prisma.community.groupBy({ by: ['type'], _count: true }),
        this.prisma.community.groupBy({ by: ['subtype'], _count: true }),
        this.prisma.community.count(),
        this.prisma.communityMember.count({ where: { status: 'APPROVED' } }),
        this.prisma.communityPost.count(),
        this.prisma.communityReport.count({ where: { status: 'PENDING' } }),
      ]);

    // Convert byType array to object for easier frontend consumption
    const byTypeObj = byType.reduce(
      (acc, item) => {
        acc[item.type] = item._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Ensure all types are present even if count is 0
    const allTypes = [
      'NETWORK',
      'NATIONAL',
      'REGION',
      'ZONE',
      'WOREDA',
      'SCHOOL',
    ];
    allTypes.forEach((type) => {
      if (!byTypeObj[type]) byTypeObj[type] = 0;
    });

    const active = await this.prisma.community.count({
      where: { isActive: true },
    });
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

  async getCommunityMembers(
    communityId: string,
    query?: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      level?: string;
    },
  ) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw new NotFoundException('Community not found');

    const skip = ((query?.page ?? 1) - 1) * (query?.pageSize ?? 20);
    const where: any = { communityId };

    if (query?.search) {
      where.teacher = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.level) {
      where.teacher = { ...where.teacher, level: query.level };
    }

    const [members, total] = await Promise.all([
      this.prisma.communityMember.findMany({
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
              school: true,
              department: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.communityMember.count({ where }),
    ]);

    return {
      data: members,
      meta: {
        total,
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
        totalPages: Math.ceil(total / (query?.pageSize ?? 20)),
      },
    };
  }

  async updateMemberStatus(
    communityId: string,
    memberId: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    const membership = await this.prisma.communityMember.findUnique({
      where: { id: memberId },
      include: { community: true, teacher: true },
    });

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.communityId !== communityId) {
      throw new NotFoundException(
        'Membership does not belong to this community',
      );
    }

    const updated = await this.prisma.communityMember.update({
      where: { id: memberId },
      data: { status },
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
    });

    // Notify teacher about status change
    this.notificationService
      .create({
        receiverId: membership.teacherId,
        title: 'Community Membership Updated',
        message: `Your membership in ${membership.community.name} has been ${status.toLowerCase()}.`,
        type: NotificationEvent.COMMUNITY_JOIN,
        referenceId: communityId,
      })
      .catch(() => {});

    return updated;
  }

  async removeMember(communityId: string, memberId: string) {
    const membership = await this.prisma.communityMember.findUnique({
      where: { id: memberId },
      include: { community: true, teacher: true },
    });

    if (!membership) throw new NotFoundException('Membership not found');
    if (membership.communityId !== communityId) {
      throw new NotFoundException(
        'Membership does not belong to this community',
      );
    }

    await this.prisma.communityMember.delete({
      where: { id: memberId },
    });

    // Notify teacher about removal
    this.notificationService
      .create({
        receiverId: membership.teacherId,
        title: 'Removed from Community',
        message: `You have been removed from ${membership.community.name}.`,
        type: NotificationEvent.COMMUNITY_JOIN,
        referenceId: communityId,
      })
      .catch(() => {});

    return { success: true, message: 'Member removed successfully' };
  }

  async getCommunityPosts(
    communityId: string,
    query?: {
      page?: number;
      pageSize?: number;
      search?: string;
      postType?: string;
      moderationStatus?: string;
    },
  ) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw new NotFoundException('Community not found');

    const skip = ((query?.page ?? 1) - 1) * (query?.pageSize ?? 20);
    const where: any = { communityId };

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.postType) {
      where.postType = query.postType;
    }

    if (query?.moderationStatus) {
      where.moderationStatus = query.moderationStatus;
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
            },
          },
          category: { select: { id: true, name: true } },
          _count: {
            select: {
              communityLikes: true,
              comments: true,
              communityReports: true,
            },
          },
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

  async getCommunityReports(
    communityId: string,
    query?: {
      page?: number;
      pageSize?: number;
      status?: string;
    },
  ) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community) throw new NotFoundException('Community not found');

    const skip = ((query?.page ?? 1) - 1) * (query?.pageSize ?? 20);
    const where: any = {
      post: { communityId },
    };

    if (query?.status) {
      where.status = query.status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.communityReport.findMany({
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
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              teacherId: true,
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
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
        pageSize: query?.pageSize ?? 20,
        totalPages: Math.ceil(total / (query?.pageSize ?? 20)),
      },
    };
  }

  // Post moderation (stats, listing, moderate, reports) lives in AdminPostsService.
}
