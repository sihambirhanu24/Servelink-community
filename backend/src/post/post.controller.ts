import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PostService } from "../post/post.service";
import { CreatePostDto } from "../community/dto/create-post.dto";

@Controller("posts")
export class PostController {
  constructor(
    private readonly postService: PostService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createPost(
    @Req() req,
    @Body() dto: CreatePostDto,
  ) {
    return this.postService.createPost(
      req.user.sub,
      dto,
    );
  }

  @Get()
  getPosts(
    @Req() req,
    @Query("search") search?: string,
    @Query("communityId") communityId?: string,
    @Query("categoryId") categoryId?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "10",
  ) {
    return this.postService.getPosts(
      req.user?.sub,
      {
        search,
        communityId,
        categoryId,
        page: Number(page),
        limit: Number(limit),
      },
    );
  }

  @Get(":id")
  getPost(
    @Param("id") id: string,
  ) {
    return this.postService.getPostById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  updatePost(
    @Param("id") id: string,
    @Req() req,
    @Body() dto: CreatePostDto,
  ) {
    return this.postService.updatePost(
      id,
      req.user.sub,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  deletePost(
    @Param("id") id: string,
    @Req() req,
  ) {
    return this.postService.deletePost(
      id,
      req.user.sub,
    );
  }

  @Get("trending")
  trending() {
    return this.postService.getTrendingPosts();
  }
}