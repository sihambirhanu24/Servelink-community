import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { TeacherVerificationService } from '../teacher-verification.service';

/**
 * Guard to ensure only APPROVED teachers can access protected routes.
 * 
 * This guard should be used AFTER JwtAuthGuard to ensure the user is authenticated.
 * It checks that:
 * 1. User is authenticated (has valid JWT)
 * 2. User is a teacher (not admin)
 * 3. Teacher's verificationStatus is APPROVED
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
 * 
 * Note: Admins bypass this check (they use isAdmin flag instead)
 */
@Injectable()
export class VerifiedTeacherGuard implements CanActivate {
  private readonly logger = new Logger(VerifiedTeacherGuard.name);

  constructor(
    private readonly verificationService: TeacherVerificationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User must be authenticated (JwtAuthGuard should run before this)
    if (!user) {
      this.logger.warn('VerifiedTeacherGuard: No user in request');
      throw new UnauthorizedException('Authentication required');
    }

    // If user is an admin, allow access (admins bypass verification check)
    if (user.isAdmin === true) {
      return true;
    }

    // Must have teacherId (regular teacher accounts)
    if (!user.teacherId) {
      this.logger.warn(`VerifiedTeacherGuard: User ${user.sub || user.id} has no teacherId`);
      throw new ForbiddenException('Teacher account required');
    }

    // Check if teacher is verified
    const isVerified = await this.verificationService.isTeacherVerified(user.teacherId);

    if (!isVerified) {
      this.logger.log(
        `VerifiedTeacherGuard: Teacher ${user.teacherId} is not verified (blocked access)`,
      );
      throw new ForbiddenException(
        'Your teacher account must be verified before accessing this resource. Please upload verification documents and wait for admin approval.',
      );
    }

    return true;
  }
}
