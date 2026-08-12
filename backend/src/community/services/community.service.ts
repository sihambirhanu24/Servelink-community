import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreatePostDto } from '../dto/create-post.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { ReportPostDto } from '../dto/report-post.dto';
import { AttachmentType } from '@prisma/client';
import { NotificationService } from '../../notification/notification.service';
import { NotificationEvent } from '../../notification/notification.types';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAllPosts() {
    return this.prisma.communityPost.findMany({
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
    return this.prisma.communityPost.create({
      data: {
        title: dto.title,
        description: dto.description,
        teacherId,
        communityId: dto.communityId,
        categoryId: dto.categoryId,
      },
      include: { teacher: true, category: true, community: true },
    });
  }

  async getPostById(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        teacher: true,
        community: true,
        category: true,
        attachments: true,
        comments: true,
        communityLikes: true,
        tags: { include: { tag: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
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
    return this.prisma.communityLike.delete({
      where: { teacherId_postId: { teacherId, postId } },
    });
  }

  async createComment(teacherId: string, postId: string, dto: CreateCommentDto) {
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

  async bookmarkPost(teacherId: string, postId: string) {
    const [bookmark, post] = await Promise.all([
      this.prisma.communityBookmark.create({ data: { teacherId, postId } }),
      this.prisma.communityPost.findUnique({
        where: { id: postId },
        select: { teacherId: true, title: true },
      }),
    ]);

    if (post && post.teacherId !== teacherId) {
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
    return this.prisma.communityBookmark.delete({
      where: { teacherId_postId: { teacherId, postId } },
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
        communityId: communityFilter
          ? communityFilter
          : { in: accessibleIds },
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
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
      bookmarked: post.communityBookmarks.some((b) => b.teacherId === teacherId),
    }));
  }

  async getTrendingPosts() {
    return this.prisma.communityPost.findMany({
      include: { teacher: true, communityLikes: true, comments: true },
      orderBy: [
        { communityLikes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
      ],
      take: 10,
    });
  }

  async reportPost(teacherId: string, postId: string, dto: ReportPostDto) {
    return this.prisma.communityReport.create({
      data: {
        teacherId,
        postId,
        reason: dto.reason,
        description: dto.description,
      },
      include: { teacher: true, post: true },
    });
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

    const normalizedUrl = file.path.replace(/\\/g, '/');

    return this.prisma.attachment.create({
      data: {
        fileName: file.originalname,
        url: normalizedUrl.startsWith('uploads/') ? `/${normalizedUrl}` : normalizedUrl,
        fileSize: file.size,
        type: attachmentType,
        postId,
      },
    });
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

  private static readonly TYPE_MIN_LEVEL: Record<string, number> = {
    SCHOOL: 1,
    WOREDA: 2,
    ZONE: 3,
    REGION: 4,
    NATIONAL: 5,
  };

  async getCommunitiesByType(teacherId: string, type: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true, school: true, woreda: true, zone: true, region: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherLevelNum = CommunityService.LEVEL_ORDER[teacher.level] ?? 1;
    const normalizedType = type.toUpperCase();
    const requiredLevel = CommunityService.TYPE_MIN_LEVEL[normalizedType] ?? 99;

    if (teacherLevelNum < requiredLevel) {
      throw new ForbiddenException(
        `Your level (${teacher.level}) does not have access to ${type} communities.`,
      );
    }

    const matchFieldByType: Record<string, string | undefined> = {
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
      throw new NotFoundException(
        `No ${type} community exists yet. Ask your admin to create one.`,
      );
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
      select: { level: true, school: true, woreda: true, zone: true, region: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherLevelNum = CommunityService.LEVEL_ORDER[teacher.level] ?? 1;
    const normalizedType = type.toUpperCase();
    const requiredLevel =
      CommunityService.TYPE_MIN_LEVEL[normalizedType] ?? 99;

    if (teacherLevelNum < requiredLevel) {
      throw new ForbiddenException(
        `Your level does not have access to ${type} communities.`,
      );
    }

    const skip = (filters.page - 1) * filters.limit;

    // ── Build a geographic community filter so that each type only returns
    //    posts from the community that actually belongs to this teacher. ────
    let communityWhere: any = { type: normalizedType as any };

    if (normalizedType === 'SCHOOL' && teacher.school) {
      communityWhere = {
        type: 'SCHOOL',
        OR: [
          { school: { equals: teacher.school, mode: 'insensitive' } },
          { name:   { equals: teacher.school, mode: 'insensitive' } },
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
      bookmarked: post.communityBookmarks.some((b) => b.teacherId === teacherId),
    }));
  }

  async getMembersByType(teacherId: string, type: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherLevelNum = CommunityService.LEVEL_ORDER[teacher.level] ?? 1;
    const requiredLevel =
      CommunityService.TYPE_MIN_LEVEL[type.toUpperCase()] ?? 99;
    if (teacherLevelNum < requiredLevel) throw new ForbiddenException('Access denied');

    return this.prisma.communityMember.findMany({
      where: { community: { type: type.toUpperCase() as any } },
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
    });
  }

  async getWoredaSchools(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true, woreda: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const teacherLevelNum = CommunityService.LEVEL_ORDER[teacher.level] ?? 1;
    if (teacherLevelNum < 2) {
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
        include: { _count: { select: { communityMembers: true, posts: true } } },
        orderBy: { name: 'asc' },
      });
      return { woreda, schools: fallback };
    }

    return { woreda, schools: communities };
  }

  async getAccessibleCommunities(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { level: true, school: true, woreda: true, zone: true, region: true },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const levelNum = CommunityService.LEVEL_ORDER[teacher.level] ?? 1;

    // Build OR conditions for each unlocked type, scoped to the teacher's geography
    const orClauses: any[] = [];

    // SCHOOL always accessible (level 1+), scoped to teacher's school
    if (levelNum >= 1) {
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
    if (levelNum >= 2) {
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
    if (levelNum >= 3) {
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
    if (levelNum >= 4) {
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
    if (levelNum >= 5) {
      orClauses.push({ type: 'NATIONAL' });
    }

    if (orClauses.length === 0) {
      return { teacherLevel: teacher.level, communities: [], unlockedTypes: [] };
    }

    const communities = await this.prisma.community.findMany({
      where: { OR: orClauses },
      include: { _count: { select: { communityMembers: true, posts: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    const unlockedTypes = ['SCHOOL', 'WOREDA', 'ZONE', 'REGION', 'NATIONAL'].filter(
      (t) => (CommunityService.TYPE_MIN_LEVEL[t] ?? 99) <= levelNum,
    );

    return { teacherLevel: teacher.level, communities, unlockedTypes };
  }

  async getAccessibleCommunityById(communityId: string, teacherId: string) {
    const [community, teacher] = await Promise.all([
      this.prisma.community.findUnique({
        where: { id: communityId },
        include: {
          posts: {
            include: { teacher: true, category: true, comments: true, communityLikes: true },
            orderBy: { createdAt: 'desc' },
          },
          communityMembers: {
            include: {
              teacher: { select: { id: true, firstName: true, lastName: true, profileImage: true, level: true } },
            },
          },
          _count: { select: { posts: true, communityMembers: true } },
        },
      }),
      this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { level: true, school: true, woreda: true, zone: true, region: true },
      }),
    ]);

    if (!community) throw new NotFoundException('Community not found');
    if (!teacher) throw new NotFoundException('Teacher not found');

    const levelNum = CommunityService.LEVEL_ORDER[teacher.level] ?? 1;
    const requiredLevel = CommunityService.TYPE_MIN_LEVEL[community.type] ?? 99;

    if (levelNum < requiredLevel) {
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
    community: { type: string; school?: string | null; woreda?: string | null; zone?: string | null; region?: string | null },
    teacher: { school?: string | null; woreda?: string | null; zone?: string | null; region?: string | null },
  ): boolean {
    const ci = (a: string | null | undefined, b: string | null | undefined) =>
      !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

    switch (community.type) {
      case 'SCHOOL':
        return ci(community.school, teacher.school) || ci(community.woreda, teacher.woreda);
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
}
