import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import {
  ApproveLiveSessionDto,
  RejectLiveSessionDto,
  RescheduleLiveSessionDto,
  UpdateLiveSessionStatusDto,
} from './dto/update-live-session.dto';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '../payment/payment.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import { LiveKitService } from './livekit.service';
import {
  accountSuspendedException,
  evaluateSuspension,
  suspensionSnapshotSelect,
} from '../suspension/suspension-state';

type SessionRealTimeStatus = 'UPCOMING' | 'LIVE' | 'ENDED';

@Injectable()
export class LiveSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
    private readonly liveKitService: LiveKitService,
  ) {}

  /**
   * Centralized session status calculation function
   *
   * Rules:
   * - UPCOMING: currentTime < startTime
   * - LIVE: startTime <= currentTime < endTime
   * - ENDED: currentTime >= endTime
   *
   * @param scheduledStart - Date object
   * @param durationMinutes - Duration in minutes
   * @param now - Optional current time (for testing)
   * @returns The real-time status
   */
  private getSessionStatus(
    scheduledStart: Date,
    durationMinutes: number,
    now: number = Date.now(),
  ): SessionRealTimeStatus {
    if (!scheduledStart || !durationMinutes) {
      return 'ENDED'; // Default to ENDED for invalid data
    }

    const startTime = scheduledStart.getTime();
    const endTime = startTime + durationMinutes * 60 * 1000;

    // Validate times
    if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
      return 'ENDED'; // Invalid data - treat as ended
    }

    if (now >= endTime) {
      return 'ENDED';
    }

    if (now >= startTime && now < endTime) {
      return 'LIVE';
    }

    return 'UPCOMING';
  }

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

    const actualTeacherConflicts = teacherConflicts.filter((c) => {
      const cEnd = new Date(c.scheduledStart.getTime() + c.duration * 60000);
      return start < cEnd && end > c.scheduledStart;
    });

    if (actualTeacherConflicts.length > 0) {
      throw new ConflictException(
        'You already have a session scheduled during this time',
      );
    }

    // ── Provider validation ───────────────────────────────────────────────
    const provider = dto.provider ?? 'LIVEKIT';

    if (provider === 'GOOGLE_MEET') {
      // meetingUrl is required and must be a legitimate Google Meet link
      if (!dto.meetingUrl || dto.meetingUrl.trim() === '') {
        throw new BadRequestException(
          'Google Meet link is required when provider is GOOGLE_MEET.',
        );
      }
      this.validateGoogleMeetUrl(dto.meetingUrl);
    }

    if (provider === 'LIVEKIT' && dto.meetingUrl) {
      // Silently ignore meetingUrl for LiveKit — it will not be stored
    }
    // ─────────────────────────────────────────────────────────────────────

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
        visibility: (dto.visibility || 'NETWORK') as any,
        provider: provider as any,
        meetingUrl: provider === 'GOOGLE_MEET' ? dto.meetingUrl!.trim() : null,
      },
    });

    if (provider === 'GOOGLE_MEET') {
      // No LiveKit room name needed for Google Meet sessions
      return session;
    }

    // LIVEKIT: assign a room name (room is created lazily on first join)
    const livekitRoomName = this.liveKitService.roomNameFor(session.id);
    return this.prisma.liveSession.update({
      where: { id: session.id },
      data: { livekitRoomName, meetingRoomId: livekitRoomName },
    });
  }

  /**
   * Validate that the provided URL is a legitimate Google Meet link.
   * Accepts: https://meet.google.com/xxx-xxxx-xxx
   * Rejects: non-https, non-google, javascript:, data:, etc.
   */
  private validateGoogleMeetUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url.trim());
    } catch {
      throw new BadRequestException(
        'Please provide a valid Google Meet meeting link.',
      );
    }

    if (parsed.protocol !== 'https:') {
      throw new BadRequestException(
        'Please provide a valid Google Meet meeting link (must use HTTPS).',
      );
    }

    // Accept meet.google.com and regional variants like meet.google.co.uk
    if (
      !parsed.hostname.endsWith('google.com') &&
      !parsed.hostname.endsWith('google.co.uk') &&
      !parsed.hostname.startsWith('meet.google.')
    ) {
      throw new BadRequestException(
        'Please provide a valid Google Meet meeting link (must be a meet.google.com URL).',
      );
    }

    if (!parsed.hostname.startsWith('meet.')) {
      throw new BadRequestException(
        'Please provide a valid Google Meet meeting link.',
      );
    }
  }

  async findAllForTeacher(teacherId: string) {
    const sessions = await this.prisma.liveSession.findMany({
      where: { teacherId, archivedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        payments: {
          where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
          select: { id: true, amount: true, status: true, refundStatus: true },
        },
      },
    });

    const now = Date.now();
    return sessions
      .filter((session) => {
        if (session.status === 'CANCELLED') return true;
        const realTimeStatus = this.getSessionStatus(
          session.scheduledStart,
          session.duration,
          now,
        );
        if (realTimeStatus === 'ENDED' && session.status !== 'COMPLETED') {
          return false;
        }
        return true;
      })
      .map((session) => this.withHostActions(session, teacherId, false));
  }

  async findAllForAdmin() {
    const sessions = await this.prisma.liveSession.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
          },
        },
        admin: { select: { id: true, name: true, email: true } },
        payments: {
          where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
          select: { id: true, amount: true, status: true, refundStatus: true },
        },
      },
    });

    return sessions.map((session) =>
      this.withHostActions(session, undefined, true),
    );
  }

  async getDiscoverableSessions(teacherId: string) {
    // 1. Get the authenticated teacher to know their school, woreda, zone, region
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { school: true, woreda: true, zone: true, region: true },
    });

    if (!teacher) {
      throw new UnauthorizedException('Teacher not found');
    }

    // 2. Fetch all sessions that are NOT rejected or cancelled, etc
    const sessions = await this.prisma.liveSession.findMany({
      where: {
        status: {
          in: ['REQUESTED', 'APPROVED', 'LIVE', 'COMPLETED', 'CANCELLED'],
        },
        archivedAt: null,
      },
      orderBy: { scheduledStart: 'asc' },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            school: true,
            woreda: true,
            zone: true,
            region: true,
          },
        },
        payments: {
          where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
          select: { id: true, amount: true, status: true, refundStatus: true },
        },
      },
    });

    // 3. Filter in-memory (or we could do complex Prisma ORs, but in-memory is safe for now)
    const now = Date.now();
    const discoverable = sessions
      .filter((session) => {
        if (session.status === 'CANCELLED' && session.teacherId !== teacherId) {
          return false;
        }
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
      })
      .filter((session) => {
        if (session.status === 'CANCELLED')
          return session.teacherId === teacherId;
        const realTimeStatus = this.getSessionStatus(
          session.scheduledStart,
          session.duration,
          now,
        );
        if (realTimeStatus === 'ENDED' && session.status !== 'COMPLETED') {
          return false;
        }
        return true;
      });

    // 4. Strip sensitive player URLs from the response if they are paid and not joined
    // (Actual joining requires payment, but we strip it from discovery entirely)
    return discoverable.map((session) => {
      const { adminId, ...safeSession } = session;
      return this.withHostActions(safeSession, teacherId, false);
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
        title: { startsWith: 'Reminder' },
      },
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
      },
    });

    return { success: true, message: 'Reminder set successfully' };
  }

  async findOne(id: string, userId?: string, isAdmin?: boolean) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        admin: { select: { id: true, name: true, email: true } },
        payments: {
          where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
          select: { id: true, amount: true, status: true, refundStatus: true },
        },
      },
    });
    if (!session) throw new NotFoundException('Live session not found');

    if (!userId)
      return { ...session, access: { canAccess: false, role: 'GUEST' } };

    const isHost = session.teacherId === userId;
    const isGlobalAdmin = Boolean(isAdmin);

    const isCancelled = session.status === 'CANCELLED';
    let canAccess = false;
    let role = 'GUEST';
    let registrationStatus = 'NONE';
    let paymentStatus: string | null = null;
    let refundStatus: string | null = null;

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
        const registration =
          await this.prisma.liveSessionRegistration.findUnique({
            where: {
              teacherId_liveSessionId: {
                teacherId: userId,
                liveSessionId: id,
              },
            },
            include: { payment: true },
          });

        const payment =
          registration?.payment ||
          (await this.prisma.payment.findFirst({
            where: {
              teacherId: userId,
              liveSessionId: id,
            },
            orderBy: { createdAt: 'desc' },
          }));

        if (payment) {
          paymentStatus = payment.status;
          refundStatus = payment.refundStatus;
        }

        if (
          registration &&
          registration.status !== 'CANCELLED' &&
          !isCancelled
        ) {
          canAccess = true;
          role = 'PARTICIPANT';
          registrationStatus = registration.status;
          if (!paymentStatus && registration.paymentId) {
            paymentStatus = 'SUCCESSFUL';
          }
        } else if (payment) {
          if (payment.status === 'SUCCESSFUL' && !isCancelled) {
            canAccess = true;
            role = 'PARTICIPANT';
            registrationStatus = 'REGISTERED (LEGACY)';
          } else if (registration) {
            registrationStatus = registration.status;
          }
        }
      }
    }

    if (isCancelled) {
      canAccess = isHost || isGlobalAdmin;
    }

    const refundSummary =
      isHost || isGlobalAdmin
        ? await this.paymentService.getRefundSummary(id)
        : null;

    const access = {
      canAccess,
      role,
      registrationStatus,
      paymentStatus,
      refundStatus,
      sessionCancelled: isCancelled,
    };
    const hostActions = this.buildHostActions(
      session,
      this.countSuccessfulPayments(session),
      isHost,
      isGlobalAdmin,
    );

    if (!canAccess) {
      const { ...safeSession } = session;
      return { ...safeSession, access, refundSummary, hostActions };
    }

    return { ...session, access, refundSummary, hostActions };
  }

  private async checkConflict(
    adminId: string,
    start: Date,
    durationMinutes: number,
    excludeId?: string,
  ) {
    const end = new Date(start.getTime() + durationMinutes * 60000);
    const conflicts = await this.prisma.liveSession.findMany({
      where: {
        adminId,
        status: { in: ['APPROVED', 'LIVE', 'RESCHEDULED'] },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    // Filter down more precisely in JS to be safe, since end time isn't stored directly (we could add it, but this is simpler)
    const actualConflicts = conflicts.filter((c) => {
      const cEnd = new Date(c.scheduledStart.getTime() + c.duration * 60000);
      return start < cEnd && end > c.scheduledStart;
    });

    if (actualConflicts.length > 0) {
      throw new ConflictException(
        'Admin already has a session scheduled during this time',
      );
    }
  }

  async approve(id: string, adminId: string, dto: ApproveLiveSessionDto) {
    const session = await this.findOne(id);
    if (session.status !== 'REQUESTED' && session.status !== 'RESCHEDULED') {
      throw new ConflictException(
        'Can only approve requested or rescheduled sessions',
      );
    }

    const assignedAdminId = dto.adminId || adminId;

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminId: assignedAdminId,
        meetingRoomId: this.liveKitService.roomNameFor(id),
        livekitRoomName: this.liveKitService.roomNameFor(id),
      },
    });

    await this.prisma.notification.create({
      data: {
        receiverId: session.teacherId,
        title: 'Live Session Approved',
        message: `Your live session "${session.topic}" has been approved.`,
        type: 'LIVE_SESSION',
        referenceId: id,
      },
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
      },
    });

    return updated;
  }

  async reschedule(id: string, adminId: string, dto: RescheduleLiveSessionDto) {
    const session = await this.findOne(id);

    await this.checkConflict(
      adminId,
      new Date(dto.scheduledStart),
      session.duration,
      id,
    );

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
      },
    });

    return updated;
  }

  async updateStatus(
    id: string,
    userId: string,
    isAdmin: boolean,
    dto: UpdateLiveSessionStatusDto,
  ) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Live session not found');

    if (!isAdmin && session.teacherId !== userId) {
      throw new ForbiddenException('Not authorized for this session');
    }

    if (
      session.status === 'CANCELLED' &&
      (dto.status === 'LIVE' || dto.status === 'COMPLETED')
    ) {
      throw new ConflictException(
        'A cancelled session cannot be started or resumed',
      );
    }

    if (dto.status === 'CANCELLED') {
      return this.cancel(id, userId, isAdmin);
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
      },
    });
  }

  private countSuccessfulPayments(
    session: { payments?: Array<{ id: string; amount?: any }> } | null,
  ) {
    return session?.payments?.length || 0;
  }

  private totalCollected(
    session: { payments?: Array<{ amount?: any }> } | null,
  ) {
    return (session?.payments || []).reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
  }

  private buildHostActions(
    session: any,
    paidCount: number,
    isHost: boolean,
    isAdmin: boolean,
  ) {
    const isCancelled = session.status === 'CANCELLED';
    const hasFinancialHistory = paidCount > 0 || session.status === 'COMPLETED';
    const canDelete =
      (isHost || isAdmin) &&
      !isCancelled &&
      paidCount === 0 &&
      session.status !== 'COMPLETED';
    const canCancel =
      (isHost || isAdmin) &&
      !isCancelled &&
      ['REQUESTED', 'APPROVED', 'RESCHEDULED', 'LIVE'].includes(session.status);
    return {
      canDelete,
      canCancel,
      isCancelled,
      paidParticipants: paidCount,
      totalCollected: this.totalCollected(session),
      hasFinancialHistory,
    };
  }

  private withHostActions(session: any, userId?: string, isAdmin = false) {
    const isHost = userId ? session.teacherId === userId : false;
    const paidCount = this.countSuccessfulPayments(session);
    const { payments, ...rest } = session;
    return {
      ...rest,
      hostActions: this.buildHostActions(session, paidCount, isHost, isAdmin),
    };
  }

  async getCancellationPreview(id: string, userId: string, isAdmin: boolean) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
        },
      },
    });
    if (!session) throw new NotFoundException('Live session not found');
    if (!isAdmin && session.teacherId !== userId) {
      throw new ForbiddenException('Not authorized for this session');
    }

    const refundSummary = await this.paymentService.getRefundSummary(id);
    return {
      sessionId: session.id,
      topic: session.topic,
      status: session.status,
      isPaid: session.isPaid,
      price: session.price,
      ...this.buildHostActions(
        session,
        session.payments.length,
        session.teacherId === userId,
        isAdmin,
      ),
      refundSummary,
      refundDisclaimer:
        'Cancelling will stop the session. Refunds are sent to Chapa and are only marked refunded after Chapa confirms them. Immediate refund of every participant is not guaranteed.',
    };
  }

  async deleteSession(id: string, userId: string, isAdmin: boolean) {
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.prisma.$transaction(async (tx) => {
      const session = await tx.liveSession.findUnique({
        where: { id },
        include: {
          payments: true,
        },
      });

      if (!session) {
        throw new NotFoundException('Live session not found');
      }

      if (!isAdmin && session.teacherId !== userId) {
        throw new ForbiddenException('You are not the host of this session');
      }

      if (session.status === 'CANCELLED' || session.status === 'COMPLETED') {
        throw new ConflictException('This session cannot be deleted');
      }

      const successfulPayments = session.payments.filter(
        (p) => p.status === 'SUCCESSFUL' || p.status === 'REFUNDED',
      );
      if (successfulPayments.length > 0) {
        throw new ConflictException(
          'This session has successful payments and cannot be deleted. Cancel it instead.',
        );
      }

      await tx.payment.updateMany({
        where: { liveSessionId: id },
        data: { liveSessionId: null },
      });

      await tx.liveSession.delete({ where: { id } });

      await tx.financialAuditLog.create({
        data: {
          actorId: userId,
          actorIsAdmin: Boolean(isAdmin),
          action: 'LIVE_SESSION_DELETED',
          metadata: {
            sessionId: id,
            topic: session.topic,
            wasPaid: session.isPaid,
            unlinkedPayments: session.payments.length,
          },
        },
      });

      return { deleted: true, id };
    });
  }

  async cancel(id: string, userId: string, isAdmin: boolean) {
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const existing = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        payments: {
          where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
        },
        registrations: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Live session not found');
    }

    if (!isAdmin && existing.teacherId !== userId) {
      throw new ForbiddenException('You are not the host of this session');
    }

    if (['REJECTED', 'COMPLETED'].includes(existing.status)) {
      throw new UnprocessableEntityException(
        'This session cannot be cancelled in its current state',
      );
    }

    if (existing.status === 'CANCELLED') {
      const refundSummary = await this.paymentService.getRefundSummary(id);
      return {
        session: existing,
        alreadyCancelled: true,
        refundSummary,
      };
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.liveSession.findUnique({
        where: { id },
        include: {
          payments: {
            where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
            include: { teacherEarnings: true },
          },
          registrations: true,
        },
      });

      if (!locked) {
        throw new NotFoundException('Live session not found');
      }

      if (locked.status === 'CANCELLED') {
        return locked;
      }

      const updated = await tx.liveSession.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledById: userId,
        },
      });

      await tx.liveSessionRegistration.updateMany({
        where: { liveSessionId: id, status: { not: 'CANCELLED' } },
        data: { status: 'CANCELLED' },
      });

      for (const payment of locked.payments) {
        if (
          payment.status === 'SUCCESSFUL' &&
          payment.refundStatus === 'NOT_REQUIRED'
        ) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              refundStatus: 'PENDING',
              refundReason: `Live session cancelled: ${locked.topic}`,
            },
          });
        }
        await this.paymentService.freezeEarningsForPayment(tx, payment.id);
      }

      await tx.financialAuditLog.create({
        data: {
          actorId: userId,
          actorIsAdmin: Boolean(isAdmin),
          action: 'LIVE_SESSION_CANCELLED',
          liveSessionId: id,
          metadata: {
            topic: locked.topic,
            affectedRegistrations: locked.registrations.length,
            affectedPayments: locked.payments.length,
            totalAmount: locked.payments.reduce(
              (sum, p) => sum + Number(p.amount || 0),
              0,
            ),
          },
        },
      });

      return updated;
    });

    const refundResults = await this.paymentService.processRefundsForSession(
      id,
      `Live session cancelled: ${existing.topic}`,
    );
    await this.liveKitService.deleteRoom(id).catch(() => undefined);

    const affectedStudents = existing.registrations
      .map((r) => r.teacherId)
      .filter((studentId) => studentId !== existing.teacherId);

    const uniqueStudents = Array.from(new Set(affectedStudents));
    try {
      for (const studentId of uniqueStudents) {
        const studentPayment = existing.payments.find(
          (p) => p.teacherId === studentId,
        );
        const refundState = studentPayment
          ? refundResults.find((r) => r.paymentId === studentPayment.id)
              ?.refundStatus
          : null;

        let refundMessage = '';
        if (refundState === 'PROCESSING') {
          refundMessage = ' Your payment refund is being processed.';
        } else if (refundState === 'REFUNDED') {
          refundMessage = ` Your ${Number(studentPayment?.amount || 0)} ETB payment has been refunded.`;
        } else if (refundState === 'PENDING') {
          refundMessage = ' Your payment refund is pending confirmation.';
        } else if (refundState === 'FAILED') {
          refundMessage =
            ' Your refund could not be completed automatically. Please contact support.';
        }

        await this.notificationService.create({
          receiverId: studentId,
          title: 'Live Session Cancelled',
          message: `${existing.topic} has been cancelled.${refundMessage}`,
          type: NotificationEvent.LIVE_SESSION,
          referenceId: id,
        });
      }

      await this.notificationService.create({
        receiverId: existing.teacherId,
        title: 'Live Session Cancelled',
        message: `You cancelled "${existing.topic}". ${existing.payments.length} paid registration(s) were included in the refund workflow.`,
        type: NotificationEvent.LIVE_SESSION,
        referenceId: id,
      });
    } catch (error) {
      console.error(
        '[LiveSession] Failed to send cancellation notifications',
        error,
      );
    }

    const refundSummary = await this.paymentService.getRefundSummary(id);
    await this.prisma.financialAuditLog.create({
      data: {
        actorId: userId,
        actorIsAdmin: Boolean(isAdmin),
        action: 'LIVE_SESSION_REFUND_WORKFLOW',
        liveSessionId: id,
        metadata: {
          refundResults,
          refundSummary,
        },
      },
    });

    return {
      session: cancelled,
      alreadyCancelled: false,
      refundSummary,
      refundResults,
    };
  }

  async archive(id: string, userId: string, isAdmin: boolean) {
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can archive sessions');
    }
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Live session not found');

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    await this.prisma.financialAuditLog.create({
      data: {
        actorId: userId,
        actorIsAdmin: true,
        action: 'LIVE_SESSION_ARCHIVED',
        liveSessionId: id,
        metadata: { topic: session.topic, status: session.status },
      },
    });

    return updated;
  }

  async issueLiveKitToken(
    sessionId: string,
    userId: string,
    isAdmin: boolean,
    options: { requireHost?: boolean } = {},
  ) {
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
      },
    });
    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    if (session.status === 'CANCELLED' || session.status === 'REJECTED') {
      throw new ConflictException('This session cannot be joined');
    }

    // GOOGLE_MEET sessions never use LiveKit tokens — caller should redirect to meetingUrl
    if ((session as any).provider === 'GOOGLE_MEET') {
      throw new BadRequestException(
        'This session uses Google Meet. No LiveKit token is issued. Use the meeting URL to join.',
      );
    }

    const clockStatus = this.getSessionStatus(
      session.scheduledStart,
      session.duration,
    );
    if (session.status === 'COMPLETED' || clockStatus === 'ENDED') {
      throw new ConflictException('This session has ended');
    }

    const isSessionOwner = session.teacherId === userId;
    const isPlatformAdmin = Boolean(isAdmin);
    if (options.requireHost && !isSessionOwner && !isPlatformAdmin) {
      throw new ForbiddenException(
        'Only the session host can open Live Studio',
      );
    }

    const isHost = isSessionOwner || isPlatformAdmin;
    const role: 'HOST' | 'VIEWER' = isHost ? 'HOST' : 'VIEWER';

    if (!isHost) {
      if (clockStatus !== 'LIVE') {
        throw new ConflictException('This session has not started yet');
      }
      if (session.isPaid) {
        const payment = await this.prisma.payment.findFirst({
          where: {
            teacherId: userId,
            liveSessionId: sessionId,
            status: 'SUCCESSFUL',
          },
        });
        if (!payment) {
          throw new ForbiddenException(
            'A successful payment is required to join this session',
          );
        }
      }
    }

    const user = await this.prisma.teacher.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, ...suspensionSnapshotSelect },
    });

    // Defense in depth: JwtAuthGuard already rejects suspended accounts, but a
    // LiveKit token is a credential of its own, so never mint one (host OR
    // viewer) for a suspended teacher regardless of how this method is reached.
    if (!isPlatformAdmin) {
      if (!user) {
        throw new UnauthorizedException('Account no longer exists');
      }
      const { suspension } = evaluateSuspension(user);
      if (suspension) {
        throw accountSuspendedException(suspension);
      }
    }

    const displayName =
      isAdmin && !user
        ? 'Admin'
        : `${user?.firstName || 'Teacher'} ${user?.lastName || ''}`.trim();

    const endTime =
      session.scheduledStart.getTime() + session.duration * 60 * 1000;
    const remainingMs = Math.max(endTime - Date.now(), 15 * 60 * 1000);
    const ttlSeconds = Math.ceil(remainingMs / 1000) + 15 * 60;

    if (!session.livekitRoomName) {
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: { livekitRoomName: this.liveKitService.roomNameFor(sessionId) },
      });
    }

    const issued = await this.liveKitService.createParticipantToken({
      sessionId,
      identity: userId,
      displayName,
      role,
      ttlSeconds,
    });

    if (isHost && !session.startedAt && clockStatus === 'LIVE') {
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: { status: 'LIVE', startedAt: new Date() },
      });
    }

    return issued;
  }

  async endLiveSession(sessionId: string, userId: string, isAdmin: boolean) {
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Live session not found');
    }
    if (!isAdmin && session.teacherId !== userId) {
      throw new ForbiddenException('Only the host can end this session');
    }
    if (session.status === 'CANCELLED') {
      throw new ConflictException(
        'A cancelled session cannot be ended as live',
      );
    }

    const updated = await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    await this.liveKitService.deleteRoom(sessionId);

    try {
      await this.notificationService.create({
        receiverId: session.teacherId,
        title: 'Live Session Ended',
        message: `"${session.topic}" has ended.`,
        type: NotificationEvent.LIVE_SESSION,
        referenceId: sessionId,
      });
    } catch {}

    return updated;
  }

  async removeLiveParticipant(
    sessionId: string,
    actorId: string,
    isAdmin: boolean,
    identity: string,
  ) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Live session not found');
    if (!isAdmin && session.teacherId !== actorId) {
      throw new ForbiddenException('Only the host can moderate participants');
    }
    if (identity === session.teacherId) {
      throw new ConflictException(
        'The host cannot be removed from the session',
      );
    }
    await this.liveKitService.removeParticipant(sessionId, identity);
    return { removed: true, identity };
  }

  async listLiveParticipants(
    sessionId: string,
    actorId: string,
    isAdmin: boolean,
  ) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Live session not found');
    if (!isAdmin && session.teacherId !== actorId) {
      throw new ForbiddenException(
        'Only the host can list LiveKit participants',
      );
    }
    const participants = await this.liveKitService.listParticipants(sessionId);
    return participants.map((p) => ({
      identity: p.identity,
      name: p.name,
      state: p.state,
      joinedAt: p.joinedAt,
    }));
  }
}
