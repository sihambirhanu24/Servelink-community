import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationAction,
  PostModerationStatus,
  PostType,
  Prisma,
  ReportStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationEvent } from '../notification/notification.types';
import {
  AdminPostsQueryDto,
  PostModerationAction,
  PostSortOption,
  ReportResolutionAction,
} from './dto/admin-posts.dto';

const PREVIEW_LENGTH = 200;

/** Row projection for the moderation table: only what the table renders. */
const postRowSelect = {
  id: true,
  title: true,
  description: true,
  postType: true,
  moderationStatus: true,
  moderatedAt: true,
  moderationReason: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  teacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      level: true,
      verified: true,
      status: true,
      profileImage: true,
    },
  },
  community: { select: { id: true, name: true, type: true } },
  category: { select: { id: true, name: true } },
  _count: {
    select: {
      communityLikes: true,
      comments: true,
      communityBookmarks: true,
      communityReports: true,
      attachments: true,
    },
  },
  communityReports: {
    where: { status: ReportStatus.PENDING },
    select: { id: true },
  },
} satisfies Prisma.CommunityPostSelect;

type PostRow = Prisma.CommunityPostGetPayload<{ select: typeof postRowSelect }>;

interface ModerationTransition {
  status: PostModerationStatus;
  historyAction: ModerationAction;
  resolvesPendingReports: boolean;
  notification: {
    title: string;
    message: (title: string, reason?: string) => string;
  };
}

const TRANSITIONS: Record<PostModerationAction, ModerationTransition> = {
  HIDDEN: {
    status: PostModerationStatus.HIDDEN,
    historyAction: ModerationAction.POST_HIDDEN,
    resolvesPendingReports: true,
    notification: {
      title: 'Post Hidden',
      message: (title, reason) =>
        reason
          ? `Your post "${title}" has been hidden by an administrator: ${reason}`
          : `Your post "${title}" has been hidden by an administrator.`,
    },
  },
  REMOVE: {
    status: PostModerationStatus.REMOVED,
    historyAction: ModerationAction.POST_REMOVED,
    resolvesPendingReports: true,
    notification: {
      title: 'Post Removed',
      message: (title, reason) =>
        reason
          ? `Your post "${title}" has been removed because: ${reason}`
          : `Your post "${title}" has been removed by an administrator.`,
    },
  },
  RESTORE: {
    status: PostModerationStatus.ACTIVE,
    historyAction: ModerationAction.POST_RESTORED,
    resolvesPendingReports: false,
    notification: {
      title: 'Post Restored',
      message: (title) =>
        `Your post "${title}" has been restored and is now visible again.`,
    },
  },
};

/** Which current states each action may be applied to. */
const ALLOWED_FROM: Record<PostModerationAction, PostModerationStatus[]> = {
  HIDDEN: [
    PostModerationStatus.ACTIVE,
    PostModerationStatus.REPORTED,
    PostModerationStatus.UNDER_REVIEW,
  ],
  REMOVE: [
    PostModerationStatus.ACTIVE,
    PostModerationStatus.REPORTED,
    PostModerationStatus.UNDER_REVIEW,
    PostModerationStatus.HIDDEN,
  ],
  RESTORE: [PostModerationStatus.HIDDEN, PostModerationStatus.REMOVED],
};

@Injectable()
export class AdminPostsService {
  private readonly logger = new Logger(AdminPostsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // ─── Statistics ────────────────────────────────────────────────────────────

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      total,
      byStatus,
      byType,
      todayPosts,
      pendingReports,
      postsWithPendingReports,
    ] = await Promise.all([
      this.prisma.communityPost.count(),
      this.prisma.communityPost.groupBy({
        by: ['moderationStatus'],
        _count: { _all: true },
      }),
      this.prisma.communityPost.groupBy({
        by: ['postType'],
        _count: { _all: true },
      }),
      this.prisma.communityPost.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.communityReport.count({
        where: { status: ReportStatus.PENDING },
      }),
      this.prisma.communityPost.count({
        where: { communityReports: { some: { status: ReportStatus.PENDING } } },
      }),
    ]);

    const statusCounts = Object.fromEntries(
      Object.values(PostModerationStatus).map((s) => [s, 0]),
    ) as Record<PostModerationStatus, number>;
    for (const row of byStatus)
      statusCounts[row.moderationStatus] = row._count._all;

    const typeCounts = Object.fromEntries(
      Object.values(PostType).map((t) => [t, 0]),
    ) as Record<PostType, number>;
    for (const row of byType) typeCounts[row.postType] = row._count._all;

    return {
      total,
      published: statusCounts.ACTIVE,
      pendingReview: statusCounts.REPORTED + statusCounts.UNDER_REVIEW,
      reported: statusCounts.REPORTED,
      underReview: statusCounts.UNDER_REVIEW,
      hidden: statusCounts.HIDDEN,
      removed: statusCounts.REMOVED,
      todayPosts,
      pendingReports,
      postsWithPendingReports,
      byStatus: statusCounts,
      byType: typeCounts,
    };
  }

  // ─── Listing ───────────────────────────────────────────────────────────────

  async list(query: AdminPostsQueryDto) {
    const where = this.buildWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: this.buildOrderBy(query.sortBy),
        select: postRowSelect,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toRow(row)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  private buildWhere(
    query: AdminPostsQueryDto,
  ): Prisma.CommunityPostWhereInput {
    const where: Prisma.CommunityPostWhereInput = {};

    if (query.search) {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.OR = [
        { title: contains },
        { description: contains },
        { teacher: { firstName: contains } },
        { teacher: { lastName: contains } },
        { teacher: { email: contains } },
        { community: { name: contains } },
      ];
    }

    if (query.communityId) where.communityId = query.communityId;
    if (query.communityType) where.community = { type: query.communityType };
    if (query.teacherLevel) where.teacher = { level: query.teacherLevel };
    if (query.moderationStatus) where.moderationStatus = query.moderationStatus;
    if (query.postType) where.postType = query.postType;
    if (query.categoryId) where.categoryId = query.categoryId;

    switch (query.reportStatus) {
      case 'NO_REPORTS':
        where.communityReports = { none: {} };
        break;
      case 'REPORTED':
        where.communityReports = { some: {} };
        break;
      case 'UNRESOLVED':
        where.communityReports = { some: { status: ReportStatus.PENDING } };
        break;
      case 'RESOLVED':
        where.communityReports = {
          some: {},
          none: { status: ReportStatus.PENDING },
        };
        break;
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        // A date-only upper bound should include the whole of that day.
        const to = new Date(query.dateTo);
        if (/^\d{4}-\d{2}-\d{2}$/.test(query.dateTo))
          to.setDate(to.getDate() + 1);
        where.createdAt.lt = to;
      }
    }

    return where;
  }

  private buildOrderBy(
    sortBy: PostSortOption,
  ): Prisma.CommunityPostOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'oldest':
        return [{ createdAt: 'asc' }];
      case 'most_reported':
        return [
          { communityReports: { _count: 'desc' } },
          { createdAt: 'desc' },
        ];
      case 'most_engaged':
        // Prisma cannot order by a sum of relation counts; comments first, then reactions.
        return [
          { comments: { _count: 'desc' } },
          { communityLikes: { _count: 'desc' } },
          { createdAt: 'desc' },
        ];
      case 'newest':
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  private toRow(row: PostRow) {
    const { description, communityReports, ...rest } = row;
    return {
      ...rest,
      preview: this.makePreview(description),
      pendingReports: communityReports.length,
    };
  }

  private makePreview(html: string) {
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > PREVIEW_LENGTH
      ? `${text.slice(0, PREVIEW_LENGTH)}…`
      : text;
  }

  // ─── Detail ────────────────────────────────────────────────────────────────

  async getById(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            level: true,
            verified: true,
            status: true,
            profileImage: true,
            school: true,
            department: true,
            suspensionReason: true,
            suspensionStart: true,
            suspensionUntil: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            type: true,
            school: true,
            woreda: true,
            zone: true,
            region: true,
            department: true,
          },
        },
        category: { select: { id: true, name: true } },
        _count: {
          select: {
            communityLikes: true,
            comments: true,
            communityBookmarks: true,
            communityReports: true,
          },
        },
        attachments: true,
        comments: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        communityReports: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        moderationHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async getReports(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, moderationStatus: true },
    });
    if (!post) throw new NotFoundException('Post not found');

    const reports = await this.prisma.communityReport.findMany({
      where: { postId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return { post, reports };
  }

  async getModerationHistory(postId: string) {
    const exists = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Post not found');

    return this.prisma.moderationHistory.findMany({
      where: { postId },
      include: { post: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Moderation ────────────────────────────────────────────────────────────

  async moderate(
    id: string,
    adminId: string,
    action: PostModerationAction,
    reason?: string,
  ) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        teacherId: true,
        moderationStatus: true,
        _count: {
          select: {
            communityReports: { where: { status: ReportStatus.PENDING } },
          },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (!ALLOWED_FROM[action].includes(post.moderationStatus)) {
      throw new BadRequestException(
        `Cannot ${action.toLowerCase()} a post whose status is ${post.moderationStatus}`,
      );
    }

    const transition = TRANSITIONS[action];
    const nextStatus = this.resolveTargetStatus(
      transition,
      post._count.communityReports,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedPost = await tx.communityPost.update({
        where: { id },
        data: {
          moderationStatus: nextStatus,
          moderatedById: adminId,
          moderationReason: reason ?? null,
          moderatedAt: new Date(),
        },
      });

      await tx.moderationHistory.create({
        data: {
          postId: id,
          teacherId: post.teacherId,
          adminId,
          action: transition.historyAction,
          reason,
        },
      });

      if (transition.resolvesPendingReports) {
        await tx.communityReport.updateMany({
          where: { postId: id, status: ReportStatus.PENDING },
          data: {
            status: ReportStatus.RESOLVED,
            reviewedById: adminId,
            reviewedAt: new Date(),
          },
        });
      }

      return updatedPost;
    });

    this.notifyAuthor(post.teacherId, id, transition, post.title, reason);
    return updated;
  }

  async bulkModerate(
    ids: string[],
    adminId: string,
    action: PostModerationAction,
    reason?: string,
  ) {
    const uniqueIds = [...new Set(ids)];
    const posts = await this.prisma.communityPost.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        title: true,
        teacherId: true,
        moderationStatus: true,
        _count: {
          select: {
            communityReports: { where: { status: ReportStatus.PENDING } },
          },
        },
      },
    });

    if (posts.length !== uniqueIds.length) {
      const found = new Set(posts.map((p) => p.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Posts not found: ${missing.join(', ')}`);
    }

    const transition = TRANSITIONS[action];
    const eligible = posts.filter((p) =>
      ALLOWED_FROM[action].includes(p.moderationStatus),
    );
    const skipped = posts.filter(
      (p) => !ALLOWED_FROM[action].includes(p.moderationStatus),
    );

    if (eligible.length > 0) {
      const now = new Date();
      await this.prisma.$transaction(async (tx) => {
        // RESTORE may land on different statuses per post, so update individually.
        for (const post of eligible) {
          await tx.communityPost.update({
            where: { id: post.id },
            data: {
              moderationStatus: this.resolveTargetStatus(
                transition,
                post._count.communityReports,
              ),
              moderatedById: adminId,
              moderationReason: reason ?? null,
              moderatedAt: now,
            },
          });
        }

        await tx.moderationHistory.createMany({
          data: eligible.map((post) => ({
            postId: post.id,
            teacherId: post.teacherId,
            adminId,
            action: transition.historyAction,
            reason,
          })),
        });

        if (transition.resolvesPendingReports) {
          await tx.communityReport.updateMany({
            where: {
              postId: { in: eligible.map((p) => p.id) },
              status: ReportStatus.PENDING,
            },
            data: {
              status: ReportStatus.RESOLVED,
              reviewedById: adminId,
              reviewedAt: now,
            },
          });
        }
      });

      for (const post of eligible) {
        this.notifyAuthor(
          post.teacherId,
          post.id,
          transition,
          post.title,
          reason,
        );
      }
    }

    return {
      action,
      updated: eligible.map((p) => p.id),
      skipped: skipped.map((p) => ({
        id: p.id,
        moderationStatus: p.moderationStatus,
      })),
    };
  }

  async resolveReport(
    postId: string,
    reportId: string,
    adminId: string,
    action: ReportResolutionAction,
  ) {
    const report = await this.prisma.communityReport.findUnique({
      where: { id: reportId },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            teacherId: true,
            moderationStatus: true,
          },
        },
      },
    });
    if (!report || report.postId !== postId) {
      throw new NotFoundException('Report not found for this post');
    }
    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException(
        `Report has already been ${report.status.toLowerCase()}`,
      );
    }

    const status =
      action === 'RESOLVE' ? ReportStatus.RESOLVED : ReportStatus.DISMISSED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedReport = await tx.communityReport.update({
        where: { id: reportId },
        data: { status, reviewedById: adminId, reviewedAt: new Date() },
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.moderationHistory.create({
        data: {
          postId,
          // Logs the reporter: this history row is about the report, not the author.
          teacherId: report.teacherId,
          adminId,
          action:
            action === 'RESOLVE'
              ? ModerationAction.REPORT_RESOLVED
              : ModerationAction.REPORT_DISMISSED,
        },
      });

      // Once the queue for this post is empty, it no longer needs review.
      const remaining = await tx.communityReport.count({
        where: { postId, status: ReportStatus.PENDING },
      });
      const needsReview =
        report.post.moderationStatus === PostModerationStatus.REPORTED ||
        report.post.moderationStatus === PostModerationStatus.UNDER_REVIEW;
      if (remaining === 0 && needsReview) {
        await tx.communityPost.update({
          where: { id: postId },
          data: { moderationStatus: PostModerationStatus.ACTIVE },
        });
      }

      return { ...updatedReport, remainingPendingReports: remaining };
    });

    const reporterMessage =
      action === 'RESOLVE'
        ? 'Your report has been reviewed by an administrator.'
        : 'Your report has been reviewed and no action was taken.';
    this.notificationService
      .create({
        receiverId: report.teacherId,
        title: 'Report Reviewed',
        message: reporterMessage,
        type: NotificationEvent.REPORT,
        referenceId: postId,
      })
      .catch((error: unknown) => this.logNotifyFailure(error));

    return updated;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Restoring a post that still has open reports puts it back in the review queue. */
  private resolveTargetStatus(
    transition: ModerationTransition,
    pendingReports: number,
  ) {
    if (
      transition.status === PostModerationStatus.ACTIVE &&
      pendingReports > 0
    ) {
      return PostModerationStatus.REPORTED;
    }
    return transition.status;
  }

  private notifyAuthor(
    teacherId: string,
    postId: string,
    transition: ModerationTransition,
    title: string,
    reason?: string,
  ) {
    this.notificationService
      .create({
        receiverId: teacherId,
        title: transition.notification.title,
        message: transition.notification.message(title, reason),
        type: NotificationEvent.SYSTEM,
        referenceId: postId,
      })
      .catch((error: unknown) => this.logNotifyFailure(error));
  }

  private logNotifyFailure(error: unknown) {
    this.logger.warn(
      `Failed to send moderation notification: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
