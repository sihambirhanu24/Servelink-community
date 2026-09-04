import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';
import { PayoutVerificationService } from './payout-verification.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [PaymentController, PayoutController],
  providers: [PaymentService, PayoutService, PayoutVerificationService],
  exports: [PaymentService, PayoutService],
})
export class PaymentModule {}
