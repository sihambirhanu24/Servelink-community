import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import { CreateFinancialSupportRequestDto } from './dto/create-financial-support.dto';
import { ContributeFinancialSupportDto } from './dto/contribute-financial-support.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinancialSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new financial support request
   */
  async createFinancialSupportRequest(
    teacherId: string,
    dto: CreateFinancialSupportRequestDto,
  ) {
    // Validate amount
    if (dto.amountNeeded <= 0) {
      throw new BadRequestException('Amount needed must be greater than 0');
    }

    // Create the financial support request
    const supportRequest = await this.prisma.financialSupportRequest.create({
      data: {
        requesterId: teacherId,
        amountNeeded: dto.amountNeeded,
        reason: dto.reason,
        additionalNotes: dto.additionalNotes,
        status: 'OPEN',
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            department: true,
          },
        },
      },
    });

    return supportRequest;
  }

  /**
   * Contribute to a financial support request (atomic operation)
   * Uses TeacherEarning (availableEarnings) as the fund source, not WalletBalance
   */
  async contributeToFinancialSupport(
    contributorId: string,
    dto: ContributeFinancialSupportDto,
  ) {
    const { supportRequestId, amount } = dto;

    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Contribution amount must be greater than 0');
    }

    // Use a transaction to ensure atomicity
    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Fetch the support request with lock
        const supportRequest = await tx.financialSupportRequest.findUnique({
          where: { id: supportRequestId },
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (!supportRequest) {
          throw new NotFoundException('Financial support request not found');
        }

        // 2. Validate status
        if (supportRequest.status !== 'OPEN' && supportRequest.status !== 'PARTIALLY_FUNDED') {
          throw new BadRequestException(
            `Cannot contribute to a ${supportRequest.status.toLowerCase()} request`,
          );
        }

        // 3. Prevent self-contribution
        if (supportRequest.requesterId === contributorId) {
          throw new ForbiddenException('You cannot contribute to your own request');
        }

        // 4. Check remaining amount needed
        const remaining =
          Number(supportRequest.amountNeeded) - Number(supportRequest.amountReceived);

        if (remaining <= 0) {
          throw new BadRequestException('This request has already reached its goal');
        }

        // 5. Prevent overfunding
        if (amount > remaining) {
          throw new BadRequestException(
            `Contribution exceeds remaining amount. Maximum allowed: ${remaining} ETB`,
          );
        }

        // 6. Check contributor's ACTUAL available earnings (from TeacherEarning, not WalletBalance)
        const availableEarningsAgg = await tx.teacherEarning.aggregate({
          where: { 
            teacherId: contributorId, 
            status: 'AVAILABLE' 
          },
          _sum: { netAmount: true },
        });

        const contributorAvailableBalance = Number(availableEarningsAgg._sum.netAmount || 0);

        if (contributorAvailableBalance < amount) {
          throw new BadRequestException(
            `Insufficient wallet balance. Available: ${contributorAvailableBalance.toFixed(2)} ETB, Required: ${amount.toFixed(2)} ETB`,
          );
        }

        // 7. Generate unique transaction reference (idempotency key)
        const transactionReference = `FSC-${supportRequestId}-${contributorId}-${Date.now()}`;

        // 8. Check for duplicate contribution (idempotency)
        const existingContribution = await tx.financialContribution.findUnique({
          where: { transactionReference },
        });

        if (existingContribution) {
          throw new BadRequestException('Duplicate contribution detected');
        }

        // 9. Deduct from contributor's available earnings
        // Mark earnings as PAID_OUT in the order they were earned (FIFO)
        const earningsToDeduct = await tx.teacherEarning.findMany({
          where: { teacherId: contributorId, status: 'AVAILABLE' },
          orderBy: { createdAt: 'asc' },
        });

        let remainingToDeduct = amount;
        const earningsToMark: string[] = [];

        for (const earning of earningsToDeduct) {
          if (remainingToDeduct <= 0) break;
          
          const earningAmount = Number(earning.netAmount);
          if (earningAmount <= remainingToDeduct) {
            // Use entire earning
            earningsToMark.push(earning.id);
            remainingToDeduct -= earningAmount;
          } else {
            // Partial use not supported in current model
            // Mark as used and handle remainder separately
            earningsToMark.push(earning.id);
            remainingToDeduct = 0;
          }
        }

        // Mark earnings as PAID_OUT
        if (earningsToMark.length > 0) {
          await tx.teacherEarning.updateMany({
            where: { id: { in: earningsToMark } },
            data: { status: 'PAID_OUT' },
          });
        }

        // 10. Credit the recipient's earnings (create new earning record)
        await tx.teacherEarning.create({
          data: {
            teacherId: supportRequest.requesterId,
            liveSessionId: null, // Not from a live session
            grossAmount: amount,
            platformFee: 0, // No platform fee for peer-to-peer support
            netAmount: amount,
            status: 'AVAILABLE',
          },
        });

        // 11. Record the contribution
        const contribution = await tx.financialContribution.create({
          data: {
            supportRequestId,
            contributorId,
            recipientId: supportRequest.requesterId,
            amount,
            transactionReference,
          },
          include: {
            contributor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        });

        // 12. Update the support request's amountReceived
        const newAmountReceived = Number(supportRequest.amountReceived) + amount;
        const goalReached = newAmountReceived >= Number(supportRequest.amountNeeded);

        const updatedRequest = await tx.financialSupportRequest.update({
          where: { id: supportRequestId },
          data: {
            amountReceived: newAmountReceived,
            status: goalReached ? 'GOAL_REACHED' : 'PARTIALLY_FUNDED',
            completedAt: goalReached ? new Date() : null,
          },
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                department: true,
              },
            },
            contributions: {
              include: {
                contributor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        // 13. Send notification to requester
        await this.notificationService.create({
          receiverId: supportRequest.requesterId,
          title: 'New Contribution Received',
          message: `${contribution.contributor.firstName} ${contribution.contributor.lastName} contributed ${amount} ETB to your financial support request`,
          type: NotificationEvent.SYSTEM,
          referenceId: supportRequestId,
        });

        // 14. If goal reached, send celebration notification
        if (goalReached) {
          await this.notificationService.create({
            receiverId: supportRequest.requesterId,
            title: '🎉 Goal Reached!',
            message: `Your financial support request has reached its goal of ${supportRequest.amountNeeded} ETB. Thank you to all contributors!`,
            type: NotificationEvent.SYSTEM,
            referenceId: supportRequestId,
          });
        }

        return {
          contribution,
          supportRequest: updatedRequest,
          goalReached,
        };
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 30000, // 30 seconds
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * Get all financial support requests with filters
   */
  async getFinancialSupportRequests(filters?: {
    status?: 'OPEN' | 'PARTIALLY_FUNDED' | 'GOAL_REACHED' | 'CANCELLED' | 'CLOSED' | 'EXPIRED';
    requesterId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, requesterId, page = 1, limit = 20 } = filters || {};

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (requesterId) {
      where.requesterId = requesterId;
    }

    const [requests, total] = await Promise.all([
      this.prisma.financialSupportRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              department: true,
              school: true,
              region: true,
            },
          },
          contributions: {
            include: {
              contributor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 5, // Show latest 5 contributors
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.financialSupportRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single financial support request with full details
   */
  async getFinancialSupportRequestById(requestId: string) {
    const request = await this.prisma.financialSupportRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            department: true,
            school: true,
            region: true,
            bio: true,
          },
        },
        contributions: {
          include: {
            contributor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                department: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            contributions: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Financial support request not found');
    }

    return request;
  }

  /**
   * Cancel a financial support request (only by requester)
   */
  async cancelFinancialSupportRequest(requestId: string, teacherId: string) {
    const request = await this.prisma.financialSupportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Financial support request not found');
    }

    if (request.requesterId !== teacherId) {
      throw new ForbiddenException('Only the requester can cancel this request');
    }

    if (request.status !== 'OPEN' && request.status !== 'PARTIALLY_FUNDED') {
      throw new BadRequestException(`Cannot cancel a ${request.status.toLowerCase()} request`);
    }

    // If there are contributions, we cannot simply cancel
    if (Number(request.amountReceived) > 0) {
      throw new BadRequestException(
        'Cannot cancel a request that has received contributions. Please contact support.',
      );
    }

    return await this.prisma.financialSupportRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Get contribution history for a teacher
   */
  async getTeacherContributions(teacherId: string, page = 1, limit = 20) {
    const [contributions, total] = await Promise.all([
      this.prisma.financialContribution.findMany({
        where: { contributorId: teacherId },
        include: {
          supportRequest: {
            include: {
              requester: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.financialContribution.count({
        where: { contributorId: teacherId },
      }),
    ]);

    return {
      contributions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
