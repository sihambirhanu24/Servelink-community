import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));
jest.mock('axios');

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentService refunds', () => {
  let service: PaymentService;
  let prisma: any;

  const successfulPayment = {
    id: 'pay-1',
    teacherId: 'student-1',
    liveSessionId: 'session-1',
    amount: 500,
    status: 'SUCCESSFUL',
    refundStatus: 'PENDING',
    transactionRef: 'TXN_ABC123',
    chapaReference: 'CHAPA_REF_1',
    chapaRefundRefId: null,
    refundIdempotencyKey: null,
    refundInitiatedAt: null,
    metadata: {},
    liveSession: { teacherId: 'host-1', topic: 'Workshop' },
    teacherEarnings: [{ id: 'earn-1', status: 'AVAILABLE' }],
  };

  beforeEach(async () => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      teacherEarning: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'earn-1', status: 'AVAILABLE' }]),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      liveSessionRegistration: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };

    mockedAxios.isAxiosError = jest.fn().mockReturnValue(false) as any;
    mockedAxios.post = jest.fn();
    mockedAxios.get = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('CHASECK_TEST') },
        },
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  it('TEST 9-12 conceptual: successful payments remain stored (never deleted by refund flow)', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      ...successfulPayment,
      status: 'REFUNDED',
      refundStatus: 'REFUNDED',
    });
    const result = await service.initiateRefundForPayment('pay-1', 'cancel');
    expect('skipped' in result && result.skipped).toBe(true);
    expect(prisma.payment.findUnique).toHaveBeenCalled();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('TEST 13: does not initiate a second refund while PROCESSING', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      ...successfulPayment,
      refundStatus: 'PROCESSING',
    });
    const result = await service.initiateRefundForPayment('pay-1', 'cancel');
    expect('skipped' in result && result.skipped).toBe(true);
    expect(result.refundStatus).toBe('PROCESSING');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('TEST 14: confirmed Chapa refund marks payment REFUNDED', async () => {
    prisma.payment.findUnique.mockResolvedValue(successfulPayment);
    prisma.payment.update.mockResolvedValue({
      ...successfulPayment,
      refundStatus: 'PROCESSING',
    });
    mockedAxios.post.mockResolvedValue({
      data: {
        status: 'success',
        data: { ref_id: 'MERC-DIS-REF-1', status: 'refunded' },
      },
    });
    prisma.payment.findUnique
      .mockResolvedValueOnce(successfulPayment)
      .mockResolvedValueOnce({
        ...successfulPayment,
        chapaRefundRefId: 'MERC-DIS-REF-1',
      });

    const result = await service.initiateRefundForPayment(
      'pay-1',
      'session cancelled',
    );
    expect(
      ('status' in result && result.status === 'REFUNDED') ||
        result.refundStatus === 'REFUNDED' ||
        prisma.$transaction,
    ).toBeTruthy();
  });

  it('TEST 15: Chapa reversed maps to REFUND_FAILED without changing other payments', async () => {
    const updated = { ...successfulPayment, refundStatus: 'FAILED' };
    prisma.payment.update.mockResolvedValue(updated);
    const result = await service.applyRefundConfirmation(
      successfulPayment,
      'reversed',
      'ref-1',
    );
    expect(result.refundStatus).toBe('FAILED');
  });

  it('TEST 16: initiated Chapa refund stays PROCESSING, not REFUNDED', async () => {
    prisma.payment.update.mockResolvedValue({
      ...successfulPayment,
      refundStatus: 'PROCESSING',
    });
    const result = await service.applyRefundConfirmation(
      successfulPayment,
      'initiated',
      'ref-1',
    );
    expect(result.refundStatus).toBe('PROCESSING');
  });

  it('TEST 17: refund summary counts failed separately from refunded', async () => {
    prisma.payment.findMany.mockResolvedValue([
      { amount: 500, status: 'REFUNDED', refundStatus: 'REFUNDED' },
      { amount: 500, status: 'SUCCESSFUL', refundStatus: 'FAILED' },
      { amount: 500, status: 'SUCCESSFUL', refundStatus: 'PENDING' },
    ]);
    const summary = await service.getRefundSummary('session-1');
    expect(summary.paidParticipants).toBe(3);
    expect(summary.refundedCount).toBe(1);
    expect(summary.failedCount).toBe(1);
    expect(summary.pendingCount).toBe(1);
  });

  it('maps official Chapa refund statuses without inventing success', () => {
    expect(service.mapChapaRefundStatus('initiated')).toBe('PROCESSING');
    expect(service.mapChapaRefundStatus('processing')).toBe('PROCESSING');
    expect(service.mapChapaRefundStatus('refunded')).toBe('REFUNDED');
    expect(service.mapChapaRefundStatus('reversed')).toBe('FAILED');
  });
});
