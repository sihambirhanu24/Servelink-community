import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

    // Calculate totals - PENDING earnings are reserved for payouts and not available
    const [
      totalEarnings,
      pendingEarnings,
      availableEarnings,
      paidOutEarnings,
      recentEarnings,
      recentPayouts,
    ] = await Promise.all([
      this.prisma.teacherEarning.aggregate({
        where: { teacherId, status: { not: 'REVERSED' } },
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

    // Convert Prisma.Decimal to numbers for JSON serialization
    const toNumber = (decimal: Prisma.Decimal | null | undefined): number => {
      if (!decimal) return 0;
      return decimal.toNumber();
    };

    // Serialize recentEarnings (convert Decimal fields)
    const serializedRecentEarnings = recentEarnings.map((earning) => ({
      ...earning,
      netAmount: Number(earning.netAmount),
      grossAmount: Number(earning.grossAmount),
      platformFee: Number(earning.platformFee),
    }));

    // Serialize recentPayouts (convert Decimal fields)
    const serializedRecentPayouts = recentPayouts.map((payout) => ({
      ...payout,
      amount: Number(payout.amount),
    }));

    return {
      totalEarnings: toNumber(totalEarnings._sum.netAmount),
      pendingEarnings: toNumber(pendingEarnings._sum.netAmount),
      availableEarnings: toNumber(availableEarnings._sum.netAmount),
      paidOutEarnings: toNumber(paidOutEarnings._sum.netAmount),
      platformFeePercent,
      minPayoutAmount,
      recentEarnings: serializedRecentEarnings,
      recentPayouts: serializedRecentPayouts,
    };
  }

  async requestPayout(teacherId: string, dto: RequestPayoutDto) {
    console.log(
      '[Payout] Requesting payout for teacher:',
      teacherId,
      'amount:',
      dto.amount,
    );

    // Get available balance
    const wallet = await this.getTeacherWallet(teacherId);

    if (Number(wallet.availableEarnings) < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${wallet.availableEarnings}, Requested: ${dto.amount}`,
      );
    }

    // Check minimum payout amount
    const settings = await this.prisma.platformSettings.findFirst();
    const minPayoutAmount = settings?.minPayoutAmount || 100;

    if (dto.amount < Number(minPayoutAmount)) {
      throw new BadRequestException(
        `Minimum payout amount is ${minPayoutAmount} ETB`,
      );
    }

    // Check for pending payouts (idempotency)
    const pendingPayouts = await this.prisma.payout.findFirst({
      where: { teacherId, status: { in: ['PENDING', 'PROCESSING'] } },
    });

    if (pendingPayouts) {
      throw new ConflictException(
        'You already have a pending or processing payout request',
      );
    }

    // Generate unique reference
    const reference = `PAYOUT_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

    // Calculate platform fee and net amount
    const platformFeePercent = settings?.platformFeePercent || 15;
    const feeAmount = new Prisma.Decimal(dto.amount)
      .mul(platformFeePercent)
      .div(100);
    const netAmount = new Prisma.Decimal(dto.amount).sub(feeAmount);

    // Use database transaction to prevent double spending
    const result = await this.prisma.$transaction(async (tx) => {
      // Create payout request
      const payout = await tx.payout.create({
        data: {
          teacherId,
          amount: new Prisma.Decimal(dto.amount),
          feeAmount,
          netAmount,
          currency: dto.currency || 'ETB',
          status: 'PENDING',
          bankCode: dto.bankCode,
          bankName: dto.bankCode,
          bankAccountNumber: dto.bankAccountNumber,
          bankAccountName: dto.bankAccountName,
          reference,
        },
      });

      // Create audit log for payout creation
      await tx.financialAuditLog.create({
        data: {
          action: 'PAYOUT_REQUESTED',
          actorId: teacherId,
          actorIsAdmin: false,
          metadata: {
            entityType: 'PAYOUT',
            entityId: payout.id,
            previousStatus: null,
            newStatus: 'PENDING',
            reason: 'Teacher requested payout',
            amount: dto.amount.toString(),
            bankCode: dto.bankCode,
            reference,
          },
        },
      });

      // Reserve earnings (mark as PENDING instead of PAID_OUT)
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
          // We mark this earning as PENDING, but create a new earning for the remainder.
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
            },
          });

          remainingAmount = new Prisma.Decimal(0);
          break;
        }
      }

      if (remainingAmount.gt(0)) {
        throw new BadRequestException(
          'Insufficient available earnings to cover the requested amount',
        );
      }

      await tx.teacherEarning.updateMany({
        where: { id: { in: earningsToMark } },
        data: { status: 'PENDING', payoutId: payout.id },
      });

      return payout;
    });

    console.log(
      '[Payout] Database transaction complete. Initiating Chapa transfer...',
      result.id,
    );

    try {
      // Initiate Chapa transfer immediately
      const transferResponse = await this.paymentService.initiateTransfer({
        account_name: dto.bankAccountName,
        account_number: dto.bankAccountNumber,
        amount: Number(netAmount), // Send net amount to Chapa
        currency: dto.currency || 'ETB',
        reference,
        bank_code: dto.bankCode,
      });

      console.log('[Payout] Chapa transfer response:', transferResponse);

      // Update payout with Chapa response data
      // Chapa returns { status: 'success', data: { id, reference, status } }
      if (transferResponse.status === 'success' && transferResponse.data) {
        const chapaTransferStatus = transferResponse.data.status?.toLowerCase();

        // Determine ServeLink payout status based on Chapa's response
        let payoutStatus: string;
        if (chapaTransferStatus === 'success') {
          payoutStatus = 'COMPLETED'; // Immediate success
        } else if (chapaTransferStatus === 'failed') {
          payoutStatus = 'FAILED'; // Immediate failure
        } else {
          payoutStatus = 'PROCESSING'; // Pending/queued
        }

        console.log(
          `[Payout] Chapa transfer status: ${chapaTransferStatus}, mapping to: ${payoutStatus}`,
        );

        await this.prisma.$transaction(async (tx) => {
          await tx.payout.update({
            where: { id: result.id },
            data: {
              status: payoutStatus as any,
              chapaTransferId: transferResponse.data.id?.toString(),
              chapaReference: transferResponse.data.reference,
              chapaStatus: chapaTransferStatus,
              submittedAt: new Date(),
              completedAt: payoutStatus === 'COMPLETED' ? new Date() : null,
              failedAt: payoutStatus === 'FAILED' ? new Date() : null,
              bankReference: transferResponse.data.bank_reference,
              metadata: transferResponse.data,
            },
          });

          // If immediately COMPLETED, mark earnings as PAID_OUT
          if (payoutStatus === 'COMPLETED') {
            await tx.teacherEarning.updateMany({
              where: { payoutId: result.id, status: 'PENDING' },
              data: { status: 'PAID_OUT' },
            });

            // Audit log for immediate COMPLETED
            await tx.financialAuditLog.create({
              data: {
                action: 'PAYOUT_COMPLETED_IMMEDIATE',
                actorId: teacherId,
                actorIsAdmin: false,
                metadata: {
                  entityType: 'PAYOUT',
                  entityId: result.id,
                  previousStatus: 'PENDING',
                  newStatus: 'COMPLETED',
                  reason: 'Chapa transfer completed immediately (test mode)',
                  chapaTransferId: transferResponse.data.id?.toString(),
                  chapaReference: transferResponse.data.reference,
                  chapaStatus: chapaTransferStatus,
                },
              },
            });
          } else if (payoutStatus === 'FAILED') {
            // If immediately FAILED, refund earnings
            await tx.teacherEarning.updateMany({
              where: { payoutId: result.id, status: 'PENDING' },
              data: { status: 'AVAILABLE', payoutId: null },
            });

            // Audit log for immediate FAILED
            await tx.financialAuditLog.create({
              data: {
                action: 'PAYOUT_FAILED_IMMEDIATE',
                actorId: teacherId,
                actorIsAdmin: false,
                metadata: {
                  entityType: 'PAYOUT',
                  entityId: result.id,
                  previousStatus: 'PENDING',
                  newStatus: 'FAILED',
                  reason: 'Chapa transfer failed immediately',
                  chapaError:
                    transferResponse.data.message || 'Transfer failed',
                },
              },
            });
          } else {
            // PROCESSING - waiting for webhook or manual verification
            await tx.financialAuditLog.create({
              data: {
                action: 'PAYOUT_PROCESSING',
                actorId: teacherId,
                actorIsAdmin: false,
                metadata: {
                  entityType: 'PAYOUT',
                  entityId: result.id,
                  previousStatus: 'PENDING',
                  newStatus: 'PROCESSING',
                  reason: 'Chapa transfer initiated successfully',
                  chapaTransferId: transferResponse.data.id?.toString(),
                  chapaReference: transferResponse.data.reference,
                  chapaStatus: chapaTransferStatus,
                },
              },
            });
          }
        });
      } else {
        // Chapa rejected the transfer
        throw new Error(transferResponse.message || 'Chapa transfer rejected');
      }
    } catch (error: any) {
      console.error(
        '[Payout] Chapa transfer failed, marking as REJECTED and refunding earnings:',
        error.message,
      );

      // If Chapa failed, we must refund the TeacherEarnings and mark payout as REJECTED
      await this.prisma.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: result.id },
          data: {
            status: 'REJECTED',
            rejectionReason: error.message,
            failedAt: new Date(),
          },
        });

        // Audit log for REJECTED transition
        await tx.financialAuditLog.create({
          data: {
            action: 'PAYOUT_REJECTED',
            actorId: teacherId,
            actorIsAdmin: false,
            metadata: {
              entityType: 'PAYOUT',
              entityId: result.id,
              previousStatus: 'PENDING',
              newStatus: 'REJECTED',
              reason: error.message,
              chapaError: error.message,
            },
          },
        });

        // Refund earnings back to AVAILABLE
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

    // Convert Decimal fields to numbers for JSON serialization
    const serializedPayouts = payouts.map((payout) => ({
      ...payout,
      amount: Number(payout.amount),
    }));

    return serializedPayouts;
  }

  async getProcessingPayoutsNeedingVerification(since: Date) {
    const payouts = await this.prisma.payout.findMany({
      where: {
        status: 'PROCESSING',
        OR: [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: since } }],
      },
      select: {
        id: true,
        reference: true,
        teacherId: true,
        lastVerifiedAt: true,
      },
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

    // Idempotency: if already finalized, return current status without calling Chapa
    if (
      payout.status === 'COMPLETED' ||
      payout.status === 'FAILED' ||
      payout.status === 'REJECTED'
    ) {
      console.log('[Payout] Payout already finalized:', payout.status);
      // Convert Decimal to number for JSON serialization
      return {
        ...payout,
        amount: Number(payout.amount),
      };
    }

    // Only call Chapa if still PROCESSING AND has a valid Chapa reference
    if (payout.status !== 'PROCESSING') {
      console.log(
        '[Payout] Payout not in PROCESSING status, skipping Chapa verification:',
        payout.status,
      );
      return {
        ...payout,
        amount: Number(payout.amount),
      };
    }

    // Check if Chapa transfer was actually submitted
    if (!payout.chapaReference && !payout.chapaTransferId) {
      console.log(
        '[Payout] No Chapa reference found - transfer may not have been submitted successfully',
      );

      // This payout is in PROCESSING but was never submitted to Chapa
      // Mark as FAILED and refund
      const updated = await this.prisma.$transaction(async (tx) => {
        const p = await tx.payout.update({
          where: { reference },
          data: {
            status: 'FAILED',
            rejectionReason:
              'Chapa transfer was not submitted successfully. No transfer reference found.',
            lastVerifiedAt: new Date(),
            failedAt: new Date(),
          },
        });

        // Refund reserved earnings back to AVAILABLE
        await tx.teacherEarning.updateMany({
          where: { payoutId: payout.id, status: 'PENDING' },
          data: { status: 'AVAILABLE', payoutId: null },
        });

        // Audit log
        await tx.financialAuditLog.create({
          data: {
            action: 'PAYOUT_FAILED_NO_REFERENCE',
            actorId: teacherId,
            actorIsAdmin: false,
            metadata: {
              entityType: 'PAYOUT',
              entityId: payout.id,
              previousStatus: payout.status,
              newStatus: 'FAILED',
              reason: 'No Chapa reference found - transfer was not submitted',
            },
          },
        });

        return p;
      });

      return {
        ...updated,
        amount: Number(updated.amount),
      };
    }

    // Call Chapa to verify (one-time only)
    try {
      const chapaStatus = await this.paymentService.verifyTransfer(reference);

      console.log('[Payout] Chapa verification response:', chapaStatus);

      // Chapa returns { status: 'success', data: { status: 'success'|'failed', ... } }
      const transferStatus = chapaStatus.data?.status;

      if (transferStatus === 'success') {
        const updated = await this.prisma.$transaction(async (tx) => {
          // Check again if already COMPLETED (race condition with webhook)
          const current = await tx.payout.findUnique({ where: { reference } });
          if (current?.status === 'COMPLETED') {
            return current;
          }

          // Mark payout as COMPLETED
          const p = await tx.payout.update({
            where: { reference },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
              lastVerifiedAt: new Date(),
              bankReference: chapaStatus.data?.bank_reference,
              chapaStatus: 'success',
              metadata: chapaStatus.data,
            },
          });

          // Mark reserved earnings as PAID_OUT
          await tx.teacherEarning.updateMany({
            where: { payoutId: payout.id, status: 'PENDING' },
            data: { status: 'PAID_OUT' },
          });

          // Audit log for COMPLETED transition
          await tx.financialAuditLog.create({
            data: {
              action: 'PAYOUT_COMPLETED_MANUAL',
              actorId: teacherId,
              actorIsAdmin: false,
              metadata: {
                entityType: 'PAYOUT',
                entityId: payout.id,
                previousStatus: payout.status,
                newStatus: 'COMPLETED',
                reason:
                  'Manual Chapa verification confirmed successful transfer',
                bankReference: chapaStatus.data?.bank_reference,
              },
            },
          });

          return p;
        });
        // Convert Decimal to number for JSON serialization
        return {
          ...updated,
          amount: Number(updated.amount),
        };
      } else if (transferStatus === 'failed') {
        const updated = await this.prisma.$transaction(async (tx) => {
          // Check again if already FAILED (race condition with webhook)
          const current = await tx.payout.findUnique({ where: { reference } });
          if (current?.status === 'FAILED' || current?.status === 'REJECTED') {
            return current;
          }

          const p = await tx.payout.update({
            where: { reference },
            data: {
              status: 'FAILED',
              rejectionReason: chapaStatus.data?.message || 'Transfer failed',
              lastVerifiedAt: new Date(),
              failedAt: new Date(),
              chapaStatus: 'failed',
              metadata: chapaStatus.data,
            },
          });

          // Refund reserved earnings back to AVAILABLE
          await tx.teacherEarning.updateMany({
            where: { payoutId: payout.id, status: 'PENDING' },
            data: { status: 'AVAILABLE', payoutId: null },
          });

          // Audit log for FAILED transition
          await tx.financialAuditLog.create({
            data: {
              action: 'PAYOUT_FAILED_MANUAL',
              actorId: teacherId,
              actorIsAdmin: false,
              metadata: {
                entityType: 'PAYOUT',
                entityId: payout.id,
                previousStatus: payout.status,
                newStatus: 'FAILED',
                reason: chapaStatus.data?.message || 'Transfer failed',
              },
            },
          });

          return p;
        });
        // Convert Decimal to number for JSON serialization
        return {
          ...updated,
          amount: Number(updated.amount),
        };
      }

      // Still processing - update last verified timestamp
      await this.prisma.payout.update({
        where: { reference },
        data: { lastVerifiedAt: new Date() },
      });

      // Convert Decimal to number for JSON serialization
      return {
        ...payout,
        amount: Number(payout.amount),
      };
    } catch (error) {
      console.error('[Payout] Verify status error:', error);
      // Convert Decimal to number for JSON serialization
      return {
        ...payout,
        amount: Number(payout.amount),
      };
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

    // Convert Decimal fields to numbers for JSON serialization
    const serializedPayouts = payouts.map((payout) => ({
      ...payout,
      amount: Number(payout.amount),
    }));

    return {
      payouts: serializedPayouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approvePayout(payoutId: string, adminId: string) {
    console.log(
      '[Payout] Admin approving payout:',
      payoutId,
      'by admin:',
      adminId,
    );

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
    console.log(
      '[Payout] Admin rejecting payout:',
      payoutId,
      'by admin:',
      adminId,
    );

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

      // Revert associated earnings back to available (both PAID_OUT and PENDING)
      await tx.teacherEarning.updateMany({
        where: { payoutId },
        data: { status: 'AVAILABLE', payoutId: null },
      });

      return updatedPayout;
    });

    console.log('[Payout] Payout rejected:', result.id);

    return result;
  }

  async cancelPayout(payoutId: string, teacherId: string) {
    console.log(
      '[Payout] Cancelling payout:',
      payoutId,
      'by teacher:',
      teacherId,
    );

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.teacherId !== teacherId) {
      throw new BadRequestException('You can only cancel your own payouts');
    }

    // Only allow cancelling PENDING payouts (not PROCESSING or COMPLETED)
    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Only pending payouts can be cancelled');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'CANCELLED',
          rejectionReason: 'Cancelled by teacher',
        },
      });

      // Refund reserved earnings back to AVAILABLE
      await tx.teacherEarning.updateMany({
        where: { payoutId, status: 'PENDING' },
        data: { status: 'AVAILABLE', payoutId: null },
      });

      // Audit log for CANCELLED transition
      await tx.financialAuditLog.create({
        data: {
          action: 'PAYOUT_CANCELLED',
          actorId: teacherId,
          actorIsAdmin: false,
          metadata: {
            entityType: 'PAYOUT',
            entityId: payoutId,
            previousStatus: payout.status,
            newStatus: 'CANCELLED',
            reason: 'Cancelled by teacher',
          },
        },
      });

      return updatedPayout;
    });

    console.log('[Payout] Payout cancelled:', result.id);

    // Convert Decimal to number for JSON serialization
    return {
      ...result,
      amount: Number(result.amount),
    };
  }

  async processPayout(payoutId: string, adminId: string) {
    console.log(
      '[Payout] Admin processing payout:',
      payoutId,
      'by admin:',
      adminId,
    );

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'APPROVED') {
      throw new BadRequestException(
        'Payout must be approved before processing',
      );
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

    // Convert Decimal to number for JSON serialization
    return {
      ...updatedPayout,
      amount: Number(updatedPayout.amount),
    };
  }

  async completePayout(
    payoutId: string,
    adminId: string,
    overrideReason?: string,
  ) {
    console.log(
      '[Payout] Admin completing payout with override:',
      payoutId,
      'by admin:',
      adminId,
      'reason:',
      overrideReason,
    );

    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== 'PROCESSING') {
      throw new BadRequestException('Payout must be in processing status');
    }

    // Require explicit override reason for manual completion
    if (!overrideReason) {
      throw new BadRequestException(
        'Manual completion requires an explicit override reason for audit purposes',
      );
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Mark payout as COMPLETED with admin override
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          rejectionReason: `ADMIN_OVERRIDE: ${overrideReason}`, // Store override reason in rejectionReason field for audit
          metadata: {
            ...((payout.metadata as any) || {}),
            adminOverride: true,
            overrideBy: adminId,
            overrideAt: new Date().toISOString(),
            overrideReason,
          },
        },
      });

      // Mark reserved earnings as PAID_OUT
      await tx.teacherEarning.updateMany({
        where: { payoutId, status: 'PENDING' },
        data: { status: 'PAID_OUT' },
      });

      // Create audit log entry
      await tx.financialAuditLog.create({
        data: {
          action: 'PAYOUT_ADMIN_OVERRIDE',
          actorId: adminId,
          actorIsAdmin: true,
          metadata: {
            entityType: 'PAYOUT',
            entityId: payoutId,
            previousStatus: payout.status,
            newStatus: 'COMPLETED',
            reason: overrideReason,
            chapaTransferId: payout.chapaTransferId,
            chapaReference: payout.chapaReference,
            amount: payout.amount.toString(),
          },
        },
      });

      return updatedPayout;
    });

    console.log('[Payout] Payout completed with admin override:', result.id);

    // Convert Decimal to number for JSON serialization
    return {
      ...result,
      amount: Number(result.amount),
    };
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
      pendingRefunds,
      failedRefunds,
      cancelledPaidSessions,
      recentTransactions,
      recentPayouts,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'SUCCESSFUL' },
        _sum: { amount: true },
      }),
      this.prisma.teacherEarning.aggregate({
        where: { status: { not: 'REVERSED' } },
        _sum: { platformFee: true },
      }),
      this.prisma.teacherEarning.aggregate({
        where: { status: { not: 'REVERSED' } },
        _sum: { netAmount: true },
      }),
      this.prisma.payout.count({ where: { status: 'PENDING' } }),
      this.prisma.payout.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.count({ where: { status: 'REFUNDED' } }),
      this.prisma.payment.count({
        where: { refundStatus: { in: ['PENDING', 'PROCESSING'] } },
      }),
      this.prisma.payment.count({ where: { refundStatus: 'FAILED' } }),
      this.prisma.liveSession.findMany({
        where: { status: 'CANCELLED', isPaid: true },
        orderBy: { cancelledAt: 'desc' },
        take: 50,
        include: {
          teacher: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          payments: {
            where: { status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
            select: {
              id: true,
              amount: true,
              status: true,
              refundStatus: true,
            },
          },
        },
      }),
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

    const cancelledSessionSummaries = cancelledPaidSessions.map((session) => {
      const payments = session.payments || [];
      const toNumber = (value: any) => Number(value || 0);
      const totalCollected = payments.reduce(
        (sum, p) => sum + toNumber(p.amount),
        0,
      );
      const refundedAmount = payments
        .filter((p) => p.refundStatus === 'REFUNDED' || p.status === 'REFUNDED')
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
      const pendingAmount = payments
        .filter(
          (p) =>
            p.refundStatus === 'PENDING' || p.refundStatus === 'PROCESSING',
        )
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
      const failedAmount = payments
        .filter((p) => p.refundStatus === 'FAILED')
        .reduce((sum, p) => sum + toNumber(p.amount), 0);

      return {
        id: session.id,
        topic: session.topic,
        host: session.teacher,
        price: session.price,
        cancelledAt: session.cancelledAt,
        paidParticipants: payments.length,
        totalCollected,
        refundedAmount,
        pendingAmount,
        failedAmount,
        refundStatus:
          failedAmount > 0
            ? 'HAS_FAILED'
            : pendingAmount > 0
              ? 'PENDING'
              : refundedAmount > 0
                ? 'REFUNDED'
                : 'NONE',
      };
    });

    // Convert Prisma.Decimal to numbers for JSON serialization
    const toNumber = (decimal: Prisma.Decimal | null | undefined): number => {
      if (!decimal) return 0;
      return decimal.toNumber();
    };

    return {
      totalPaymentVolume: toNumber(totalPaymentVolume._sum.amount),
      platformRevenue: toNumber(platformRevenue._sum.platformFee),
      teacherEarningsTotal: toNumber(teacherEarningsTotal._sum.netAmount),
      pendingPayouts,
      completedPayouts,
      failedPayments,
      refunds,
      pendingRefunds,
      failedRefunds,
      cancelledPaidSessions: cancelledSessionSummaries,
      recentTransactions,
      recentPayouts,
    };
  }

  // --- Chapa Webhook Handler ---

  async handleChapaWebhook(payload: any) {
    console.log('[Payout] Chapa webhook received:', payload);

    const {
      event,
      type,
      reference,
      chapa_reference,
      bank_reference,
      status,
      amount,
      currency,
    } = payload;

    if (!reference) {
      console.error('[Payout] Webhook missing reference');
      throw new BadRequestException('Missing payout reference');
    }

    // Find payout by ServeLink reference
    const payout = await this.prisma.payout.findUnique({
      where: { reference },
    });

    if (!payout) {
      console.error(
        '[Payout] Payout not found for webhook reference:',
        reference,
      );
      throw new NotFoundException('Payout not found');
    }

    // Idempotency check: if already COMPLETED or FAILED, return success
    if (payout.status === 'COMPLETED' || payout.status === 'FAILED') {
      console.log('[Payout] Payout already finalized:', payout.status);
      return {
        received: true,
        status: payout.status,
        message: 'Already processed',
      };
    }

    // Validate amount and currency match
    if (amount && Number(amount) !== Number(payout.netAmount)) {
      console.error(
        '[Payout] Webhook amount mismatch. Expected:',
        payout.netAmount,
        'Received:',
        amount,
      );
      throw new BadRequestException('Amount mismatch in webhook');
    }

    if (currency && currency !== payout.currency) {
      console.error(
        '[Payout] Webhook currency mismatch. Expected:',
        payout.currency,
        'Received:',
        currency,
      );
      throw new BadRequestException('Currency mismatch in webhook');
    }

    // Process based on event type
    const eventType = (event || type || '').toLowerCase();

    if (eventType.includes('success') || status === 'success') {
      return await this.processWebhookSuccess(
        payout,
        chapa_reference,
        bank_reference,
        payload,
      );
    } else if (
      eventType.includes('fail') ||
      eventType.includes('cancel') ||
      status === 'failed' ||
      status === 'cancelled'
    ) {
      return await this.processWebhookFailure(payout, payload);
    } else {
      console.log('[Payout] Unhandled webhook event:', eventType);
      return { received: true, message: 'Event not processed' };
    }
  }

  private async processWebhookSuccess(
    payout: any,
    chapaReference: string | null,
    bankReference: string | null,
    rawPayload: any,
  ) {
    console.log('[Payout] Processing webhook success for payout:', payout.id);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update payout to COMPLETED
      const updated = await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: 'COMPLETED',
          chapaReference,
          bankReference,
          chapaStatus: 'success',
          completedAt: new Date(),
          webhookReceivedAt: new Date(),
          metadata: {
            ...(typeof payout.metadata === 'object' ? payout.metadata : {}),
            webhook: rawPayload,
          },
        },
      });

      // Mark reserved earnings as PAID_OUT
      await tx.teacherEarning.updateMany({
        where: { payoutId: payout.id, status: 'PENDING' },
        data: { status: 'PAID_OUT' },
      });

      // Create audit log
      await tx.financialAuditLog.create({
        data: {
          action: 'PAYOUT_COMPLETED_WEBHOOK',
          actorId: payout.teacherId,
          actorIsAdmin: false,
          metadata: {
            entityType: 'PAYOUT',
            entityId: payout.id,
            previousStatus: payout.status,
            newStatus: 'COMPLETED',
            reason: 'Chapa webhook confirmed successful transfer',
            chapaReference,
            bankReference,
          },
        },
      });

      return updated;
    });

    console.log('[Payout] Webhook success processed:', result.id);
    return { received: true, status: 'COMPLETED', payoutId: result.id };
  }

  private async processWebhookFailure(payout: any, rawPayload: any) {
    console.log('[Payout] Processing webhook failure for payout:', payout.id);

    const result = await this.prisma.$transaction(async (tx) => {
      // Update payout to FAILED
      const updated = await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          chapaStatus: 'failed',
          failedAt: new Date(),
          webhookReceivedAt: new Date(),
          rejectionReason: rawPayload.message || 'Transfer failed via webhook',
          metadata: {
            ...(typeof payout.metadata === 'object' ? payout.metadata : {}),
            webhook: rawPayload,
          },
        },
      });

      // Release reserved earnings back to AVAILABLE
      await tx.teacherEarning.updateMany({
        where: { payoutId: payout.id, status: 'PENDING' },
        data: { status: 'AVAILABLE', payoutId: null },
      });

      // Create audit log
      await tx.financialAuditLog.create({
        data: {
          action: 'PAYOUT_FAILED_WEBHOOK',
          actorId: payout.teacherId,
          actorIsAdmin: false,
          metadata: {
            entityType: 'PAYOUT',
            entityId: payout.id,
            previousStatus: payout.status,
            newStatus: 'FAILED',
            reason: rawPayload.message || 'Transfer failed via webhook',
          },
        },
      });

      return updated;
    });

    console.log('[Payout] Webhook failure processed:', result.id);
    return { received: true, status: 'FAILED', payoutId: result.id };
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
        teacherId: { not: teacherId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'This phone number is already registered to another teacher',
      );
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
