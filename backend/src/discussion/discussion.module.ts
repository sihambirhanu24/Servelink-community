import { Module } from '@nestjs/common';
import { DiscussionController } from './discussion.controller';
import { DiscussionService } from './discussion.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ProgressModule } from '../progress/progress.module';
import { SuspensionModule } from '../suspension/suspension.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    ProgressModule,
    SuspensionModule,
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService],
  exports: [DiscussionService],
})
export class DiscussionModule {}
