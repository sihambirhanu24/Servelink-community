import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreatePaymentDto, PaymentMethod } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getChapaBaseUrl(): string {
    const testMode = this.configService.get<boolean>('CHAPA_TEST_MODE', true);
    return testMode
      ? 'https://api.chapa.co/v1/transaction/initialize'
      : 'https://api.chapa.co/v1/transaction/initialize';
  }

  private getChapaSecretKey(): string {
    return this.configService.get<string>('CHAPA_SECRET_KEY', '');
  }

  private getChapaPublicKey(): string {
    return this.configService.get<string>('CHAPA_PUBLIC_KEY', '');
  }

  private getCallbackUrl(): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${baseUrl}/payment/callback`;
  }

  private getReturnUrl(): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${baseUrl}/payment/success`;
  }

  async createPayment(teacherId: string, dto: CreatePaymentDto) {
    console.log('[Payment] Creating payment for teacher:', teacherId, 'session:', dto.liveSessionId);

    // Verify live session exists and is paid
    const liveSession = await this.prisma.liveSession.findUnique({
      where: { id: dto.liveSessionId },
    });

    if (!liveSession) {
      throw new NotFoundException('Live session not found');
    }

    if (!liveSession.isPaid || !liveSession.price) {
      throw new BadRequestException('This session is not a paid session');
    }

    // Verify amount matches session price
    if (Number(dto.amount) !== Number(liveSession.price)) {
      throw new BadRequestException(`Amount must be ${liveSession.price} ETB`);
    }

    // Check for duplicate payment using idempotency key
    const idempotencyKey = `${teacherId}_${dto.liveSessionId}_${Date.now()}`;
    
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        teacherId,
        liveSessionId: dto.liveSessionId,
        status: { in: ['SUCCESSFUL', 'PROCESSING'] },
      },
    });

    if (existingPayment) {
      throw new ConflictException('Payment already exists for this session');
    }

    // Generate unique transaction reference
    const transactionRef = `TXN_${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

    // Prepare Chapa payment request
    const chapaPayload = {
      amount: dto.amount,
      currency: dto.currency || 'ETB',
      email: dto.email || 'user@example.com',
      first_name: dto.firstName || 'User',
      last_name: dto.lastName || 'Name',
      phone_number: dto.phone || '+251911234567',
      tx_ref: transactionRef,
      callback_url: this.getCallbackUrl(),
      return_url: `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/payments/chapa/result?tx_ref=${transactionRef}`,
      'customization[title]': 'ServeLink Live Session Payment',
      'customization[description]': `Payment for session: ${liveSession.topic}`,
      'meta[teacher_id]': teacherId,
      'meta[live_session_id]': dto.liveSessionId,
      'meta[idempotency_key]': idempotencyKey,
      'meta[invoices]': JSON.stringify([
        { key: "Live Session", value: liveSession.topic },
        { key: "Session Access", value: "1 seat" }
      ]),
    };

    console.log('[Payment] Chapa payload prepared:', { transactionRef, amount: dto.amount });

    try {
      const chapaResponse = await axios.post(
        this.getChapaBaseUrl(),
        chapaPayload,
        {
          headers: {
            Authorization: `Bearer ${this.getChapaSecretKey()}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('[Payment] Chapa response:', chapaResponse.data);

      if (chapaResponse.data.status !== 'success') {
        throw new BadRequestException('Failed to initialize payment with Chapa');
      }

      // Save payment record
      const payment = await this.prisma.payment.create({
        data: {
          teacherId,
          liveSessionId: dto.liveSessionId,
          amount: new Prisma.Decimal(dto.amount),
          currency: dto.currency || 'ETB',
          status: 'PENDING',
          paymentMethod: dto.paymentMethod as PaymentMethod,
          transactionRef,
          chapaTxRef: chapaResponse.data.data.tx_ref,
          chapaCheckoutUrl: chapaResponse.data.data.checkout_url,
          idempotencyKey,
          metadata: chapaResponse.data.data,
        },
      });

      console.log('[Payment] Payment record created:', payment.id);

      return {
        paymentId: payment.id,
        transactionRef: payment.transactionRef,
        checkoutUrl: payment.chapaCheckoutUrl,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error) {
      console.error('[Payment] Chapa API error:', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(`Chapa API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async verifyPayment(dto: VerifyPaymentDto) {
    console.log('[Payment] Verifying payment:', dto.transactionRef);

    const payment = await this.prisma.payment.findUnique({
      where: { transactionRef: dto.transactionRef },
      include: {
        liveSession: true,
        teacher: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === 'SUCCESSFUL') {
      console.log('[Payment] Payment already verified');
      return {
        status: payment.status,
        verifiedAt: payment.verifiedAt,
        message: 'Payment already verified',
        liveSessionId: payment.liveSessionId,
      };
    }

    // Verify with Chapa API
    try {
      const verifyUrl = `https://api.chapa.co/v1/transaction/verify/${dto.transactionRef}`;
      const chapaResponse = await axios.get(verifyUrl, {
        headers: {
          Authorization: `Bearer ${this.getChapaSecretKey()}`,
        },
      });

      console.log('[Payment] Chapa verification response:', chapaResponse.data);

      const chapaStatus = chapaResponse.data.data.status;
      const chapaReference = chapaResponse.data.data.reference || chapaResponse.data.data.tx_ref;
      const isSuccessful = chapaStatus === 'success';
      const failureMessage = isSuccessful ? null : chapaResponse.data.message || 'Payment failed';

      const result = await this.processPaymentResult(payment, isSuccessful, failureMessage, chapaReference);

      return {
        status: result.status,
        verifiedAt: result.verifiedAt,
        message: isSuccessful ? 'Payment verified successfully' : 'Payment verification failed',
        liveSessionId: result.liveSessionId,
        chapaReference: result.chapaTxRef,
        amount: result.amount,
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error('[Payment] Verification error:', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(`Verification error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async handleWebhook(payload: any) {
    console.log('[Payment] Webhook received:', payload);

    const { tx_ref, status, reference } = payload;

    if (!tx_ref) {
      throw new BadRequestException('Missing transaction reference');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { transactionRef: tx_ref },
      include: {
        liveSession: true,
        teacher: true,
      },
    });

    if (!payment) {
      console.error('[Payment] Payment not found for webhook:', tx_ref);
      throw new NotFoundException('Payment not found');
    }

    const isSuccessful = status === 'success';
    await this.processPaymentResult(payment, isSuccessful, payload.message || 'Payment failed', reference || tx_ref);

    return { received: true };
  }

  private async processPaymentResult(payment: any, isSuccessful: boolean, failureReason: string | null, chapaReference: string | null = null) {
    // If the payment is already recorded as SUCCESSFUL in our database, it's idempotent
    if (payment.status === 'SUCCESSFUL') {
      // If we got a new chapaReference but didn't have one before, we might want to update it, but for idempotency returning is usually fine.
      return payment;
    }

    // Use a transaction to ensure Payment, Registration, and Earning all update atomically
    return await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment status
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isSuccessful ? 'SUCCESSFUL' : 'FAILED',
          verifiedAt: new Date(),
          completedAt: isSuccessful ? new Date() : null,
          failureReason: isSuccessful ? null : failureReason,
          chapaTxRef: chapaReference || payment.chapaTxRef,
        },
      });

      if (isSuccessful) {
        // 2. Create LiveSessionRegistration for the student
        if (payment.liveSessionId) {
          await tx.liveSessionRegistration.upsert({
            where: {
              teacherId_liveSessionId: {
                teacherId: payment.teacherId,
                liveSessionId: payment.liveSessionId,
              },
            },
            update: {
              status: 'REGISTERED',
              paymentId: payment.id,
            },
            create: {
              teacherId: payment.teacherId,
              liveSessionId: payment.liveSessionId,
              paymentId: payment.id,
              status: 'REGISTERED',
            },
          });
          console.log('[Payment] Student registered for live session:', payment.liveSessionId);
        }

        // 3. Create TeacherEarning (creates the wallet credit)
        await this.createTeacherEarning(tx, payment);
      }

      console.log('[Payment] Payment processing complete. Status:', updatedPayment.status);
      return updatedPayment;
    });
  }

  private async createTeacherEarning(tx: any, payment: any) {
    console.log('[Payment] Creating teacher earning for payment:', payment.id);

    // Get platform settings
    const settings = await this.prisma.platformSettings.findFirst();
    const platformFeePercent = settings?.platformFeePercent || 10;

    const grossAmount = payment.amount;
    const platformFee = grossAmount.mul(platformFeePercent).div(100);
    const netAmount = grossAmount.sub(platformFee);

    const earning = await tx.teacherEarning.create({
      data: {
        teacherId: payment.liveSession.teacherId, // Note: Give earning to the HOST, not the STUDENT (payment.teacherId)
        liveSessionId: payment.liveSessionId,
        paymentId: payment.id,
        grossAmount,
        platformFee,
        netAmount,
        status: 'AVAILABLE',
        completedAt: new Date(),
      },
    });

    console.log('[Payment] Teacher earning created:', earning.id);

    return earning;
  }

  async getPaymentHistory(teacherId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { teacherId },
      include: {
        liveSession: {
          select: {
            topic: true,
            scheduledStart: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }

  async getPaymentById(id: string, teacherId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, teacherId },
      include: {
        liveSession: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // ==========================================
  // CHAPA TRANSFER API (PAYOUTS)
  // ==========================================

  async getChapaBanks() {
    try {
      const response = await axios.get('https://api.chapa.co/v1/banks', {
        headers: {
          Authorization: `Bearer ${this.getChapaSecretKey()}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('[Payment] Error fetching Chapa banks:', error.response?.data || error.message);
      throw new BadRequestException('Failed to fetch supported banks from Chapa');
    }
  }

  async initiateTransfer(payload: {
    account_name: string;
    account_number: string;
    amount: number;
    currency: string;
    reference: string;
    bank_code: string;
  }) {
    try {
      const response = await axios.post(
        'https://api.chapa.co/v1/transfers',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.getChapaSecretKey()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('[Payment] Chapa transfer response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[Payment] Chapa transfer error:', error.response?.data || error.message);
      throw new BadRequestException(`Chapa transfer failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async verifyTransfer(reference: string) {
    try {
      const response = await axios.get(`https://api.chapa.co/v1/transfers/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.getChapaSecretKey()}`,
        },
      });
      console.log(`[Payment] Chapa transfer verification for ${reference}:`, response.data);
      return response.data;
    } catch (error: any) {
      console.error('[Payment] Chapa transfer verification error:', error.response?.data || error.message);
      throw new BadRequestException(`Failed to verify transfer: ${error.response?.data?.message || error.message}`);
    }
  }
}
