import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// IMPORTANT ASSUMPTION, FLAGGING RATHER THAN SILENTLY DECIDING:
// Your User model has no separate `role` field — `teacherLevel` is the
// only role-like field that exists (values like TEACHER, and
// presumably ADMIN, per the register form's role selector). This guard
// reuses `teacherLevel` as the role check rather than introducing a
// brand-new `role` enum/column, since that would be a bigger schema
// change than this admin module should silently make on its own. If
// you actually want a SEPARATE role system independent of
// teacherLevel (e.g. an Admin who is also tracked at a teacher level
// for gamification), that's a real design decision — flag it back to
// me and we'll add a proper `role` field instead of overloading
// `teacherLevel`.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator on this route at all -> no role
    // restriction, just pass through (JwtAuthGuard, which must run
    // BEFORE this guard, already handled "is this person logged in").
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by JwtStrategy (returns raw payload)

    // Admin JWT tokens carry isAdmin:true instead of a teacherLevel.
    // If the route only requires 'ADMIN' and the token is an admin
    // token, grant access immediately without a teacherLevel check.
    if (user.isAdmin === true) {
      return true;
    }

    if (!requiredRoles.includes(user.teacherLevel)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }
}
