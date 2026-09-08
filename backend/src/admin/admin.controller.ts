import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpgradeLevelDto } from './dto/upgrade-level.dto';
import { TeachersQueryDto } from './dto/teachers-query.dto';
import { CreateCommunityDto, UpdateCommunityDto } from './dto/community.dto';
import { TeacherVerificationService } from '../verification/teacher-verification.service';
import { RejectTeacherDto } from '../verification/dto/reject-teacher.dto';
import { SuspensionService } from '../suspension/suspension.service';
import {
  AdminSuspendTeacherDto,
  UnsuspendTeacherDto,
} from '../suspension/dto/suspend-teacher.dto';
import { SuspensionType } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly verificationService: TeacherVerificationService,
    private readonly suspensionService: SuspensionService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('teachers')
  async getTeachers(@Query() query: TeachersQueryDto) {
    // Synchronise finished temporary suspensions first so the table never shows
    // "SUSPENDED · 0 days left" for an account that is effectively active again.
    await this.suspensionService.expireDueSuspensions();
    return this.adminService.getTeachers(query);
  }

  @Patch('teachers/upgrade-level')
  upgradeLevel(@Body() dto: UpgradeLevelDto) {
    return this.adminService.upgradeLevel(dto);
  }

  /**
   * PATCH /admin/teachers/:id/suspend
   * Body: { reason, suspensionType?: TEMPORARY|PERMANENT|WARNING, durationDays? }
   * Defaults to a TEMPORARY suspension when durationDays is given, PERMANENT otherwise.
   */
  @Patch('teachers/:id/suspend')
  suspend(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AdminSuspendTeacherDto,
  ) {
    const suspensionType =
      dto.suspensionType ??
      (dto.durationDays ? SuspensionType.TEMPORARY : SuspensionType.PERMANENT);
    return this.suspensionService.suspendTeacher({
      teacherId: id,
      suspensionType,
      reason: dto.reason,
      duration: dto.durationDays,
      adminId: req.user.sub,
      reportId: dto.reportId,
    });
  }

  @Patch('teachers/:id/activate')
  activate(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UnsuspendTeacherDto,
  ) {
    return this.suspensionService.unsuspendTeacher({
      teacherId: id,
      adminId: req.user.sub,
      reason: dto?.reason,
    });
  }

  @Get('teachers/:id/suspension-history')
  suspensionHistory(@Param('id') id: string) {
    return this.suspensionService.getSuspensionHistory(id);
  }

  @Get('reports')
  getReports(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('reason') reason?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getReports({
      page,
      pageSize,
      search,
      reason,
      status,
    });
  }

  @Patch('reports/:id/status')
  updateReportStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateReportStatus(id, status);
  }

  @Patch('reports/:id/resolve')
  resolveReportById(@Param('id') id: string, @Request() req: any) {
    return this.adminService.resolveReportById(id, req.user.sub);
  }

  @Patch('reports/:id/dismiss')
  dismissReport(@Param('id') id: string, @Request() req: any) {
    return this.adminService.dismissReport(id, req.user.sub);
  }

  @Post('reports/:id/warn')
  warnUserFromReport(@Param('id') id: string) {
    return this.adminService.warnUserFromReport(id);
  }

  @Post('reports/:id/remove-content')
  removeContentFromReport(@Param('id') id: string) {
    return this.adminService.removeContentFromReport(id);
  }

  // ─── Community management ─────────────────────────────────────────────────

  @Get('communities')
  getCommunities(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('subtype') subtype?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getCommunities({
      page,
      pageSize,
      search,
      type,
      subtype,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get('communities/stats')
  getCommunityStats() {
    return this.adminService.getCommunityStats();
  }

  // Post moderation endpoints live in AdminPostsController (admin/posts/*).

  @Get('communities/:id')
  getCommunityById(@Param('id') id: string) {
    return this.adminService.getCommunityById(id);
  }

  @Post('communities')
  createCommunity(@Body() dto: CreateCommunityDto) {
    return this.adminService.createCommunity(dto);
  }

  @Patch('communities/:id')
  updateCommunity(@Param('id') id: string, @Body() dto: UpdateCommunityDto) {
    return this.adminService.updateCommunity(id, dto);
  }

  @Patch('communities/:id/toggle-active')
  toggleCommunityActive(@Param('id') id: string) {
    return this.adminService.toggleCommunityActive(id);
  }

  @Get('communities/:id/members')
  getCommunityMembers(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('level') level?: string,
  ) {
    return this.adminService.getCommunityMembers(id, {
      page,
      pageSize,
      search,
      status,
      level,
    });
  }

  @Patch('communities/:communityId/members/:memberId/status')
  updateMemberStatus(
    @Param('communityId') communityId: string,
    @Param('memberId') memberId: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    return this.adminService.updateMemberStatus(
      communityId,
      memberId,
      body.status,
    );
  }

  @Delete('communities/:communityId/members/:memberId')
  removeMember(
    @Param('communityId') communityId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.adminService.removeMember(communityId, memberId);
  }

  @Get('communities/:id/posts')
  getCommunityPosts(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('postType') postType?: string,
    @Query('moderationStatus') moderationStatus?: string,
  ) {
    return this.adminService.getCommunityPosts(id, {
      page,
      pageSize,
      search,
      postType,
      moderationStatus,
    });
  }

  @Get('communities/:id/reports')
  getCommunityReports(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getCommunityReports(id, {
      page,
      pageSize,
      status,
    });
  }

  // ─── Teacher Verification Management ─────────────────────────────────────

  @Get('teachers/pending-verification')
  getPendingVerifications() {
    return this.verificationService.getPendingTeachers();
  }

  @Get('teachers/:id/verification')
  getTeacherVerificationInfo(@Param('id') id: string) {
    return this.verificationService.getTeacherVerificationInfo(id);
  }

  @Patch('teachers/:id/approve-verification')
  approveTeacherVerification(@Param('id') teacherId: string, @Request() req) {
    const adminId = req.user.sub;
    return this.verificationService.approveTeacher(teacherId, adminId);
  }

  @Patch('teachers/:id/reject-verification')
  rejectTeacherVerification(
    @Param('id') teacherId: string,
    @Body() dto: RejectTeacherDto,
    @Request() req,
  ) {
    const adminId = req.user.sub;
    return this.verificationService.rejectTeacher(
      teacherId,
      dto.reason,
      adminId,
    );
  }

  @Get('teachers/:teacherId/documents/:documentId')
  async viewVerificationDocument(
    @Param('teacherId') teacherId: string,
    @Param('documentId') documentId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const adminId = req.user.sub;
    const { document, filePath } = await this.verificationService.getDocument(
      documentId,
      adminId,
      true, // isAdmin = true
    );

    // Send file for viewing (admin can view all verification documents)
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${document.fileName}"`,
    );
    res.sendFile(filePath, { root: '.' });
  }
}
