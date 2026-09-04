import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UnauthorizedException,
  Delete,
} from '@nestjs/common';
import { LiveSessionService } from './live-session.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import {
  ApproveLiveSessionDto,
  RejectLiveSessionDto,
  RescheduleLiveSessionDto,
  UpdateLiveSessionStatusDto,
} from './dto/update-live-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('live-sessions')
export class LiveSessionController {
  constructor(private readonly liveSessionService: LiveSessionService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createLiveSessionDto: CreateLiveSessionDto,
  ) {
    if (user.isAdmin) {
      throw new UnauthorizedException('Admins cannot request sessions');
    }
    return this.liveSessionService.create(user.sub, createLiveSessionDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    if (user.isAdmin) {
      return this.liveSessionService.findAllForAdmin();
    } else {
      return this.liveSessionService.findAllForTeacher(user.sub);
    }
  }

  @Get('discover')
  discoverSessions(@CurrentUser() user: any) {
    console.log('[LiveSessionController] discoverSessions called by:', user);
    try {
      if (user.isAdmin) {
        return this.liveSessionService.findAllForAdmin();
      } else {
        return this.liveSessionService.getDiscoverableSessions(user.sub);
      }
    } catch (e) {
      console.error('[LiveSessionController] Error in discoverSessions:', e);
      throw e;
    }
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveSessionService.findOne(id, user.sub, user.isAdmin);
  }

  @Patch(':id/approve')
  approve(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() approveDto: ApproveLiveSessionDto,
  ) {
    if (!user.isAdmin) {
      throw new UnauthorizedException('Only admins can approve sessions');
    }
    return this.liveSessionService.approve(id, user.sub, approveDto);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() rejectDto: RejectLiveSessionDto,
  ) {
    if (!user.isAdmin) {
      throw new UnauthorizedException('Only admins can reject sessions');
    }
    return this.liveSessionService.reject(id, user.sub, rejectDto);
  }

  @Patch(':id/reschedule')
  reschedule(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleLiveSessionDto,
  ) {
    if (!user.isAdmin) {
      throw new UnauthorizedException('Only admins can reschedule sessions');
    }
    return this.liveSessionService.reschedule(id, user.sub, rescheduleDto);
  }

  @Post(':id/remind')
  remindMe(@CurrentUser() user: any, @Param('id') id: string) {
    if (user.isAdmin) {
      throw new UnauthorizedException('Admins cannot set reminders');
    }
    return this.liveSessionService.setReminder(id, user.sub);
  }

  @Get(':id/cancellation-preview')
  getCancellationPreview(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveSessionService.getCancellationPreview(
      id,
      user.sub,
      user.isAdmin,
    );
  }

  @Delete(':id')
  deleteSession(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveSessionService.deleteSession(id, user.sub, user.isAdmin);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveSessionService.cancel(id, user.sub, user.isAdmin);
  }

  @Patch(':id/archive')
  archive(@CurrentUser() user: any, @Param('id') id: string) {
    if (!user.isAdmin) {
      throw new UnauthorizedException('Only admins can archive sessions');
    }
    return this.liveSessionService.archive(id, user.sub, true);
  }

  @Post(':id/livekit/token')
  issueLiveKitToken(
    @CurrentUser() user: { sub: string; isAdmin?: boolean },
    @Param('id') id: string,
  ) {
    return this.liveSessionService.issueLiveKitToken(
      id,
      user.sub,
      Boolean(user.isAdmin),
    );
  }

  @Post(':id/livekit/host-token')
  issueHostLiveKitToken(
    @CurrentUser() user: { sub: string; isAdmin?: boolean },
    @Param('id') id: string,
  ) {
    return this.liveSessionService.issueLiveKitToken(
      id,
      user.sub,
      Boolean(user.isAdmin),
      { requireHost: true },
    );
  }

  @Post(':id/end')
  endSession(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveSessionService.endLiveSession(id, user.sub, user.isAdmin);
  }

  @Get(':id/livekit/participants')
  listParticipants(@CurrentUser() user: any, @Param('id') id: string) {
    return this.liveSessionService.listLiveParticipants(
      id,
      user.sub,
      user.isAdmin,
    );
  }

  @Post(':id/livekit/participants/:identity/remove')
  removeParticipant(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('identity') identity: string,
  ) {
    return this.liveSessionService.removeLiveParticipant(
      id,
      user.sub,
      user.isAdmin,
      identity,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateLiveSessionStatusDto,
  ) {
    return this.liveSessionService.updateStatus(
      id,
      user.sub,
      user.isAdmin,
      updateStatusDto,
    );
  }
}
