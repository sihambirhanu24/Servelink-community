import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { AdminBroadcastDto } from './dto/admin-broadcast.dto';
import { NotificationEvent } from './notification.types';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationGateway))
    private readonly gateway: NotificationGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        receiverId: dto.receiverId,
        senderId: dto.senderId,
        senderName: dto.senderName,
        title: dto.title,
        message: dto.message,
        type: dto.type as any,
        referenceId: dto.referenceId,
      },
    });

    try {
      this.gateway.emitToUser(dto.receiverId, 'notification', notification);
      this.gateway.emitToUser(dto.receiverId, 'unread-count-update', {});
    } catch {}

    return notification;
  }

  async findAll(receiverId: string, query: QueryNotificationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { receiverId };

    if (query.type) {
      where.type = query.type;
    }
    if (query.unread === true) {
      where.isRead = false;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
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

  async unreadCount(receiverId: string) {
    const count = await this.prisma.notification.count({
      where: { receiverId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(receiverId: string) {
    await this.prisma.notification.updateMany({
      where: { receiverId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async delete(id: string) {
    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  async clearRead(receiverId: string) {
    await this.prisma.notification.deleteMany({
      where: { receiverId, isRead: true },
    });
    return { success: true };
  }

  async adminBroadcast(dto: AdminBroadcastDto) {
    const teachers = await this.prisma.teacher.findMany({
      select: { id: true },
    });

    const notifications = await this.prisma.$transaction(
      teachers.map((t) =>
        this.prisma.notification.create({
          data: {
            receiverId: t.id,
            title: dto.title,
            message: dto.message,
            type: NotificationEvent.SYSTEM as any,
            referenceId: dto.referenceId,
          },
        }),
      ),
    );

    for (const n of notifications) {
      try {
        this.gateway.emitToUser(n.receiverId, 'notification', n);
        this.gateway.emitToUser(n.receiverId, 'unread-count-update', {});
      } catch {}
    }

    return { sent: notifications.length };
  }
}
