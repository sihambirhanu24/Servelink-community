import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { TeacherModule } from '../teacher/teacher.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [PrismaModule, NotificationModule, TeacherModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
