import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { isObservable, lastValueFrom } from 'rxjs';
import { ALLOW_SUSPENDED_KEY } from '../decorators/allow-suspended.decorator';
import { accountSuspendedException } from '../../suspension/suspension-state';

/**
 * Authenticates the bearer token AND enforces account suspension.
 *
 * `JwtStrategy.validate()` loads the account from the database on every
 * request and attaches `request.user.suspension`. If it is set, the request is
 * rejected with 403 ACCOUNT_SUSPENDED unless the handler/controller is marked
 * with `@AllowSuspended()` (own status, own history, appeals).
 *
 * Admin tokens never carry a suspension, so admin endpoints are unaffected.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = super.canActivate(context);
    const authenticated = isObservable(result)
      ? await lastValueFrom(result)
      : await result;
    if (!authenticated) {
      return false;
    }

    const allowSuspended = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SUSPENDED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowSuspended) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user;
    if (user?.suspension) {
      throw accountSuspendedException(user.suspension);
    }

    return true;
  }
}
