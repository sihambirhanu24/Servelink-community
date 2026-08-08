import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

import { PrismaModule } from '../prisma/prisma.module';
import { TeacherLevelGuard } from './guards/teacher-level.guard';
import { StringValue } from "ms";
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    PrismaModule,

    ConfigModule,

    MailModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('jwtSecret') ?? 'secret',

        signOptions: {
         expiresIn:
  (config.get("jwtExpiresIn") ?? "7d") as StringValue,
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    TeacherLevelGuard,
  ],

  exports: [
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}