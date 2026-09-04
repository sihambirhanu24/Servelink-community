import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { LiveSessionService } from './live-session.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '../payment/payment.service';
import { NotificationService } from '../notification/notification.service';
import { LiveKitService } from './livekit.service';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));
jest.mock('axios');

describe('LiveSessionService cancellation and deletion', () => {
  let service: LiveSessionService;
  let prisma: any;
  let paymentService: any;
  let notificationService: any;
  let liveKitService: any;

  const hostId = 'host-1';
  const otherUser = 'student-1';

  const baseSession = {
    id: 'session-1',
    teacherId: hostId,
    topic: 'Advanced React Workshop',
    status: 'APPROVED',
    isPaid: true,
    price: 500,
    scheduledStart: new Date(Date.now() + 86400000),
    duration: 60,
    archivedAt: null,
    payments: [],
    registrations: [],
  };

  beforeEach(async () => {
    prisma = {
      liveSession: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      payment: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      liveSessionRegistration: {
        updateMany: jest.fn(),
      },
      financialAuditLog: {
        create: jest.fn(),
      },
      teacher: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };

    paymentService = {
      getRefundSummary: jest.fn().mockResolvedValue({
        paidParticipants: 0,
        totalCollected: 0,
        refundedCount: 0,
        refundedAmount: 0,
        pendingCount: 0,
        pendingAmount: 0,
        processingCount: 0,
        processingAmount: 0,
        failedCount: 0,
        failedAmount: 0,
      }),
      freezeEarningsForPayment: jest.fn(),
      processRefundsForSession: jest.fn().mockResolvedValue([]),
    };

    notificationService = {
      create: jest.fn(),
    };

    liveKitService = {
      roomNameFor: jest.fn((id: string) => `live-session-${id}`),
      createParticipantToken: jest.fn().mockResolvedValue({
        token: 'test-token',
        serverUrl: 'wss://livekit.test',
        roomName: 'live-session-session-1',
        role: 'HOST',
        expiresIn: 3600,
      }),
      deleteRoom: jest.fn().mockResolvedValue(undefined),
      listParticipants: jest.fn().mockResolvedValue([]),
      removeParticipant: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveSessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PaymentService, useValue: paymentService },
        { provide: NotificationService, useValue: notificationService },
        { provide: LiveKitService, useValue: liveKitService },
      ],
    }).compile();

    service = module.get(LiveSessionService);
  });

  it('TEST 1: deletes a free session for the host', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      isPaid: false,
      payments: [],
    });
    prisma.liveSession.delete.mockResolvedValue({ id: 'session-1' });

    const result = await service.deleteSession('session-1', hostId, false);
    expect(result.deleted).toBe(true);
    expect(prisma.liveSession.delete).toHaveBeenCalled();
  });

  it('TEST 2: deletes a paid session with zero successful payments', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      payments: [
        { id: 'p1', status: 'PENDING' },
        { id: 'p2', status: 'FAILED' },
      ],
    });
    prisma.liveSession.delete.mockResolvedValue({ id: 'session-1' });

    const result = await service.deleteSession('session-1', hostId, false);
    expect(result.deleted).toBe(true);
    expect(prisma.payment.updateMany).toHaveBeenCalled();
  });

  it('TEST 3: rejects delete for a paid session with one successful payment', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      payments: [{ id: 'p1', status: 'SUCCESSFUL', amount: 500 }],
    });

    await expect(
      service.deleteSession('session-1', hostId, false),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.liveSession.delete).not.toHaveBeenCalled();
  });

  it('TEST 4: rejects delete for a paid session with multiple successful payments', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      payments: [
        { id: 'p1', status: 'SUCCESSFUL' },
        { id: 'p2', status: 'SUCCESSFUL' },
      ],
    });

    await expect(
      service.deleteSession('session-1', hostId, false),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('TEST 5: non-host cannot delete', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(baseSession);
    await expect(
      service.deleteSession('session-1', otherUser, false),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('TEST 6: non-host cannot cancel', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(baseSession);
    await expect(
      service.cancel('session-1', otherUser, false),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('TEST 7: unauthenticated cancel is rejected', async () => {
    await expect(service.cancel('session-1', '', false)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('TEST 8: host cancel marks session CANCELLED', async () => {
    const paid = {
      ...baseSession,
      payments: [
        {
          id: 'p1',
          teacherId: otherUser,
          status: 'SUCCESSFUL',
          amount: 500,
          refundStatus: 'NOT_REQUIRED',
        },
      ],
      registrations: [{ teacherId: otherUser, status: 'REGISTERED' }],
    };
    prisma.liveSession.findUnique.mockResolvedValue(paid);
    prisma.liveSession.update.mockResolvedValue({
      ...paid,
      status: 'CANCELLED',
    });
    paymentService.processRefundsForSession.mockResolvedValue([
      { paymentId: 'p1', refundStatus: 'PROCESSING' },
    ]);
    paymentService.getRefundSummary.mockResolvedValue({
      paidParticipants: 1,
      totalCollected: 500,
      refundedCount: 0,
      refundedAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      processingCount: 1,
      processingAmount: 500,
      failedCount: 0,
      failedAmount: 0,
    });

    const result = await service.cancel('session-1', hostId, false);
    expect(result.session.status).toBe('CANCELLED');
    expect(prisma.liveSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELLED' }),
      }),
    );
  });

  it('TEST 18: delete is re-checked against current successful payments', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      payments: [{ id: 'late-pay', status: 'SUCCESSFUL' }],
    });
    await expect(
      service.deleteSession('session-1', hostId, false),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('TEST 19: cancelled session cannot become LIVE', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      status: 'CANCELLED',
    });
    await expect(
      service.updateStatus('session-1', hostId, false, {
        status: 'LIVE',
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('does not allow a second cancel to re-run refunds', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      status: 'CANCELLED',
    });
    const result = await service.cancel('session-1', hostId, false);
    expect(result.alreadyCancelled).toBe(true);
    expect(paymentService.processRefundsForSession).not.toHaveBeenCalled();
  });

  it('rejects cancel for completed sessions', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...baseSession,
      status: 'COMPLETED',
    });
    await expect(
      service.cancel('session-1', hostId, false),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

describe('LiveSessionService LiveKit access', () => {
  let service: LiveSessionService;
  let prisma: any;
  let liveKitService: any;

  const hostId = 'host-1';
  const viewerId = 'student-1';

  const upcomingSession = {
    id: 'session-1',
    teacherId: hostId,
    topic: 'Advanced React Workshop',
    status: 'APPROVED',
    isPaid: true,
    scheduledStart: new Date(Date.now() + 86400000),
    duration: 60,
    livekitRoomName: 'live-session-session-1',
    startedAt: null,
    teacher: { firstName: 'Ada', lastName: 'Host' },
  };

  const liveSession = {
    ...upcomingSession,
    scheduledStart: new Date(Date.now() - 5 * 60 * 1000),
  };

  beforeEach(async () => {
    prisma = {
      liveSession: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findFirst: jest.fn(),
      },
      teacher: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ firstName: 'Ada', lastName: 'Host' }),
      },
    };
    liveKitService = {
      roomNameFor: jest.fn((id: string) => `live-session-${id}`),
      createParticipantToken: jest
        .fn()
        .mockImplementation(async ({ role }: any) => ({
          token: 'test-token',
          serverUrl: 'wss://livekit.test',
          roomName: 'live-session-session-1',
          role,
          expiresIn: 3600,
        })),
      deleteRoom: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveSessionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PaymentService, useValue: {} },
        { provide: NotificationService, useValue: { create: jest.fn() } },
        { provide: LiveKitService, useValue: liveKitService },
      ],
    }).compile();

    service = module.get(LiveSessionService);
  });

  it('issues a HOST token to the session owner before start', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(upcomingSession);
    const result = await service.issueLiveKitToken('session-1', hostId, false);
    expect(result.role).toBe('HOST');
    expect(liveKitService.createParticipantToken).toHaveBeenCalledWith(
      expect.objectContaining({ identity: hostId, role: 'HOST' }),
    );
  });

  it('rejects a viewer token before the session starts', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(upcomingSession);
    await expect(
      service.issueLiveKitToken('session-1', viewerId, false),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a paid viewer without a successful payment', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(liveSession);
    prisma.payment.findFirst.mockResolvedValue(null);
    await expect(
      service.issueLiveKitToken('session-1', viewerId, false),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('issues a VIEWER token to a paid participant while live', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(liveSession);
    prisma.payment.findFirst.mockResolvedValue({
      id: 'pay-1',
      status: 'SUCCESSFUL',
    });
    prisma.teacher.findUnique.mockResolvedValue({
      firstName: 'Sam',
      lastName: 'Student',
    });
    const result = await service.issueLiveKitToken(
      'session-1',
      viewerId,
      false,
    );
    expect(result.role).toBe('VIEWER');
    expect(liveKitService.createParticipantToken).toHaveBeenCalledWith(
      expect.objectContaining({ identity: viewerId, role: 'VIEWER' }),
    );
  });

  it('rejects tokens for ended sessions', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...upcomingSession,
      scheduledStart: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 30,
    });
    await expect(
      service.issueLiveKitToken('session-1', hostId, false),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects tokens for cancelled sessions', async () => {
    prisma.liveSession.findUnique.mockResolvedValue({
      ...upcomingSession,
      status: 'CANCELLED',
    });
    await expect(
      service.issueLiveKitToken('session-1', hostId, false),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects host-token requests from students and other teachers', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(upcomingSession);
    await expect(
      service.issueLiveKitToken('session-1', viewerId, false, {
        requireHost: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('ignores frontend role claims and still issues VIEWER to a paid student', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(liveSession);
    prisma.payment.findFirst.mockResolvedValue({
      id: 'pay-1',
      status: 'SUCCESSFUL',
    });
    const result = await service.issueLiveKitToken(
      'session-1',
      viewerId,
      false,
    );
    expect(result.role).toBe('VIEWER');
  });

  it('lets only the host end the session and deletes the LiveKit room', async () => {
    prisma.liveSession.findUnique.mockResolvedValue(liveSession);
    prisma.liveSession.update.mockResolvedValue({
      ...liveSession,
      status: 'COMPLETED',
    });
    await expect(
      service.endLiveSession('session-1', viewerId, false),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await service.endLiveSession('session-1', hostId, false);
    expect(liveKitService.deleteRoom).toHaveBeenCalledWith('session-1');
  });
});
