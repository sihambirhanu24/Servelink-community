import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnnouncementService } from './announcement.service';
import { AdminAnnouncementController, AnnouncementController } from './announcement.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAnnouncementController, AnnouncementController],
  providers: [AnnouncementService],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
