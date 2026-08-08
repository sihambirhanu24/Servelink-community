import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async searchTeachers(keyword: string) {
    return this.prisma.teacher.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            lastName: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            subject: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }

  async searchPosts(keyword: string) {
    return this.prisma.communityPost.findMany({
      where: {
        OR: [
          {
            title: {
              contains: keyword,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: keyword,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        teacher: true,
        community: true,
      },
    });
  }

  async searchCommunities(keyword: string) {
    return this.prisma.community.findMany({
      where: {
        name: {
          contains: keyword,
          mode: "insensitive",
        },
      },
    });
  }
}