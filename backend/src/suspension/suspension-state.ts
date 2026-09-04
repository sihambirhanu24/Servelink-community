import { ForbiddenException } from '@nestjs/common';
import { TeacherStatus } from '@prisma/client';

/** Stable application error code returned to clients when an account is suspended. */
export const ACCOUNT_SUSPENDED_CODE = 'ACCOUNT_SUSPENDED';

/** The columns on `Teacher` that are needed to decide whether a suspension is active. */
export interface SuspensionSnapshot {
  status: TeacherStatus;
  suspensionReason: string | null;
  suspensionStart: Date | null;
  suspensionUntil: Date | null;
}

export const suspensionSnapshotSelect = {
  status: true,
  suspensionReason: true,
  suspensionStart: true,
  suspensionUntil: true,
} as const;

export interface ActiveSuspension {
  permanent: boolean;
  reason: string | null;
  start: Date | null;
  until: Date | null;
}

export interface SuspensionEvaluation {
  /** Non-null when the account is currently blocked. */
  suspension: ActiveSuspension | null;
  /**
   * True when the row still says SUSPENDED but `suspensionUntil` is in the past.
   * The caller should synchronise the row back to ACTIVE (see SuspensionService.expireIfDue).
   */
  expired: boolean;
}

/**
 * Single source of truth for "is this account suspended right now?".
 *
 * Rules:
 * - PERMANENTLY_SUSPENDED  -> always suspended.
 * - SUSPENDED + until in future (or no until) -> suspended.
 * - SUSPENDED + until <= now -> expired (treated as not suspended).
 * - anything else -> not suspended.
 */
export function evaluateSuspension(
  teacher: SuspensionSnapshot,
  now: Date = new Date(),
): SuspensionEvaluation {
  if (teacher.status === TeacherStatus.PERMANENTLY_SUSPENDED) {
    return {
      suspension: {
        permanent: true,
        reason: teacher.suspensionReason,
        start: teacher.suspensionStart,
        until: null,
      },
      expired: false,
    };
  }

  if (teacher.status === TeacherStatus.SUSPENDED) {
    if (
      teacher.suspensionUntil &&
      teacher.suspensionUntil.getTime() <= now.getTime()
    ) {
      return { suspension: null, expired: true };
    }
    return {
      suspension: {
        permanent: false,
        reason: teacher.suspensionReason,
        start: teacher.suspensionStart,
        until: teacher.suspensionUntil,
      },
      expired: false,
    };
  }

  return { suspension: null, expired: false };
}

/** Builds the 403 that every protected endpoint returns for a suspended account. */
export function accountSuspendedException(
  suspension: ActiveSuspension,
): ForbiddenException {
  return new ForbiddenException({
    code: ACCOUNT_SUSPENDED_CODE,
    message: 'Your account is suspended',
    permanent: suspension.permanent,
    suspensionReason: suspension.reason,
    suspensionStart: suspension.start,
    suspensionUntil: suspension.until,
  });
}
