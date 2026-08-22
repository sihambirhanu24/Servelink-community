import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TeacherService {

  constructor(private prisma: PrismaService) {}

  async getProfile(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    return teacher;
  }

  async getPublicProfile(id: string, currentUserId?: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        bannerUrl: true,
        bio: true,
        profession: true,
        department: true,
        school: true,
        woreda: true,
        zone: true,
        region: true,
        level: true,
        verificationStatus: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    const isFollowedByCurrentUser = currentUserId
      ? await this.prisma.teacherFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: id,
            },
          },
        })
      : null;

    return {
      ...teacher,
      followerCount: teacher._count.followers,
      followingCount: teacher._count.following,
      postsCount: teacher._count.posts,
      isFollowedByCurrentUser: !!isFollowedByCurrentUser,
      isVerified: teacher.verificationStatus === "APPROVED",
    };
  }

  async getTeacherPosts(id: string, page: number = 1, limit: number = 10) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where: { teacherId: id },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              level: true,
              verificationStatus: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: true,
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              communityLikes: true,
              comments: true,
              communityBookmarks: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({
        where: { teacherId: id },
      }),
    ]);

    return {
      posts: posts.map((post) => ({
        ...post,
        tags: post.tags.map((pt) => pt.tag),
        likesCount: post._count.communityLikes,
        commentsCount: post._count.comments,
        bookmarksCount: post._count.communityBookmarks,
        teacher: {
          ...post.teacher,
          verified: post.teacher.verificationStatus === "APPROVED",
        },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async followTeacher(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException("You cannot follow yourself");
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: followingId },
    });

    if (!teacher) {
      throw new NotFoundException("Teacher not found");
    }

    const existingFollow = await this.prisma.teacherFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException("You already follow this teacher");
    }

    await this.prisma.teacherFollow.create({
      data: {
        followerId,
        followingId,
      },
    });

    const followerCount = await this.prisma.teacherFollow.count({
      where: { followingId },
    });

    return {
      followerCount,
      isFollowedByCurrentUser: true,
    };
  }

  async unfollowTeacher(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException("You cannot unfollow yourself");
    }

    const existingFollow = await this.prisma.teacherFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new BadRequestException("You are not following this teacher");
    }

    await this.prisma.teacherFollow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    const followerCount = await this.prisma.teacherFollow.count({
      where: { followingId },
    });

    return {
      followerCount,
      isFollowedByCurrentUser: false,
    };
  }

 async getStatistics(id: string) {
  const teacher = await this.prisma.teacher.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          posts: true,
          comments: true,
          communityLikes: true,
          communityBookmarks: true,
          communityMembers: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new NotFoundException("Teacher not found");
  }

  return {
    posts: teacher._count.posts,
    comments: teacher._count.comments,
    likes: teacher._count.communityLikes,
    bookmarks: teacher._count.communityBookmarks,
    memberships: teacher._count.communityMembers,
  };
}}