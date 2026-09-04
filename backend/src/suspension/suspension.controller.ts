import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AllowSuspended } from '../auth/decorators/allow-suspended.decorator';
import { SuspensionService } from './suspension.service';
import {
  ExtendSuspensionDto,
  SuspendTeacherDto,
  UnsuspendTeacherDto,
} from './dto/suspend-teacher.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('admin/suspension')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SuspensionController {
  constructor(private readonly suspensionService: SuspensionService) {}

  /**
   * POST /admin/suspension/suspend
   * Suspend a teacher
   */
  @Post('suspend')
  async suspendTeacher(
    @CurrentUser() user: any,
    @Body() dto: SuspendTeacherDto,
  ) {
    return this.suspensionService.suspendTeacher({
      teacherId: dto.teacherId,
      suspensionType: dto.suspensionType,
      reason: dto.reason,
      duration: dto.duration,
      adminId: user.sub || user.id,
      reportId: dto.reportId,
    });
  }

  /**
   * POST /admin/suspension/:teacherId/unsuspend
   * Unsuspend a teacher
   */
  @Post(':teacherId/unsuspend')
  async unsuspendTeacher(
    @CurrentUser() user: any,
    @Param('teacherId') teacherId: string,
    @Body() body: UnsuspendTeacherDto,
  ) {
    return this.suspensionService.unsuspendTeacher({
      teacherId,
      adminId: user.sub || user.id,
      reason: body?.reason,
    });
  }

  /**
   * POST /admin/suspension/:teacherId/extend
   * Extend a teacher's suspension
   */
  @Post(':teacherId/extend')
  async extendSuspension(
    @CurrentUser() user: any,
    @Param('teacherId') teacherId: string,
    @Body() body: ExtendSuspensionDto,
  ) {
    return this.suspensionService.extendSuspension(
      teacherId,
      body.days,
      user.sub || user.id,
      body.reason,
    );
  }

  /**
   * GET /admin/suspension/:teacherId/status
   * Get teacher suspension status (admin only)
   */
  @Get(':teacherId/status')
  async getSuspensionStatus(@Param('teacherId') teacherId: string) {
    return this.suspensionService.getSuspensionStatus(teacherId);
  }

  /**
   * GET /admin/suspension/:teacherId/history
   * Get teacher suspension history
   */
  @Get(':teacherId/history')
  async getSuspensionHistory(@Param('teacherId') teacherId: string) {
    return this.suspensionService.getSuspensionHistory(teacherId);
  }
}

/**
 * Teacher-accessible suspension endpoints.
 * Marked @AllowSuspended: a suspended teacher must be able to read why they
 * are suspended (this is what the "Account Suspended" screen renders).
 */
@Controller('suspension')
@UseGuards(JwtAuthGuard)
@AllowSuspended()
export class TeacherSuspensionController {
  constructor(private readonly suspensionService: SuspensionService) {}

  /**
   * GET /suspension/me/status
   * Get current teacher's suspension status
   */
  @Get('me/status')
  async getMySuspensionStatus(@CurrentUser() user: any) {
    const teacherId = user.teacherId || user.sub || user.id;
    return this.suspensionService.getSuspensionStatus(teacherId);
  }

  /**
   * GET /suspension/me/history
   * Get current teacher's suspension history
   */
  @Get('me/history')
  async getMySuspensionHistory(@CurrentUser() user: any) {
    const teacherId = user.teacherId || user.sub || user.id;
    return this.suspensionService.getSuspensionHistory(teacherId);
  }
}
