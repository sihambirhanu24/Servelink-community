import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RequestPayoutDto } from './dto/request-payout.dto';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { PaymentService } from './payment.service';

@Injectable()
export class PayoutService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private paymentService: PaymentService,
  ) {}

  async getTeacherWallet(teacherId: string) {
    console.log('[Payout] Getting teacher wallet for:', teacherId);

    // Calculate totals
    const [totalEarnings, pendingEarnings, availableEarnings, paidOutEarnings, recentEarnings, recentPayouts] = await Promise.all([
      this.prisma.teacherEarning.aggregate({
        where: { teacherId },
        _sum: { netAmount: true },
      }),
      this.prisma.teacherEarning.aggregate({
        where: { teacherId, status: 'PENDING' },
        _sum: { netAmount: true },
      }),
      this.prisma.teacherEarning.aggregate({
        where: { teacherId, status: 'AVAILABLE' },
        _sum: { netAmount: true },
      }),
      this.prisma.teacherEarning.aggregate({
        where: { teacherId, status: 'PAID_OUT' },
        _sum: { netAmount: true },
      }),
      this.prisma.teacherEarning.findMany({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          payment: {
            include: {
              liveSession: {
                select: { topic: true, scheduledStart: true },
              },
            },
          },
        },
      }),
      this.prisma.payout.findMany({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Get platform settings for minimum payout and fee
    const settings = await this.prisma.platformSettings.findFirst();
    const platformFeePercent = settings?.platformFeePercent || 15;
    const minPayoutAmount = settings?.minPayoutAmount || 100;

    return {
      totalEarnings: totalEarnings._sum.netAmount || new Prisma.Decimal(0),
      pendingEarnings: pendingEarnings._sum.netAmount || new Prisma.Decimal(0),
      availableEarnings: availableEarnings._sum.netAmount || new Prisma.Decimal(0),
      paidOutEarnings: paidOutEarnings._sum.netAmount || new Prisma.Decimal(0),
      platformFeePercent,
      minPayoutAmount,
      recentEarnings,
      recentPayouts,
    };
  }

  async requestPayout(teacherId: string, dto: RequestPayoutDto) {
    console.log('[Payout] Requesting payout for teacher:', teacherId, 'amount:', dto.amount);



    // Get available balance
    const wallet = await this.getTeacherWallet(teacherId);

    if (Number(wallet.availableEarnings) < dto.amount) {
      throw new BadRequestException(`Insufficient balance. Available: ${wallet.availableEarnings}, Requested: ${dto.amount}`);
    }

    // Check minimum payout amount
    const settings = await this.prisma.platformSettings.findFirst();
    const minPayoutAmount = settings?.minPayoutAmount || 100;

    if (dto.amount < Number(minPayoutAmount)) {
      throw new BadRequestException(`Minimum payout amount is ${minPayoutAmount} ETB`);
    }

    // Check for pending payouts
    const pendingPayouts = await this.prisma.payout.findFirst({
      where: { teacherId, status: 'PENDING' },
    });

    if (pendingPayouts) {
      throw new ConflictException('You already have a pending payout request');
    }

    // Generate unique reference
    const reference = `PAYOUT_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

    // Use database transaction to prevent double spending
    const result = await this.prisma.$transaction(async (tx) => {
      // Create payout request
      const payout = await tx.payout.create({
        data: {
          teacherId,
          amount: new Prisma.Decimal(dto.amount),
          currency: dto.currency || 'ETB',
          status: 'PENDING',
          bankName: dto.bankCode,
          bankAccountNumber: dto.bankAccountNumber,
          bankAccountName: dto.bankAccountName,
          reference,
        },
      });

      // Mark earnings as paid out
      const availableEarnings = await tx.teacherEarning.findMany({
        where: { teacherId, status: 'AVAILABLE' },
        orderBy: { createdAt: 'asc' },
      });

      let remainingAmount = new Prisma.Decimal(dto.amount);
      const earningsToMark: string[] = [];

      for (const earning of availableEarnings) {
        if (remainingAmount.lte(0)) break;

        if (earning.netAmount.lte(remainingAmount)) {
          earningsToMark.push(earning.id);
          remainingAmount = remainingAmount.sub(earning.netAmount);
        } else {
          // Partial payout: the earning is bigger than remaining amount
          // We mark this earning as PAID_OUT, but create a new earning for the remainder.
          earningsToMark.push(earning.id);
          const remainder = earning.netAmount.sub(remainingAmount);
          
          await tx.teacherEarning.create({
            data: {
              teacherId: earning.teacherId,
              liveSessionId: earning.liveSessionId,
              paymentId: earning.paymentId,
              grossAmount: remainder,
              platformFee: new Prisma.Decimal(0),
              netAmount: remainder,
              status: 'AVAILABLE',
            }
          });
          
          remainingAmount = new Prisma.Decimal(0);
          break;
        }
      }

      if (remainingAmount.gt(0)) {
        throw new BadRequestException('Insufficient available earnings to cover the requested amount');
      }

      await tx.teacherEarning.updateMany({
        where: { id: { in: earningsToMark } },
        data: { status: 'PAID_OUT', payoutId: payout.id },
      });

      return payout;
    });

    console.log('[Payout] Database transaction complete. Initiating Chapa transfer...', result.id);

    try {
      // Initiate Chapa transfer
      const transferResponse = await this.paymentService.initiateTransfer({
        account_name: dto.bankAccountName,
        account_number: dto.bankAccountNumber,
        amount: dto.amount,
        currency: dto.currency || 'ETB',
        reference,
        bank_code: dto.bankCode, // Sending bankCode directly
      });

      // Update payout with success status (if synchronous) or leave as PROCESSING
      if (transferResponse.status === 'success') {
        await this.prisma.payout.update({
          where: { id: result.id },
          data: { status: 'PROCESSING' }, // Or SUCCESS depending on Chapa's response format
        });
      }
    } catch (error: any) {
      console.error('[Payout] Chapa transfer failed, marking as FAILED and refunding earnings:', error.message);
      
      // If Chapa failed, we must refund the TeacherEarnings and mark payout as FAILED
      await this.prisma.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: result.id },
          data: { 
            status: 'REJECTED',
            rejectionReason: error.message,
          },
        });

        // Refund earnings
        await tx.teacherEarning.updateMany({
          where: { payoutId: result.id },
          data: { 
            status: 'AVAILABLE',
            payoutId: null,
          },
        });
      });

      throw error;
    }

    return result;
  }

  async getPayoutHistory(teacherId: string) {
    const payouts = await this.prisma.payout.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });

    return payouts;
  }

  async verifyPayoutStatus(reference: string, teacherId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { reference },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.teacherId !== teacherId) {
      throw new BadRequestException('Unauthorized');
    }

    if (payout.status === 'COMPLETED' || payout.status === 'REJECTED') {
      return payout;
    }

    // Call Chapa to verify
    try {
      const chapaStatus = await this.paymentService.verifyTransfer(reference);
      
      if (chapaStatus.data?.status === 'success') {
        const updated = await this.prisma.payout.update({
          where: { reference },
          data: { status: 'COMPLETED' },
        });
        return updated;
      } else if (chapaStatus.data?.status === 'failed') {
        const updated = await this.prisma.$transaction(async (tx) => {
          const p = await tx.payout.update({
            where: { reference },
            data: { 
              status: 'REJECTED',
              rejectionReason: chapaStatus.data?.message || 'Transfer failed',
            },
          });
          
          await tx.teacherEarning.updateMany({
            where: { payoutId: payout.id },
            data: { status: 'AVAILABLE', payoutId: null },
          });

          return p;
        });
        return updated;
      }

      return payout;
    } catch (error) {
      console.error('[Payout] Verify status error:', error);
      return payout;
    }
  }

  // Admin methods
  async getAllPayouts(status?: string, page = 1, limit = 20) {
    const where = status ? { status: status as any } : {};
    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      payouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approvePayout(payoutId: string, adminId: string) {
    console.log('[Payout] Admin approving payout:', payoutId, 'by admin:', adminId);

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { teacher: true },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Payout is not in pending status');
    }

    const updatedPayout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });

    console.log('[Payout] Payout approved:', updatedPayout.id);

    return updatedPayout;
  }

  async rejectPayout(payoutId: string, adminId: string, reason: string) {
    console.log('[Payout] Admin rejecting payout:', payoutId, 'by admin:', adminId);

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Payout is not in pending status');
    }

    // Use transaction to revert earnings back to available
    const result = await this.prisma.$transaction(async (tx) => {
      // Update payout status
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
        },
      });

      // Revert associated earnings back to available
      await tx.teacherEarning.updateMany({
        where: { payoutId },
        data: { status: 'AVAILABLE', payoutId: null },
      });

      return updatedPayout;
    });

    console.log('[Payout] Payout rejected:', result.id);

    return result;
  }

  async processPayout(payoutId: string, adminId: string) {
    console.log('[Payout] Admin processing payout:', payoutId, 'by admin:', adminId);

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'APPROVED') {
      throw new BadRequestException('Payout must be approved before processing');
    }

    const updatedPayout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'PROCESSING',
        processedBy: adminId,
        processedAt: new Date(),
      },
    });

    console.log('[Payout] Payout marked as processing:', updatedPayout.id);

    return updatedPayout;
  }

  async completePayout(payoutId: string, adminId: string) {
    console.log('[Payout] Admin completing payout:', payoutId, 'by admin:', adminId);

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'PROCESSING') {
      throw new BadRequestException('Payout must be in processing status');
    }

    const updatedPayout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    console.log('[Payout] Payout completed:', updatedPayout.id);

    return updatedPayout;
  }

  async getFinanceDashboard() {
    console.log('[Payout] Getting finance dashboard data');

    const [
      totalPaymentVolume,
      platformRevenue,
      teacherEarningsTotal,
      pendingPayouts,
      completedPayouts,
      failedPayments,
      refunds,
      recentTransactions,
      recentPayouts,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESSFUL' },
        _sum: { amount: true },
      }),
      this.prisma.teacherEarning.aggregate({
        _sum: { platformFee: true },
      }),
      this.prisma.teacherEarning.aggregate({
        _sum: { netAmount: true },
      }),
      this.prisma.payout.count({ where: { status: 'PENDING' } }),
      this.prisma.payout.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.count({ where: { status: 'REFUNDED' } }),
      this.prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          teacher: {
            select: { firstName: true, lastName: true, email: true },
          },
          liveSession: {
            select: { topic: true },
          },
        },
      }),
      this.prisma.payout.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          teacher: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    return {
      totalPaymentVolume: totalPaymentVolume._sum.amount || new Prisma.Decimal(0),
      platformRevenue: platformRevenue._sum.platformFee || new Prisma.Decimal(0),
      teacherEarningsTotal: teacherEarningsTotal._sum.netAmount || new Prisma.Decimal(0),
      pendingPayouts,
      completedPayouts,
      failedPayments,
      refunds,
      recentTransactions,
      recentPayouts,
    };
  }
  // --- Payout Profile Logic ---
  
  async getPayoutProfile(teacherId: string) {
    return this.prisma.teacherPayoutProfile.findUnique({
      where: { teacherId },
    });
  }

  async updatePayoutProfile(teacherId: string, profileData: any) {
    let { phoneNumber, provider } = profileData;
    
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }

    // Normalize phone number (e.g., convert 09... to +2519...)
    phoneNumber = phoneNumber.replace(/[\s-]/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+251' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('251')) {
      phoneNumber = '+' + phoneNumber;
    }
    
    // Check if another teacher is already using this phone number
    const existing = await this.prisma.teacherPayoutProfile.findFirst({
      where: { 
        phoneNumber,
        teacherId: { not: teacherId } 
      }
    });

    if (existing) {
      throw new ConflictException('This phone number is already registered to another teacher');
    }

    return this.prisma.teacherPayoutProfile.upsert({
      where: { teacherId },
      update: {
        phoneNumber,
        provider: provider || 'TELEBIRR',
        verified: false,
      },
      create: {
        teacherId,
        phoneNumber,
        provider: provider || 'TELEBIRR',
        verified: false,
      },
    });
  }
}
