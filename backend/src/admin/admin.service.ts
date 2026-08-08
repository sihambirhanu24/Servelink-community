import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import { UpgradeLevelDto } from './dto/upgrade-level.dto';
import { TeachersQueryDto } from './dto/teachers-query.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async dashboard() {
    const [teachers, communities, posts, reports] = await Promise.all([
      this.prisma.teacher.count(),
      this.prisma.community.count(),
      this.prisma.communityPost.count(),
      this.prisma.communityReport.count(),
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

    return { statistics: { teachers, communities, posts, reports }, teacherLevels, recentTeachers };
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
          verified: true,
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
}
