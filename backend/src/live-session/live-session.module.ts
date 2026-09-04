import { Module } from '@nestjs/common';
import { LiveSessionService } from './live-session.service';
import { LiveSessionController } from './live-session.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';
import { LiveKitService } from './livekit.service';

@Module({
  imports: [PrismaModule, NotificationModule, PaymentModule],
  controllers: [LiveSessionController],
  providers: [LiveSessionService, LiveKitService],
})
export class LiveSessionModule {}
