import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LEVEL_ORDER: Record<string, number> = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
};

const TYPE_MIN_LEVEL: Record<string, number> = {
  SCHOOL: 1,
  WOREDA: 2,
  ZONE: 3,
  REGION: 4,
  NATIONAL: 5,
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(teacherId: string) {
    const [
      teacher,
      postsCount,
      bookmarksCount,
      membershipsCount,
      likesReceived,
      recentPosts,
      recentNotifications,
      allMemberships,
      allCommunities,
    ] = await Promise.all([
      this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          level: true,
          profileImage: true,
          school: true,
          woreda: true,
          zone: true,
          region: true,
          subject: true,
          verified: true,
        },
      }),
      this.prisma.communityPost.count({ where: { teacherId } }),
      this.prisma.communityBookmark.count({ where: { teacherId } }),
      this.prisma.communityMember.count({ where: { teacherId } }),
      this.prisma.communityLike.count({ where: { post: { teacherId } } }),
      this.prisma.communityPost.findMany({
        where: { teacherId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          community: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true } },
          _count: {
            select: {
              communityLikes: true,
              comments: true,
              communityBookmarks: true,
            },
          },
        },
      }),
      this.prisma.notification.findMany({
        where: { receiverId: teacherId },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          referenceId: true,
          isRead: true,
          createdAt: true,
          senderName: true,
        },
      }),
      this.prisma.communityMember.findMany({
        where: { teacherId },
        select: { communityId: true },
      }),
      this.prisma.community.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          _count: { select: { communityMembers: true, posts: true } },
        },
      }),
    ]);

    if (!teacher) {
      return null;
    }

    const joinedIds = new Set(allMemberships.map((m) => m.communityId));
    const teacherLevelNum = LEVEL_ORDER[teacher.level] ?? 1;

    const suggestedCommunities = allCommunities
      .filter((c) => {
        if (joinedIds.has(c.id)) return false;
        const required = TYPE_MIN_LEVEL[c.type] ?? 99;
        return teacherLevelNum >= required;
      })
      .slice(0, 5);

    const joinedCommunityIds = [...joinedIds];
    const communityFeedPosts = joinedCommunityIds.length > 0
      ? await this.prisma.communityPost.findMany({
          where: { communityId: { in: joinedCommunityIds }, teacherId: { not: teacherId } },
          orderBy: { createdAt: 'desc' },
          take: 6,
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            community: { select: { id: true, name: true, type: true } },
            category: { select: { id: true, name: true } },
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
            _count: {
              select: { communityLikes: true, comments: true },
            },
          },
        })
      : [];

    const communityAccessLevels = (
      ['SCHOOL', 'WOREDA', 'ZONE', 'REGION', 'NATIONAL'] as const
    ).map((type) => {
      const required = TYPE_MIN_LEVEL[type];
      const unlocked = teacherLevelNum >= required;
      const joined = allCommunities
        .filter((c) => c.type === type && joinedIds.has(c.id))
        .length;
      const available = allCommunities.filter((c) => c.type === type).length;
      return { type, unlocked, required, joined, available };
    });

    return {
      teacher,
      stats: {
        posts: postsCount,
        bookmarks: bookmarksCount,
        communities: membershipsCount,
        likes: likesReceived,
      },
      recentPosts,
      communityFeed: communityFeedPosts,
      recentNotifications,
      suggestedCommunities,
      communityAccess: communityAccessLevels,
    };
  }
}
