import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpgradeLevelDto } from './dto/upgrade-level.dto';
import { TeachersQueryDto } from './dto/teachers-query.dto';

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
}
