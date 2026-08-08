import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { TEACHER_LEVEL_KEY } from '../decorators/teacher-level.decorator';

@Injectable()
export class TeacherLevelGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredLevels =
      this.reflector.getAllAndOverride<string[]>(
        TEACHER_LEVEL_KEY,
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (!requiredLevels) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest();

    const user = request.user;

    if (
      !requiredLevels.includes(user.level)
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this community.',
      );
    }

    return true;
  }
}