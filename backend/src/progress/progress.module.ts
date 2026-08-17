import { Module } from '@nestjs/common';
import { TeacherProgressService } from './teacher-progress.service';
import { ProgressController } from './progress.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [ProgressController],
  providers: [TeacherProgressService],
  exports: [TeacherProgressService],
})
export class ProgressModule {}
