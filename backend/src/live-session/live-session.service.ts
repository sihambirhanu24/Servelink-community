import { Injectable, NotFoundException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { ApproveLiveSessionDto, RejectLiveSessionDto, RescheduleLiveSessionDto, UpdateLiveSessionStatusDto } from './dto/update-live-session.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LiveSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async create(teacherId: string, dto: CreateLiveSessionDto) {
    // Check if teacher already has a session at this time
    const start = new Date(dto.scheduledStart);
    const end = new Date(start.getTime() + dto.duration * 60000);
    
    const teacherConflicts = await this.prisma.liveSession.findMany({
      where: {
        teacherId,
        status: { in: ['APPROVED', 'LIVE', 'RESCHEDULED'] },
      },
    });

    const actualTeacherConflicts = teacherConflicts.filter(c => {
      const cEnd = new Date(c.scheduledStart.getTime() + c.duration * 60000);
      return (start < cEnd && end > c.scheduledStart);
    });

    if (actualTeacherConflicts.length > 0) {
      throw new ConflictException('You already have a session scheduled during this time');
    }

    const session = await this.prisma.liveSession.create({
      data: {
        teacherId,
        topic: dto.topic,
        description: dto.description,
        scheduledStart: new Date(dto.scheduledStart),
        duration: dto.duration,
        isPaid: dto.isPaid ?? false,
        price: dto.price ?? null,
        maxParticipants: dto.maxParticipants ?? null,
        visibility: dto.visibility || 'NETWORK',
        restreamPlayerUrl: dto.restreamUrl, // Storing the user-provided Restream URL here
      },
    });

    // Notify all admins (or just specific ones if assigned)
    // For now, we don't have a specific admin assignment on create.
    return session;
  }

  async findAllForTeacher(teacherId: string) {
    return this.prisma.liveSession.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true, email: true } },
      }
    });
  }

  async findAllForAdmin() {
    return this.prisma.liveSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      }
    });
  }

  async getDiscoverableSessions(teacherId: string) {
    // 1. Get the authenticated teacher to know their school, woreda, zone, region
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { school: true, woreda: true, zone: true, region: true }
    });

    if (!teacher) {
      throw new UnauthorizedException('Teacher not found');
    }

    // 2. Fetch all sessions that are NOT rejected or cancelled, etc
    const sessions = await this.prisma.liveSession.findMany({
      where: {
        status: { in: ['REQUESTED', 'APPROVED', 'LIVE', 'COMPLETED'] },
      },
      orderBy: { scheduledStart: 'asc' },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, school: true, woreda: true, zone: true, region: true } },
      }
    });

    // 3. Filter in-memory (or we could do complex Prisma ORs, but in-memory is safe for now)
    const discoverable = sessions.filter(session => {
      // Creator always sees their own
      if (session.teacherId === teacherId) return true;

      const creator = session.teacher;
      switch (session.visibility) {
        case 'NETWORK':
        case 'NATIONAL':
          return true; // All verified teachers
        case 'REGION':
          return teacher.region === creator.region;
        case 'ZONE':
          return teacher.zone === creator.zone;
        case 'WOREDA':
          return teacher.woreda === creator.woreda;
        case 'SCHOOL':
          return teacher.school === creator.school;
        default:
          return true; // Fallback
      }
    });

    // 4. Strip sensitive player URLs from the response if they are paid and not joined
    // (Actual joining requires payment, but we strip it from discovery entirely)
    return discoverable.map(session => {
      const { restreamPlayerUrl, restreamChannelId, adminId, ...safeSession } = session;
      return safeSession;
    });
  }

  async setReminder(id: string, teacherId: string) {
    const session = await this.findOne(id);
    
    // Check if reminder already exists
    const existing = await this.prisma.notification.findFirst({
      where: {
        receiverId: teacherId,
        type: 'LIVE_SESSION',
        referenceId: id,
        title: { startsWith: 'Reminder' }
      }
    });

    if (existing) {
      throw new ConflictException('Reminder already set for this session');
    }

    await this.prisma.notification.create({
      data: {
        receiverId: teacherId,
        title: `Reminder Set: ${session.topic}`,
        message: `You will be reminded before this session starts at ${new Date(session.scheduledStart).toLocaleString()}.`,
        type: 'LIVE_SESSION',
        referenceId: id,
      }
    });

    return { success: true, message: 'Reminder set successfully' };
  }

  async findOne(id: string, userId?: string, isAdmin?: boolean) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        admin: { select: { id: true, name: true, email: true } },
      }
    });
    if (!session) throw new NotFoundException('Live session not found');

    if (!userId) return { ...session, access: { canAccess: false, role: 'GUEST' } };

    const isHost = session.teacherId === userId;
    const isGlobalAdmin = isAdmin;

    let canAccess = false;
    let role = 'GUEST';
    let registrationStatus = 'NONE';
    let paymentStatus: string | null = null;

    if (isGlobalAdmin) {
      canAccess = true;
      role = 'ADMIN';
    } else if (isHost) {
      canAccess = true;
      role = 'HOST';
    } else {
      if (!session.isPaid) {
        canAccess = true;
        role = 'PARTICIPANT';
      } else {
        // Paid session check
        const registration = await this.prisma.liveSessionRegistration.findUnique({
          where: {
            teacherId_liveSessionId: {
              teacherId: userId,
              liveSessionId: id,
            },
          },
        });

        if (registration && registration.status !== 'CANCELLED') {
          canAccess = true;
          role = 'PARTICIPANT';
          registrationStatus = registration.status;
          paymentStatus = 'SUCCESSFUL';
        } else {
          // Check payment if registration isn't created yet or to get PENDING/FAILED status
          const payment = await this.prisma.payment.findFirst({
            where: {
              teacherId: userId, // Payer
              liveSessionId: id,
            },
            orderBy: { createdAt: 'desc' }
          });
          if (payment) {
            paymentStatus = payment.status;
            if (payment.status === 'SUCCESSFUL') {
              canAccess = true;
              role = 'PARTICIPANT';
              registrationStatus = 'REGISTERED (LEGACY)';
            }
          }
        }
      }
    }

    if (!canAccess) {
      const { restreamPlayerUrl, restreamChannelId, ...safeSession } = session;
      return { ...safeSession, access: { canAccess, role, registrationStatus, paymentStatus } };
    }

    return { ...session, access: { canAccess, role, registrationStatus, paymentStatus } };
  }

  private async checkConflict(adminId: string, start: Date, durationMinutes: number, excludeId?: string) {
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const conflicts = await this.prisma.liveSession.findMany({
      where: {
        adminId,
        status: { in: ['APPROVED', 'LIVE', 'RESCHEDULED'] },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    // Filter down more precisely in JS to be safe, since end time isn't stored directly (we could add it, but this is simpler)
    const actualConflicts = conflicts.filter(c => {
      const cEnd = new Date(c.scheduledStart.getTime() + c.duration * 60000);
      return (start < cEnd && end > c.scheduledStart);
    });

    if (actualConflicts.length > 0) {
      throw new ConflictException('Admin already has a session scheduled during this time');
    }
  }

  async approve(id: string, adminId: string, dto: ApproveLiveSessionDto) {
    const session = await this.findOne(id);
    if (session.status !== 'REQUESTED' && session.status !== 'RESCHEDULED') {
      throw new ConflictException('Can only approve requested or rescheduled sessions');
    }

    const assignedAdminId = dto.adminId || adminId;

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminId: assignedAdminId,
        meetingRoomId: `session_${id}`,
      },
    });

    await this.prisma.notification.create({
      data: {
        receiverId: session.teacherId,
        title: 'Live Session Approved',
        message: `Your live session "${session.topic}" has been approved.`,
        type: 'LIVE_SESSION',
        referenceId: id,
      }
    });

    return updated;
  }

  async reject(id: string, adminId: string, dto: RejectLiveSessionDto) {
    const session = await this.findOne(id);
    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminId,
        rejectionReason: dto.reason,
      },
    });

    await this.prisma.notification.create({
      data: {
        receiverId: session.teacherId,
        title: 'Live Session Rejected',
        message: `Your live session "${session.topic}" was rejected: ${dto.reason}`,
        type: 'LIVE_SESSION',
        referenceId: id,
      }
    });

    return updated;
  }

  async reschedule(id: string, adminId: string, dto: RescheduleLiveSessionDto) {
    const session = await this.findOne(id);
    
    await this.checkConflict(adminId, new Date(dto.scheduledStart), session.duration, id);

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        scheduledStart: new Date(dto.scheduledStart),
        adminId,
      },
    });

    await this.prisma.notification.create({
      data: {
        receiverId: session.teacherId,
        title: 'Live Session Rescheduled',
        message: `Your live session "${session.topic}" has been rescheduled to ${new Date(dto.scheduledStart).toLocaleString()}.`,
        type: 'LIVE_SESSION',
        referenceId: id,
      }
    });

    return updated;
  }

  async updateStatus(id: string, userId: string, isAdmin: boolean, dto: UpdateLiveSessionStatusDto) {
    const session = await this.findOne(id);
    
    // Verify participant
    if (!isAdmin && session.teacherId !== userId) {
      throw new ForbiddenException('Not authorized for this session');
    }
    
    let startedAt = session.startedAt;
    let endedAt = session.endedAt;

    if (dto.status === 'LIVE' && !startedAt) {
      startedAt = new Date();
    } else if (dto.status === 'COMPLETED' && !endedAt) {
      endedAt = new Date();
    }

    return this.prisma.liveSession.update({
      where: { id },
      data: { 
        status: dto.status, 
        startedAt, 
        endedAt,
        ...(dto.restreamPlayerUrl && { restreamPlayerUrl: dto.restreamPlayerUrl }),
        ...(dto.restreamChannelId && { restreamChannelId: dto.restreamChannelId })
      }
    });
  }

}
