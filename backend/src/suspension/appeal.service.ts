import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SuspensionService } from './suspension.service';
import { NotificationEvent } from '../notification/notification.types';

export interface CreateAppealDto {
  teacherId: string;
  subject: string;
  explanation: string;
  attachmentUrl?: string;
}

export interface ReviewAppealDto {
  appealId: string;
  adminId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminResponse?: string;
  extendSuspensionDays?: number;
}

@Injectable()
export class AppealService {
  private readonly logger = new Logger(AppealService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly suspensionService: SuspensionService,
  ) {}

  /**
   * Create a suspension appeal
   */
  async createAppeal(dto: CreateAppealDto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Check if teacher is suspended
    if (teacher.status !== 'SUSPENDED' && teacher.status !== 'PERMANENTLY_SUSPENDED') {
      throw new ForbiddenException('You can only appeal a suspension');
    }

    // Check if there's already a pending appeal
    const existingAppeal = await this.prisma.suspensionAppeal.findFirst({
      where: {
        teacherId: dto.teacherId,
        status: 'PENDING',
      },
    });

    if (existingAppeal) {
      throw new ForbiddenException('You already have a pending appeal');
    }

    // Create the appeal
    const appeal = await this.prisma.suspensionAppeal.create({
      data: {
        teacherId: dto.teacherId,
        subject: dto.subject,
        explanation: dto.explanation,
        attachmentUrl: dto.attachmentUrl,
        status: 'PENDING',
      },
    });

    // Notify teacher
    await this.notificationService.create({
      receiverId: dto.teacherId,
      title: 'Appeal Submitted',
      message: 'Your suspension appeal has been sent to the moderation team.',
      type: NotificationEvent.APPEAL_SUBMITTED,
    });

    // TODO: Notify admins about new appeal
    // This would require getting all admin users

    this.logger.log(`Appeal created by teacher ${dto.teacherId}`);

    return appeal;
  }

  /**
   * Get all appeals for admin review
   */
  async getAllAppeals(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const appeals = await (this.prisma as any).suspensionAppeal.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            status: true,
            suspensionReason: true,
            suspensionStart: true,
            suspensionUntil: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return appeals;
  }

  /**
   * Get appeal details
   */
  async getAppeal(appealId: string) {
    const appeal = await (this.prisma as any).suspensionAppeal.findUnique({
      where: { id: appealId },
      include: {
        teacher: {
          select: {
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
          },
        },
      },
    });

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    // Get suspension history
    const history = await (this.prisma as any).suspensionHistory.findMany({
      where: { teacherId: appeal.teacherId },
      orderBy: { suspendedAt: 'desc' },
      take: 5,
    });

    return {
      ...appeal,
      suspensionHistory: history,
    };
  }

  /**
   * Review an appeal (approve/reject)
   */
  async reviewAppeal(dto: ReviewAppealDto) {
    const appeal = await (this.prisma as any).suspensionAppeal.findUnique({
      where: { id: dto.appealId },
      include: { teacher: true },
    });

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    if (appeal.status !== 'PENDING') {
      throw new ForbiddenException('Appeal has already been reviewed');
    }

    // Update appeal
    const updatedAppeal = await (this.prisma as any).suspensionAppeal.update({
      where: { id: dto.appealId },
      data: {
        status: dto.status,
        reviewedBy: dto.adminId,
        reviewedAt: new Date(),
        adminResponse: dto.adminResponse,
      },
    });

    if (dto.status === 'APPROVED') {
      // Unsuspend the teacher
      await this.suspensionService.unsuspendTeacher({
        teacherId: appeal.teacherId,
        adminId: dto.adminId,
        reason: 'Appeal approved',
      });

      // Notify teacher
      await this.notificationService.create({
        receiverId: appeal.teacherId,
        title: 'Appeal Approved',
        message: 'Your account has been restored.',
        type: NotificationEvent.APPEAL_APPROVED,
      });

      this.logger.log(`Appeal ${dto.appealId} approved by ${dto.adminId}`);
    } else if (dto.status === 'REJECTED') {
      // If extending suspension
      if (dto.extendSuspensionDays && dto.extendSuspensionDays > 0) {
        await this.suspensionService.extendSuspension(
          appeal.teacherId,
          dto.extendSuspensionDays,
          dto.adminId,
          dto.adminResponse || 'Appeal rejected',
        );
      }

      // Notify teacher
      await this.notificationService.create({
        receiverId: appeal.teacherId,
        title: 'Appeal Rejected',
        message: `Your suspension remains active. ${dto.adminResponse || ''}`,
        type: NotificationEvent.APPEAL_REJECTED,
      });

      this.logger.log(`Appeal ${dto.appealId} rejected by ${dto.adminId}`);
    }

    return updatedAppeal;
  }

  /**
   * Get teacher's appeals
   */
  async getTeacherAppeals(teacherId: string) {
    const appeals = await (this.prisma as any).suspensionAppeal.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });

    return appeals;
  }
}
