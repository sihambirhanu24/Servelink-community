import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TeacherStatus, SuspensionType } from '@prisma/client';
import { NotificationEvent } from '../notification/notification.types';
import {
  evaluateSuspension,
  suspensionSnapshotSelect,
} from './suspension-state';

export interface SuspendTeacherDto {
  teacherId: string;
  suspensionType: SuspensionType;
  reason: string;
  duration?: number; // in days for temporary suspension
  adminId: string;
  reportId?: string;
}

export interface UnsuspendTeacherDto {
  teacherId: string;
  adminId: string;
  reason?: string;
}

/** Marker stored in `suspendedBy` / `restoredBy` when the platform itself acted. */
export const SYSTEM_ACTOR = 'SYSTEM';

const MAX_TEMPORARY_DAYS = 365;

const teacherResultSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  level: true,
  status: true,
  suspensionReason: true,
  suspensionStart: true,
  suspensionUntil: true,
  suspendedBy: true,
  suspensionCount: true,
} as const;

@Injectable()
export class SuspensionService {
  private readonly logger = new Logger(SuspensionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Suspend a teacher (or issue a WARNING).
   *
   * TEMPORARY / PERMANENT change the authoritative `Teacher.status`; every
   * subsequent authenticated request is then rejected by `JwtAuthGuard`.
   * WARNING only records a history entry and notifies the teacher — it does not
   * restrict access.
   */
  async suspendTeacher(dto: SuspendTeacherDto) {
    const reason = dto.reason?.trim();
    if (!reason) {
      throw new BadRequestException('A suspension reason is required');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
      select: { id: true, ...suspensionSnapshotSelect },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const now = new Date();

    if (dto.suspensionType === SuspensionType.WARNING) {
      await this.prisma.suspensionHistory.create({
        data: {
          teacherId: teacher.id,
          suspensionType: SuspensionType.WARNING,
          reason,
          suspendedBy: dto.adminId,
          suspendedAt: now,
          suspendedUntil: null,
          // A warning never blocks access, so the record is closed immediately.
          restoredAt: now,
          restoredBy: dto.adminId,
          reportId: dto.reportId,
        },
      });

      await this.safeNotify({
        receiverId: teacher.id,
        title: 'Account Warning',
        message: `You have received a warning from the ServeLink moderation team: ${reason}`,
        type: NotificationEvent.SUSPENSION,
      });

      this.logger.log(`Teacher ${teacher.id} warned by ${dto.adminId}`);
      return this.prisma.teacher.findUnique({
        where: { id: teacher.id },
        select: teacherResultSelect,
      });
    }

    // Lazily expire a finished temporary suspension so the "already suspended"
    // check below reflects reality.
    if (evaluateSuspension(teacher, now).expired) {
      await this.expireIfDue(teacher.id);
      teacher.status = TeacherStatus.ACTIVE;
    }

    if (teacher.status !== TeacherStatus.ACTIVE) {
      throw new ConflictException(
        'Teacher is already suspended. Unsuspend first or extend the current suspension.',
      );
    }

    let suspensionUntil: Date | null = null;
    if (dto.suspensionType === SuspensionType.TEMPORARY) {
      if (
        !dto.duration ||
        !Number.isInteger(dto.duration) ||
        dto.duration < 1
      ) {
        throw new BadRequestException(
          'A duration in days (>= 1) is required for a temporary suspension',
        );
      }
      if (dto.duration > MAX_TEMPORARY_DAYS) {
        throw new BadRequestException(
          `Temporary suspensions cannot exceed ${MAX_TEMPORARY_DAYS} days`,
        );
      }
      suspensionUntil = new Date(
        now.getTime() + dto.duration * 24 * 60 * 60 * 1000,
      );
    }

    const newStatus =
      dto.suspensionType === SuspensionType.PERMANENT
        ? TeacherStatus.PERMANENTLY_SUSPENDED
        : TeacherStatus.SUSPENDED;

    const [, updatedTeacher] = await this.prisma.$transaction([
      this.prisma.suspensionHistory.create({
        data: {
          teacherId: teacher.id,
          suspensionType: dto.suspensionType,
          reason,
          suspendedBy: dto.adminId,
          suspendedAt: now,
          suspendedUntil: suspensionUntil,
          reportId: dto.reportId,
        },
      }),
      this.prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          status: newStatus,
          suspensionReason: reason,
          suspensionStart: now,
          suspensionUntil,
          suspendedBy: dto.adminId,
          suspensionCount: { increment: 1 },
        },
        select: teacherResultSelect,
      }),
    ]);

    await this.safeNotify({
      receiverId: teacher.id,
      title: 'Account Suspended',
      message:
        dto.suspensionType === SuspensionType.PERMANENT
          ? `Your ServeLink account has been permanently suspended. Reason: ${reason}`
          : `Your ServeLink account has been suspended until ${suspensionUntil!.toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )}. Reason: ${reason}`,
      type: NotificationEvent.SUSPENSION,
    });

    this.logger.log(
      `Teacher ${teacher.id} ${dto.suspensionType.toLowerCase()} suspended by ${dto.adminId}` +
        (suspensionUntil ? ` until ${suspensionUntil.toISOString()}` : ''),
    );

    return updatedTeacher;
  }

  /**
   * Lift a suspension. History is preserved: the open record is closed with
   * `restoredAt` / `restoredBy`, never deleted.
   */
  async unsuspendTeacher(dto: UnsuspendTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
      select: { id: true, status: true },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    if (teacher.status === TeacherStatus.ACTIVE) {
      throw new ConflictException('Teacher is not suspended');
    }

    const now = new Date();
    const [, updatedTeacher] = await this.prisma.$transaction([
      this.prisma.suspensionHistory.updateMany({
        where: { teacherId: teacher.id, restoredAt: null },
        data: { restoredAt: now, restoredBy: dto.adminId },
      }),
      this.prisma.teacher.update({
        where: { id: teacher.id },
        data: {
          status: TeacherStatus.ACTIVE,
          suspensionReason: null,
          suspensionStart: null,
          suspensionUntil: null,
          suspendedBy: null,
        },
        select: teacherResultSelect,
      }),
    ]);

    await this.safeNotify({
      receiverId: teacher.id,
      title: 'Account Restored',
      message:
        'Your ServeLink account has been restored. You can now use the platform normally.',
      type: NotificationEvent.ACCOUNT_RESTORED,
    });

    this.logger.log(`Teacher ${teacher.id} unsuspended by ${dto.adminId}`);
    return updatedTeacher;
  }

  /**
   * Synchronise an expired temporary suspension back to ACTIVE.
   * The `updateMany` predicate makes this idempotent and race-safe: only one
   * concurrent caller can flip the row, so history is closed and the teacher is
   * notified exactly once.
   */
  async expireIfDue(
    teacherId: string,
    now: Date = new Date(),
  ): Promise<boolean> {
    const { count } = await this.prisma.teacher.updateMany({
      where: {
        id: teacherId,
        status: TeacherStatus.SUSPENDED,
        suspensionUntil: { lte: now },
      },
      data: {
        status: TeacherStatus.ACTIVE,
        suspensionReason: null,
        suspensionStart: null,
        suspensionUntil: null,
        suspendedBy: null,
      },
    });
    if (count === 0) {
      return false;
    }

    await this.prisma.suspensionHistory.updateMany({
      where: { teacherId, restoredAt: null },
      data: { restoredAt: now, restoredBy: SYSTEM_ACTOR },
    });

    await this.safeNotify({
      receiverId: teacherId,
      title: 'Account Restored',
      message:
        'Your temporary suspension has ended. Your ServeLink account has been restored.',
      type: NotificationEvent.ACCOUNT_RESTORED,
    });

    this.logger.log(
      `Teacher ${teacherId} automatically restored: temporary suspension expired`,
    );
    return true;
  }

  /** Expire every temporary suspension whose end date has passed. Returns the number restored. */
  async expireDueSuspensions(now: Date = new Date()): Promise<number> {
    const due = await this.prisma.teacher.findMany({
      where: { status: TeacherStatus.SUSPENDED, suspensionUntil: { lte: now } },
      select: { id: true },
    });
    let restored = 0;
    for (const { id } of due) {
      if (await this.expireIfDue(id, now)) restored += 1;
    }
    return restored;
  }

  /**
   * Returns true when the teacher may use the platform (not suspended, or the
   * temporary suspension has expired and has just been synchronised).
   */
  async checkSuspensionExpiration(teacherId: string): Promise<boolean> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: suspensionSnapshotSelect,
    });
    if (!teacher) {
      return false;
    }

    const { suspension, expired } = evaluateSuspension(teacher);
    if (expired) {
      await this.expireIfDue(teacherId);
      return true;
    }
    return suspension === null;
  }

  /**
   * Current suspension status of a teacher. Expired temporary suspensions are
   * synchronised first so callers never see a stale SUSPENDED row.
   */
  async getSuspensionStatus(teacherId: string) {
    const snapshot = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: suspensionSnapshotSelect,
    });
    if (!snapshot) {
      throw new NotFoundException('Teacher not found');
    }
    if (evaluateSuspension(snapshot).expired) {
      await this.expireIfDue(teacherId);
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        status: true,
        suspensionReason: true,
        suspensionStart: true,
        suspensionUntil: true,
        suspendedBy: true,
        suspensionCount: true,
      },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    return teacher;
  }

  /**
   * Full suspension history, newest first, with actor names resolved so the
   * admin UI can show who suspended / restored rather than raw ids.
   */
  async getSuspensionHistory(teacherId: string) {
    const history = await this.prisma.suspensionHistory.findMany({
      where: { teacherId },
      orderBy: { suspendedAt: 'desc' },
    });

    const actorIds = new Set<string>();
    for (const h of history) {
      if (h.suspendedBy && h.suspendedBy !== SYSTEM_ACTOR)
        actorIds.add(h.suspendedBy);
      if (h.restoredBy && h.restoredBy !== SYSTEM_ACTOR)
        actorIds.add(h.restoredBy);
    }
    const admins = actorIds.size
      ? await this.prisma.admin.findMany({
          where: { id: { in: [...actorIds] } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const nameById = new Map(admins.map((a) => [a.id, a.name || a.email]));
    const resolve = (id: string | null) =>
      id === null
        ? null
        : id === SYSTEM_ACTOR
          ? 'System (automatic)'
          : (nameById.get(id) ?? 'Admin');

    const now = Date.now();
    return history.map((h) => {
      const endedAt = h.restoredAt ?? h.suspendedUntil ?? null;
      const status: 'WARNING' | 'ACTIVE' | 'COMPLETED' =
        h.suspensionType === SuspensionType.WARNING
          ? 'WARNING'
          : h.restoredAt ||
              (h.suspendedUntil && h.suspendedUntil.getTime() <= now)
            ? 'COMPLETED'
            : 'ACTIVE';
      return {
        ...h,
        suspendedByName: resolve(h.suspendedBy),
        restoredByName: resolve(h.restoredBy),
        endedAt,
        status,
      };
    });
  }

  /**
   * Extend a temporary suspension.
   */
  async extendSuspension(
    teacherId: string,
    additionalDays: number,
    adminId: string,
    reason: string,
  ) {
    if (!Number.isInteger(additionalDays) || additionalDays < 1) {
      throw new BadRequestException(
        'additionalDays must be a positive integer',
      );
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, ...suspensionSnapshotSelect },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    if (teacher.status !== TeacherStatus.SUSPENDED) {
      throw new ConflictException(
        'Teacher is not currently under a temporary suspension',
      );
    }

    const now = new Date();
    const base =
      teacher.suspensionUntil &&
      teacher.suspensionUntil.getTime() > now.getTime()
        ? new Date(teacher.suspensionUntil)
        : now;
    const newSuspensionUntil = new Date(
      base.getTime() + additionalDays * 24 * 60 * 60 * 1000,
    );

    const [updatedTeacher] = await this.prisma.$transaction([
      this.prisma.teacher.update({
        where: { id: teacherId },
        data: { suspensionUntil: newSuspensionUntil, suspensionReason: reason },
        select: teacherResultSelect,
      }),
      // Close the previous record and open a new one so the timeline stays truthful.
      this.prisma.suspensionHistory.updateMany({
        where: { teacherId, restoredAt: null },
        data: { restoredAt: now, restoredBy: adminId },
      }),
      this.prisma.suspensionHistory.create({
        data: {
          teacherId,
          suspensionType: SuspensionType.TEMPORARY,
          reason: `Extension: ${reason}`,
          suspendedBy: adminId,
          suspendedAt: now,
          suspendedUntil: newSuspensionUntil,
        },
      }),
    ]);

    await this.safeNotify({
      receiverId: teacherId,
      title: 'Suspension Extended',
      message: `Your suspension has been extended by ${additionalDays} days. Reason: ${reason}`,
      type: NotificationEvent.SUSPENSION,
    });

    return updatedTeacher;
  }

  /** Notifications are best-effort; a notification failure must never undo a suspension. */
  private async safeNotify(dto: Parameters<NotificationService['create']>[0]) {
    try {
      await this.notificationService.create(dto);
    } catch (err) {
      this.logger.warn(
        `Failed to send suspension notification to ${dto.receiverId}: ${(err as Error).message}`,
      );
    }
  }
}
