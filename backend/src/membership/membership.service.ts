import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async joinCommunity(teacherId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) throw new NotFoundException('Community not found');

    const exists = await this.prisma.communityMember.findFirst({
      where: { teacherId, communityId },
    });

    if (exists) throw new BadRequestException('Already a member');

    const member = await this.prisma.communityMember.create({
      data: { teacherId, communityId },
    });

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { firstName: true, lastName: true },
    });

    const teacherName = teacher
      ? `${teacher.firstName} ${teacher.lastName}`
      : 'A teacher';

    this.notificationService
      .create({
        receiverId: teacherId,
        title: 'Welcome to the community!',
        message: `You have successfully joined "${community.name}"`,
        type: NotificationEvent.COMMUNITY_JOIN,
        referenceId: communityId,
      })
      .catch(() => {});

    return member;
  }

  async leaveCommunity(teacherId: string, communityId: string) {
    return this.prisma.communityMember.delete({
      where: { teacherId_communityId: { teacherId, communityId } },
    });
  }

  async getMembers(communityId: string) {
    return this.prisma.communityMember.findMany({
      where: { communityId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            level: true,
            subject: true,
          },
        },
      },
    });
  }

  async isMember(teacherId: string, communityId: string) {
    const member = await this.prisma.communityMember.findFirst({
      where: { teacherId, communityId },
    });
    return { joined: !!member };
  }
}
