import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SuspensionType, TeacherStatus } from '@prisma/client';
import { SuspensionService, SYSTEM_ACTOR } from './suspension.service';

const DAY = 24 * 60 * 60 * 1000;

describe('SuspensionService', () => {
  const prisma = {
    teacher: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    suspensionHistory: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    admin: { findMany: jest.fn() },
    // Executes the already-built Prisma promises in order (they are mocks here).
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };

  let service: SuspensionService;

  const activeTeacher = {
    id: 't1',
    status: TeacherStatus.ACTIVE,
    suspensionReason: null,
    suspensionStart: null,
    suspensionUntil: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SuspensionService(prisma as any, notifications as any);
  });

  describe('suspendTeacher', () => {
    it('404s for an unknown teacher', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);
      await expect(
        service.suspendTeacher({
          teacherId: 'nope',
          suspensionType: SuspensionType.TEMPORARY,
          reason: 'x',
          duration: 7,
          adminId: 'a1',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('requires a reason', async () => {
      await expect(
        service.suspendTeacher({
          teacherId: 't1',
          suspensionType: SuspensionType.TEMPORARY,
          reason: '   ',
          duration: 7,
          adminId: 'a1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.teacher.findUnique).not.toHaveBeenCalled();
    });

    it('requires a positive duration for TEMPORARY suspensions', async () => {
      prisma.teacher.findUnique.mockResolvedValue(activeTeacher);
      await expect(
        service.suspendTeacher({
          teacherId: 't1',
          suspensionType: SuspensionType.TEMPORARY,
          reason: 'Spam',
          adminId: 'a1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('refuses to double-suspend an already suspended teacher', async () => {
      prisma.teacher.findUnique.mockResolvedValue({
        ...activeTeacher,
        status: TeacherStatus.SUSPENDED,
        suspensionUntil: new Date(Date.now() + DAY),
      });
      await expect(
        service.suspendTeacher({
          teacherId: 't1',
          suspensionType: SuspensionType.PERMANENT,
          reason: 'Again',
          adminId: 'a1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('writes history + status atomically for a TEMPORARY suspension and notifies the teacher', async () => {
      prisma.teacher.findUnique.mockResolvedValue(activeTeacher);
      prisma.suspensionHistory.create.mockResolvedValue({ id: 'h1' });
      prisma.teacher.update.mockResolvedValue({
        id: 't1',
        status: TeacherStatus.SUSPENDED,
      });

      const before = Date.now();
      const result = await service.suspendTeacher({
        teacherId: 't1',
        suspensionType: SuspensionType.TEMPORARY,
        reason: '  Harassment  ',
        duration: 7,
        adminId: 'admin-1',
        reportId: 'r1',
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      const historyArgs = prisma.suspensionHistory.create.mock.calls[0][0];
      expect(historyArgs.data).toMatchObject({
        teacherId: 't1',
        suspensionType: SuspensionType.TEMPORARY,
        reason: 'Harassment',
        suspendedBy: 'admin-1',
        reportId: 'r1',
      });
      const until: Date = historyArgs.data.suspendedUntil;
      expect(until.getTime() - before).toBeGreaterThanOrEqual(7 * DAY - 1000);
      expect(until.getTime() - before).toBeLessThanOrEqual(7 * DAY + 5000);

      const updateArgs = prisma.teacher.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: 't1' });
      expect(updateArgs.data).toMatchObject({
        status: TeacherStatus.SUSPENDED,
        suspensionReason: 'Harassment',
        suspendedBy: 'admin-1',
        suspensionCount: { increment: 1 },
      });
      expect(updateArgs.data.suspensionUntil).toEqual(until);

      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ receiverId: 't1', type: 'SUSPENSION' }),
      );
      expect(result).toEqual({ id: 't1', status: TeacherStatus.SUSPENDED });
    });

    it('uses PERMANENTLY_SUSPENDED with no end date for PERMANENT suspensions', async () => {
      prisma.teacher.findUnique.mockResolvedValue(activeTeacher);
      prisma.suspensionHistory.create.mockResolvedValue({ id: 'h1' });
      prisma.teacher.update.mockResolvedValue({
        id: 't1',
        status: TeacherStatus.PERMANENTLY_SUSPENDED,
      });

      await service.suspendTeacher({
        teacherId: 't1',
        suspensionType: SuspensionType.PERMANENT,
        reason: 'Fraud',
        adminId: 'a1',
      });

      expect(prisma.teacher.update.mock.calls[0][0].data).toMatchObject({
        status: TeacherStatus.PERMANENTLY_SUSPENDED,
        suspensionUntil: null,
      });
    });

    it('records a WARNING without changing account status', async () => {
      prisma.teacher.findUnique
        .mockResolvedValueOnce(activeTeacher)
        .mockResolvedValueOnce({ id: 't1', status: TeacherStatus.ACTIVE });
      prisma.suspensionHistory.create.mockResolvedValue({ id: 'h1' });

      const result = await service.suspendTeacher({
        teacherId: 't1',
        suspensionType: SuspensionType.WARNING,
        reason: 'Tone',
        adminId: 'a1',
      });

      expect(prisma.teacher.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      const data = prisma.suspensionHistory.create.mock.calls[0][0].data;
      expect(data.suspensionType).toBe(SuspensionType.WARNING);
      expect(data.restoredAt).toBeInstanceOf(Date);
      expect(result).toEqual({ id: 't1', status: TeacherStatus.ACTIVE });
    });

    it('does not let a notification failure undo the suspension', async () => {
      prisma.teacher.findUnique.mockResolvedValue(activeTeacher);
      prisma.suspensionHistory.create.mockResolvedValue({ id: 'h1' });
      prisma.teacher.update.mockResolvedValue({
        id: 't1',
        status: TeacherStatus.SUSPENDED,
      });
      notifications.create.mockRejectedValueOnce(new Error('socket down'));

      await expect(
        service.suspendTeacher({
          teacherId: 't1',
          suspensionType: SuspensionType.TEMPORARY,
          reason: 'Spam',
          duration: 1,
          adminId: 'a1',
        }),
      ).resolves.toEqual({ id: 't1', status: TeacherStatus.SUSPENDED });
    });
  });

  describe('unsuspendTeacher', () => {
    it('409s when the teacher is not suspended', async () => {
      prisma.teacher.findUnique.mockResolvedValue({
        id: 't1',
        status: TeacherStatus.ACTIVE,
      });
      await expect(
        service.unsuspendTeacher({ teacherId: 't1', adminId: 'a1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('closes the open history record (never deletes) and restores ACTIVE in one transaction', async () => {
      prisma.teacher.findUnique.mockResolvedValue({
        id: 't1',
        status: TeacherStatus.SUSPENDED,
      });
      prisma.suspensionHistory.updateMany.mockResolvedValue({ count: 1 });
      prisma.teacher.update.mockResolvedValue({
        id: 't1',
        status: TeacherStatus.ACTIVE,
      });

      const result = await service.unsuspendTeacher({
        teacherId: 't1',
        adminId: 'admin-2',
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.suspensionHistory.updateMany).toHaveBeenCalledWith({
        where: { teacherId: 't1', restoredAt: null },
        data: { restoredAt: expect.any(Date), restoredBy: 'admin-2' },
      });
      expect(prisma.teacher.update.mock.calls[0][0].data).toMatchObject({
        status: TeacherStatus.ACTIVE,
        suspensionReason: null,
        suspensionUntil: null,
        suspendedBy: null,
      });
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'ACCOUNT_RESTORED' }),
      );
      expect(result.status).toBe(TeacherStatus.ACTIVE);
    });
  });

  describe('expireIfDue', () => {
    it('is a no-op when the row is not an expired temporary suspension', async () => {
      prisma.teacher.updateMany.mockResolvedValue({ count: 0 });
      await expect(service.expireIfDue('t1')).resolves.toBe(false);
      expect(prisma.suspensionHistory.updateMany).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('restores the account, closes history as SYSTEM and notifies exactly once', async () => {
      prisma.teacher.updateMany.mockResolvedValue({ count: 1 });
      prisma.suspensionHistory.updateMany.mockResolvedValue({ count: 1 });
      const now = new Date('2026-09-10T00:00:00Z');

      await expect(service.expireIfDue('t1', now)).resolves.toBe(true);

      expect(prisma.teacher.updateMany).toHaveBeenCalledWith({
        where: {
          id: 't1',
          status: TeacherStatus.SUSPENDED,
          suspensionUntil: { lte: now },
        },
        data: expect.objectContaining({ status: TeacherStatus.ACTIVE }),
      });
      expect(prisma.suspensionHistory.updateMany).toHaveBeenCalledWith({
        where: { teacherId: 't1', restoredAt: null },
        data: { restoredAt: now, restoredBy: SYSTEM_ACTOR },
      });
      expect(notifications.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('checkSuspensionExpiration', () => {
    it('returns false for a live suspension and true for an active account', async () => {
      prisma.teacher.findUnique.mockResolvedValueOnce({
        ...activeTeacher,
        status: TeacherStatus.SUSPENDED,
        suspensionUntil: new Date(Date.now() + DAY),
      });
      await expect(service.checkSuspensionExpiration('t1')).resolves.toBe(
        false,
      );

      prisma.teacher.findUnique.mockResolvedValueOnce(activeTeacher);
      await expect(service.checkSuspensionExpiration('t1')).resolves.toBe(true);
    });

    it('expires and returns true when the end date has passed', async () => {
      prisma.teacher.findUnique.mockResolvedValueOnce({
        ...activeTeacher,
        status: TeacherStatus.SUSPENDED,
        suspensionUntil: new Date(Date.now() - 1000),
      });
      prisma.teacher.updateMany.mockResolvedValue({ count: 1 });
      prisma.suspensionHistory.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.checkSuspensionExpiration('t1')).resolves.toBe(true);
      expect(prisma.teacher.updateMany).toHaveBeenCalled();
    });
  });

  describe('getSuspensionHistory', () => {
    it('resolves admin names, labels SYSTEM actors and derives a status per record', async () => {
      const past = new Date(Date.now() - 10 * DAY);
      prisma.suspensionHistory.findMany.mockResolvedValue([
        {
          id: 'h1',
          suspensionType: 'TEMPORARY',
          suspendedBy: 'a1',
          restoredBy: null,
          suspendedAt: new Date(),
          suspendedUntil: new Date(Date.now() + DAY),
          restoredAt: null,
        },
        {
          id: 'h2',
          suspensionType: 'TEMPORARY',
          suspendedBy: 'a1',
          restoredBy: SYSTEM_ACTOR,
          suspendedAt: past,
          suspendedUntil: past,
          restoredAt: past,
        },
        {
          id: 'h3',
          suspensionType: 'WARNING',
          suspendedBy: 'a2',
          restoredBy: 'a2',
          suspendedAt: past,
          suspendedUntil: null,
          restoredAt: past,
        },
      ]);
      prisma.admin.findMany.mockResolvedValue([
        { id: 'a1', name: 'Admin Siham', email: 's@x.com' },
      ]);

      const rows = await service.getSuspensionHistory('t1');

      expect(prisma.admin.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { in: expect.arrayContaining(['a1', 'a2']) } },
        }),
      );
      expect(rows[0]).toMatchObject({
        suspendedByName: 'Admin Siham',
        restoredByName: null,
        status: 'ACTIVE',
      });
      expect(rows[1]).toMatchObject({
        restoredByName: 'System (automatic)',
        status: 'COMPLETED',
        endedAt: past,
      });
      expect(rows[2]).toMatchObject({
        suspendedByName: 'Admin',
        status: 'WARNING',
      });
    });
  });
});
