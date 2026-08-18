import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { TeacherVerificationService } from './teacher-verification.service';
import { VerifiedTeacherGuard } from './guards/verified-teacher.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [VerificationController],
  providers: [TeacherVerificationService, VerifiedTeacherGuard],
  exports: [TeacherVerificationService, VerifiedTeacherGuard],
})
export class VerificationModule {}
