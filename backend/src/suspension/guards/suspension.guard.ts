import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SuspensionService } from '../suspension.service';

/**
 * Guard to ensure suspended teachers cannot access protected routes.
 *
 * This guard should be used AFTER JwtAuthGuard to ensure the user is authenticated.
 * It checks that:
 * 1. User is authenticated (has valid JWT)
 * 2. User's account is not suspended
 * 3. If temporarily suspended, checks for automatic expiration
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, SuspensionGuard)
 *
 * Note: Admins bypass this check
 */
@Injectable()
export class SuspensionGuard implements CanActivate {
  private readonly logger = new Logger(SuspensionGuard.name);

  constructor(private readonly suspensionService: SuspensionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated (JwtAuthGuard should run before this)
    if (!user) {
      this.logger.warn('SuspensionGuard: No user in request');
      throw new ForbiddenException('Authentication required');
    }

    // If user is an admin, allow access (admins bypass suspension check)
    if (user.isAdmin === true) {
      return true;
    }

    // Must have teacherId (regular teacher accounts)
    if (!user.teacherId) {
      this.logger.warn(
        `SuspensionGuard: User ${user.sub || user.id} has no teacherId`,
      );
      throw new ForbiddenException('Teacher account required');
    }

    // Check and auto-expire if needed
    const isActive = await this.suspensionService.checkSuspensionExpiration(
      user.teacherId,
    );

    if (!isActive) {
      // Get suspension details for the error response
      const suspensionStatus = await this.suspensionService.getSuspensionStatus(
        user.teacherId,
      );

      this.logger.log(
        `SuspensionGuard: Teacher ${user.teacherId} is suspended (blocked access)`,
      );

      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended',
        suspensionReason: suspensionStatus.suspensionReason,
        suspensionStart: suspensionStatus.suspensionStart,
        suspensionUntil: suspensionStatus.suspensionUntil,
      });
    }

    return true;
  }
}
