import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ProgressModule } from '../progress/progress.module';
import { VerificationModule } from '../verification/verification.module';
import { CommunityController } from './controllers/community.controller';
import { CommunityService } from './services/community.service';

@Module({
  imports: [PrismaModule, NotificationModule, ProgressModule, VerificationModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
