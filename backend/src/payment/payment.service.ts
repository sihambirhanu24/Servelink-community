import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return `${baseUrl}/payment/callback`;
  }

  private getReturnUrl(): string {
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    return `${baseUrl}/payment/success`;
  }

  async createPayment(teacherId: string, dto: CreatePaymentDto) {
    console.log(
      '[Payment] Creating payment for teacher:',
      teacherId,
      'session:',
      dto.liveSessionId,
    );

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
        { key: 'Live Session', value: liveSession.topic },
        { key: 'Session Access', value: '1 seat' },
      ]),
    };

    console.log('[Payment] Chapa payload prepared:', {
      transactionRef,
      amount: dto.amount,
    });

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
        throw new BadRequestException(
          'Failed to initialize payment with Chapa',
        );
      }

      // Save payment record
      const payment = await this.prisma.payment.create({
        data: {
          teacherId,
          liveSessionId: dto.liveSessionId,
          amount: new Prisma.Decimal(dto.amount),
          currency: dto.currency || 'ETB',
          status: 'PENDING',
          paymentMethod: dto.paymentMethod,
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
        throw new BadRequestException(
          `Chapa API error: ${error.response?.data?.message || error.message}`,
        );
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
      const chapaReference =
        chapaResponse.data.data.reference || chapaResponse.data.data.tx_ref;
      const isSuccessful = chapaStatus === 'success';
      const failureMessage = isSuccessful
        ? null
        : chapaResponse.data.message || 'Payment failed';

      const result = await this.processPaymentResult(
        payment,
        isSuccessful,
        failureMessage,
        chapaReference,
      );

      return {
        status: result.status,
        verifiedAt: result.verifiedAt,
        message: isSuccessful
          ? 'Payment verified successfully'
          : 'Payment verification failed',
        liveSessionId: result.liveSessionId,
        chapaReference: result.chapaTxRef,
        amount: result.amount,
        createdAt: result.createdAt,
      };
    } catch (error) {
      console.error('[Payment] Verification error:', error);
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(
          `Verification error: ${error.response?.data?.message || error.message}`,
        );
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
    await this.processPaymentResult(
      payment,
      isSuccessful,
      payload.message || 'Payment failed',
      reference || tx_ref,
    );

    return { received: true };
  }

  private async processPaymentResult(
    payment: any,
    isSuccessful: boolean,
    failureReason: string | null,
    chapaReference: string | null = null,
  ) {
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
          console.log(
            '[Payment] Student registered for live session:',
            payment.liveSessionId,
          );
        }

        // 3. Create TeacherEarning (creates the wallet credit)
        await this.createTeacherEarning(tx, payment);
      }

      console.log(
        '[Payment] Payment processing complete. Status:',
        updatedPayment.status,
      );
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
      console.error(
        '[Payment] Error fetching Chapa banks:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        'Failed to fetch supported banks from Chapa',
      );
    }
  }

  /**
   * Returns true when CHAPA_TEST_MODE=true in the environment.
   * Never used in production — the guard at the top of each method ensures
   * live mode always calls the real Chapa API.
   */
  private isPayoutTestMode(): boolean {
    return this.configService.get<string>('CHAPA_TEST_MODE') === 'true';
  }

  /**
   * Reads TEST_PAYOUT_STATUS and validates it is one of the three accepted
   * values.  Throws a clear config error rather than silently defaulting so
   * the developer is alerted to a misconfiguration immediately.
   */
  private getTestPayoutStatus(): 'success' | 'pending' | 'failed' {
    const raw = (this.configService.get<string>('TEST_PAYOUT_STATUS') || '')
      .toLowerCase()
      .trim();
    if (raw === 'success' || raw === 'pending' || raw === 'failed') {
      return raw;
    }
    throw new BadRequestException(
      `[PAYOUT TEST MODE] TEST_PAYOUT_STATUS is "${raw || '(empty)'}". ` +
        'Must be one of: success | pending | failed. ' +
        'Fix your .env and restart the server.',
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // initiateTransfer
  // ─────────────────────────────────────────────────────────────────────────
  // Called by payout.service.ts → requestPayout().
  // Caller reads:
  //   transferResponse.status           → must be 'success' for happy path
  //   transferResponse.data             → must be an object
  //   transferResponse.data.reference   → stored as payout.chapaReference
  //   transferResponse.data.id          → stored as payout.chapaTransferId
  //   transferResponse.data.status      → lowercase: 'success'/'failed'/other
  //   transferResponse.data.bank_reference
  //   transferResponse.data.message
  // ─────────────────────────────────────────────────────────────────────────
  async initiateTransfer(payload: {
    account_name: string;
    account_number: string;
    amount: number;
    currency: string;
    reference: string;
    bank_code: string;
  }) {
    // ── TEST MODE ────────────────────────────────────────────────────────
    if (this.isPayoutTestMode()) {
      const testStatus = this.getTestPayoutStatus();
      // Build a deterministic, recognisable test reference from the ServeLink
      // payout reference so it is easy to trace in logs and the database.
      const testChapaRef = 'TEST_CHAPA_' + payload.reference;

      console.log('[PAYOUT] Test mode: true');
      console.log('[PAYOUT] Test payout status:', testStatus);
      console.log('[PAYOUT] Generated test transfer reference:', testChapaRef);
      console.log('[PAYOUT] accountExists:', !!payload.account_number);
      console.log('[PAYOUT] amount:', payload.amount, payload.currency);

      // Shape matches exactly what payout.service.ts expects from the real
      // Chapa response so the downstream status-mapping code is exercised
      // unchanged.
      return {
        status: 'success',
        message: '[TEST MODE] Transfer simulation - ' + testStatus,
        data: {
          id: testChapaRef,
          reference: testChapaRef,
          // 'success' → caller maps to COMPLETED
          // 'failed'  → caller maps to FAILED
          // 'pending' → caller maps to PROCESSING (everything else)
          status: testStatus,
          bank_reference:
            testStatus === 'success'
              ? 'TEST_BANK_REF_' + payload.reference
              : null,
          message:
            testStatus === 'failed'
              ? 'Test mode: simulated transfer failure'
              : null,
        },
      };
    }

    // ── LIVE MODE ────────────────────────────────────────────────────────
    console.log('[PAYOUT] Test mode: false');
    console.log('[PAYOUT] Sending real transfer to Chapa');
    console.log(
      '[PAYOUT] reference:',
      payload.reference,
      '| amount:',
      payload.amount,
      payload.currency,
      '| bankCode:',
      payload.bank_code,
      '| accountExists:',
      !!payload.account_number,
    );

    const backendUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:5000';
    const callbackUrl = backendUrl + '/api/payouts/chapa/webhook';

    try {
      const response = await axios.post(
        'https://api.chapa.co/v1/transfers',
        {
          ...payload,
          callback_url: callbackUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${this.getChapaSecretKey()}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('[Payment] Chapa transfer response:', response.data);

      // Guard against Chapa test-key quirk where data comes back as a plain
      // string instead of an object.  If it happens in live mode we surface
      // the real response rather than silently losing the reference.
      if (
        response.data?.status === 'success' &&
        typeof response.data.data === 'string'
      ) {
        console.warn(
          '[Payment] Chapa returned data as string (unexpected in live mode):',
          response.data.data,
        );
        throw new BadRequestException(
          'Chapa returned an unexpected response format. ' +
            'Raw Chapa message: ' +
            response.data.message +
            '. Raw data: ' +
            response.data.data,
        );
      }

      return response.data;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const chapaMsg = error.response?.data?.message || error.message;
      console.error(
        '[Payment] Chapa transfer error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Chapa transfer failed: ' + chapaMsg);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // verifyTransfer
  // ─────────────────────────────────────────────────────────────────────────
  // Called by payout.service.ts → verifyPayoutStatus().
  // Caller reads:
  //   chapaStatus.data?.status      → lowercase: 'success'/'failed'/other
  //   chapaStatus.data?.bank_reference
  // ─────────────────────────────────────────────────────────────────────────
  async verifyTransfer(reference: string) {
    // ── TEST MODE ────────────────────────────────────────────────────────
    if (this.isPayoutTestMode()) {
      const testStatus = this.getTestPayoutStatus();

      console.log('[PAYOUT] Test mode: true');
      console.log('[PAYOUT] Test payout status (verify):', testStatus);

      return {
        status: 'success',
        message: '[TEST MODE] Verification simulation - ' + testStatus,
        data: {
          reference,
          status: testStatus,
          bank_reference:
            testStatus === 'success' ? 'TEST_BANK_REF_' + reference : null,
          message:
            testStatus === 'failed'
              ? 'Test mode: simulated verification failure'
              : null,
        },
      };
    }

    // ── LIVE MODE ────────────────────────────────────────────────────────
    console.log(
      '[PAYOUT] Test mode: false — calling Chapa verify for',
      reference,
    );

    try {
      const response = await axios.get(
        'https://api.chapa.co/v1/transfers/verify/' + reference,
        {
          headers: {
            Authorization: `Bearer ${this.getChapaSecretKey()}`,
          },
        },
      );
      console.log(
        '[Payment] Chapa transfer verification for',
        reference,
        ':',
        response.data,
      );
      return response.data;
    } catch (error: any) {
      const chapaMsg = error.response?.data?.message || error.message;
      console.error(
        '[Payment] Chapa transfer verification error:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to verify transfer: ' + chapaMsg);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Refund support methods
  // ─────────────────────────────────────────────────────────────────────────

  mapChapaRefundStatus(
    chapaStatus?: string,
  ): 'PROCESSING' | 'REFUNDED' | 'FAILED' | null {
    if (!chapaStatus) return null;
    const s = String(chapaStatus).toLowerCase();
    if (s === 'initiated' || s === 'processing') return 'PROCESSING';
    if (s === 'refunded') return 'REFUNDED';
    if (s === 'reversed' || s === 'failed') return 'FAILED';
    return null;
  }

  async applyRefundConfirmation(
    payment: any,
    chapaStatus: string | undefined,
    refId: string | null,
    _raw?: any,
  ) {
    const mapped = this.mapChapaRefundStatus(chapaStatus);

    if (!mapped) {
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          chapaRefundRefId: refId ?? payment.chapaRefundRefId,
          refundLastCheckedAt: new Date(),
        },
      });
    }

    if (mapped === 'PROCESSING') {
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundStatus: 'PROCESSING',
          chapaRefundRefId: refId ?? payment.chapaRefundRefId,
          refundLastCheckedAt: new Date(),
        },
      });
    }

    if (mapped === 'FAILED') {
      return this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundStatus: 'FAILED',
          refundFailureReason: 'Chapa refund status: ' + chapaStatus,
          chapaRefundRefId: refId ?? payment.chapaRefundRefId,
          refundLastCheckedAt: new Date(),
        },
      });
    }

    // mapped === 'REFUNDED'
    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: payment.amount,
          chapaRefundRefId: refId ?? payment.chapaRefundRefId,
          refundLastCheckedAt: new Date(),
          refundFailureReason: null,
        },
      });

      const earnings: any[] = payment.teacherEarnings ?? [];
      for (const earning of earnings) {
        if (earning.status === 'PAID_OUT') {
          await tx.teacherEarning.update({
            where: { id: earning.id },
            data: { refundReviewRequired: true },
          });
        } else if (earning.status !== 'REVERSED') {
          await tx.teacherEarning.update({
            where: { id: earning.id },
            data: { status: 'REVERSED' },
          });
        }
      }

      if (payment.liveSessionId) {
        await tx.liveSessionRegistration.updateMany({
          where: {
            liveSessionId: payment.liveSessionId,
            teacherId: payment.teacherId,
          },
          data: { status: 'CANCELLED' },
        });
      }

      return updated;
    });
  }

  async getRefundSummary(liveSessionId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        liveSessionId,
        status: { in: ['SUCCESSFUL', 'REFUNDED'] },
      },
    });

    const toNum = (v: any) => Number(v || 0);
    const summary = {
      paidParticipants: payments.length,
      totalCollected: payments.reduce(
        (s: number, p: any) => s + toNum(p.amount),
        0,
      ),
      refundedCount: 0,
      refundedAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      processingCount: 0,
      processingAmount: 0,
      failedCount: 0,
      failedAmount: 0,
    };

    for (const p of payments) {
      const amt = toNum(p.amount);
      if (p.refundStatus === 'REFUNDED' || p.status === 'REFUNDED') {
        summary.refundedCount += 1;
        summary.refundedAmount += amt;
      } else if (p.refundStatus === 'PROCESSING') {
        summary.processingCount += 1;
        summary.processingAmount += amt;
      } else if (p.refundStatus === 'FAILED') {
        summary.failedCount += 1;
        summary.failedAmount += amt;
      } else {
        summary.pendingCount += 1;
        summary.pendingAmount += amt;
      }
    }

    return summary;
  }

  async freezeEarningsForPayment(tx: any, paymentId: string) {
    await tx.teacherEarning.updateMany({
      where: { paymentId, status: 'AVAILABLE' },
      data: { status: 'PENDING' },
    });
  }

  async processRefundsForSession(
    liveSessionId: string,
    reason: string,
  ): Promise<Array<{ paymentId: string; refundStatus: string }>> {
    const payments = await this.prisma.payment.findMany({
      where: { liveSessionId, status: { in: ['SUCCESSFUL', 'REFUNDED'] } },
    });

    const results: Array<{ paymentId: string; refundStatus: string }> = [];
    for (const p of payments) {
      const res = await this.initiateRefundForPayment(p.id, reason);
      results.push({
        paymentId: res.paymentId ?? p.id,
        refundStatus: res.refundStatus ?? p.refundStatus,
      });
    }
    return results;
  }

  async initiateRefundForPayment(
    paymentId: string,
    reason: string,
    options?: { force?: boolean },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { liveSession: true, teacherEarnings: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    // Already fully refunded — skip
    if (payment.status === 'REFUNDED' || payment.refundStatus === 'REFUNDED') {
      return { paymentId: payment.id, refundStatus: 'REFUNDED', skipped: true };
    }

    // Not a successful charge — nothing to refund
    if (payment.status !== 'SUCCESSFUL') {
      return {
        paymentId: payment.id,
        refundStatus: payment.refundStatus,
        skipped: true,
      };
    }

    // Already in progress — skip unless forced
    if (payment.refundStatus === 'PROCESSING' && !options?.force) {
      return {
        paymentId: payment.id,
        refundStatus: 'PROCESSING',
        skipped: true,
      };
    }

    const idempotencyKey = payment.refundIdempotencyKey || 'REF_' + payment.id;
    const chapaTxRef = payment.transactionRef;

    if (!chapaTxRef) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundStatus: 'PENDING',
          refundReason: reason,
          refundFailureReason: 'Missing tx_ref',
        },
      });
      return {
        paymentId: payment.id,
        refundStatus: 'PENDING',
        skipped: true,
        requiresAdminReview: true,
      };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        refundStatus: 'PROCESSING',
        refundReason: reason,
        refundIdempotencyKey: idempotencyKey,
        refundInitiatedAt: payment.refundInitiatedAt ?? new Date(),
        refundFailureReason: null,
      },
    });

    try {
      const body = new URLSearchParams();
      body.append('reason', reason);
      body.append('reference', idempotencyKey);

      const response = await axios.post(
        'https://api.chapa.co/v1/refund/' + encodeURIComponent(chapaTxRef),
        body.toString(),
        {
          headers: {
            Authorization: 'Bearer ' + this.getChapaSecretKey(),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const data = response.data?.data ?? {};
      const refId: string | null = data.ref_id ?? data.reference ?? null;
      const mapped = this.mapChapaRefundStatus(data.status);

      if (refId) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { chapaRefundRefId: refId, refundLastCheckedAt: new Date() },
        });
      }

      if (mapped === 'REFUNDED') {
        const fresh = await this.prisma.payment.findUnique({
          where: { id: payment.id },
          include: { liveSession: true, teacherEarnings: true },
        });
        return this.applyRefundConfirmation(
          fresh!,
          'refunded',
          refId,
          response.data,
        );
      }

      if (mapped === 'FAILED') {
        return this.applyRefundConfirmation(
          payment,
          data.status ?? 'reversed',
          refId,
          response.data,
        );
      }

      return {
        paymentId: payment.id,
        refundStatus: 'PROCESSING',
        chapaRefundRefId: refId,
        skipped: false,
      };
    } catch (error: any) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.message ?? error.message)
        : error.message;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { refundStatus: 'PENDING', refundFailureReason: String(msg) },
      });
      return {
        paymentId: payment.id,
        refundStatus: 'PENDING',
        skipped: false,
        requiresAdminReview: true,
      };
    }
  }

  async verifyRefundForPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { liveSession: true, teacherEarnings: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.refundStatus === 'REFUNDED') return payment;
    if (!payment.chapaRefundRefId)
      throw new BadRequestException('No Chapa refund reference to verify');

    try {
      const response = await axios.get(
        'https://api.chapa.co/v1/refund/' +
          encodeURIComponent(payment.chapaRefundRefId) +
          '/verify',
        { headers: { Authorization: 'Bearer ' + this.getChapaSecretKey() } },
      );
      const chapaStatus = response.data?.data?.status;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { refundLastCheckedAt: new Date() },
      });
      return this.applyRefundConfirmation(
        payment,
        chapaStatus,
        payment.chapaRefundRefId,
        response.data,
      );
    } catch (error: any) {
      const msg = axios.isAxiosError(error)
        ? (error.response?.data?.message ??
          'Unable to verify refund with Chapa')
        : 'Unable to verify refund with Chapa';
      throw new BadRequestException(String(msg));
    }
  }
}
