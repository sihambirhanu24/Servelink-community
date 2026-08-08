import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
  Query,
  Post,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationService } from './notification.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { AdminBroadcastDto } from './dto/admin-broadcast.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async all(@Req() req, @Query() query: QueryNotificationDto) {
    return this.notificationService.findAll(req.user.sub, query);
  }

  @Get('unread-count')
  async unread(@Req() req) {
    return this.notificationService.unreadCount(req.user.sub);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationService.markRead(id);
  }

  @Patch('read-all')
  async readAll(@Req() req) {
    return this.notificationService.markAllRead(req.user.sub);
  }

  @Delete('clear')
  async clearRead(@Req() req) {
    return this.notificationService.clearRead(req.user.sub);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.notificationService.delete(id);
  }

  @Post('admin-send')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async adminSend(@Body() dto: AdminBroadcastDto) {
    return this.notificationService.adminBroadcast(dto);
  }
}
