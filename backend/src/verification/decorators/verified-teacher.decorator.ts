import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { VerifiedTeacherGuard } from '../guards/verified-teacher.guard';

/**
 * Decorator to require verified teacher access.
 * Combines JWT authentication with verification status check.
 * 
 * Usage:
 * @VerifiedTeacher()
 * async createPost() { ... }
 * 
 * This is equivalent to:
 * @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
 */
export const VerifiedTeacher = () => {
  return applyDecorators(
    UseGuards(JwtAuthGuard, VerifiedTeacherGuard),
  );
};
