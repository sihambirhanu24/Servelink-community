import {
  Controller,
  Get,
  Query,
} from "@nestjs/common";

import { SearchService } from "./search.service";
import { SearchDto } from "./dto/search.dto";

@Controller("search")
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
  ) {}

  @Get("teachers")
  searchTeachers(
    @Query() dto: SearchDto,
  ) {
    return this.searchService.searchTeachers(
      dto.keyword ?? "",
    );
  }

  @Get("posts")
  searchPosts(
    @Query() dto: SearchDto,
  ) {
    return this.searchService.searchPosts(
      dto.keyword ?? "",
    );
  }

  @Get("communities")
  searchCommunities(
    @Query() dto: SearchDto,
  ) {
    return this.searchService.searchCommunities(
      dto.keyword ?? "",
    );
  }
}