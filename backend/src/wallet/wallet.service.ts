import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, WalletTransactionType, WalletTransactionStatus } from '@prisma/client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create wallet balance for a teacher
   */
  async getOrCreateBalance(teacherId: string) {
    let wallet = await this.prisma.walletBalance.findUnique({
      where: { teacherId },
    });

    if (!wallet) {
      wallet = await this.prisma.walletBalance.create({
        data: {
          teacherId,
          availableBalance: 0,
          reservedBalance: 0,
          totalBalance: 0,
        },
      });
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getBalance(teacherId: string) {
    const wallet = await this.getOrCreateBalance(teacherId);
    
    return {
      id: wallet.id,
      teacherId: wallet.teacherId,
      availableBalance: wallet.availableBalance,
      reservedBalance: wallet.reservedBalance,
      totalBalance: wallet.totalBalance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  /**
   * Reserve funds for a support request (atomic operation)
   * This reduces available balance and increases reserved balance
   */
  async reserveFunds(
    teacherId: string,
    amount: number,
    reference: string,
    supportRequestId: string,
    description: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Check for duplicate reference (idempotency)
    const existingTx = await this.prisma.walletTransaction.findUnique({
      where: { reference },
    });

    if (existingTx) {
      this.logger.warn(`Duplicate reservation attempt: ${reference}`);
      return existingTx;
    }

    return await this.prisma.$transaction(async (tx) => {
      // Get current balance
      const wallet = await tx.walletBalance.findUnique({
        where: { teacherId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Check if sufficient funds available
      if (wallet.availableBalance.toNumber() < amount) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${wallet.availableBalance} ETB, Required: ${amount} ETB`,
        );
      }

      const balanceBefore = wallet.availableBalance;
      const newAvailableBalance = wallet.availableBalance.toNumber() - amount;
      const newReservedBalance = wallet.reservedBalance.toNumber() + amount;

      // Update wallet balances
      await tx.walletBalance.update({
        where: { teacherId },
        data: {
          availableBalance: newAvailableBalance,
          reservedBalance: newReservedBalance,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          teacherId,
          type: WalletTransactionType.SUPPORT_RESERVE,
          amount: -amount,
          balanceBefore: balanceBefore,
          balanceAfter: newAvailableBalance,
          status: WalletTransactionStatus.COMPLETED,
          reference,
          supportRequestId,
          description,
        },
      });

      this.logger.log(
        `Reserved ${amount} ETB for teacher ${teacherId}, reference: ${reference}`,
      );

      return transaction;
    });
  }

  /**
   * Release reserved funds back to available balance (atomic operation)
   * Used when request is declined or cancelled
   */
  async releaseFunds(
    teacherId: string,
    amount: number,
    reference: string,
    supportRequestId: string,
    description: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Check for duplicate reference (idempotency)
    const existingTx = await this.prisma.walletTransaction.findUnique({
      where: { reference },
    });

    if (existingTx) {
      this.logger.warn(`Duplicate release attempt: ${reference}`);
      return existingTx;
    }

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.walletBalance.findUnique({
        where: { teacherId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Check if sufficient reserved funds
      if (wallet.reservedBalance.toNumber() < amount) {
        throw new BadRequestException(
          `Insufficient reserved balance. Reserved: ${wallet.reservedBalance} ETB, Required: ${amount} ETB`,
        );
      }

      const balanceBefore = wallet.availableBalance;
      const newAvailableBalance = wallet.availableBalance.toNumber() + amount;
      const newReservedBalance = wallet.reservedBalance.toNumber() - amount;

      // Update wallet balances
      await tx.walletBalance.update({
        where: { teacherId },
        data: {
          availableBalance: newAvailableBalance,
          reservedBalance: newReservedBalance,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          teacherId,
          type: WalletTransactionType.SUPPORT_RELEASE,
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: newAvailableBalance,
          status: WalletTransactionStatus.COMPLETED,
          reference,
          supportRequestId,
          description,
        },
      });

      this.logger.log(
        `Released ${amount} ETB for teacher ${teacherId}, reference: ${reference}`,
      );

      return transaction;
    });
  }

  /**
   * Transfer funds from one teacher to another (atomic operation)
   * Used when provider accepts a paid support request
   */
  async transferFunds(
    fromTeacherId: string,
    toTeacherId: string,
    amount: number,
    reference: string,
    supportRequestId: string,
    description: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    if (fromTeacherId === toTeacherId) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    // Check for duplicate reference (idempotency)
    const existingTx = await this.prisma.walletTransaction.findFirst({
      where: { reference },
    });

    if (existingTx) {
      this.logger.warn(`Duplicate transfer attempt: ${reference}`);
      return { debitTx: existingTx, creditTx: existingTx };
    }

    return await this.prisma.$transaction(async (tx) => {
      // Get sender wallet (requester)
      const fromWallet = await tx.walletBalance.findUnique({
        where: { teacherId: fromTeacherId },
      });

      if (!fromWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      // Check if sufficient reserved funds
      if (fromWallet.reservedBalance.toNumber() < amount) {
        throw new BadRequestException(
          `Insufficient reserved balance. Reserved: ${fromWallet.reservedBalance} ETB, Required: ${amount} ETB`,
        );
      }

      // Get or create receiver wallet (provider)
      let toWallet = await tx.walletBalance.findUnique({
        where: { teacherId: toTeacherId },
      });

      if (!toWallet) {
        toWallet = await tx.walletBalance.create({
          data: {
            teacherId: toTeacherId,
            availableBalance: 0,
            reservedBalance: 0,
            totalBalance: 0,
          },
        });
      }

      // Calculate new balances
      const fromBalanceBefore = fromWallet.reservedBalance;
      const toBalanceBefore = toWallet.availableBalance;

      const newFromReservedBalance = fromWallet.reservedBalance.toNumber() - amount;
      const newFromTotalBalance = fromWallet.totalBalance.toNumber() - amount;
      const newToAvailableBalance = toWallet.availableBalance.toNumber() + amount;
      const newToTotalBalance = toWallet.totalBalance.toNumber() + amount;

      // Update sender wallet (deduct from reserved)
      await tx.walletBalance.update({
        where: { teacherId: fromTeacherId },
        data: {
          reservedBalance: newFromReservedBalance,
          totalBalance: newFromTotalBalance,
        },
      });

      // Update receiver wallet (add to available)
      await tx.walletBalance.update({
        where: { teacherId: toTeacherId },
        data: {
          availableBalance: newToAvailableBalance,
          totalBalance: newToTotalBalance,
        },
      });

      // Create debit transaction
      const debitTx = await tx.walletTransaction.create({
        data: {
          teacherId: fromTeacherId,
          type: WalletTransactionType.SUPPORT_TRANSFER_DEBIT,
          amount: -amount,
          balanceBefore: fromBalanceBefore,
          balanceAfter: newFromReservedBalance,
          status: WalletTransactionStatus.COMPLETED,
          reference: `${reference}-DEBIT`,
          supportRequestId,
          relatedTeacherId: toTeacherId,
          description: `${description} (paid to provider)`,
        },
      });

      // Create credit transaction
      const creditTx = await tx.walletTransaction.create({
        data: {
          teacherId: toTeacherId,
          type: WalletTransactionType.SUPPORT_TRANSFER_CREDIT,
          amount: amount,
          balanceBefore: toBalanceBefore,
          balanceAfter: newToAvailableBalance,
          status: WalletTransactionStatus.COMPLETED,
          reference: `${reference}-CREDIT`,
          supportRequestId,
          relatedTeacherId: fromTeacherId,
          description: `${description} (received from requester)`,
        },
      });

      this.logger.log(
        `Transferred ${amount} ETB from ${fromTeacherId} to ${toTeacherId}, reference: ${reference}`,
      );

      return { debitTx, creditTx };
    });
  }

  /**
   * Add earnings to wallet (used for existing live session earnings)
   */
  async addEarnings(
    teacherId: string,
    amount: number,
    reference: string,
    description: string,
    metadata?: any,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Check for duplicate reference (idempotency)
    const existingTx = await this.prisma.walletTransaction.findUnique({
      where: { reference },
    });

    if (existingTx) {
      this.logger.warn(`Duplicate earnings attempt: ${reference}`);
      return existingTx;
    }

    return await this.prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateBalance(teacherId);
      
      const balanceBefore = wallet.availableBalance;
      const newAvailableBalance = wallet.availableBalance.toNumber() + amount;
      const newTotalBalance = wallet.totalBalance.toNumber() + amount;

      // Update wallet
      await tx.walletBalance.update({
        where: { teacherId },
        data: {
          availableBalance: newAvailableBalance,
          totalBalance: newTotalBalance,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          teacherId,
          type: WalletTransactionType.EARNING,
          amount: amount,
          balanceBefore: balanceBefore,
          balanceAfter: newAvailableBalance,
          status: WalletTransactionStatus.COMPLETED,
          reference,
          description,
          metadata,
        },
      });

      this.logger.log(`Added ${amount} ETB earnings for teacher ${teacherId}`);

      return transaction;
    });
  }

  /**
   * Get transaction history
   */
  async getTransactions(teacherId: string, limit = 50, offset = 0) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        supportRequest: {
          select: {
            id: true,
            topic: true,
            status: true,
          },
        },
        relatedTeacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const total = await this.prisma.walletTransaction.count({
      where: { teacherId },
    });

    return {
      transactions,
      total,
      limit,
      offset,
    };
  }
}
