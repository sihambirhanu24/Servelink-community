import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SuspensionService } from '../suspension/suspension.service';
import {
  ActiveSuspension,
  evaluateSuspension,
  suspensionSnapshotSelect,
} from '../suspension/suspension-state';

/**
 * Shape of `request.user` after a successful JWT authentication.
 * `suspension` is populated from the database on every request so that an
 * already-issued token stops granting access the moment the account is
 * suspended; `JwtAuthGuard` turns it into a 403 ACCOUNT_SUSPENDED.
 */
export interface AuthenticatedUser {
  sub: string;
  email?: string;
  isAdmin: boolean;
  teacherId?: string;
  teacherLevel?: string;
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'PERMANENTLY_SUSPENDED';
  suspension: ActiveSuspension | null;
  [key: string]: unknown;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly suspensionService: SuspensionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('jwtSecret') ??
        config.get<string>('JWT_SECRET') ??
        'secret',
    });
  }

  /**
   * Re-validates the account behind the token against the database.
   * A signed token alone is not enough: the account must still exist, and for
   * teachers the current suspension state is attached for the guard to enforce.
   */
  async validate(payload: any): Promise<AuthenticatedUser> {
    if (!payload || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid token');
    }

    if (payload.isAdmin === true) {
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.sub },
        select: { id: true },
      });
      if (!admin) {
        throw new UnauthorizedException('Admin account no longer exists');
      }
      return { ...payload, isAdmin: true, suspension: null };
    }

    const teacherId: string = payload.teacherId ?? payload.sub;
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, ...suspensionSnapshotSelect },
    });
    if (!teacher) {
      throw new UnauthorizedException('Account no longer exists');
    }

    let { suspension, expired } = evaluateSuspension(teacher);
    if (expired) {
      // Temporary suspension has run out: synchronise the row back to ACTIVE
      // (closes the history record + notifies) before letting the request through.
      try {
        await this.suspensionService.expireIfDue(teacher.id);
      } catch (err) {
        this.logger.warn(
          `Failed to auto-expire suspension for teacher ${teacher.id}: ${(err as Error).message}`,
        );
      }
      suspension = null;
    }

    return {
      ...payload,
      isAdmin: false,
      teacherId: teacher.id,
      accountStatus: suspension
        ? suspension.permanent
          ? 'PERMANENTLY_SUSPENDED'
          : 'SUSPENDED'
        : 'ACTIVE',
      suspension,
    };
  }
}
