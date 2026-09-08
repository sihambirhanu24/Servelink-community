import { Module, forwardRef } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { FinancialSupportService } from './financial-support.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatModule } from '../chat/chat.module';
import { WalletModule } from '../wallet/wallet.module';
import { SuspensionModule } from '../suspension/suspension.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => ChatModule),
    WalletModule,
    SuspensionModule,
  ],
  controllers: [SupportController],
  providers: [SupportService, FinancialSupportService],
  exports: [SupportService, FinancialSupportService],
})
export class SupportModule {}
