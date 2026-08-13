import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';


import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CommunityService } from '../services/community.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ReportPostDto } from '../dto/report-post.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { multerConfig } from '../../upload/config/multer.config';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';


@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
  ) {}


  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all communities for teacher',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  getCommunities(@CurrentUser() user: any) {
    return this.communityService.getCommunities(user.sub);
  }
@ApiOperation({
  summary: "Get all categories",
})
@Get("categories")
getCategories() {
  return this.communityService.getCategories();
}

 @Post("posts")
@UseGuards(JwtAuthGuard)
createPost(
  @CurrentUser() user,
  @Body() dto: CreatePostDto,
) {

  console.log(user);

  console.log(dto);

  return this.communityService.createPost(
    user.sub,
    dto,
  );
}
@ApiBearerAuth()
@ApiOperation({
  summary: 'Like a post',
})
@UseGuards(JwtAuthGuard)
@Post('posts/:id/like')
likePost(
  @Param('id') postId: string,
  @Req() req,
) {
  return this.communityService.likePost(
    postId,
    req.user.sub,
  );
}


@ApiBearerAuth()
@ApiOperation({
  summary: 'Remove like from a post',
})
@UseGuards(JwtAuthGuard)
@Delete('posts/:id/like')
unlikePost(
  @Param('id') postId: string,
  @Req() req,
) {
  return this.communityService.unlikePost(
    postId,
    req.user.sub,
  );
}



@ApiBearerAuth()
@ApiOperation({
  summary: 'Add comment to a post',
})
@Post('posts/:postId/comments')
@UseGuards(JwtAuthGuard)
createComment(
  @Param('postId') postId: string,
  @Body() dto: CreateCommentDto,
  @Req() req,
) {
  return this.communityService.createComment(
    req.user.sub,
    postId,
    dto,
  );
}

 @ApiOperation({
  summary: 'Get all posts',
})



  @ApiOperation({
  summary: 'Get a post by ID',
})
  @Get('posts/:id')
getPostById(@Param('id') id: string) {
  return this.communityService.getPostById(id);
}


@ApiBearerAuth()
@ApiOperation({
  summary: 'Update a post',
})
@Patch('posts/:id')
@UseGuards(JwtAuthGuard)
updatePost(
  @Param('id') id: string,
  @Body() dto: CreatePostDto,
  @Req() req,
) {
  return this.communityService.updatePost(
    id,
    req.user.sub,
    dto,
  );
}

@ApiBearerAuth()
@ApiOperation({
  summary: 'Delete a post',
})
@Delete('posts/:id')
@UseGuards(JwtAuthGuard)
deletePost(
  @Param('id') id: string,
  @Req() req,
) {
  return this.communityService.deletePost(
    id,
    req.user.sub,
  );
}

@ApiBearerAuth()
@ApiOperation({
  summary: 'Bookmark a post',
})
@Post('posts/:postId/bookmark')
@UseGuards(JwtAuthGuard)
bookmarkPost(
  @Param('postId') postId: string,
  @Req() req,
) {
  return this.communityService.bookmarkPost(
    req.user.sub,
    postId,
  );
}

@ApiBearerAuth()
@ApiOperation({
  summary: 'Remove bookmark',
})
@Delete('posts/:postId/bookmark')
@UseGuards(JwtAuthGuard)
unBookmarkPost(
  @Param('postId') postId: string,
  @Req() req,
) {
  return this.communityService.unBookmarkPost(
    req.user.sub,
    postId,
  );
}        
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get("posts")
getPosts(
  @Req() req,
  @Query("search") search?: string,
  @Query("communityId") communityId?: string,
  @Query("categoryId") categoryId?: string,
  @Query("page") page = "1",
  @Query("limit") limit = "10",
) {
  return this.communityService.getPosts(
    req.user.sub,
    {
      search,
      communityId,
      categoryId,
      page: Number(page),
      limit: Number(limit),
    },
  );
}
@ApiOperation({
  summary: 'Get trending posts',
})
@Get('posts/trending')
getTrending() {
  return this.communityService.getTrendingPosts();
}

@ApiBearerAuth()
@ApiOperation({
  summary: 'Report a post',
})
@Post('posts/:postId/report')
@UseGuards(JwtAuthGuard)
reportPost(
  @Param('postId') postId: string,
  @Body() dto: ReportPostDto,
  @Req() req,
) {
  return this.communityService.reportPost(
    req.user.sub,
    postId,
    dto,
  );
}


@ApiBearerAuth()
@ApiOperation({
  summary: 'Upload attachment',
})
@Post('posts/:postId/attachment')
@UseGuards(JwtAuthGuard)
@UseInterceptors(
  FileInterceptor(
    'file',
    multerConfig,
  ),
)
uploadAttachment(
  @UploadedFile() file: Express.Multer.File,
  @Param('postId') postId: string,
) {
  return this.communityService.uploadAttachment(
    file,
    postId,
  );
}

@ApiBearerAuth()
@ApiOperation({
  summary: 'Delete attachment',
})
@Delete('attachments/:attachmentId')
@UseGuards(JwtAuthGuard)
deleteAttachment(
  @Param('attachmentId') attachmentId: string,
  @Req() req,
) {
  return this.communityService.deleteAttachment(
    attachmentId,
    req.user.sub,
  );
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get('woreda-schools')
getWoredaSchools(@CurrentUser() user: any) {
  return this.communityService.getWoredaSchools(user.sub);
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get('accessible')
getAccessibleCommunities(@CurrentUser() user: any) {
  return this.communityService.getAccessibleCommunities(user.sub);
}

// ─── Community-type routes (level-gated) - must come BEFORE ':id' ─────────────────────────────────────

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get("type/:type")
getCommunitiesByType(
  @Param("type") type: string,
  @CurrentUser() user: any,
) {
  return this.communityService.getCommunitiesByType(user.sub, type);
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get("type/:type/posts")
getPostsByType(
  @Param("type") type: string,
  @CurrentUser() user: any,
  @Query("search") search?: string,
  @Query("categoryId") categoryId?: string,
  @Query("filter") filter?: string,
  @Query("page") page = "1",
  @Query("limit") limit = "20",
) {
  console.log(`[getPostsByType] type=${type}, page=${page}, limit=${limit}`);
  return this.communityService.getPostsByType(user.sub, type, {
    search,
    categoryId,
    filter,
    page: Number(page),
    limit: Number(limit),
  });
}

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get("type/:type/members")
getMembersByType(
  @Param("type") type: string,
  @CurrentUser() user: any,
) {
  return this.communityService.getMembersByType(user.sub, type);
}


@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Get(':id')
getCommunity(
  @Param('id') id: string,
  @CurrentUser() user: any,
) {
  return this.communityService.getAccessibleCommunityById(id, user.sub);
}

}

