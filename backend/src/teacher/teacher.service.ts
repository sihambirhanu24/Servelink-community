import {
  Injectable,
  NotFoundException,
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