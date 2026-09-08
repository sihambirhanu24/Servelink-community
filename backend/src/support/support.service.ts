import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { QuerySupportRequestDto } from './dto/query-support-request.dto';
import { QueryProvidersDto } from './dto/query-providers.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import { ChatService } from '../chat/chat.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly walletService: WalletService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // PROVIDER PROFILE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  async createOrUpdateProviderProfile(
    teacherId: string,
    dto: CreateProviderProfileDto | UpdateProviderProfileDto,
  ) {
    // Verify teacher exists and is verified
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        verified: true,
        verificationStatus: true,
        status: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (
      !teacher.verified ||
      teacher.verificationStatus !== 'APPROVED' ||
      teacher.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'Only verified and active teachers can offer support',
      );
    }

    // Upsert provider profile
    const profile = await this.prisma.supportProviderProfile.upsert({
      where: { teacherId },
      create: {
        teacherId,
        expertise: dto.expertise || [],
        experience: dto.experience || '',
        description: dto.description || '',
        supportTypes: dto.supportTypes || [],
        availabilityDays: dto.availabilityDays || [],
        availabilityTime: dto.availabilityTime,
        maxActiveRequests: dto.maxActiveRequests ?? 5,
        isAvailable: dto.isAvailable ?? true,
      },
      update: {
        ...(dto.expertise !== undefined && { expertise: dto.expertise }),
        ...(dto.experience !== undefined && { experience: dto.experience }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.supportTypes !== undefined && {
          supportTypes: dto.supportTypes,
        }),
        ...(dto.availabilityDays !== undefined && {
          availabilityDays: dto.availabilityDays,
        }),
        ...(dto.availabilityTime !== undefined && {
          availabilityTime: dto.availabilityTime,
        }),
        ...(dto.maxActiveRequests !== undefined && {
          maxActiveRequests: dto.maxActiveRequests,
        }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        updatedAt: new Date(),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            verified: true,
            level: true,
          },
        },
      },
    });

    return profile;
  }

  async getProviderProfile(teacherId: string) {
    const profile = await this.prisma.supportProviderProfile.findUnique({
      where: { teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            verified: true,
            level: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    return profile;
  }

  async getMyProviderProfile(teacherId: string) {
    const profile = await this.prisma.supportProviderProfile.findUnique({
      where: { teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            verified: true,
            level: true,
          },
        },
      },
    });

    return profile; // Can be null if not created yet
  }

  async discoverProviders(query: QueryProvidersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isAvailable: query.isAvailable !== undefined ? query.isAvailable : true,
      teacher: {
        verified: true,
        verificationStatus: 'APPROVED',
        status: 'ACTIVE',
      },
    };

    // Search in expertise or teacher name
    if (query.search) {
      where.OR = [
        {
          expertise: {
            hasSome: [query.search],
          },
        },
        {
          teacher: {
            OR: [
              {
                firstName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          },
        },
      ];
    }

    // Filter by support type
    if (query.supportType) {
      where.supportTypes = {
        has: query.supportType,
      };
    }

    const [providers, total] = await Promise.all([
      this.prisma.supportProviderProfile.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
        },
        orderBy: [{ averageRating: 'desc' }, { completedSessions: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.supportProviderProfile.count({ where }),
    ]);

    return {
      data: providers,
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

  // ─────────────────────────────────────────────────────────────────────────
  // SUPPORT REQUEST MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  async createSupportRequest(teacherId: string, dto: CreateSupportRequestDto) {
    // Verify teacher exists and is verified
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        verified: true,
        verificationStatus: true,
        status: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (
      !teacher.verified ||
      teacher.verificationStatus !== 'APPROVED' ||
      teacher.status !== 'ACTIVE'
    ) {
      throw new ForbiddenException(
        'Only verified and active teachers can request support',
      );
    }

    // Cannot request support from themselves
    if (dto.providerId && dto.providerId === teacherId) {
      throw new BadRequestException('Cannot request support from yourself');
    }

    // Validate payment fields
    const paymentType = dto.paymentType || 'FREE';
    const isPaid = paymentType === 'PAID';

    if (isPaid) {
      if (!dto.requestedAmount || dto.requestedAmount <= 0) {
        throw new BadRequestException(
          'Amount is required and must be greater than 0 for paid support',
        );
      }
      if (!dto.paymentReason || dto.paymentReason.trim().length < 10) {
        throw new BadRequestException(
          'Payment reason is required for paid support (minimum 10 characters)',
        );
      }
    }

    // If specific provider requested, verify they exist and are available
    if (dto.providerId) {
      const provider = await this.prisma.supportProviderProfile.findUnique({
        where: { teacherId: dto.providerId },
      });

      if (!provider) {
        throw new NotFoundException('Provider not found');
      }

      if (!provider.isAvailable) {
        throw new BadRequestException('Provider is currently unavailable');
      }

      // Check if provider supports the requested type
      if (!provider.supportTypes.includes(dto.supportType as any)) {
        throw new BadRequestException(
          'Provider does not offer this type of support',
        );
      }
    }

    // For paid requests, check wallet balance and reserve funds
    let paymentReference: string | null = null;
    if (isPaid) {
      const balance = await this.walletService.getBalance(teacherId);
      if (balance.availableBalance.toNumber() < dto.requestedAmount!) {
        throw new BadRequestException(
          `Insufficient wallet balance. Available: ${balance.availableBalance} ETB, Required: ${dto.requestedAmount} ETB`,
        );
      }
    }

    // Create support request with payment info
    const requestId = `SR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    paymentReference = isPaid ? `SUPPORT_${requestId}` : null;

    // Create request and reserve funds atomically
    const request = await this.prisma.$transaction(async (tx) => {
      const newRequest = await tx.supportRequest.create({
        data: {
          requesterId: teacherId,
          providerId: dto.providerId,
          topic: dto.topic,
          description: dto.description,
          supportType: dto.supportType as any,
          urgency: dto.urgency as any,
          preferredAt: dto.preferredAt ? new Date(dto.preferredAt) : null,
          notes: dto.notes,
          status: 'PENDING',
          paymentType: paymentType as any,
          requestedAmount: dto.requestedAmount || null,
          paymentReason: dto.paymentReason || null,
          paymentStatus: isPaid ? 'RESERVED' : 'NOT_REQUIRED',
          paymentReference: paymentReference,
          reservedAt: isPaid ? new Date() : null,
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
          provider: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  verified: true,
                  level: true,
                },
              },
            },
          },
        },
      });

      // Reserve funds if paid
      if (isPaid && paymentReference) {
        await this.walletService.reserveFunds(
          teacherId,
          dto.requestedAmount!,
          paymentReference,
          newRequest.id,
          `Teacher Support: ${dto.topic}`,
        );
      }

      return newRequest;
    });

    // Send notification to provider if specified
    if (dto.providerId) {
      const notificationMessage = isPaid
        ? `${request.requester.firstName} requests ${dto.requestedAmount} ETB for help with: ${request.topic}`
        : `${request.requester.firstName} needs help with: ${request.topic}`;

      await this.notificationService.create({
        receiverId: dto.providerId,
        senderId: teacherId,
        senderName: `${teacher.firstName} ${teacher.lastName}`,
        title: isPaid ? 'New Paid Support Request' : 'New Support Request',
        message: notificationMessage,
        type: NotificationEvent.SYSTEM,
        referenceId: request.id,
      });
    }

    return request;
  }

  async getMySupportRequests(teacherId: string, query: QuerySupportRequestDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { requesterId: teacherId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.supportType) {
      where.supportType = query.supportType;
    }

    if (query.urgency) {
      where.urgency = query.urgency;
    }

    const [requests, total] = await Promise.all([
      this.prisma.supportRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
          provider: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  verified: true,
                  level: true,
                },
              },
            },
          },
          rating: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportRequest.count({ where }),
    ]);

    return {
      data: requests,
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

  async getProviderRequests(teacherId: string, query: QuerySupportRequestDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { providerId: teacherId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.supportType) {
      where.supportType = query.supportType;
    }

    if (query.urgency) {
      where.urgency = query.urgency;
    }

    const [requests, total] = await Promise.all([
      this.prisma.supportRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
          provider: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  verified: true,
                  level: true,
                },
              },
            },
          },
          rating: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportRequest.count({ where }),
    ]);

    return {
      data: requests,
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

  async getSupportRequest(requestId: string, teacherId: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            verified: true,
            level: true,
          },
        },
        provider: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                verified: true,
                level: true,
              },
            },
          },
        },
        rating: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only requester or provider can view
    if (
      request.requesterId !== teacherId &&
      request.providerId !== teacherId
    ) {
      throw new ForbiddenException('You cannot view this support request');
    }

    return request;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REQUEST STATUS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────

  async acceptRequest(requestId: string, providerId: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only the assigned provider can accept
    if (request.providerId !== providerId) {
      throw new ForbiddenException('You cannot accept this request');
    }

    // Can only accept PENDING requests
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot accept request with status ${request.status}`,
      );
    }

    // Check if payment has already been transferred (idempotency)
    if (request.paymentStatus === 'TRANSFERRED') {
      throw new BadRequestException('Payment has already been transferred');
    }

    // Create or get existing chat room
    let chatRoomId: string | null = null;
    try {
      const chatResult =
        await this.chatService.findOrCreateDirectConversation(
          request.requesterId,
          providerId,
        );
      chatRoomId = chatResult.chatRoomId;
    } catch (error) {
      // Log error but don't fail the acceptance
      console.error('Failed to create chat room:', error);
    }

    // Accept request and transfer funds atomically
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.supportRequest.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          chatRoomId,
          ...(request.paymentType === 'PAID' && {
            paymentStatus: 'TRANSFERRED',
            transferredAt: new Date(),
          }),
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
          provider: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  verified: true,
                  level: true,
                },
              },
            },
          },
        },
      });

      // Transfer funds if paid request
      if (
        request.paymentType === 'PAID' &&
        request.paymentReference &&
        request.requestedAmount
      ) {
        await this.walletService.transferFunds(
          request.requesterId,
          providerId,
          request.requestedAmount.toNumber(),
          request.paymentReference,
          requestId,
          `Teacher Support: ${request.topic}`,
        );

        // Update provider earnings
        await tx.supportProviderProfile.update({
          where: { teacherId: providerId },
          data: {
            totalEarnings: {
              increment: request.requestedAmount,
            },
          },
        });
      }

      return updatedRequest;
    });

    // Notify requester
    const notificationMessage =
      request.paymentType === 'PAID'
        ? `Your support request "${request.topic}" has been accepted. ${request.requestedAmount} ETB has been transferred.`
        : `Your support request "${request.topic}" has been accepted`;

    await this.notificationService.create({
      receiverId: request.requesterId,
      senderId: providerId,
      senderName: `${request.provider?.teacher.firstName} ${request.provider?.teacher.lastName}`,
      title: 'Support Request Accepted',
      message: notificationMessage,
      type: NotificationEvent.SYSTEM,
      referenceId: requestId,
    });

    // Notify provider about payment received
    if (request.paymentType === 'PAID') {
      await this.notificationService.create({
        receiverId: providerId,
        senderId: request.requesterId,
        senderName: 'System',
        title: 'Payment Received',
        message: `You received ${request.requestedAmount} ETB for Teacher Support`,
        type: NotificationEvent.SYSTEM,
        referenceId: requestId,
      });
    }

    return updated;
  }

  async declineRequest(requestId: string, providerId: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
      include: {
        provider: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only the assigned provider can decline
    if (request.providerId !== providerId) {
      throw new ForbiddenException('You cannot decline this request');
    }

    // Can only decline PENDING requests
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot decline request with status ${request.status}`,
      );
    }

    // Decline and release funds atomically
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.supportRequest.update({
        where: { id: requestId },
        data: {
          status: 'DECLINED',
          ...(request.paymentType === 'PAID' && {
            paymentStatus: 'RELEASED',
            releasedAt: new Date(),
          }),
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
          provider: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  verified: true,
                  level: true,
                },
              },
            },
          },
        },
      });

      // Release funds if paid request
      if (
        request.paymentType === 'PAID' &&
        request.paymentReference &&
        request.requestedAmount &&
        request.paymentStatus === 'RESERVED'
      ) {
        await this.walletService.releaseFunds(
          request.requesterId,
          request.requestedAmount.toNumber(),
          `${request.paymentReference}-RELEASE`,
          requestId,
          `Teacher Support declined: ${request.topic}`,
        );
      }

      return updatedRequest;
    });

    // Notify requester
    const notificationMessage =
      request.paymentType === 'PAID'
        ? `Your support request "${request.topic}" was declined. Your ${request.requestedAmount} ETB reservation has been released.`
        : `Your support request "${request.topic}" was declined`;

    await this.notificationService.create({
      receiverId: request.requesterId,
      senderId: providerId,
      senderName: `${request.provider?.teacher.firstName} ${request.provider?.teacher.lastName}`,
      title: 'Support Request Declined',
      message: notificationMessage,
      type: NotificationEvent.SYSTEM,
      referenceId: requestId,
    });

    return updated;
  }

  async startSupport(requestId: string, teacherId: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only provider can start
    if (request.providerId !== teacherId) {
      throw new ForbiddenException('You cannot start this support');
    }

    // Can only start ACCEPTED requests
    if (request.status !== 'ACCEPTED') {
      throw new BadRequestException(
        `Cannot start support with status ${request.status}`,
      );
    }

    const updated = await this.prisma.supportRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            verified: true,
            level: true,
          },
        },
        provider: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                verified: true,
                level: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async completeRequest(requestId: string, providerId: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
      include: {
        provider: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only provider can complete
    if (request.providerId !== providerId) {
      throw new ForbiddenException('You cannot complete this request');
    }

    // Can only complete IN_PROGRESS or ACCEPTED requests
    if (!['ACCEPTED', 'IN_PROGRESS'].includes(request.status)) {
      throw new BadRequestException(
        `Cannot complete request with status ${request.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Update request
      const req = await tx.supportRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
          provider: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  verified: true,
                  level: true,
                },
              },
            },
          },
        },
      });

      // Increment provider's completed sessions
      await tx.supportProviderProfile.update({
        where: { teacherId: providerId },
        data: {
          completedSessions: { increment: 1 },
        },
      });

      return req;
    });

    // Notify requester
    await this.notificationService.create({
      receiverId: request.requesterId,
      senderId: providerId,
      senderName: `${request.provider?.teacher.firstName} ${request.provider?.teacher.lastName}`,
      title: 'Support Completed',
      message: `Support for "${request.topic}" has been marked as completed. Please rate your experience!`,
      type: NotificationEvent.SYSTEM,
      referenceId: requestId,
    });

    return updated;
  }

  async cancelRequest(requestId: string, requesterId: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only requester can cancel
    if (request.requesterId !== requesterId) {
      throw new ForbiddenException('You cannot cancel this request');
    }

    // Can only cancel PENDING requests (not ACCEPTED or later)
    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel request with status ${request.status}. Please contact the provider.`,
      );
    }

    // Cancel and release funds atomically
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.supportRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          ...(request.paymentType === 'PAID' && {
            paymentStatus: 'RELEASED',
            releasedAt: new Date(),
          }),
        },
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              verified: true,
              level: true,
            },
          },
          provider: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  verified: true,
                  level: true,
                },
              },
            },
          },
        },
      });

      // Release funds if paid request
      if (
        request.paymentType === 'PAID' &&
        request.paymentReference &&
        request.requestedAmount &&
        request.paymentStatus === 'RESERVED'
      ) {
        await this.walletService.releaseFunds(
          requesterId,
          request.requestedAmount.toNumber(),
          `${request.paymentReference}-CANCEL`,
          requestId,
          `Teacher Support cancelled: ${request.topic}`,
        );
      }

      return updatedRequest;
    });

    // Notify provider if assigned
    if (request.providerId) {
      await this.notificationService.create({
        receiverId: request.providerId,
        senderId: requesterId,
        title: 'Support Request Cancelled',
        message: `Support request "${request.topic}" has been cancelled`,
        type: NotificationEvent.SYSTEM,
        referenceId: requestId,
      });
    }

    return updated;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RATING SYSTEM
  // ─────────────────────────────────────────────────────────────────────────

  async rateProvider(
    requestId: string,
    requesterId: string,
    dto: CreateRatingDto,
  ) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
      include: {
        rating: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only requester can rate
    if (request.requesterId !== requesterId) {
      throw new ForbiddenException('You cannot rate this support');
    }

    // Can only rate COMPLETED requests
    if (request.status !== 'COMPLETED') {
      throw new BadRequestException('Can only rate completed support');
    }

    // Cannot rate without a provider
    if (!request.providerId) {
      throw new BadRequestException('No provider to rate');
    }

    // Check for duplicate rating
    if (request.rating) {
      throw new ConflictException('You have already rated this support');
    }

    const rating = await this.prisma.$transaction(async (tx) => {
      // Create rating
      const newRating = await tx.supportRating.create({
        data: {
          supportRequestId: requestId,
          requesterId,
          providerId: request.providerId!,
          rating: dto.rating,
          feedback: dto.feedback,
        },
      });

      // Recalculate provider's average rating
      const ratings = await tx.supportRating.findMany({
        where: { providerId: request.providerId! },
        select: { rating: true },
      });

      const averageRating =
        ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

      await tx.supportProviderProfile.update({
        where: { teacherId: request.providerId! },
        data: {
          averageRating,
        },
      });

      return newRating;
    });

    // Notify provider
    await this.notificationService.create({
      receiverId: request.providerId!,
      senderId: requesterId,
      title: 'New Rating Received',
      message: `You received a ${dto.rating}-star rating for "${request.topic}"`,
      type: NotificationEvent.SYSTEM,
      referenceId: requestId,
    });

    return rating;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT INTEGRATION
  // ─────────────────────────────────────────────────────────────────────────

  async getSupportChatRoom(requestId: string, teacherId: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requesterId: true,
        providerId: true,
        status: true,
        chatRoomId: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Support request not found');
    }

    // Only requester or provider can access chat
    if (
      request.requesterId !== teacherId &&
      request.providerId !== teacherId
    ) {
      throw new ForbiddenException(
        'You cannot access chat for this support request',
      );
    }

    // Chat only available after acceptance
    if (!['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(request.status)) {
      throw new BadRequestException(
        'Chat is only available after support is accepted',
      );
    }

    // If chat room already exists, return it
    if (request.chatRoomId) {
      return { chatRoomId: request.chatRoomId };
    }

    // If no chat room yet, create one
    if (request.providerId) {
      try {
        const chatResult =
          await this.chatService.findOrCreateDirectConversation(
            request.requesterId,
            request.providerId,
          );

        // Update request with chat room ID
        await this.prisma.supportRequest.update({
          where: { id: requestId },
          data: { chatRoomId: chatResult.chatRoomId },
        });

        return { chatRoomId: chatResult.chatRoomId };
      } catch (error) {
        throw new BadRequestException('Failed to create chat room');
      }
    }

    throw new BadRequestException('No provider assigned');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────────────

  async getProviderStats(teacherId: string) {
    const profile = await this.prisma.supportProviderProfile.findUnique({
      where: { teacherId },
    });

    if (!profile) {
      return {
        isProvider: false,
        completedSessions: 0,
        averageRating: null,
        activeRequests: 0,
      };
    }

    const activeRequests = await this.prisma.supportRequest.count({
      where: {
        providerId: teacherId,
        status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
      },
    });

    return {
      isProvider: true,
      completedSessions: profile.completedSessions,
      averageRating: profile.averageRating,
      activeRequests,
      isAvailable: profile.isAvailable,
    };
  }

  async getDashboardStats() {
    const [totalProviders, availableProviders, totalRequests, activeRequests] =
      await Promise.all([
        this.prisma.supportProviderProfile.count(),
        this.prisma.supportProviderProfile.count({
          where: { isAvailable: true },
        }),
        this.prisma.supportRequest.count(),
        this.prisma.supportRequest.count({
          where: { status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] } },
        }),
      ]);

    return {
      totalProviders,
      availableProviders,
      totalRequests,
      activeRequests,
    };
  }
}
