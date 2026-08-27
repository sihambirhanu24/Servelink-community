import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuspensionGuard } from '../suspension/guards/suspension.guard';
import { DiscussionService } from './discussion.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import { QueryDiscussionsDto } from './dto/query-discussions.dto';
import { ReportDiscussionDto } from './dto/report-discussion.dto';

@Controller('discussions')
@UseGuards(JwtAuthGuard)
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Post()
  @UseGuards(SuspensionGuard)
  create(@Request() req: any, @Body() dto: CreateDiscussionDto) {
    return this.discussionService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: QueryDiscussionsDto) {
    return this.discussionService.findAll(req.user.sub, query);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.discussionService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @UseGuards(SuspensionGuard)
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDiscussionDto,
  ) {
    return this.discussionService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(SuspensionGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.discussionService.remove(id, req.user.sub);
  }

  @Post(':id/bookmark')
  @UseGuards(SuspensionGuard)
  toggleBookmark(@Request() req: any, @Param('id') id: string) {
    return this.discussionService.toggleBookmark(id, req.user.sub);
  }

  @Post(':id/report')
  @UseGuards(SuspensionGuard)
  report(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReportDiscussionDto,
  ) {
    return this.discussionService.report(id, req.user.sub, dto);
  }

  @Post(':id/mark-read')
  markAsRead(@Request() req: any, @Param('id') id: string) {
    return this.discussionService.markAsRead(id, req.user.sub);
  }
}
