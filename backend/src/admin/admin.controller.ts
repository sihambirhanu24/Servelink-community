import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpgradeLevelDto } from './dto/upgrade-level.dto';
import { TeachersQueryDto } from './dto/teachers-query.dto';
import { CreateCommunityDto, UpdateCommunityDto } from './dto/community.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.adminService.dashboard();
  }

  @Get('teachers')
  getTeachers(@Query() query: TeachersQueryDto) {
    return this.adminService.getTeachers(query);
  }

  @Patch('teachers/upgrade-level')
  upgradeLevel(@Body() dto: UpgradeLevelDto) {
    return this.adminService.upgradeLevel(dto);
  }

  @Patch('teachers/:id/suspend')
  suspend(@Param('id') id: string) {
    return this.adminService.suspendTeacher(id);
  }

  @Patch('teachers/:id/activate')
  activate(@Param('id') id: string) {
    return this.adminService.activateTeacher(id);
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
  updateReportStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateReportStatus(id, status);
  }

  // ─── Community management ─────────────────────────────────────────────────

  @Get('communities')
  getCommunities(
    @Query('page')     page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search')   search?: string,
    @Query('type')     type?: string,
    @Query('subtype')  subtype?: string,
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

  @Get('communities/:id')
  getCommunityById(@Param('id') id: string) {
    return this.adminService.getCommunityById(id);
  }

  @Post('communities')
  createCommunity(@Body() dto: CreateCommunityDto) {
    return this.adminService.createCommunity(dto);
  }

  @Patch('communities/:id')
  updateCommunity(
    @Param('id') id: string,
    @Body() dto: UpdateCommunityDto,
  ) {
    return this.adminService.updateCommunity(id, dto);
  }

  @Patch('communities/:id/toggle-active')
  toggleCommunityActive(@Param('id') id: string) {
    return this.adminService.toggleCommunityActive(id);
  }
}