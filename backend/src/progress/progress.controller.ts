import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { TeacherProgressService } from './teacher-progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: TeacherProgressService) {}

  /**
   * Get authenticated teacher's progression status
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyProgress(@Req() req) {
    return this.progressService.getProgress(req.user.sub);
  }

  /**
   * Get authenticated teacher's activity history
   */
  @UseGuards(JwtAuthGuard)
  @Get('activity')
  async getMyActivity(@Req() req) {
    return this.progressService.getActivityHistory(req.user.sub);
  }
}
