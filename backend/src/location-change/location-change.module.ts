import { Module } from '@nestjs/common';
import { LocationChangeService } from './location-change.service';
import { LocationChangeController } from './location-change.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [LocationChangeController],
  providers: [LocationChangeService],
  exports: [LocationChangeService],
})
export class LocationChangeModule {}
