import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TeacherStatus, SuspensionType } from '@prisma/client';
import { NotificationEvent } from '../notification/notification.types';

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

@Injectable()
export class SuspensionService {
  private readonly logger = new Logger(SuspensionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Suspend a teacher
   */
  async suspendTeacher(dto: SuspendTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Calculate suspension end date for temporary suspensions
    let suspensionUntil: Date | null = null;
    if (dto.suspensionType === SuspensionType.TEMPORARY && dto.duration) {
      suspensionUntil = new Date();
      suspensionUntil.setDate(suspensionUntil.getDate() + dto.duration);
    }

    // Create suspension history record
    await this.prisma.suspensionHistory.create({
      data: {
        teacherId: dto.teacherId,
        suspensionType: dto.suspensionType,
        reason: dto.reason,
        suspendedBy: dto.adminId,
        suspendedUntil: suspensionUntil,
        reportId: dto.reportId,
      },
    });

    // Update teacher status and suspension fields
    const newStatus = dto.suspensionType === SuspensionType.PERMANENT 
      ? TeacherStatus.PERMANENTLY_SUSPENDED 
      : TeacherStatus.SUSPENDED;

    const updatedTeacher = await this.prisma.teacher.update({
      where: { id: dto.teacherId },
      data: {
        status: newStatus,
        suspensionReason: dto.reason,
        suspensionStart: new Date(),
        suspensionUntil,
        suspendedBy: dto.adminId,
        suspensionCount: { increment: 1 },
      },
    });

    // Send notification to teacher
    await this.notificationService.create({
      receiverId: dto.teacherId,
      title: 'Account Suspended',
      message: `Your ServeLink account has been ${dto.suspensionType.toLowerCase()} because of: ${dto.reason}`,
      type: NotificationEvent.SUSPENSION,
    });

    this.logger.log(`Teacher ${dto.teacherId} suspended by ${dto.adminId}`);

    return updatedTeacher;
  }

  /**
   * Unsuspend a teacher
   */
  async unsuspendTeacher(dto: UnsuspendTeacherDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.status === TeacherStatus.ACTIVE) {
      throw new ForbiddenException('Teacher is not suspended');
    }

    // Update suspension history
    const activeSuspension = await this.prisma.suspensionHistory.findFirst({
      where: {
        teacherId: dto.teacherId,
        restoredAt: null,
      },
      orderBy: { suspendedAt: 'desc' },
    });

    if (activeSuspension) {
      await this.prisma.suspensionHistory.update({
        where: { id: activeSuspension.id },
        data: {
          restoredAt: new Date(),
          restoredBy: dto.adminId,
        },
      });
    }

    // Update teacher status
    const updatedTeacher = await this.prisma.teacher.update({
      where: { id: dto.teacherId },
      data: {
        status: TeacherStatus.ACTIVE,
        suspensionReason: null,
        suspensionStart: null,
        suspensionUntil: null,
        suspendedBy: null,
      },
    });

    // Send notification to teacher
    await this.notificationService.create({
      receiverId: dto.teacherId,
      title: 'Account Restored',
      message: 'Your ServeLink account has been restored. You can now use the platform normally.',
      type: NotificationEvent.ACCOUNT_RESTORED,
    });

    this.logger.log(`Teacher ${dto.teacherId} unsuspended by ${dto.adminId}`);

    return updatedTeacher;
  }

  /**
   * Check and automatically expire temporary suspensions
   * Called on each authenticated request
   */
  async checkSuspensionExpiration(teacherId: string): Promise<boolean> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return false;
    }

    // If not suspended or permanently suspended, no auto-expiration
    if (teacher.status !== TeacherStatus.SUSPENDED || !teacher.suspensionUntil) {
      return teacher.status === TeacherStatus.ACTIVE;
    }

    // Check if suspension has expired
    const now = new Date();
    if (teacher.suspensionUntil <= now) {
      // Auto-restore the teacher
      await this.unsuspendTeacher({
        teacherId,
        adminId: 'SYSTEM', // System auto-restoration
        reason: 'Automatic expiration',
      });

      this.logger.log(`Teacher ${teacherId} automatically restored due to suspension expiration`);
      return true;
    }

    // Still suspended
    return false;
  }

  /**
   * Get teacher suspension status
   */
  async getSuspensionStatus(teacherId: string) {
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
   * Get teacher suspension history
   */
  async getSuspensionHistory(teacherId: string) {
    const history = await this.prisma.suspensionHistory.findMany({
      where: { teacherId },
      orderBy: { suspendedAt: 'desc' },
    });

    return history;
  }

  /**
   * Extend suspension duration
   */
  async extendSuspension(teacherId: string, additionalDays: number, adminId: string, reason: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.status !== TeacherStatus.SUSPENDED) {
      throw new ForbiddenException('Teacher is not currently suspended');
    }

    const newSuspensionUntil = teacher.suspensionUntil 
      ? new Date(teacher.suspensionUntil)
      : new Date();
    
    newSuspensionUntil.setDate(newSuspensionUntil.getDate() + additionalDays);

    const updatedTeacher = await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        suspensionUntil: newSuspensionUntil,
        suspensionReason: reason,
      },
    });

    // Create new history record for the extension
    await this.prisma.suspensionHistory.create({
      data: {
        teacherId,
        suspensionType: SuspensionType.TEMPORARY,
        reason: `Extension: ${reason}`,
        suspendedBy: adminId,
        suspendedUntil: newSuspensionUntil,
      },
    });

    // Notify teacher
    await this.notificationService.create({
      receiverId: teacherId,
      title: 'Suspension Extended',
      message: `Your suspension has been extended by ${additionalDays} days. Reason: ${reason}`,
      type: NotificationEvent.SUSPENSION,
    });

    return updatedTeacher;
  }
}
