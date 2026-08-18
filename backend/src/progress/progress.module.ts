import { Module } from '@nestjs/common';
import { TeacherProgressService } from './teacher-progress.service';
import { ProgressController } from './progress.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [PrismaModule, NotificationModule, VerificationModule],
  controllers: [ProgressController],
  providers: [TeacherProgressService],
  exports: [TeacherProgressService],
})
export class ProgressModule {}
