import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { CreatePostByTypeDto } from '../dto/create-post-by-type.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { TeacherProgressService } from '../../progress/teacher-progress.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ReportPostDto } from '../dto/report-post.dto';
import { AttachmentType } from '@prisma/client';
import { NotificationService } from '../../notification/notification.service';
import { NotificationEvent } from '../../notification/notification.types';
import {
  isPostPubliclyVisible,
  publiclyVisiblePostWhere,
} from '../../common/post-visibility';
import {
  sanitizeRichText,
  isHtmlSafe,
} from '../../common/utils/sanitize-html.util';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly progressService: TeacherProgressService,
  ) {}

  async getAllPosts() {
    return this.prisma.communityPost.findMany({
      where: publiclyVisiblePostWhere,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            level: true,
            verified: true,
          },
        },
        category: true,
        tags: { include: { tag: true } },
        attachments: true,
        comments: true,
        communityLikes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPost(teacherId: string, dto: CreatePostDto) {
    // Sanitize description to prevent XSS
    if (!isHtmlSafe(dto.description)) {
      throw new BadRequestException('Description contains unsafe content');
    }
    const sanitizedDescription = sanitizeRichText(dto.description);

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
      throw new ForbiddenException(
        'You have reached your daily limit of 3 posts.',
      );
    }

    const post = await this.prisma.communityPost.create({
      data: {
        title: dto.title,
        description: sanitizedDescription,
        teacherId,
        communityId: dto.communityId,
        categoryId: dto.categoryId,
        postType: dto.postType || 'DISCUSSION',
      },
      include: { teacher: true, category: true, community: true },
    });

    // Award progression points asynchronously after successful post creation
    this.progressService.awardPostPoints(teacherId, post.id).catch((err) => {
      console.error(`Failed to award post points: ${err.message}`);
    });

    return post;
  }

  /**
   * Create a post by community type.
   *
   * The backend resolves the real community from:
   *  1. The requested communityType (NETWORK, SCHOOL, WOREDA, etc.)
   *  2. The authenticated teacher's geographic profile and level
   *
   * The frontend NEVER sends a communityId — it sends a communityType.
   * Authorization is fully enforced here.
   */
  async createPostByType(teacherId: string, dto: CreatePostByTypeDto) {
    const normalizedType = dto.communityType.toUpperCase();

    // ── Authorization: does this teacher have access to this community type? ──
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        level: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        privilegeExpiresAt: true,
        verificationStatus: true,
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const requiredLevel = CommunityService.TYPE_MIN_LEVEL[normalizedType] ?? 99;

    if (
      !this.hasAccessToType(
        teacher.level,
        teacher.privilegeExpiresAt,
        requiredLevel,
      )
    ) {
      throw new ForbiddenException(
        `Your level does not have access to ${normalizedType} communities.`,
      );
    }

    // ── Resolve the actual community from the DB ───────────────────────────────
    // For NETWORK: match any community of type NETWORK (no geographic filter)
    // For geographic types: match the community that corresponds to this teacher
    let communityWhere: any = { type: normalizedType as any, isActive: true };

    if (normalizedType === 'SCHOOL' && teacher.school) {
      communityWhere = {
        type: 'SCHOOL',
        isActive: true,
        OR: [
          { school: { equals: teacher.school, mode: 'insensitive' } },
          { name: { equals: teacher.school, mode: 'insensitive' } },
        ],
      };
    } else if (normalizedType === 'WOREDA' && teacher.woreda) {
      communityWhere = {
        type: 'WOREDA',
        isActive: true,
        woreda: { equals: teacher.woreda, mode: 'insensitive' },
      };
    } else if (normalizedType === 'ZONE' && teacher.zone) {
      communityWhere = {
        type: 'ZONE',
        isActive: true,
        zone: { equals: teacher.zone, mode: 'insensitive' },
      };
    } else if (normalizedType === 'REGION' && teacher.region) {
      communityWhere = {
        type: 'REGION',
        isActive: true,
        region: { equals: teacher.region, mode: 'insensitive' },
      };
    }

    const community = await this.prisma.community.findFirst({
      where: communityWhere,
      orderBy: { createdAt: 'asc' },
    });

    if (!community) {
      // For NETWORK: auto-create it on first use so teachers never see a 404.
      // For geographic types: the admin must create communities — show a clear message.
      if (normalizedType === 'NETWORK') {
        return this.prisma.community.create({
          data: {
            name: 'Network Community',
            type: 'NETWORK' as any,
            subtype: 'COMMON' as any,
            description:
              'The global professional community for all verified ServeLink teachers.',
            isActive: true,
          },
        });
      }

      throw new NotFoundException(
        `No ${normalizedType} community found for your profile. Ask your admin to create one.`,
      );
    }

    // ── Daily post limit ──────────────────────────────────────────────────────
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.communityPost.count({
      where: { teacherId, createdAt: { gte: startOfDay } },
    });
    if (todayCount >= 3) {
      throw new ForbiddenException(
        'You have reached your daily limit of 3 posts.',
      );
    }

    // ── Create the post ───────────────────────────────────────────────────────
    // Sanitize description to prevent XSS
    if (!isHtmlSafe(dto.description || '')) {
      throw new BadRequestException('Description contains unsafe content');
    }
    const sanitizedDescription = sanitizeRichText(dto.description || '');

    // If deadline is provided, treat as QUESTION with blind answer period
    const postType = dto.deadline ? 'QUESTION' : (dto.postType ?? 'DISCUSSION');

    const deadline = dto.deadline ? new Date(dto.deadline) : null;

    // Validate deadline is in the future
    if (deadline && deadline <= new Date()) {
      throw new BadRequestException('Deadline must be in the future');
    }

    const post = await this.prisma.communityPost.create({
      data: {
        title: dto.title,
        description: sanitizedDescription,
        teacherId,
        communityId: community.id, // resolved by backend — never from client
        categoryId: dto.categoryId,
        postType: postType as any,
        deadline: deadline,
        questionStatus: deadline ? 'OPEN' : undefined,
      },
      include: { teacher: true, category: true, community: true },
    });

    // Award points based on post type
    if (postType === 'QUESTION') {
      this.progressService
        .awardQuestionPoints(teacherId, post.id)
        .catch((err) =>
          console.error(`Failed to award question points: ${err.message}`),
        );
    } else if (postType === 'RESOURCE') {
      this.progressService
        .awardResourcePoints(teacherId, post.id)
        .catch((err) =>
          console.error(`Failed to award resource points: ${err.message}`),
        );
    }
    // DISCUSSION type posts get points through the DiscussionService

    return post;
  }

  async getPostById(id: string, teacherId?: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        teacher: true,
        community: true,
        category: true,
        attachments: true,
        comments: true,
        communityLikes: true,
        communityBookmarks: true,
        tags: { include: { tag: true } },
      },
    });
    if (
      !post ||
      (!isPostPubliclyVisible(post.moderationStatus) &&
        post.teacherId !== teacherId)
    ) {
      throw new NotFoundException('Post not found');
    }

    // Increment view count asynchronously (fire and forget)
    this.prisma.communityPost
      .update({
        where: { id },
        data: { views: { increment: 1 } },
      })
      .catch(() => {}); // Silently fail if increment doesn't work

    // Return with liked/bookmarked status if teacherId provided
    if (teacherId) {
      return {
        ...post,
        likesCount: post.communityLikes.length,
        liked: post.communityLikes.some((l) => l.teacherId === teacherId),
        bookmarked: post.communityBookmarks.some(
          (b) => b.teacherId === teacherId,
        ),
      };
    }

    return post;
  }

  async updatePost(id: string, teacherId: string, dto: CreatePostDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.teacherId !== teacherId)
      throw new ForbiddenException('You can only update your own posts.');
    return this.prisma.communityPost.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        communityId: dto.communityId,
        categoryId: dto.categoryId,
        postType: dto.postType,
      },
    });
  }

  async deletePost(id: string, teacherId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.teacherId !== teacherId)
      throw new ForbiddenException('You can only delete your own posts.');

    return this.prisma.$transaction(async (tx) => {
      await tx.attachment.deleteMany({ where: { postId: id } });
      await tx.communityComment.deleteMany({ where: { postId: id } });
      await tx.communityLike.deleteMany({ where: { postId: id } });
      await tx.communityBookmark.deleteMany({ where: { postId: id } });
      await tx.communityReport.deleteMany({ where: { postId: id } });
      await tx.postTag.deleteMany({ where: { postId: id } });
      return tx.communityPost.delete({ where: { id } });
    });
  }

  async likePost(postId: string, teacherId: string) {
    const existing = await this.prisma.communityLike.findFirst({
      where: { postId, teacherId },
    });
    if (existing) throw new BadRequestException('You already liked this post.');

    const [like, post] = await Promise.all([
      this.prisma.communityLike.create({ data: { postId, teacherId } }),
      this.prisma.communityPost.findUnique({
        where: { id: postId },
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    if (post && post.teacherId !== teacherId) {
      // Award points to post owner (not the liker)
      this.progressService
        .awardLikePoints(post.teacherId, postId, teacherId)
        .catch((err) => {
          console.error(`Failed to award like points: ${err.message}`);
        });

      // Send notification
      const senderTeacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { firstName: true, lastName: true },
      });
      const senderName = senderTeacher
        ? `${senderTeacher.firstName} ${senderTeacher.lastName}`
        : 'Someone';
      this.notificationService
        .create({
          receiverId: post.teacherId,
          senderId: teacherId,
          senderName,
          title: 'Someone liked your post',
          message: `${senderName} liked your post "${post.title}"`,
          type: NotificationEvent.LIKE,
          referenceId: postId,
        })
        .catch(() => {});
    }

    return like;
  }

  async unlikePost(postId: string, teacherId: string) {
    // Get post owner before deleting the like
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { teacherId: true },
    });

    const result = await this.prisma.communityLike.delete({
      where: { teacherId_postId: { teacherId, postId } },
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
    const comment = await this.prisma.communityComment.create({
      data: { content: dto.content, teacherId, postId },
      include: { teacher: true, post: true },
    });

    if (comment.post && comment.post.teacherId !== teacherId) {
      const senderName = `${comment.teacher.firstName} ${comment.teacher.lastName}`;
      this.notificationService
        .create({
          receiverId: comment.post.teacherId,
          senderId: teacherId,
          senderName,
          title: 'New comment on your post',
          message: `${senderName} commented on your post "${comment.post.title}"`,
          type: NotificationEvent.COMMENT,
          referenceId: postId,
        })
        .catch(() => {});
    }

    return comment;
  }

  async markBestAnswer(teacherId: string, commentId: string) {
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: commentId },
      include: { post: true, teacher: true },
    });

    if (!comment) throw new NotFoundException('Answer not found');
    if (comment.post.teacherId !== teacherId) {
      throw new ForbiddenException(
        'Only the question author can mark the best answer',
      );
    }

    // Unmark any existing best answer for this post
    await this.prisma.communityComment.updateMany({
      where: { postId: comment.post.id, isAccepted: true },
      data: { isAccepted: false },
    });

    const updated = await this.prisma.communityComment.update({
      where: { id: commentId },
      data: { isAccepted: true },
    });

    await this.prisma.communityPost.update({
      where: { id: comment.post.id },
      data: { isResolved: true },
    });

    return updated;
  }

  async markHelpful(teacherId: string, commentId: string) {
    const existing = await this.prisma.commentReaction.findUnique({
      where: { commentId_teacherId: { commentId, teacherId } },
    });

    if (existing) {
      // Toggle off
      await this.prisma.commentReaction.delete({
        where: { id: existing.id },
      });
      return { marked: false };
    } else {
      await this.prisma.commentReaction.create({
        data: { commentId, teacherId, reaction: 'HELPFUL' },
      });
      return { marked: true };
    }
  }

  async bookmarkPost(teacherId: string, postId: string) {
    const [bookmark, post] = await Promise.all([
      this.prisma.communityBookmark.create({ data: { teacherId, postId } }),
      this.prisma.communityPost.findUnique({
        where: { id: postId },
        select: { teacherId: true, title: true },
      }),
    ]);

    if (post && post.teacherId !== teacherId) {
      // Award points to post owner (not the bookmarker)
      this.progressService
        .awardBookmarkPoints(post.teacherId, postId, teacherId)
        .catch((err) => {
          console.error(`Failed to award bookmark points: ${err.message}`);
        });

      // Send notification
      const senderTeacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { firstName: true, lastName: true },
      });
      const senderName = senderTeacher
        ? `${senderTeacher.firstName} ${senderTeacher.lastName}`
        : 'Someone';
      this.notificationService
        .create({
          receiverId: post.teacherId,
          senderId: teacherId,
          senderName,
          title: 'Your post was bookmarked',
          message: `${senderName} bookmarked your post "${post.title}"`,
          type: NotificationEvent.BOOKMARK,
          referenceId: postId,
        })
        .catch(() => {});
    }

    return bookmark;
  }

  async unBookmarkPost(teacherId: string, postId: string) {
    // Get post owner before deleting the bookmark
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { teacherId: true },
    });

    const result = await this.prisma.communityBookmark.delete({
      where: { teacherId_postId: { teacherId, postId } },
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

  async getPosts(
    teacherId: string,
    filters: {
      search?: string;
      communityId?: string;
      categoryId?: string;
      postType?: string;
      page: number;
      limit: number;
    },
  ) {
    const skip = (filters.page - 1) * filters.limit;

    // Build the list of community IDs this teacher can actually access
    const accessible = await this.getAccessibleCommunities(teacherId);
    const accessibleIds = accessible.communities.map((c) => c.id);

    // If a specific communityId was requested, verify it's in the accessible set
    let communityFilter: string | undefined = undefined;
    if (filters.communityId) {
      if (!accessibleIds.includes(filters.communityId)) {
        return []; // Requested community is out of scope — return empty silently
      }
      communityFilter = filters.communityId;
    }

    const posts = await this.prisma.communityPost.findMany({
      where: {
        // Only posts from communities this teacher can access
        communityId: communityFilter ? communityFilter : { in: accessibleIds },
        ...publiclyVisiblePostWhere,
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.postType
          ? { postType: filters.postType as any }
          : { postType: { not: 'DISCUSSION' as any } }),
      },
      include: {
        teacher: true,
        community: true,
        category: true,
        comments: true,
        attachments: true,
        communityLikes: true,
        communityBookmarks: true,
      },
      skip,
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((post) => ({
      ...post,
      likesCount: post.communityLikes.length,
      liked: post.communityLikes.some((l) => l.teacherId === teacherId),
      bookmarks: post.communityBookmarks.length,
      bookmarked: post.communityBookmarks.some(
        (b) => b.teacherId === teacherId,
      ),
    }));
  }

  async getTrendingPosts() {
    return this.prisma.communityPost.findMany({
      where: publiclyVisiblePostWhere,
      include: { teacher: true, communityLikes: true, comments: true },
      orderBy: [
        { communityLikes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
      ],
      take: 10,
    });
  }

  async reportPost(teacherId: string, postId: string, dto: ReportPostDto) {
    // Verify post exists — include teacher so we have the post owner's ID
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, title: true, teacherId: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Prevent self-reporting
    if (post.teacherId === teacherId) {
      throw new BadRequestException('You cannot report your own post');
    }

    // Check for duplicate report
    const existingReport = await this.prisma.communityReport.findUnique({
      where: { teacherId_postId: { teacherId, postId } },
    });
    if (existingReport) {
      throw new ConflictException('You have already reported this post');
    }

    // Create the report and flag the post for the moderation queue
    const [report] = await this.prisma.$transaction([
      this.prisma.communityReport.create({
        data: {
          teacherId,
          postId,
          reason: dto.reason,
          description: dto.description,
          status: 'PENDING',
        },
      }),
      this.prisma.communityPost.updateMany({
        where: { id: postId, moderationStatus: 'ACTIVE' },
        data: { moderationStatus: 'REPORTED' },
      }),
    ]);

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

      const reporterName = reporter
        ? `${reporter.firstName} ${reporter.lastName}`
        : 'A teacher';

      await Promise.all(
        admins.map((admin) =>
          this.notificationService.create({
            receiverId: admin.id,
            senderId: teacherId,
            senderName: reporterName,
            title: 'New Post Report',
            message: `${reporterName} reported a post: "${post.title.substring(0, 50)}..." for ${dto.reason}`,
            type: NotificationEvent.REPORT,
            referenceId: report.id,
          }),
        ),
      );
    }

    // ── Notify the REPORTER (confirmation — do NOT mention who owns the post) ──
    this.notificationService
      .create({
        receiverId: teacherId,
        title: 'Report Submitted',
        message:
          'Your report has been submitted and will be reviewed by an administrator.',
        type: NotificationEvent.REPORT,
        referenceId: report.id,
      })
      .catch(() => {});

    // ── Notify the POST OWNER (privacy: do NOT reveal reporter identity) ───────
    this.notificationService
      .create({
        receiverId: post.teacherId,
        title: 'Post Reported',
        message:
          'Your post has been reported and is currently under review by an administrator.',
        type: NotificationEvent.REPORT,
        referenceId: postId,
        // senderId / senderName intentionally omitted — reporter must stay anonymous
      })
      .catch(() => {});

    return { success: true, reportId: report.id };
  }

  async uploadAttachment(file: Express.Multer.File, postId: string) {
    let attachmentType: AttachmentType;
    if (file.mimetype.startsWith('image/')) {
      attachmentType = AttachmentType.IMAGE;
    } else if (file.mimetype === 'application/pdf') {
      attachmentType = AttachmentType.PDF;
    } else if (file.mimetype.startsWith('video/')) {
      attachmentType = AttachmentType.VIDEO;
    } else {
      attachmentType = AttachmentType.DOCX;
    }

    // Normalize path: convert backslashes to forward slashes and remove leading ./
    let normalizedUrl = file.path.replace(/\\/g, '/').replace(/^\.\//g, '');

    // Ensure URL starts with 'uploads/' (not '/uploads/')
    if (!normalizedUrl.startsWith('uploads/')) {
      // If path is absolute, extract just the uploads/... part
      const uploadsIndex = normalizedUrl.indexOf('uploads/');
      if (uploadsIndex !== -1) {
        normalizedUrl = normalizedUrl.substring(uploadsIndex);
      }
    }

    return this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        url: normalizedUrl, // Store as 'uploads/images/file.jpg' without leading slash
        fileSize: file.size,
        type: attachmentType,
        postId,
      },
    });
  }

  async deleteAttachment(attachmentId: string, teacherId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { post: true },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (attachment.post.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You can only delete attachments from your own posts',
      );
    }

    // Delete from database
    await this.prisma.attachment.delete({
      where: { id: attachmentId },
    });

    // Optionally delete file from disk
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), attachment.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Failed to delete file from disk:', error);
    }

    return { success: true, message: 'Attachment deleted successfully' };
  }

  async getCommunities(teacherId: string) {
    const accessible = await this.getAccessibleCommunities(teacherId);
    return {
      teacherLevel: accessible.teacherLevel,
      communities: accessible.communities,
    };
  }

  async getCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(name: string) {
    // Check if category already exists
    const existing = await this.prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      throw new Error('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: { name },
    });
  }

  async deleteCategory(id: string) {
    // Check if category is being used by any posts
    const postsCount = await this.prisma.communityPost.count({
      where: { categoryId: id },
    });

    if (postsCount > 0) {
      throw new Error(
        `Cannot delete category: ${postsCount} posts are using it`,
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getCommunity(id: string) {
    const community = await this.prisma.community.findUnique({
      where: { id },
      include: {
        posts: {
          include: {
            teacher: true,
            category: true,
            comments: true,
            communityLikes: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        communityMembers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                level: true,
              },
            },
          },
        },
        _count: { select: { posts: true, communityMembers: true } },
      },
    });

    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  private static readonly LEVEL_ORDER: Record<string, number> = {
    LEVEL_1: 1,
    LEVEL_2: 2,
    LEVEL_3: 3,
    LEVEL_4: 4,
    LEVEL_5: 5,
  };

  // NETWORK = 0 means ALL verified teachers can access it (no level gate).
  private static readonly TYPE_MIN_LEVEL: Record<string, number> = {
    NETWORK: 0,
    SCHOOL: 1,
    WOREDA: 2,
    ZONE: 3,
    REGION: 4,
    NATIONAL: 5,
  };

  /**
   * Check if teacher has access to a community type based on level.
   * requiredLevel = 0 means open to all verified teachers (NETWORK).
   */
  private hasAccessToType(
    teacherLevel: string,
    privilegeExpiresAt: Date | null,
    requiredLevel: number,
  ): boolean {
    // NETWORK (requiredLevel = 0) is always accessible to verified teachers
    if (requiredLevel === 0) return true;
    const teacherLevelNum = CommunityService.LEVEL_ORDER[teacherLevel] ?? 1;
    return teacherLevelNum >= requiredLevel;
  }

  async getCommunitiesByType(teacherId: string, type: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        level: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        privilegeExpiresAt: true,
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const normalizedType = type.toUpperCase();
    const requiredLevel = CommunityService.TYPE_MIN_LEVEL[normalizedType] ?? 99;

    // Check access with privilege system
    if (
      !this.hasAccessToType(
        teacher.level,
        teacher.privilegeExpiresAt,
        requiredLevel,
      )
    ) {
      throw new ForbiddenException(
        `Your level (${teacher.level}) does not have access to ${type} communities.`,
      );
    }

    const matchFieldByType: Record<string, string | undefined> = {
      NETWORK: undefined, // no geographic restriction — matches all NETWORK communities
      SCHOOL: teacher.school,
      WOREDA: teacher.woreda,
      ZONE: teacher.zone,
      REGION: teacher.region,
      NATIONAL: undefined,
    };
    const matchValue = matchFieldByType[normalizedType];

    // Match on the community's geographic field (school/woreda/zone/region),
    // case-insensitive. Fall back to the first community of this type so
    // teachers always see a page even if the field values don't align exactly.
    let community = matchValue
      ? await this.prisma.community.findFirst({
          where: {
            type: normalizedType as any,
            OR: [
              { school: { equals: matchValue, mode: 'insensitive' } },
              { woreda: { equals: matchValue, mode: 'insensitive' } },
              { zone: { equals: matchValue, mode: 'insensitive' } },
              { region: { equals: matchValue, mode: 'insensitive' } },
              { name: { equals: matchValue, mode: 'insensitive' } },
            ],
          },
          include: {
            communityMembers: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                    level: true,
                    school: true,
                    subject: true,
                  },
                },
              },
            },
            _count: { select: { communityMembers: true, posts: true } },
          },
        })
      : null;

    // Fallback: any community of this type
    if (!community) {
      community = await this.prisma.community.findFirst({
        where: { type: normalizedType as any },
        include: {
          communityMembers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  level: true,
                  school: true,
                  subject: true,
                },
              },
            },
          },
          _count: { select: { communityMembers: true, posts: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!community) {
      if (normalizedType === 'NETWORK') {
        // Auto-create the global Network Community on first use
        const existing = await this.prisma.community.findFirst({
          where: { type: 'NETWORK' as any },
          include: {
            communityMembers: {
              include: {
                teacher: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    profileImage: true,
                    level: true,
                    school: true,
                    subject: true,
                  },
                },
              },
            },
            _count: { select: { communityMembers: true, posts: true } },
          },
        });
        if (existing) {
          community = existing;
        } else {
          community = await this.prisma.community.create({
            data: {
              name: 'Network Community',
              type: 'NETWORK' as any,
              subtype: 'COMMON' as any,
              description:
                'The global professional community for all verified ServeLink teachers.',
              isActive: true,
            },
            include: {
              communityMembers: {
                include: {
                  teacher: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      profileImage: true,
                      level: true,
                      school: true,
                      subject: true,
                    },
                  },
                },
              },
              _count: { select: { communityMembers: true, posts: true } },
            },
          });
        }
      } else {
        throw new NotFoundException(
          `No ${type} community exists yet. Ask your admin to create one.`,
        );
      }
    }

    return { teacherLevel: teacher.level, community };
  }

  async getPostsByType(
    teacherId: string,
    type: string,
    filters: {
      search?: string;
      categoryId?: string;
      filter?: string;
      page: number;
      limit: number;
    },
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        level: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        privilegeExpiresAt: true,
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const normalizedType = type.toUpperCase();
    const requiredLevel = CommunityService.TYPE_MIN_LEVEL[normalizedType] ?? 99;

    // Check access with privilege system
    if (
      !this.hasAccessToType(
        teacher.level,
        teacher.privilegeExpiresAt,
        requiredLevel,
      )
    ) {
      throw new ForbiddenException(
        `Your level does not have access to ${type} communities.`,
      );
    }

    const skip = (filters.page - 1) * filters.limit;

    // ── Build a geographic community filter so that each type only returns
    //    posts from the community that actually belongs to this teacher. ────
    let communityWhere: any = { type: normalizedType as any };

    // NETWORK has no geographic restriction — all posts across all NETWORK communities
    if (normalizedType === 'SCHOOL' && teacher.school) {
      communityWhere = {
        type: 'SCHOOL',
        OR: [
          { school: { equals: teacher.school, mode: 'insensitive' } },
          { name: { equals: teacher.school, mode: 'insensitive' } },
        ],
      };
    } else if (normalizedType === 'WOREDA' && teacher.woreda) {
      communityWhere = {
        type: 'WOREDA',
        woreda: { equals: teacher.woreda, mode: 'insensitive' },
      };
    } else if (normalizedType === 'ZONE' && teacher.zone) {
      communityWhere = {
        type: 'ZONE',
        zone: { equals: teacher.zone, mode: 'insensitive' },
      };
    } else if (normalizedType === 'REGION' && teacher.region) {
      communityWhere = {
        type: 'REGION',
        region: { equals: teacher.region, mode: 'insensitive' },
      };
    }

    const posts = await this.prisma.communityPost.findMany({
      where: {
        community: communityWhere,
        ...publiclyVisiblePostWhere,
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            level: true,
            verified: true,
            school: true,
            subject: true,
          },
        },
        community: true,
        category: true,
        comments: true,
        attachments: true,
        communityLikes: true,
        communityBookmarks: true,
      },
      skip,
      take: filters.limit,
      orderBy:
        filters.filter === 'popular'
          ? { communityLikes: { _count: 'desc' } }
          : { createdAt: 'desc' },
    });

    return posts.map((post) => ({
      ...post,
      likesCount: post.communityLikes.length,
      liked: post.communityLikes.some((l) => l.teacherId === teacherId),
      bookmarks: post.communityBookmarks.length,
      bookmarked: post.communityBookmarks.some(
        (b) => b.teacherId === teacherId,
      ),
    }));
  }

  async getMembersByType(
    teacherId: string,
    type: string,
    page = 1,
    limit = 20,
    search?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true, privilegeExpiresAt: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const requiredLevel =
      CommunityService.TYPE_MIN_LEVEL[type.toUpperCase()] ?? 99;
    if (
      !this.hasAccessToType(
        teacher.level,
        teacher.privilegeExpiresAt,
        requiredLevel,
      )
    ) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * limit;

    // Build dynamic search filter if user types in search box
    const searchFilter = search
      ? {
          OR: [
            {
              teacher: {
                firstName: { contains: search, mode: 'insensitive' as const },
              },
            },
            {
              teacher: {
                lastName: { contains: search, mode: 'insensitive' as const },
              },
            },
            {
              teacher: {
                subject: { contains: search, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {};

    const communityTypeEnum = type.toUpperCase() as any;

    // Run queries in parallel for efficiency
    const [members, total] = await Promise.all([
      this.prisma.communityMember.findMany({
        where: {
          community: { type: communityTypeEnum },
          ...searchFilter,
        },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              level: true,
              school: true,
              subject: true,
              verified: true,
            },
          },
        },
        distinct: ['teacherId'],
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communityMember.count({
        where: {
          community: { type: communityTypeEnum },
          ...searchFilter,
        },
      }),
    ]);

    return {
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWoredaSchools(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true, woreda: true, privilegeExpiresAt: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Check access with privilege system (WOREDA requires level 2)
    if (!this.hasAccessToType(teacher.level, teacher.privilegeExpiresAt, 2)) {
      throw new ForbiddenException(
        'Level 2 or above required to access Woreda school communities.',
      );
    }

    const woreda = teacher.woreda?.trim();

    const where: any = { type: 'SCHOOL' };
    if (woreda) {
      where.OR = [
        { woreda: { equals: woreda, mode: 'insensitive' } },
        { school: { equals: woreda, mode: 'insensitive' } },
      ];
    }

    const communities = await this.prisma.community.findMany({
      where,
      include: {
        _count: { select: { communityMembers: true, posts: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (!communities.length && woreda) {
      const fallback = await this.prisma.community.findMany({
        where: { type: 'SCHOOL' },
        include: {
          _count: { select: { communityMembers: true, posts: true } },
        },
        orderBy: { name: 'asc' },
      });
      return { woreda, schools: fallback };
    }

    return { woreda, schools: communities };
  }

  async getAccessibleCommunities(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        level: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        privilegeExpiresAt: true,
      },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const levelNum = CommunityService.LEVEL_ORDER[teacher.level] ?? 1;

    // Effective level is just the actual level
    const effectiveLevel = levelNum;

    // Build OR conditions for each unlocked type, scoped to the teacher's geography
    const orClauses: any[] = [];

    // SCHOOL always accessible (level 1+), scoped to teacher's school
    if (effectiveLevel >= 1) {
      if (teacher.school) {
        orClauses.push({
          type: 'SCHOOL',
          school: { equals: teacher.school, mode: 'insensitive' },
        });
      } else {
        // If teacher has no school set, show all SCHOOL communities
        orClauses.push({ type: 'SCHOOL' });
      }
    }

    // WOREDA accessible at level 2+, scoped to teacher's woreda
    if (effectiveLevel >= 2) {
      if (teacher.woreda) {
        orClauses.push({
          type: 'WOREDA',
          woreda: { equals: teacher.woreda, mode: 'insensitive' },
        });
      } else {
        // If teacher has no woreda set, show all WOREDA communities
        orClauses.push({ type: 'WOREDA' });
      }
    }

    // ZONE accessible at level 3+, scoped to teacher's zone
    if (effectiveLevel >= 3) {
      if (teacher.zone) {
        orClauses.push({
          type: 'ZONE',
          zone: { equals: teacher.zone, mode: 'insensitive' },
        });
      } else {
        orClauses.push({ type: 'ZONE' });
      }
    }

    // REGION accessible at level 4+, scoped to teacher's region
    if (effectiveLevel >= 4) {
      if (teacher.region) {
        orClauses.push({
          type: 'REGION',
          region: { equals: teacher.region, mode: 'insensitive' },
        });
      } else {
        orClauses.push({ type: 'REGION' });
      }
    }

    // NATIONAL accessible at level 5+ — no geographic filter
    if (effectiveLevel >= 5) {
      orClauses.push({ type: 'NATIONAL' });
    }

    if (orClauses.length === 0) {
      return {
        teacherLevel: teacher.level,
        communities: [],
        unlockedTypes: [],
      };
    }

    const communities = await this.prisma.community.findMany({
      where: { OR: orClauses },
      include: { _count: { select: { communityMembers: true, posts: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    const unlockedTypes = [
      'SCHOOL',
      'WOREDA',
      'ZONE',
      'REGION',
      'NATIONAL',
    ].filter(
      (t) => (CommunityService.TYPE_MIN_LEVEL[t] ?? 99) <= effectiveLevel,
    );

    return { teacherLevel: teacher.level, communities, unlockedTypes };
  }

  async getAccessibleCommunityById(communityId: string, teacherId: string) {
    const [community, teacher] = await Promise.all([
      this.prisma.community.findUnique({
        where: { id: communityId },
        include: {
          posts: {
            include: {
              teacher: true,
              category: true,
              comments: true,
              communityLikes: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          communityMembers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                  level: true,
                },
              },
            },
          },
          _count: { select: { posts: true, communityMembers: true } },
        },
      }),
      this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
          level: true,
          school: true,
          woreda: true,
          zone: true,
          region: true,
          privilegeExpiresAt: true,
        },
      }),
    ]);

    if (!community) throw new NotFoundException('Community not found');
    if (!teacher) throw new NotFoundException('Teacher not found');

    const requiredLevel = CommunityService.TYPE_MIN_LEVEL[community.type] ?? 99;

    // Check access with privilege system
    if (
      !this.hasAccessToType(
        teacher.level,
        teacher.privilegeExpiresAt,
        requiredLevel,
      )
    ) {
      throw new ForbiddenException(
        `Your level does not have access to ${community.type} communities.`,
      );
    }

    // Geographic scope check — for non-NATIONAL communities, verify geographic match
    if (community.type !== 'NATIONAL') {
      const geoMatch = this.isInGeographicScope(community, teacher);
      if (!geoMatch) {
        throw new ForbiddenException(
          'This community is outside your authorized geographic scope.',
        );
      }
    }

    return community;
  }

  private isInGeographicScope(
    community: {
      type: string;
      school?: string | null;
      woreda?: string | null;
      zone?: string | null;
      region?: string | null;
    },
    teacher: {
      school?: string | null;
      woreda?: string | null;
      zone?: string | null;
      region?: string | null;
    },
  ): boolean {
    const ci = (a: string | null | undefined, b: string | null | undefined) =>
      !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

    switch (community.type) {
      case 'NETWORK':
        return true; // NETWORK is open to all verified teachers
      case 'SCHOOL':
        return (
          ci(community.school, teacher.school) ||
          ci(community.woreda, teacher.woreda)
        );
      case 'WOREDA':
        return ci(community.woreda, teacher.woreda);
      case 'ZONE':
        return ci(community.zone, teacher.zone);
      case 'REGION':
        return ci(community.region, teacher.region);
      case 'NATIONAL':
        return true;
      default:
        return false;
    }
  }

  // ─── Community Guidelines ────────────────────────────────────────────────────

  async getGuidelines() {
    return this.prisma.communityGuideline.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async createGuideline(data: {
    title: string;
    description: string;
    icon?: string;
    order?: number;
  }) {
    return this.prisma.communityGuideline.create({ data });
  }

  async seedDefaultGuidelines() {
    const count = await this.prisma.communityGuideline.count();
    if (count > 0) return { message: 'Guidelines already seeded' };

    const defaults = [
      {
        title: 'Be Respectful',
        description:
          'Treat every teacher with courtesy and professionalism. Disagreements are fine; disrespect is not.',
        icon: '🤝',
        order: 1,
      },
      {
        title: 'Share Educational Value',
        description:
          'Posts, questions and resources must contribute meaningfully to the teaching profession.',
        icon: '📚',
        order: 2,
      },
      {
        title: 'No Misinformation',
        description:
          'Only share verified, accurate information. Cite your sources when possible.',
        icon: '✅',
        order: 3,
      },
      {
        title: 'Keep It Professional',
        description:
          'This is a professional educator community. Personal attacks and off-topic content are not allowed.',
        icon: '🏫',
        order: 4,
      },
      {
        title: 'Protect Privacy',
        description:
          'Do not share personal details of students, colleagues, or other teachers without consent.',
        icon: '🔒',
        order: 5,
      },
      {
        title: 'Contribute Positively',
        description:
          'Upvote helpful answers, mark best answers, and support your fellow educators.',
        icon: '⭐',
        order: 6,
      },
    ];

    await this.prisma.communityGuideline.createMany({ data: defaults });
    return { message: 'Guidelines seeded', count: defaults.length };
  }

  // ─── Network Community overview ──────────────────────────────────────────────
  // Returns real aggregated stats + recent content cards for the Overview tab.

  async getNetworkOverview() {
    const [
      memberCount,
      questionCount,
      discussionCount,
      resourceCount,
      recentQuestions,
      recentDiscussions,
      recentResources,
    ] = await Promise.all([
      // Count distinct verified teachers (proxy for network community members)
      this.prisma.teacher.count({
        where: { verificationStatus: 'APPROVED' },
      }),
      this.prisma.communityPost.count({
        where: { postType: 'QUESTION', ...publiclyVisiblePostWhere },
      }),
      this.prisma.communityPost.count({
        where: { postType: 'DISCUSSION', ...publiclyVisiblePostWhere },
      }),
      this.prisma.communityPost.count({
        where: { postType: 'RESOURCE', ...publiclyVisiblePostWhere },
      }),
      // Recent questions — lightweight select
      this.prisma.communityPost.findMany({
        where: { postType: 'QUESTION', ...publiclyVisiblePostWhere },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              level: true,
            },
          },
          _count: { select: { comments: true, communityLikes: true } },
          community: { select: { id: true, name: true, type: true } },
        },
      }),
      // Recent discussions
      this.prisma.communityPost.findMany({
        where: { postType: 'DISCUSSION', ...publiclyVisiblePostWhere },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              level: true,
            },
          },
          _count: { select: { comments: true, communityLikes: true } },
          community: { select: { id: true, name: true, type: true } },
        },
      }),
      // Recent resources
      this.prisma.communityPost.findMany({
        where: { postType: 'RESOURCE', ...publiclyVisiblePostWhere },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              level: true,
            },
          },
          _count: { select: { comments: true, communityLikes: true } },
          attachments: {
            select: {
              id: true,
              url: true,
              type: true,
              fileName: true,
              fileSize: true,
            },
          },
          community: { select: { id: true, name: true, type: true } },
        },
      }),
    ]);

    return {
      stats: {
        members: memberCount,
        questions: questionCount,
        discussions: discussionCount,
        resources: resourceCount,
      },
      recentQuestions,
      recentDiscussions,
      recentResources,
    };
  }

  // ─── Top Contributors ────────────────────────────────────────────────────────
  // Returns teachers ranked by their total contribution points

  async getTopContributors(limit: number = 10) {
    const topContributors = await this.prisma.teacher.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        level: true,
        points: true,
        createdAt: true,
      },
      orderBy: [
        { points: 'desc' },
        { createdAt: 'asc' }, // Earlier contributors rank higher on ties
      ],
      take: limit,
    });

    return topContributors.map((teacher, index) => ({
      rank: index + 1,
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      profileImage: teacher.profileImage,
      level: teacher.level,
      points: teacher.points,
    }));
  }

  // ─── Get comments (answers) for a post ──────────────────────────────────────

  async getPostComments(postId: string, teacherId?: string) {
    const comments = await this.prisma.communityComment.findMany({
      where: { postId, parentId: null }, // top-level only
      orderBy: [
        { isAccepted: 'desc' }, // best answer first
        { createdAt: 'asc' },
      ],
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            level: true,
            verified: true,
          },
        },
        reactions: {
          select: { teacherId: true, reaction: true },
        },
      },
    });

    return comments.map((c) => ({
      ...c,
      helpfulCount: c.reactions.filter((r) => r.reaction === 'HELPFUL').length,
      markedHelpful: teacherId
        ? c.reactions.some(
            (r) => r.teacherId === teacherId && r.reaction === 'HELPFUL',
          )
        : false,
    }));
  }
}
