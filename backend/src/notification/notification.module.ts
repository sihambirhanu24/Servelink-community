import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { AdminNotificationController } from './admin-notification.controller';
import { AdminNotificationService } from './admin-notification.service';
import { NotificationGateway } from './notification.gateway';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('jwtSecret') ||
          config.get<string>('JWT_SECRET') ||
          'secret',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationController, AdminNotificationController],
  providers: [NotificationService, AdminNotificationService, NotificationGateway],
  exports: [NotificationService, AdminNotificationService],
})
export class NotificationModule {}
