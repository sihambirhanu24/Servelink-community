import { SetMetadata } from '@nestjs/common';

export const ALLOW_SUSPENDED_KEY = 'allowSuspended';

/**
 * Opts a route (or whole controller) out of the suspension block enforced by
 * `JwtAuthGuard`. Use only for endpoints a suspended teacher legitimately
 * needs: reading their own account/suspension state and submitting appeals.
 */
export const AllowSuspended = () => SetMetadata(ALLOW_SUSPENDED_KEY, true);
