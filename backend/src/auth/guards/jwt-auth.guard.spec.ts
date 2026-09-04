import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ALLOW_SUSPENDED_KEY } from '../decorators/allow-suspended.decorator';

/**
 * These tests exercise the suspension enforcement layered on top of passport
 * authentication. The passport part (`AuthGuard('jwt').canActivate`) is stubbed
 * to "authenticated" and `request.user` is pre-populated the way JwtStrategy
 * does after its database lookup.
 */
describe('JwtAuthGuard (suspension enforcement)', () => {
  const baseProto = AuthGuard('jwt').prototype;
  let superCanActivate: jest.SpyInstance;

  const makeContext = (user: any, meta: Record<string, unknown> = {}) => {
    const handler = () => undefined;
    class Ctrl {}
    for (const [k, v] of Object.entries(meta))
      Reflect.defineMetadata(k, v, handler);
    return {
      getHandler: () => handler,
      getClass: () => Ctrl,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    superCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockResolvedValue(true);
  });

  afterEach(() => jest.restoreAllMocks());

  it('lets an active teacher through', async () => {
    const guard = new JwtAuthGuard(new Reflector());
    await expect(
      guard.canActivate(
        makeContext({ sub: 't1', isAdmin: false, suspension: null }),
      ),
    ).resolves.toBe(true);
    expect(superCanActivate).toHaveBeenCalledTimes(1);
  });

  it('rejects a suspended teacher with 403 ACCOUNT_SUSPENDED even though the JWT verified', async () => {
    const guard = new JwtAuthGuard(new Reflector());
    const suspension = {
      permanent: false,
      reason: 'Spam',
      start: new Date(),
      until: new Date(Date.now() + 86_400_000),
    };
    const promise = guard.canActivate(
      makeContext({ sub: 't1', isAdmin: false, suspension }),
    );
    await expect(promise).rejects.toBeInstanceOf(ForbiddenException);
    await promise.catch((err: ForbiddenException) => {
      expect(err.getStatus()).toBe(403);
      expect(err.getResponse()).toMatchObject({
        code: 'ACCOUNT_SUSPENDED',
        suspensionReason: 'Spam',
      });
    });
  });

  it('rejects a permanently suspended teacher', async () => {
    const guard = new JwtAuthGuard(new Reflector());
    const suspension = {
      permanent: true,
      reason: 'Fraud',
      start: new Date(),
      until: null,
    };
    await expect(
      guard.canActivate(makeContext({ sub: 't1', isAdmin: false, suspension })),
    ).rejects.toMatchObject({
      response: { code: 'ACCOUNT_SUSPENDED', permanent: true },
    });
  });

  it('allows a suspended teacher on routes marked @AllowSuspended()', async () => {
    const guard = new JwtAuthGuard(new Reflector());
    const suspension = {
      permanent: false,
      reason: 'Spam',
      start: new Date(),
      until: null,
    };
    await expect(
      guard.canActivate(
        makeContext(
          { sub: 't1', isAdmin: false, suspension },
          { [ALLOW_SUSPENDED_KEY]: true },
        ),
      ),
    ).resolves.toBe(true);
  });

  it('never blocks admins (their principal carries no suspension)', async () => {
    const guard = new JwtAuthGuard(new Reflector());
    await expect(
      guard.canActivate(
        makeContext({ sub: 'a1', isAdmin: true, suspension: null }),
      ),
    ).resolves.toBe(true);
  });

  it('propagates authentication failure from passport untouched', async () => {
    superCanActivate.mockRejectedValueOnce(new Error('Unauthorized'));
    const guard = new JwtAuthGuard(new Reflector());
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      'Unauthorized',
    );
  });

  // Silence unused-var lint for the prototype handle used for documentation.
  void baseProto;
});
