import { ForbiddenException } from '@nestjs/common';
import { TeacherStatus } from '@prisma/client';
import {
  ACCOUNT_SUSPENDED_CODE,
  accountSuspendedException,
  evaluateSuspension,
} from './suspension-state';

const NOW = new Date('2026-09-02T12:00:00.000Z');
const IN_ONE_DAY = new Date('2026-09-03T12:00:00.000Z');
const ONE_DAY_AGO = new Date('2026-09-01T12:00:00.000Z');

describe('evaluateSuspension', () => {
  it('treats ACTIVE as not suspended', () => {
    expect(
      evaluateSuspension(
        {
          status: TeacherStatus.ACTIVE,
          suspensionReason: null,
          suspensionStart: null,
          suspensionUntil: null,
        },
        NOW,
      ),
    ).toEqual({ suspension: null, expired: false });
  });

  it('treats PERMANENTLY_SUSPENDED as permanently suspended regardless of dates', () => {
    const result = evaluateSuspension(
      {
        status: TeacherStatus.PERMANENTLY_SUSPENDED,
        suspensionReason: 'Fraud',
        suspensionStart: ONE_DAY_AGO,
        suspensionUntil: ONE_DAY_AGO, // stale date must not "expire" a permanent ban
      },
      NOW,
    );
    expect(result.expired).toBe(false);
    expect(result.suspension).toEqual({
      permanent: true,
      reason: 'Fraud',
      start: ONE_DAY_AGO,
      until: null,
    });
  });

  it('keeps a temporary suspension active while now < suspensionUntil', () => {
    const result = evaluateSuspension(
      {
        status: TeacherStatus.SUSPENDED,
        suspensionReason: 'Spam',
        suspensionStart: ONE_DAY_AGO,
        suspensionUntil: IN_ONE_DAY,
      },
      NOW,
    );
    expect(result.expired).toBe(false);
    expect(result.suspension).toEqual({
      permanent: false,
      reason: 'Spam',
      start: ONE_DAY_AGO,
      until: IN_ONE_DAY,
    });
  });

  it('marks a temporary suspension expired once now >= suspensionUntil', () => {
    expect(
      evaluateSuspension(
        {
          status: TeacherStatus.SUSPENDED,
          suspensionReason: 'Spam',
          suspensionStart: ONE_DAY_AGO,
          suspensionUntil: NOW,
        },
        NOW,
      ),
    ).toEqual({ suspension: null, expired: true });
    expect(
      evaluateSuspension(
        {
          status: TeacherStatus.SUSPENDED,
          suspensionReason: 'Spam',
          suspensionStart: ONE_DAY_AGO,
          suspensionUntil: ONE_DAY_AGO,
        },
        NOW,
      ),
    ).toEqual({ suspension: null, expired: true });
  });

  it('treats SUSPENDED without an end date as suspended until lifted', () => {
    const result = evaluateSuspension(
      {
        status: TeacherStatus.SUSPENDED,
        suspensionReason: null,
        suspensionStart: ONE_DAY_AGO,
        suspensionUntil: null,
      },
      NOW,
    );
    expect(result.expired).toBe(false);
    expect(result.suspension?.permanent).toBe(false);
    expect(result.suspension?.until).toBeNull();
  });
});

describe('accountSuspendedException', () => {
  it('is a 403 carrying the stable ACCOUNT_SUSPENDED code and suspension metadata', () => {
    const ex = accountSuspendedException({
      permanent: false,
      reason: 'Spam',
      start: ONE_DAY_AGO,
      until: IN_ONE_DAY,
    });
    expect(ex).toBeInstanceOf(ForbiddenException);
    expect(ex.getStatus()).toBe(403);
    expect(ex.getResponse()).toEqual({
      code: ACCOUNT_SUSPENDED_CODE,
      message: 'Your account is suspended',
      permanent: false,
      suspensionReason: 'Spam',
      suspensionStart: ONE_DAY_AGO,
      suspensionUntil: IN_ONE_DAY,
    });
  });
});
