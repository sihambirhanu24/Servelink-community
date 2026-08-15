import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { VerifiedTeacherGuard } from "../auth/guards/verified-teacher.guard";
import { EngagementService } from "./engagement.service";
import { CreateCommentDto } from "../community/dto/create-comment.dto";
import { ReportPostDto } from "../community/dto/report-post.dto";

@Controller("engagement")
export class EngagementController {
  constructor(
    private readonly engagementService: EngagementService,
  ) {}

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Post("posts/:id/like")
  like(
    @Param("id") id: string,
    @Req() req,
  ) {
    return this.engagementService.likePost(
      id,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Delete("posts/:id/like")
  unlike(
    @Param("id") id: string,
    @Req() req,
  ) {
    return this.engagementService.unlikePost(
      id,
      req.user.sub,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Post("posts/:id/comment")
  comment(
    @Param("id") id: string,
    @Req() req,
    @Body() dto: CreateCommentDto,
  ) {
    return this.engagementService.createComment(
      req.user.sub,
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Post("posts/:id/bookmark")
  bookmark(
    @Param("id") id: string,
    @Req() req,
  ) {
    return this.engagementService.bookmarkPost(
      req.user.sub,
      id,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Delete("posts/:id/bookmark")
  removeBookmark(
    @Param("id") id: string,
    @Req() req,
  ) {
    return this.engagementService.unBookmarkPost(
      req.user.sub,
      id,
    );
  }

  @UseGuards(JwtAuthGuard, VerifiedTeacherGuard)
  @Post("posts/:id/report")
  report(
    @Param("id") id: string,
    @Req() req,
    @Body() dto: ReportPostDto,
  ) {
    return this.engagementService.reportPost(
      req.user.sub,
      id,
      dto,
    );
  }
}