import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppealService } from './appeal.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('suspension/appeals')
@UseGuards(JwtAuthGuard)
export class AppealController {
  constructor(private readonly appealService: AppealService) {}

  /**
   * POST /suspension/appeals
   * Create a suspension appeal (teacher endpoint)
   */
  @Post()
  async createAppeal(@CurrentUser() user: any, @Body() dto: {
    subject: string;
    explanation: string;
    attachmentUrl?: string;
  }) {
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
@UseGuards(JwtAuthGuard)
export class AdminAppealController {
  constructor(private readonly appealService: AppealService) {}

  /**
   * GET /admin/suspension/appeals
   * Get all appeals for admin review
   */
  @Get()
  async getAllAppeals(@CurrentUser() user: any, @Query('status') status?: string) {
    if (!user.isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    return this.appealService.getAllAppeals(status as any);
  }

  /**
   * GET /admin/suspension/appeals/:id
   * Get appeal details
   */
  @Get(':id')
  async getAppeal(@CurrentUser() user: any, @Param('id') id: string) {
    if (!user.isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

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
    @Body() dto: {
      status: 'PENDING' | 'APPROVED' | 'REJECTED';
      adminResponse?: string;
      extendSuspensionDays?: number;
    },
  ) {
    if (!user.isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }

    return this.appealService.reviewAppeal({
      appealId: id,
      adminId: user.sub || user.id,
      status: dto.status,
      adminResponse: dto.adminResponse,
      extendSuspensionDays: dto.extendSuspensionDays,
    });
  }
}
