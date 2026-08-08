import {
  Controller,
  Get,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

import { CurrentUser } from "../auth/decorators/current-user.decorator";

import { TeacherService } from "./teacher.service";

@Controller("teacher")
export class TeacherController {
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