import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { ProgressModule } from '../progress/progress.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, NotificationModule, ProgressModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
