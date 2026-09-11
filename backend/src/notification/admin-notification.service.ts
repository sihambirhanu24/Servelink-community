import { Injectable, forwardRef, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminNotificationDto } from './dto/create-admin-notification.dto';
import { QueryAdminNotificationDto } from './dto/query-admin-notification.dto';
import { AdminNotificationEvent } from './admin-notification.types';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class AdminNotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly gateway: NotificationGateway,
  ) {}

  async create(dto: CreateAdminNotificationDto) {
    const notification = await this.prisma.adminNotification.create({
      data: {
        adminId: dto.adminId,
        title: dto.title,
        message: dto.message,
        type: dto.type as any,
        referenceId: dto.referenceId,
        link: dto.link,
        metadata: dto.metadata || {},
      },
    });

    // Emit real-time notification to admin
    try {
      this.gateway.emitToAdmin(dto.adminId, 'admin-notification', notification);
      this.gateway.emitToAdmin(dto.adminId, 'admin-unread-count-update', {});
    } catch (error) {
      // Don't fail the main operation if websocket fails
      console.error('Failed to emit admin notification:', error);
    }

    return notification;
  }

  async createForAllAdmins(
    title: string,
    message: string,
    type: AdminNotificationEvent,
    options?: {
      referenceId?: string;
      link?: string;
      metadata?: Record<string, any>;
    },
  ) {
    // Get all admins
    const admins = await this.prisma.admin.findMany({
      select: { id: true },
    });

    const notifications = await this.prisma.$transaction(
      admins.map((admin) =>
        this.prisma.adminNotification.create({
          data: {
            adminId: admin.id,
            title,
            message,
            type: type as any,
            referenceId: options?.referenceId,
            link: options?.link,
            metadata: options?.metadata || {},
          },
        }),
      ),
    );

    // Emit to all admins
    for (const notification of notifications) {
      try {
        this.gateway.emitToAdmin(notification.adminId, 'admin-notification', notification);
        this.gateway.emitToAdmin(notification.adminId, 'admin-unread-count-update', {});
      } catch (error) {
        console.error('Failed to emit admin notification:', error);
      }
    }

    return { sent: notifications.length };
  }

  async findAll(adminId: string, query: QueryAdminNotificationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { adminId };

    if (query.type) {
      where.type = query.type;
    }
    if (query.unread === true) {
      where.isRead = false;
    } else if (query.unread === false) {
      where.isRead = true;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      this.prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminNotification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async unreadCount(adminId: string) {
    const count = await this.prisma.adminNotification.count({
      where: { adminId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string, adminId: string) {
    // Verify ownership
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.adminId !== adminId) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    return this.prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markUnread(id: string, adminId: string) {
    // Verify ownership
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.adminId !== adminId) {
      throw new ForbiddenException('You can only mark your own notifications as unread');
    }

    return this.prisma.adminNotification.update({
      where: { id },
      data: { isRead: false },
    });
  }

  async markAllRead(adminId: string) {
    await this.prisma.adminNotification.updateMany({
      where: { adminId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async delete(id: string, adminId: string) {
    // Verify ownership
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id },
      select: { adminId: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.adminId !== adminId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    await this.prisma.adminNotification.delete({ where: { id } });
    return { success: true };
  }

  async clearRead(adminId: string) {
    await this.prisma.adminNotification.deleteMany({
      where: { adminId, isRead: true },
    });
    return { success: true };
  }
}
