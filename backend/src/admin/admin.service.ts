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

    // If report is RESOLVED (violation confirmed), apply penalty to post owner
    if (status === 'RESOLVED' && report.post) {
      this.progressService
        .applyViolationPenalty(report.post.teacherId, report.post.id, reportId)
        .catch((err) => {
          console.error(`Failed to apply violation penalty: ${err.message}`);
        });
    }

    return updatedReport;
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
    const [byType, bySubtype, total] = await Promise.all([
      this.prisma.community.groupBy({ by: ['type'],    _count: true }),
      this.prisma.community.groupBy({ by: ['subtype'], _count: true }),
      this.prisma.community.count(),
    ]);
    return { total, byType, bySubtype };
  }
}