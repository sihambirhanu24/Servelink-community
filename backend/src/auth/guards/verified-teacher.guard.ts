import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TeacherVerificationStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

/**
 * Blocks teacher/community functionality until an admin has approved the
 * teacher. Runs AFTER JwtAuthGuard and reads the status from the database —
 * never from the JWT, which is issued before approval and is client-held.
 *
 * Routes without JwtAuthGuard (public reads) have no `request.user` and are
 * left untouched; admin tokens pass through.
 */
@Injectable()
export class VerifiedTeacherGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.isAdmin === true) {
      return true;
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: user.sub },
      select: { verificationStatus: true },
    });

    if (!teacher) {
      throw new ForbiddenException('Teacher account not found');
    }

    if (teacher.verificationStatus !== TeacherVerificationStatus.APPROVED) {
      throw new ForbiddenException(
        teacher.verificationStatus === TeacherVerificationStatus.REJECTED
          ? 'Your teacher verification was rejected. Resubmit your documents to regain access.'
          : 'Your teacher verification is under review. You will get access once an administrator approves your account.',
      );
    }

    return true;
  }
}
