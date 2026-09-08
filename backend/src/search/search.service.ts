import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publiclyVisiblePostWhere } from '../common/post-visibility';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchTeachers(keyword: string) {
    return this.prisma.teacher.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            subject: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
  }

  /**
   * Get verified teachers eligible for messaging.
   * Excludes current user, unverified, pending, rejected, and suspended teachers.
   */
  async getVerifiedTeachers(currentTeacherId: string, keyword?: string, limit = 20) {
    const where: any = {
      AND: [
        { verificationStatus: 'APPROVED' },
        { status: 'ACTIVE' },
        { verified: true },
        { id: { not: currentTeacherId } }, // Exclude current user
      ],
    };

    // Add search filter if keyword provided
    if (keyword && keyword.trim()) {
      where.AND.push({
        OR: [
          { firstName: { contains: keyword, mode: 'insensitive' } },
          { lastName: { contains: keyword, mode: 'insensitive' } },
          { department: { contains: keyword, mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.teacher.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        level: true,
        department: true,
        verified: true,
      },
      orderBy: [
        { level: 'desc' }, // Higher levels first
        { firstName: 'asc' },
      ],
      take: limit,
    });
  }

  async searchPosts(keyword: string) {
    return this.prisma.communityPost.findMany({
      where: {
        ...publiclyVisiblePostWhere,
        OR: [
          {
            title: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: keyword,
              mode: 'insensitive',
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
          mode: 'insensitive',
        },
      },
    });
  }
}
