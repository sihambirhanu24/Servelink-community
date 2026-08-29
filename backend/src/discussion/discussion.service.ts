import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import { TeacherProgressService } from '../progress/teacher-progress.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { UpdateDiscussionDto } from './dto/update-discussion.dto';
import { QueryDiscussionsDto } from './dto/query-discussions.dto';
import { ReportDiscussionDto } from './dto/report-discussion.dto';
import {
  DiscussionResponse,
  DiscussionDetailResponse,
  PaginatedDiscussionsResponse,
  CreateDiscussionResult,
} from './dto/discussion-response.dto';
import { POINT_VALUES } from '../progress/types/progress.types';

@Injectable()
export class DiscussionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly progressService: TeacherProgressService,
  ) {}

  // ─── CREATE DISCUSSION ─────────────────────────────────────────────────────

  async create(
    teacherId: string,
    dto: CreateDiscussionDto,
  ): Promise<CreateDiscussionResult> {
    // Check for duplicate discussion (anti-spam / double-click prevention)
    const recentDuplicate = await this.prisma.discussion.findFirst({
      where: {
        authorId: teacherId,
        title: dto.title,
        createdAt: {
          gte: new Date(Date.now() - 30000), // last 30 seconds
        },
      },
    });

    if (recentDuplicate) {
      throw new BadRequestException('You recently created a discussion with this title.');
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const discussion = await this.prisma.discussion.create({
      data: {
        title: dto.title,
        description: dto.description,
        authorId: teacherId,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            level: true,
            profileImage: true,
            verified: true,
            subject: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Award points for discussion creation synchronously
    await this.progressService.awardDiscussionPoints(teacherId, discussion.id);
    
    // Fetch updated progress
    const progress = await this.progressService.getProgress(teacherId);

    return {
      discussion: this.formatDiscussionDetail(discussion, teacherId),
      pointsAwarded: POINT_VALUES.DISCUSSION_CREATED,
      progress,
    };
  }

  // ─── LIST DISCUSSIONS ──────────────────────────────────────────────────────

  async findAll(
    teacherId: string,
    query: QueryDiscussionsDto,
  ): Promise<PaginatedDiscussionsResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.tag) {
      where.tags = {
        has: query.tag,
      };
    }

    // Determine sort order
    let orderBy: any = {};
    switch (query.sortBy) {
      case 'mostActive':
        orderBy = [{ lastActiveAt: 'desc' }];
        break;
      case 'mostDiscussed':
        orderBy = [{ replyCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'recentlyUpdated':
        orderBy = [{ updatedAt: 'desc' }];
        break;
      case 'latest':
      default:
        orderBy = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    }

    const [discussions, total] = await Promise.all([
      this.prisma.discussion.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              level: true,
              profileImage: true,
              verified: true,
              subject: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          bookmarks: {
            where: { teacherId },
            select: { id: true },
          },
        },
      }),
      this.prisma.discussion.count({ where }),
    ]);

    return {
      data: discussions.map((d) => this.formatDiscussion(d, teacherId)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // ─── GET DISCUSSION BY ID ──────────────────────────────────────────────────

  async findOne(
    discussionId: string,
    teacherId: string,
  ): Promise<DiscussionDetailResponse> {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId, isActive: true },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            level: true,
            profileImage: true,
            verified: true,
            subject: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        bookmarks: {
          where: { teacherId },
          select: { id: true },
        },
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    // Increment view count
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: { views: { increment: 1 } },
    });

    // Mark as read
    await this.markAsRead(discussionId, teacherId);

    return this.formatDiscussionDetail(discussion, teacherId);
  }

  // ─── UPDATE DISCUSSION ─────────────────────────────────────────────────────

  async update(
    discussionId: string,
    teacherId: string,
    dto: UpdateDiscussionDto,
  ): Promise<DiscussionDetailResponse> {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId, isActive: true },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    if (discussion.authorId !== teacherId) {
      throw new ForbiddenException('You can only edit your own discussions');
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const updated = await this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        title: dto.title,
        description: dto.description,
        categoryId: dto.categoryId,
        tags: dto.tags,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            level: true,
            profileImage: true,
            verified: true,
            subject: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        bookmarks: {
          where: { teacherId },
          select: { id: true },
        },
      },
    });

    return this.formatDiscussionDetail(updated, teacherId);
  }

  // ─── DELETE DISCUSSION ─────────────────────────────────────────────────────

  async remove(discussionId: string, teacherId: string): Promise<void> {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId, isActive: true },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    if (discussion.authorId !== teacherId) {
      throw new ForbiddenException('You can only delete your own discussions');
    }

    // Soft delete
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: { isActive: false },
    });
  }

  // ─── BOOKMARK ──────────────────────────────────────────────────────────────

  async toggleBookmark(
    discussionId: string,
    teacherId: string,
  ): Promise<{ bookmarked: boolean }> {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId, isActive: true },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    const existing = await this.prisma.discussionBookmark.findUnique({
      where: {
        discussionId_teacherId: {
          discussionId,
          teacherId,
        },
      },
    });

    if (existing) {
      await this.prisma.discussionBookmark.delete({
        where: { id: existing.id },
      });
      // Remove points from discussion owner
      if (discussion.authorId !== teacherId) {
        this.progressService.removeDiscussionBookmarkPoints(discussion.authorId, discussionId, teacherId).catch(() => {});
      }
      return { bookmarked: false };
    } else {
      await this.prisma.discussionBookmark.create({
        data: {
          discussionId,
          teacherId,
        },
      });
      // Award points to discussion owner (not to the bookmarker)
      if (discussion.authorId !== teacherId) {
        this.progressService.awardDiscussionBookmarkPoints(discussion.authorId, discussionId, teacherId).catch(() => {});
      }
      return { bookmarked: true };
    }
  }

  // ─── REPORT ────────────────────────────────────────────────────────────────

  async report(
    discussionId: string,
    teacherId: string,
    dto: ReportDiscussionDto,
  ): Promise<{ success: boolean }> {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId, isActive: true },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    if (discussion.authorId === teacherId) {
      throw new BadRequestException('You cannot report your own discussion');
    }

    // Check if already reported
    const existing = await this.prisma.discussionReport.findUnique({
      where: {
        discussionId_teacherId: {
          discussionId,
          teacherId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('You have already reported this discussion');
    }

    const report = await this.prisma.discussionReport.create({
      data: {
        discussionId,
        teacherId,
        reason: dto.reason,
        description: dto.description,
      },
    });

    // Get admin users
    const admins = await this.prisma.admin.findMany({
      select: { id: true },
    });

    // Notify admins about the report
    if (admins.length > 0) {
      const reporter = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { firstName: true, lastName: true },
      });

      const reporterName = reporter ? `${reporter.firstName} ${reporter.lastName}` : 'A teacher';

      await Promise.all(
        admins.map((admin) =>
          this.notificationService.create({
            receiverId: admin.id,
            senderId: teacherId,
            senderName: reporterName,
            title: 'New Discussion Report',
            message: `${reporterName} reported a discussion: "${discussion.title.substring(0, 50)}..." for ${dto.reason}`,
            type: NotificationEvent.REPORT,
            referenceId: report.id,
          })
        )
      );
    }

    return { success: true };
  }

  // ─── READ STATE ────────────────────────────────────────────────────────────

  async markAsRead(discussionId: string, teacherId: string): Promise<void> {
    await this.prisma.discussionReadState.upsert({
      where: {
        discussionId_teacherId: {
          discussionId,
          teacherId,
        },
      },
      create: {
        discussionId,
        teacherId,
      },
      update: {
        lastReadAt: new Date(),
      },
    });
  }

  // ─── INCREMENT REPLY COUNT ─────────────────────────────────────────────────

  async incrementReplyCount(discussionId: string): Promise<void> {
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        replyCount: { increment: 1 },
        lastActiveAt: new Date(),
      },
    });
  }

  async decrementReplyCount(discussionId: string): Promise<void> {
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: {
        replyCount: { decrement: 1 },
      },
    });
  }

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────

  async notifyDiscussionReply(
    discussionId: string,
    senderId: string,
    senderName: string,
  ): Promise<void> {
    const discussion = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
      select: { authorId: true, title: true },
    });

    if (!discussion || discussion.authorId === senderId) {
      return; // Don't notify if discussion not found or replying to own discussion
    }

    await this.notificationService.create({
      receiverId: discussion.authorId,
      senderId,
      senderName,
      title: 'New reply to your discussion',
      message: `${senderName} replied to your discussion: "${discussion.title.substring(0, 50)}..."`,
      type: NotificationEvent.REPLY,
      referenceId: discussionId,
    });
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private formatDiscussion(discussion: any, teacherId: string): DiscussionResponse {
    return {
      id: discussion.id,
      title: discussion.title,
      description: discussion.description,
      author: {
        id: discussion.author.id,
        firstName: discussion.author.firstName,
        lastName: discussion.author.lastName,
        level: discussion.author.level,
        profileImage: discussion.author.profileImage,
        verified: discussion.author.verified,
        subject: discussion.author.subject,
      },
      category: discussion.category,
      tags: discussion.tags,
      views: discussion.views,
      replyCount: discussion.replyCount,
      isBookmarked: discussion.bookmarks?.length > 0,
      isPinned: discussion.isPinned,
      lastActiveAt: discussion.lastActiveAt,
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
    };
  }

  private formatDiscussionDetail(
    discussion: any,
    teacherId: string,
  ): DiscussionDetailResponse {
    return {
      ...this.formatDiscussion(discussion, teacherId),
      isOwner: discussion.authorId === teacherId,
    };
  }
}
