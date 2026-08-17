import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { TeacherProgressService } from "../progress/teacher-progress.service";
import { CreateCommentDto } from "../community/dto/create-comment.dto";
import { ReportPostDto } from "../community/dto/report-post.dto";

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: TeacherProgressService,
  ) {}

  async likePost(
    postId: string,
    teacherId: string,
  ) {
    const existing =
      await this.prisma.communityLike.findFirst({
        where: {
          postId,
          teacherId,
        },
      });

    if (existing) {
      throw new BadRequestException(
        "Already liked",
      );
    }

    // Get post owner info
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { teacherId: true },
    });

    const like = await this.prisma.communityLike.create({
      data: {
        teacherId,
        postId,
      },
    });

    // Award points to post owner (not the liker)
    if (post && post.teacherId !== teacherId) {
      this.progressService
        .awardLikePoints(post.teacherId, postId, teacherId)
        .catch((err) => {
          console.error(`Failed to award like points: ${err.message}`);
        });
    }

    return like;
  }

  async unlikePost(
    postId: string,
    teacherId: string,
  ) {
    // Get post owner before deleting the like
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { teacherId: true },
    });

    const result = await this.prisma.communityLike.delete({
      where: {
        teacherId_postId: {
          teacherId,
          postId,
        },
      },
    });

    // Remove points from post owner
    if (post && post.teacherId !== teacherId) {
      this.progressService
        .removeLikePoints(post.teacherId, postId, teacherId)
        .catch((err) => {
          console.error(`Failed to remove like points: ${err.message}`);
        });
    }

    return result;
  }

  async createComment(
    teacherId: string,
    postId: string,
    dto: CreateCommentDto,
  ) {
    return this.prisma.communityComment.create({
      data: {
        teacherId,
        postId,
        content: dto.content,
      },
      include: {
        teacher: true,
      },
    });
  }

  async bookmarkPost(
    teacherId: string,
    postId: string,
  ) {
    // Get post owner info
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { teacherId: true },
    });

    const bookmark = await this.prisma.communityBookmark.create({
      data: {
        teacherId,
        postId,
      },
    });

    // Award points to post owner (not the bookmarker)
    if (post && post.teacherId !== teacherId) {
      this.progressService
        .awardBookmarkPoints(post.teacherId, postId, teacherId)
        .catch((err) => {
          console.error(`Failed to award bookmark points: ${err.message}`);
        });
    }

    return bookmark;
  }

  async unBookmarkPost(
    teacherId: string,
    postId: string,
  ) {
    // Get post owner before deleting the bookmark
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { teacherId: true },
    });

    const result = await this.prisma.communityBookmark.delete({
      where: {
        teacherId_postId: {
          teacherId,
          postId,
        },
      },
    });

    // Remove points from post owner
    if (post && post.teacherId !== teacherId) {
      this.progressService
        .removeBookmarkPoints(post.teacherId, postId, teacherId)
        .catch((err) => {
          console.error(`Failed to remove bookmark points: ${err.message}`);
        });
    }

    return result;
  }

  async reportPost(
    teacherId: string,
    postId: string,
    dto: ReportPostDto,
  ) {
    return this.prisma.communityReport.create({
      data: {
        teacherId,
        postId,
        reason: dto.reason,
        description: dto.description,
      },
    });
  }
}