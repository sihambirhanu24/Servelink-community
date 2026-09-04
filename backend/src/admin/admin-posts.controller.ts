import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminPostsService } from './admin-posts.service';
import {
  AdminPostsQueryDto,
  BulkModeratePostsDto,
  ModeratePostDto,
  ResolvePostReportDto,
} from './dto/admin-posts.dto';

interface AdminRequest {
  user: { sub: string; adminId?: string; isAdmin?: boolean };
}

/**
 * Admin content-moderation API for community posts.
 * Paths are unchanged from the previous AdminController routes so the existing
 * /admin/posts/[id] review page keeps working.
 */
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPostsController {
  constructor(private readonly adminPostsService: AdminPostsService) {}

  @Get('stats')
  getStats() {
    return this.adminPostsService.getStats();
  }

  @Get()
  list(@Query() query: AdminPostsQueryDto) {
    return this.adminPostsService.list(query);
  }

  // Declared before ':id' routes so "bulk" is never captured as a post id.
  @Patch('bulk/moderate')
  bulkModerate(@Body() dto: BulkModeratePostsDto, @Req() req: AdminRequest) {
    return this.adminPostsService.bulkModerate(
      dto.ids,
      this.adminIdOf(req),
      dto.action,
      dto.reason,
    );
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.adminPostsService.getById(id);
  }

  @Get(':id/reports')
  getReports(@Param('id') id: string) {
    return this.adminPostsService.getReports(id);
  }

  @Get(':id/moderation-history')
  getModerationHistory(@Param('id') id: string) {
    return this.adminPostsService.getModerationHistory(id);
  }

  @Patch(':id/moderate')
  moderate(
    @Param('id') id: string,
    @Body() dto: ModeratePostDto,
    @Req() req: AdminRequest,
  ) {
    return this.adminPostsService.moderate(
      id,
      this.adminIdOf(req),
      dto.action,
      dto.reason,
    );
  }

  @Patch(':postId/reports/:reportId/resolve')
  resolveReport(
    @Param('postId') postId: string,
    @Param('reportId') reportId: string,
    @Body() dto: ResolvePostReportDto,
    @Req() req: AdminRequest,
  ) {
    return this.adminPostsService.resolveReport(
      postId,
      reportId,
      this.adminIdOf(req),
      dto.action,
    );
  }

  private adminIdOf(req: AdminRequest) {
    return req.user.adminId ?? req.user.sub;
  }
}
