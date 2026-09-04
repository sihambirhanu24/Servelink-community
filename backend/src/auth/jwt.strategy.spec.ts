import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TeacherStatus } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate (database-backed account check)', () => {
  const config = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;

  const prisma = {
    admin: { findUnique: jest.fn() },
    teacher: { findUnique: jest.fn() },
  };
  const suspensionService = { expireIfDue: jest.fn() };

  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(config, prisma as any, suspensionService as any);
  });

  const teacherPayload = {
    sub: 't1',
    teacherId: 't1',
    email: 't@x.com',
    teacherLevel: 'LEVEL_1',
    isAdmin: false,
  };

  it('rejects malformed payloads', async () => {
    await expect(strategy.validate(null)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(strategy.validate({ isAdmin: false })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a syntactically valid token whose teacher no longer exists', async () => {
    prisma.teacher.findUnique.mockResolvedValue(null);
    await expect(strategy.validate(teacherPayload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('returns an ACTIVE principal with no suspension for an active teacher', async () => {
    prisma.teacher.findUnique.mockResolvedValue({
      id: 't1',
      status: TeacherStatus.ACTIVE,
      suspensionReason: null,
      suspensionStart: null,
      suspensionUntil: null,
    });

    const user = await strategy.validate(teacherPayload);

    expect(prisma.teacher.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 't1' } }),
    );
    expect(user).toMatchObject({
      sub: 't1',
      teacherId: 't1',
      isAdmin: false,
      accountStatus: 'ACTIVE',
      suspension: null,
    });
    expect(suspensionService.expireIfDue).not.toHaveBeenCalled();
  });

  it('attaches the live suspension for a currently suspended teacher (old JWT is no longer enough)', async () => {
    const until = new Date(Date.now() + 3 * 86_400_000);
    prisma.teacher.findUnique.mockResolvedValue({
      id: 't1',
      status: TeacherStatus.SUSPENDED,
      suspensionReason: 'Harassment',
      suspensionStart: new Date(),
      suspensionUntil: until,
    });

    const user = await strategy.validate(teacherPayload);

    expect(user.accountStatus).toBe('SUSPENDED');
    expect(user.suspension).toEqual(
      expect.objectContaining({
        permanent: false,
        reason: 'Harassment',
        until,
      }),
    );
  });

  it('flags permanent suspensions', async () => {
    prisma.teacher.findUnique.mockResolvedValue({
      id: 't1',
      status: TeacherStatus.PERMANENTLY_SUSPENDED,
      suspensionReason: 'Fraud',
      suspensionStart: new Date(),
      suspensionUntil: null,
    });

    const user = await strategy.validate(teacherPayload);
    expect(user.accountStatus).toBe('PERMANENTLY_SUSPENDED');
    expect(user.suspension?.permanent).toBe(true);
  });

  it('synchronises an expired temporary suspension and lets the teacher through', async () => {
    prisma.teacher.findUnique.mockResolvedValue({
      id: 't1',
      status: TeacherStatus.SUSPENDED,
      suspensionReason: 'Spam',
      suspensionStart: new Date(Date.now() - 8 * 86_400_000),
      suspensionUntil: new Date(Date.now() - 60_000),
    });
    suspensionService.expireIfDue.mockResolvedValue(true);

    const user = await strategy.validate(teacherPayload);

    expect(suspensionService.expireIfDue).toHaveBeenCalledWith('t1');
    expect(user.accountStatus).toBe('ACTIVE');
    expect(user.suspension).toBeNull();
  });

  it('still lets an expired-suspension teacher through if the sync write fails', async () => {
    prisma.teacher.findUnique.mockResolvedValue({
      id: 't1',
      status: TeacherStatus.SUSPENDED,
      suspensionReason: 'Spam',
      suspensionStart: new Date(),
      suspensionUntil: new Date(Date.now() - 60_000),
    });
    suspensionService.expireIfDue.mockRejectedValue(new Error('db down'));

    const user = await strategy.validate(teacherPayload);
    expect(user.suspension).toBeNull();
  });

  it('validates admins against the Admin table and never attaches a suspension', async () => {
    prisma.admin.findUnique.mockResolvedValue({ id: 'a1' });

    const user = await strategy.validate({
      sub: 'a1',
      isAdmin: true,
      email: 'admin@x.com',
    });

    expect(prisma.teacher.findUnique).not.toHaveBeenCalled();
    expect(user).toMatchObject({ sub: 'a1', isAdmin: true, suspension: null });
  });

  it('rejects admin tokens for deleted admins', async () => {
    prisma.admin.findUnique.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 'gone', isAdmin: true }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
