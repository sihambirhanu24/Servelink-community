import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Query,
} from '@nestjs/common';
import { LocationChangeService } from './location-change.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { locationChangeMulterConfig } from './config/location-change-multer.config';
import { CreateLocationChangeDto } from './dto/create-location-change.dto';
import { RejectLocationChangeDto } from './dto/reject-location-change.dto';
import { LocationChangeStatus } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class LocationChangeController {
  constructor(private readonly locationChangeService: LocationChangeService) {}

  // ==========================================
  // TEACHER ENDPOINTS
  // ==========================================

  @Get('location-change-requests/schools')
  async getSchools() {
    return this.locationChangeService.getAvailableSchools();
  }

  @Get('location-change-requests/my')
  async getMyRequests(@Request() req) {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.locationChangeService.getMyRequests(teacherId);
  }

  @Post('location-change-requests')
  @UseInterceptors(FileInterceptor('file', locationChangeMulterConfig))
  async submitRequest(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateLocationChangeDto,
  ) {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.locationChangeService.submitRequest(teacherId, dto, file);
  }

  @Patch('location-change-requests/:id/cancel')
  async cancelRequest(@Request() req, @Param('id') id: string) {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.locationChangeService.cancelRequest(id, teacherId);
  }

  @Get('location-change-requests/documents/:id')
  async viewDocumentTeacher(@Request() req, @Param('id') id: string) {
    const teacherId = req.user.teacherId || req.user.sub;
    return this.locationChangeService.getDocument(id, teacherId, false);
  }

  // ==========================================
  // ADMIN ENDPOINTS
  // ==========================================

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/location-change-requests')
  async getAllRequests(@Query('status') status?: LocationChangeStatus) {
    return this.locationChangeService.getAllRequests(status);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/location-change-requests/:id')
  async getRequestDetails(@Param('id') id: string) {
    return this.locationChangeService.getRequestById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/location-change-requests/:id/approve')
  async approveRequest(@Request() req, @Param('id') id: string) {
    const adminId = req.user.adminId || req.user.sub;
    return this.locationChangeService.approveRequest(id, adminId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/location-change-requests/:id/reject')
  async rejectRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RejectLocationChangeDto,
  ) {
    const adminId = req.user.adminId || req.user.sub;
    return this.locationChangeService.rejectRequest(id, adminId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/location-change-requests/documents/:id')
  async viewDocumentAdmin(@Request() req, @Param('id') id: string) {
    const adminId = req.user.adminId || req.user.sub;
    return this.locationChangeService.getDocument(id, adminId, true);
  }
}
