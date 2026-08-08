import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePostDto } from "../community/dto/create-post.dto";
import { AttachmentType } from "@prisma/client";
import { getPagination } from "../shared/utils/pagination";

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createPost(
    teacherId: string,
    dto: CreatePostDto,
  ) {
    return this.prisma.communityPost.create({
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