import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AllowSuspended } from '../auth/decorators/allow-suspended.decorator';
import { AppealService } from './appeal.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Teacher appeal endpoints. Marked @AllowSuspended on purpose: appeals are the
 * one thing a suspended teacher is meant to be able to do.
 */
@Controller('suspension/appeals')
@UseGuards(JwtAuthGuard)
@AllowSuspended()
export class AppealController {
  constructor(private readonly appealService: AppealService) {}

  /**
   * POST /suspension/appeals
   * Create a suspension appeal (teacher endpoint)
   */
  @Post()
  async createAppeal(
    @CurrentUser() user: any,
    @Body()
    dto: {
      subject: string;
      explanation: string;
      attachmentUrl?: string;
    },
  ) {
    return this.appealService.createAppeal({
      teacherId: user.teacherId,
      subject: dto.subject,
      explanation: dto.explanation,
      attachmentUrl: dto.attachmentUrl,
    });
  }

  /**
   * GET /suspension/appeals/my
   * Get current teacher's appeals
   */
  @Get('my')
  async getMyAppeals(@CurrentUser() user: any) {
    return this.appealService.getTeacherAppeals(user.teacherId);
  }

  /**
   * GET /suspension/appeals/my-appeal
   * Get current teacher's latest appeal (for profile display)
   */
  @Get('my-appeal')
  async getMyAppeal(@CurrentUser() user: any) {
    const appeals = await this.appealService.getTeacherAppeals(user.teacherId);
    // Return the most recent appeal
    return appeals.length > 0 ? appeals[0] : null;
  }
}

@Controller('admin/suspension/appeals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAppealController {
  constructor(private readonly appealService: AppealService) {}

  /**
   * GET /admin/suspension/appeals?status=&teacherId=
   * Get all appeals for admin review
   */
  @Get()
  async getAllAppeals(
    @Query('status') status?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.appealService.getAllAppeals(
      status as any,
      teacherId || undefined,
    );
  }

  /**
   * GET /admin/suspension/appeals/:id
   * Get appeal details
   */
  @Get(':id')
  async getAppeal(@Param('id') id: string) {
    return this.appealService.getAppeal(id);
  }

  /**
   * POST /admin/suspension/appeals/:id/review
   * Review an appeal
   */
  @Post(':id/review')
  async reviewAppeal(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body()
    dto: {
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      adminResponse?: string;
      extendSuspensionDays?: number;
    },
  ) {
    return this.appealService.reviewAppeal({
      appealId: id,
      adminId: user.sub || user.id,
      status: dto.status,
      adminResponse: dto.adminResponse,
      extendSuspensionDays: dto.extendSuspensionDays,
    });
  }
}
