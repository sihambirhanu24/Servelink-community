import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: create
  // ─────────────────────────────────────────────────────────────────────────

  async create(
    dto: CreateAnnouncementDto,
    adminId: string,
    adminName: string,
    file?: Express.Multer.File,
  ) {
    return this.prisma.announcement.create({
      data: {
        title:          dto.title,
        content:        dto.content,
        type:           (dto.type           ?? 'GENERAL')      as any,
        targetAudience: (dto.targetAudience ?? 'ALL_TEACHERS') as any,
        communityId:    dto.communityId    ?? null,
        createdById:    adminId,
        createdByName:  adminName,
        status:         'DRAFT'            as any,
        attachmentUrl:  file ? `uploads/announcements/${file.filename}` : null,
        attachmentName: file ? file.originalname : null,
        attachmentSize: file ? file.size : null,
      },
      include: { community: { select: { id: true, name: true, type: true } } },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: list all (with optional filters)
  // ─────────────────────────────────────────────────────────────────────────

  async findAll(query?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }) {
    const page     = query?.page     ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const skip     = (page - 1) * pageSize;

    const where: any = {};
    if (query?.status) where.status = query.status as any;
    if (query?.search) {
      where.OR = [
        { title:   { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          community: { select: { id: true, name: true, type: true } },
          _count: { select: { reads: true } },
        },
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: get one
  // ─────────────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const ann = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        community: { select: { id: true, name: true, type: true } },
        _count: { select: { reads: true } },
      },
    });
    if (!ann) throw new NotFoundException('Announcement not found');
    return ann;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: update
  // ─────────────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateAnnouncementDto,
    file?: Express.Multer.File,
  ) {
    await this.findOne(id); // throws if not found

    const data: any = {};
    if (dto.title          !== undefined) data.title          = dto.title;
    if (dto.content        !== undefined) data.content        = dto.content;
    if (dto.type           !== undefined) data.type           = dto.type;
    if (dto.targetAudience !== undefined) data.targetAudience = dto.targetAudience;
    if (dto.communityId    !== undefined) data.communityId    = dto.communityId || null;

    if (file) {
      data.attachmentUrl  = `uploads/announcements/${file.filename}`;
      data.attachmentName = file.originalname;
      data.attachmentSize = file.size;
    }

    return this.prisma.announcement.update({
      where: { id },
      data,
      include: { community: { select: { id: true, name: true, type: true } } },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: delete
  // ─────────────────────────────────────────────────────────────────────────

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: publish / unpublish
  // ─────────────────────────────────────────────────────────────────────────

  async publish(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.update({
      where: { id },
      data:  { status: 'PUBLISHED' as any, publishedAt: new Date() },
      include: { community: { select: { id: true, name: true, type: true } } },
    });
  }

  async unpublish(id: string) {
    await this.findOne(id);
    return this.prisma.announcement.update({
      where: { id },
      data:  { status: 'DRAFT' as any, publishedAt: null },
      include: { community: { select: { id: true, name: true, type: true } } },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEACHER: get visible announcements
  //
  // Rules:
  //  ALL_TEACHERS  → visible to every teacher
  //  SCHOOL/WOREDA/ZONE/REGION/NATIONAL → visible only when the teacher's
  //    geographic/community scope matches (or the announcement targets a
  //    community the teacher belongs to)
  // ─────────────────────────────────────────────────────────────────────────

  async findForTeacher(teacherId: string, limit = 20, page = 1) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { school: true, woreda: true, zone: true, region: true, level: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Build the "OR" conditions: teacher can see an announcement if any of
    // these match.
    const orClauses: any[] = [
      // 1. All-teacher broadcast
      { targetAudience: 'ALL_TEACHERS' },
    ];

    // 2. Geographic-scoped announcements:
    if (teacher.school) {
      orClauses.push({
        targetAudience: 'SCHOOL',
        community: { school: { equals: teacher.school, mode: 'insensitive' } },
      });
    }
    if (teacher.woreda) {
      orClauses.push({
        targetAudience: 'WOREDA',
        community: { woreda: { equals: teacher.woreda, mode: 'insensitive' } },
      });
    }
    if (teacher.zone) {
      orClauses.push({
        targetAudience: 'ZONE',
        community: { zone: { equals: teacher.zone, mode: 'insensitive' } },
      });
    }
    if (teacher.region) {
      orClauses.push({
        targetAudience: 'REGION',
        community: { region: { equals: teacher.region, mode: 'insensitive' } },
      });
    }
    // National: visible to all
    orClauses.push({ targetAudience: 'NATIONAL' });

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where: {
          status: 'PUBLISHED' as any,
          OR: orClauses,
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        include: {
          community: { select: { id: true, name: true, type: true } },
          reads: {
            where: { teacherId },
            select: { readAt: true },
          },
        },
      }),
      this.prisma.announcement.count({
        where: {
          status: 'PUBLISHED' as any,
          OR: orClauses,
        },
      }),
    ]);

    // Reshape: add `isRead` field
    const announcements = data.map((ann) => ({
      ...ann,
      isRead: ann.reads.length > 0,
      readAt: ann.reads[0]?.readAt ?? null,
      reads: undefined, // strip raw reads array from response
    }));

    return {
      data: announcements,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEACHER: get single announcement (with access check)
  // ─────────────────────────────────────────────────────────────────────────

  async findOneForTeacher(announcementId: string, teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { school: true, woreda: true, zone: true, region: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const ann = await this.prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        community: { select: { id: true, name: true, type: true, school: true, woreda: true, zone: true, region: true } },
        reads: { where: { teacherId }, select: { readAt: true } },
      },
    });
    if (!ann) throw new NotFoundException('Announcement not found');
    if (ann.status !== 'PUBLISHED') throw new NotFoundException('Announcement not found');

    // Access check
    if (!this.canTeacherSeeAnnouncement(ann, teacher)) {
      throw new ForbiddenException('You do not have access to this announcement');
    }

    return {
      ...ann,
      isRead: ann.reads.length > 0,
      readAt: ann.reads[0]?.readAt ?? null,
      reads: undefined,
    };
  }

  private canTeacherSeeAnnouncement(
    ann: any,
    teacher: { school: string; woreda: string; zone: string; region: string },
  ): boolean {
    switch (ann.targetAudience) {
      case 'ALL_TEACHERS': return true;
      case 'NATIONAL':     return true;
      case 'SCHOOL':
        return ann.community
          ? ann.community.school?.toLowerCase() === teacher.school?.toLowerCase()
          : false;
      case 'WOREDA':
        return ann.community
          ? ann.community.woreda?.toLowerCase() === teacher.woreda?.toLowerCase()
          : false;
      case 'ZONE':
        return ann.community
          ? ann.community.zone?.toLowerCase() === teacher.zone?.toLowerCase()
          : false;
      case 'REGION':
        return ann.community
          ? ann.community.region?.toLowerCase() === teacher.region?.toLowerCase()
          : false;
      default: return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEACHER: mark as read
  // ─────────────────────────────────────────────────────────────────────────

  async markAsRead(announcementId: string, teacherId: string) {
    // Upsert — safe to call multiple times
    await this.prisma.announcementRead.upsert({
      where: { announcementId_teacherId: { announcementId, teacherId } },
      update: {}, // already read — no-op
      create: { announcementId, teacherId },
    });
    return { read: true };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN: summary for dashboard
  // ─────────────────────────────────────────────────────────────────────────

  async getSummary() {
    const [published, draft, recent] = await Promise.all([
      this.prisma.announcement.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.announcement.count({ where: { status: 'DRAFT'     } }),
      this.prisma.announcement.findMany({
        where:   { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take:    5,
        select:  { id: true, title: true, type: true, publishedAt: true, createdByName: true },
      }),
    ]);
    return { published, draft, recent };
  }
}
