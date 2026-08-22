import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TeacherProgressService } from "../progress/teacher-progress.service";
import { CreatePostDto } from "../community/dto/create-post.dto";
import { AttachmentType } from "@prisma/client";
import { getPagination } from "../shared/utils/pagination";

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: TeacherProgressService,
  ) {}

  async createPost(
    teacherId: string,
    dto: CreatePostDto,
  ) {
    // Limit to 3 posts per day
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const postCountToday = await this.prisma.communityPost.count({
      where: {
        teacherId,
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    if (postCountToday >= 3) {
      throw new ForbiddenException('You have reached your daily limit of 3 posts.');
    }

    // Create the post first
    const post = await this.prisma.communityPost.create({
      data: {
        title: dto.title,
        description: dto.description,
        teacherId,
        communityId: dto.communityId,
        categoryId: dto.categoryId,
      },
      include: {
        teacher: true,
        community: true,
        category: true,
      },
    });

    // After successful post creation, award progression points
    // This happens asynchronously and won't block the post creation response
    this.progressService
      .awardPostPoints(teacherId, post.id)
      .catch((err) => {
        console.error(`Failed to award post points: ${err.message}`);
      });

    return post;
  }

  async getPosts(
    teacherId: string,
    filters: {
      search?: string;
      communityId?: string;
      categoryId?: string;
      page: number;
      limit: number;
    },
  ) {
    const { skip, take } = getPagination(
  filters.page,
  filters.limit,
);

    const posts = await this.prisma.communityPost.findMany({
      where: {
        ...(filters.search && {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }),

        ...(filters.communityId && {
          communityId: filters.communityId,
        }),

        ...(filters.categoryId && {
          categoryId: filters.categoryId,
        }),
      },

      include: {
        teacher: true,
        community: true,
        category: true,
        comments: true,
        communityLikes: true,
        attachments: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take,
    });

    return posts.map((post) => ({
      ...post,
      likesCount: post.communityLikes.length,
      commentsCount: post.comments.length,
      liked: post.communityLikes.some(
        (like) => like.teacherId === teacherId,
      ),
    }));
  }

  async getPostById(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },

      include: {
        teacher: true,
        community: true,
        category: true,
        attachments: true,
        comments: {
          include: {
            teacher: true,
          },
        },
        communityLikes: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    return post;
  }

  async updatePost(
    id: string,
    teacherId: string,
    dto: CreatePostDto,
  ) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.teacherId !== teacherId) {
      throw new ForbiddenException(
        "You can only update your own posts.",
      );
    }

    return this.prisma.communityPost.update({
      where: { id },

      data: {
        title: dto.title,
        description: dto.description,
        communityId: dto.communityId,
        categoryId: dto.categoryId,
      },
    });
  }

  async deletePost(
    id: string,
    teacherId: string,
  ) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.teacherId !== teacherId) {
      throw new ForbiddenException(
        "You can only delete your own posts.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.attachment.deleteMany({
        where: { postId: id },
      });

      await tx.communityComment.deleteMany({
        where: { postId: id },
      });

      await tx.communityLike.deleteMany({
        where: { postId: id },
      });

      await tx.communityBookmark.deleteMany({
        where: { postId: id },
      });

      await tx.communityReport.deleteMany({
        where: { postId: id },
      });

      await tx.postTag.deleteMany({
        where: { postId: id },
      });

      return tx.communityPost.delete({
        where: { id },
      });
    });
  }

  async getTrendingPosts() {
    return this.prisma.communityPost.findMany({
      include: {
        teacher: true,
        comments: true,
        communityLikes: true,
      },

      orderBy: [
        {
          communityLikes: {
            _count: "desc",
          },
        },
        {
          comments: {
            _count: "desc",
          },
        },
      ],

      take: 10,
    });
  }

  async getSavedPosts(teacherId: string) {
    const bookmarks = await this.prisma.communityBookmark.findMany({
      where: { teacherId },
      include: {
        post: {
          include: {
            teacher: true,
            community: true,
            category: true,
            comments: true,
            communityLikes: true,
            attachments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return bookmarks.map((bookmark) => ({
      ...bookmark.post,
      likesCount: bookmark.post.communityLikes.length,
      commentsCount: bookmark.post.comments.length,
      liked: bookmark.post.communityLikes.some((like) => like.teacherId === teacherId),
      bookmarked: true,
    }));
  }

  async getMyCommunitiesPosts(teacherId: string) {
    const memberships = await this.prisma.communityMember.findMany({
      where: { 
        teacherId,
        status: 'APPROVED',
      },
      select: { communityId: true },
    });

    const communityIds = memberships.map((m) => m.communityId);

    if (communityIds.length === 0) {
      return [];
    }

    const posts = await this.prisma.communityPost.findMany({
      where: {
        communityId: { in: communityIds },
      },
      include: {
        teacher: true,
        community: true,
        category: true,
        comments: true,
        communityLikes: true,
        attachments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return posts.map((post) => ({
      ...post,
      likesCount: post.communityLikes.length,
      commentsCount: post.comments.length,
      liked: post.communityLikes.some((like) => like.teacherId === teacherId),
      bookmarked: false,
    }));
  }

  async uploadAttachment(
    file: Express.Multer.File,
    postId: string,
  ) {
    let type: AttachmentType;

    if (file.mimetype.startsWith("image/")) {
      type = AttachmentType.IMAGE;
    } else if (file.mimetype === "application/pdf") {
      type = AttachmentType.PDF;
    } else if (file.mimetype.startsWith("video/")) {
      type = AttachmentType.VIDEO;
    } else {
      type = AttachmentType.DOCX;
    }

    const normalizedUrl = file.path.replace(/\\/g, "/");

    return this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        url: normalizedUrl.startsWith("uploads/") ? `/${normalizedUrl}` : normalizedUrl,
        fileSize: file.size,
        type,
        postId,
      },
    });
  }
}