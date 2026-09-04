import { Module } from '@nestjs/common';
import { SuspensionService } from './suspension.service';
import { AppealService } from './appeal.service';
import {
  SuspensionController,
  TeacherSuspensionController,
} from './suspension.controller';
import { AppealController, AdminAppealController } from './appeal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  providers: [SuspensionService, AppealService],
  controllers: [
    SuspensionController,
    TeacherSuspensionController,
    AppealController,
    AdminAppealController,
  ],
  exports: [SuspensionService, AppealService],
})
export class SuspensionModule {}
