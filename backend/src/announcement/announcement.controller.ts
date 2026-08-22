import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { announcementMulterConfig } from './config/announcement-multer.config';

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN routes  →  /admin/announcements/*
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Admin Announcements')
@ApiBearerAuth()
@Controller('admin/announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  /** GET /admin/announcements?page=1&pageSize=20&status=PUBLISHED&search= */
  @Get()
  findAll(
    @Query('page',     new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
    @Query('status')  status?: string,
    @Query('search')  search?: string,
  ) {
    return this.announcementService.findAll({ page, pageSize, status, search });
  }

  /** GET /admin/announcements/summary */
  @Get('summary')
  getSummary() {
    return this.announcementService.getSummary();
  }

  /** GET /admin/announcements/:id */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.announcementService.findOne(id);
  }

  /** POST /admin/announcements  (multipart/form-data) */
  @Post()
  @UseInterceptors(FileInterceptor('file', announcementMulterConfig))
  create(
    @Request() req: any,
    @Body() dto: CreateAnnouncementDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const adminId   = req.user.sub ?? req.user.id;
    const adminName = req.user.name ?? 'Administrator';
    return this.announcementService.create(dto, adminId, adminName, file);
  }

  /** PATCH /admin/announcements/:id  (multipart/form-data) */
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', announcementMulterConfig))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.announcementService.update(id, dto, file);
  }

  /** DELETE /admin/announcements/:id */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.announcementService.remove(id);
  }

  /** PATCH /admin/announcements/:id/publish */
  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.announcementService.publish(id);
  }

  /** PATCH /admin/announcements/:id/unpublish */
  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.announcementService.unpublish(id);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER routes  →  /announcements/*
// ─────────────────────────────────────────────────────────────────────────────

@ApiTags('Announcements')
@ApiBearerAuth()
@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  /** GET /announcements?page=1&limit=20  — returns only visible announcements */
  @Get()
  findForTeacher(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page: number,
  ) {
    const teacherId = req.user.sub ?? req.user.id;
    return this.announcementService.findForTeacher(teacherId, limit, page);
  }

  /** GET /announcements/:id */
  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const teacherId = req.user.sub ?? req.user.id;
    return this.announcementService.findOneForTeacher(id, teacherId);
  }

  /** POST /announcements/:id/read  — mark as read */
  @Post(':id/read')
  markAsRead(@Request() req: any, @Param('id') id: string) {
    const teacherId = req.user.sub ?? req.user.id;
    return this.announcementService.markAsRead(id, teacherId);
  }
}
