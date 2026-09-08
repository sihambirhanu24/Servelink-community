import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('teachers')
  searchTeachers(@Query() dto: SearchDto) {
    return this.searchService.searchTeachers(dto.keyword ?? '');
  }

  @Get('posts')
  searchPosts(@Query() dto: SearchDto) {
    return this.searchService.searchPosts(dto.keyword ?? '');
  }

  @Get('communities')
  searchCommunities(@Query() dto: SearchDto) {
    return this.searchService.searchCommunities(dto.keyword ?? '');
  }

  /**
   * Get verified teachers for messaging discovery.
   * Authenticated endpoint - excludes current user.
   */
  @UseGuards(JwtAuthGuard)
  @Get('verified-teachers')
  getVerifiedTeachers(
    @CurrentUser() user: any,
    @Query('keyword') keyword?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    return this.searchService.getVerifiedTeachers(user.sub, keyword, limitNumber);
  }
}
