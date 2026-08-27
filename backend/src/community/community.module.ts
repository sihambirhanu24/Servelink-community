import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ProgressModule } from '../progress/progress.module';
import { VerificationModule } from '../verification/verification.module';
import { ChatModule } from '../chat/chat.module';
import { SuspensionModule } from '../suspension/suspension.module';
import { CommunityController } from './controllers/community.controller';
import { QaController } from './controllers/qa.controller';
import { CommunityService } from './services/community.service';
import { QaService } from './services/qa.service';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    ProgressModule,
    VerificationModule,
    forwardRef(() => ChatModule),
    SuspensionModule,
  ],
  controllers: [QaController, CommunityController],
  providers: [CommunityService, QaService],
  exports: [CommunityService, QaService],
})
export class CommunityModule {}
