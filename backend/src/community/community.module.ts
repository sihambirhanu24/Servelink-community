import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { CommunityController } from './controllers/community.controller';
import { CommunityService } from './services/community.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
