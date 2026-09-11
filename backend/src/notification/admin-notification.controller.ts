import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminNotificationService } from './admin-notification.service';
import { QueryAdminNotificationDto } from './dto/query-admin-notification.dto';

@ApiTags('Admin Notifications')
@ApiBearerAuth()
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminNotificationController {
  constructor(
    private readonly adminNotificationService: AdminNotificationService,
  ) {}

  @Get()
  async all(@Req() req, @Query() query: QueryAdminNotificationDto) {
    return this.adminNotificationService.findAll(req.user.sub, query);
  }

  @Get('unread-count')
  async unread(@Req() req) {
    return this.adminNotificationService.unreadCount(req.user.sub);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req) {
    return this.adminNotificationService.markRead(id, req.user.sub);
  }

  @Patch(':id/unread')
  async markUnread(@Param('id') id: string, @Req() req) {
    return this.adminNotificationService.markUnread(id, req.user.sub);
  }

  @Patch('read-all')
  async readAll(@Req() req) {
    return this.adminNotificationService.markAllRead(req.user.sub);
  }

  @Delete('clear')
  async clearRead(@Req() req) {
    return this.adminNotificationService.clearRead(req.user.sub);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.adminNotificationService.delete(id, req.user.sub);
  }
}
