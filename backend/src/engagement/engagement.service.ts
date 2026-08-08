import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateCommentDto } from "../community/dto/create-comment.dto";
import { ReportPostDto } from "../community/dto/report-post.dto";

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
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

    return this.prisma.communityLike.create({
      data: {
        teacherId,
        postId,
      },
    });
  }

  async unlikePost(
    postId: string,
    teacherId: string,
  ) {
    return this.prisma.communityLike.delete({
      where: {
        teacherId_postId: {
          teacherId,
          postId,
        },
      },
    });
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
    return this.prisma.communityBookmark.create({
      data: {
        teacherId,
        postId,
      },
    });
  }

  async unBookmarkPost(
    teacherId: string,
    postId: string,
  ) {
    return this.prisma.communityBookmark.delete({
      where: {
        teacherId_postId: {
          teacherId,
          postId,
        },
      },
    });
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