import {
  Controller,
  Get,
  Post,
  Delete,
  UseGuards,
  Param,
  Query,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { CurrentUser } from "../auth/decorators/current-user.decorator";

import { TeacherService } from "./teacher.service";

@Controller("teachers")
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
  ) {}

  @Get(":id/profile")
  async getPublicProfile(@Param("id") id: string) {
    return this.teacherService.getPublicProfile(id);
  }

  @Get(":id/posts")
  async getTeacherPosts(
    @Param("id") id: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.teacherService.getTeacherPosts(
      id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/follow")
  async followTeacher(@Param("id") id: string, @CurrentUser() user) {
    return this.teacherService.followTeacher(user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id/follow")
  async unfollowTeacher(@Param("id") id: string, @CurrentUser() user) {
    return this.teacherService.unfollowTeacher(user.sub, id);
  }
}

@Controller("teacher")
export class CurrentTeacherController {
  constructor(
    private readonly teacherService: TeacherService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@CurrentUser() user) {
    return this.teacherService.getProfile(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get("statistics")
  getStatistics(@CurrentUser() user) {
    return this.teacherService.getStatistics(user.sub);
  }
}