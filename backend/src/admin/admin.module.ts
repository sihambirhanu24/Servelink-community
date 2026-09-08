import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ProgressModule } from '../progress/progress.module';
import { VerificationModule } from '../verification/verification.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminPostsController } from './admin-posts.controller';
import { AdminPostsService } from './admin-posts.service';
import { SuspensionModule } from '../suspension/suspension.module';

@Module({
  imports: [
    PrismaModule,
    NotificationModule,
    ProgressModule,
    VerificationModule,
    SuspensionModule,
  ],
  controllers: [AdminPostsController, AdminController],
  providers: [AdminService, AdminPostsService],
})
export class AdminModule {}
