import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminPostsService } from './admin-posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { AdminPostsQueryDto } from './dto/admin-posts.dto';

type MockFn = jest.Mock;

describe('AdminPostsService', () => {
  let service: AdminPostsService;
  let prisma: {
    communityPost: Record<string, MockFn>;
    communityReport: Record<string, MockFn>;
    moderationHistory: Record<string, MockFn>;
    $transaction: MockFn;
  };
  let notifications: { create: MockFn };

  const query = (
    overrides: Partial<AdminPostsQueryDto> = {},
  ): AdminPostsQueryDto =>
    Object.assign(
      new AdminPostsQueryDto(),
      { page: 1, pageSize: 20, sortBy: 'newest' },
      overrides,
    );

  beforeEach(async () => {
    prisma = {
      communityPost: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      communityReport: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      moderationHistory: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    // Run interactive transactions against the same mocks.
    prisma.$transaction.mockImplementation(async (arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: unknown) => unknown)(prisma)
        : Promise.all(arg as Promise<unknown>[]),
    );
    notifications = { create: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AdminPostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notifications },
      ],
    }).compile();

    service = module.get(AdminPostsService);
  });

  describe('getStats', () => {
    it('aggregates global counts from grouped database queries, not from a page', async () => {
      prisma.communityPost.count
        .mockResolvedValueOnce(120) // total
        .mockResolvedValueOnce(4) // today
        .mockResolvedValueOnce(7); // posts with pending reports
      prisma.communityPost.groupBy
        .mockResolvedValueOnce([
          { moderationStatus: 'ACTIVE', _count: { _all: 100 } },
          { moderationStatus: 'REPORTED', _count: { _all: 8 } },
          { moderationStatus: 'UNDER_REVIEW', _count: { _all: 2 } },
          { moderationStatus: 'HIDDEN', _count: { _all: 6 } },
          { moderationStatus: 'REMOVED', _count: { _all: 4 } },
        ])
        .mockResolvedValueOnce([
          { postType: 'QUESTION', _count: { _all: 50 } },
          { postType: 'RESOURCE', _count: { _all: 20 } },
        ]);
      prisma.communityReport.count.mockResolvedValue(9);

      const stats = await service.getStats();

      expect(stats).toMatchObject({
        total: 120,
        published: 100,
        pendingReview: 10,
        reported: 8,
        hidden: 6,
        removed: 4,
        todayPosts: 4,
        pendingReports: 9,
        postsWithPendingReports: 7,
      });
      expect(stats.byType).toEqual({
        QUESTION: 50,
        DISCUSSION: 0,
        RESOURCE: 20,
        ANNOUNCEMENT: 0,
      });
    });
  });

  describe('list', () => {
    beforeEach(() => {
      prisma.communityPost.findMany.mockResolvedValue([]);
      prisma.communityPost.count.mockResolvedValue(0);
    });

    it('paginates server-side and returns the standard admin envelope', async () => {
      prisma.communityPost.count.mockResolvedValue(45);
      const result = await service.list(query({ page: 3, pageSize: 20 }));

      expect(prisma.communityPost.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
      expect(result.meta).toEqual({
        total: 45,
        page: 3,
        pageSize: 20,
        totalPages: 3,
      });
    });

    it('searches title, content, author name/email and community name in the database', async () => {
      await service.list(query({ search: 'algebra' }));
      const where = prisma.communityPost.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual(
        expect.arrayContaining([
          { title: { contains: 'algebra', mode: 'insensitive' } },
          { description: { contains: 'algebra', mode: 'insensitive' } },
          { teacher: { email: { contains: 'algebra', mode: 'insensitive' } } },
          { community: { name: { contains: 'algebra', mode: 'insensitive' } } },
        ]),
      );
    });

    it('maps the unresolved-report filter and an inclusive date range', async () => {
      await service.list(
        query({
          reportStatus: 'UNRESOLVED',
          dateFrom: '2026-09-01',
          dateTo: '2026-09-02',
        }),
      );
      const where = prisma.communityPost.findMany.mock.calls[0][0].where;
      expect(where.communityReports).toEqual({ some: { status: 'PENDING' } });
      expect(where.createdAt.gte).toEqual(new Date('2026-09-01'));
      expect(where.createdAt.lt).toEqual(new Date('2026-09-03'));
    });

    it('sorts by report count at the database level', async () => {
      await service.list(query({ sortBy: 'most_reported' }));
      expect(prisma.communityPost.findMany.mock.calls[0][0].orderBy[0]).toEqual(
        {
          communityReports: { _count: 'desc' },
        },
      );
    });

    it('returns a plain-text preview and pending report count per row', async () => {
      prisma.communityPost.findMany.mockResolvedValue([
        {
          id: 'p1',
          description: '<p>Hello&nbsp;<b>world</b></p>',
          communityReports: [{ id: 'r1' }, { id: 'r2' }],
          _count: {
            communityLikes: 1,
            comments: 2,
            communityBookmarks: 3,
            communityReports: 2,
            attachments: 0,
          },
        },
      ]);
      const result = await service.list(query());
      expect(result.data[0]).toMatchObject({
        id: 'p1',
        preview: 'Hello world',
        pendingReports: 2,
      });
      expect(result.data[0]).not.toHaveProperty('description');
    });
  });

  describe('moderate', () => {
    const post = (moderationStatus: string, pending = 0) => ({
      id: 'p1',
      title: 'Post',
      teacherId: 't1',
      moderationStatus,
      _count: { communityReports: pending },
    });

    it('404s for a nonexistent post', async () => {
      prisma.communityPost.findUnique.mockResolvedValue(null);
      await expect(
        service.moderate('missing', 'a1', 'HIDDEN'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('400s for an impossible transition (hiding an already hidden post)', async () => {
      prisma.communityPost.findUnique.mockResolvedValue(post('HIDDEN'));
      await expect(
        service.moderate('p1', 'a1', 'HIDDEN'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.communityPost.update).not.toHaveBeenCalled();
    });

    it('hides a reported post, records history, resolves pending reports and notifies the author', async () => {
      prisma.communityPost.findUnique.mockResolvedValue(post('REPORTED', 2));
      prisma.communityPost.update.mockResolvedValue({
        id: 'p1',
        moderationStatus: 'HIDDEN',
      });

      const result = await service.moderate('p1', 'admin-1', 'HIDDEN', 'spam');

      expect(result.moderationStatus).toBe('HIDDEN');
      expect(prisma.communityPost.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            moderationStatus: 'HIDDEN',
            moderatedById: 'admin-1',
            moderationReason: 'spam',
          }),
        }),
      );
      expect(prisma.moderationHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          postId: 'p1',
          teacherId: 't1',
          adminId: 'admin-1',
          action: 'POST_HIDDEN',
        }),
      });
      expect(prisma.communityReport.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: 'p1', status: 'PENDING' } }),
      );
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ receiverId: 't1', title: 'Post Hidden' }),
      );
    });

    it('restores a hidden post to ACTIVE, or back to REPORTED when reports are still open', async () => {
      prisma.communityPost.findUnique.mockResolvedValue(post('HIDDEN', 0));
      prisma.communityPost.update.mockResolvedValue({});
      await service.moderate('p1', 'a1', 'RESTORE');
      expect(
        prisma.communityPost.update.mock.calls[0][0].data.moderationStatus,
      ).toBe('ACTIVE');
      expect(prisma.communityReport.updateMany).not.toHaveBeenCalled();

      prisma.communityPost.findUnique.mockResolvedValue(post('REMOVED', 1));
      await service.moderate('p1', 'a1', 'RESTORE');
      expect(
        prisma.communityPost.update.mock.calls[1][0].data.moderationStatus,
      ).toBe('REPORTED');
    });
  });

  describe('bulkModerate', () => {
    it('404s when any requested post does not exist, without touching the others', async () => {
      prisma.communityPost.findMany.mockResolvedValue([
        {
          id: 'p1',
          moderationStatus: 'ACTIVE',
          teacherId: 't1',
          title: 'A',
          _count: { communityReports: 0 },
        },
      ]);
      await expect(
        service.bulkModerate(['p1', 'p2'], 'a1', 'HIDDEN'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('applies the action in one transaction, skipping posts already in the target state', async () => {
      prisma.communityPost.findMany.mockResolvedValue([
        {
          id: 'p1',
          moderationStatus: 'ACTIVE',
          teacherId: 't1',
          title: 'A',
          _count: { communityReports: 1 },
        },
        {
          id: 'p2',
          moderationStatus: 'HIDDEN',
          teacherId: 't2',
          title: 'B',
          _count: { communityReports: 0 },
        },
      ]);
      prisma.communityPost.update.mockResolvedValue({});

      const result = await service.bulkModerate(
        ['p1', 'p2', 'p1'],
        'a1',
        'HIDDEN',
        'bulk',
      );

      expect(result.updated).toEqual(['p1']);
      expect(result.skipped).toEqual([
        { id: 'p2', moderationStatus: 'HIDDEN' },
      ]);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.moderationHistory.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            postId: 'p1',
            action: 'POST_HIDDEN',
            reason: 'bulk',
          }),
        ],
      });
      expect(prisma.communityReport.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { postId: { in: ['p1'] }, status: 'PENDING' },
        }),
      );
      expect(notifications.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolveReport', () => {
    const report = (overrides: Record<string, unknown> = {}) => ({
      id: 'r1',
      postId: 'p1',
      teacherId: 'reporter',
      status: 'PENDING',
      post: {
        id: 'p1',
        title: 'Post',
        teacherId: 'author',
        moderationStatus: 'REPORTED',
      },
      ...overrides,
    });

    it('404s when the report belongs to a different post', async () => {
      prisma.communityReport.findUnique.mockResolvedValue(
        report({ postId: 'other' }),
      );
      await expect(
        service.resolveReport('p1', 'r1', 'a1', 'RESOLVE'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('400s when the report was already reviewed', async () => {
      prisma.communityReport.findUnique.mockResolvedValue(
        report({ status: 'DISMISSED' }),
      );
      await expect(
        service.resolveReport('p1', 'r1', 'a1', 'RESOLVE'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('dismisses the last pending report and clears the post from the review queue', async () => {
      prisma.communityReport.findUnique.mockResolvedValue(report());
      prisma.communityReport.update.mockResolvedValue({
        id: 'r1',
        status: 'DISMISSED',
      });
      prisma.communityReport.count.mockResolvedValue(0);

      const result = await service.resolveReport('p1', 'r1', 'a1', 'DISMISS');

      expect(result).toMatchObject({
        status: 'DISMISSED',
        remainingPendingReports: 0,
      });
      expect(prisma.moderationHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'REPORT_DISMISSED',
          teacherId: 'reporter',
        }),
      });
      expect(prisma.communityPost.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { moderationStatus: 'ACTIVE' },
      });
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ receiverId: 'reporter' }),
      );
    });

    it('keeps the post in the queue while other reports remain pending', async () => {
      prisma.communityReport.findUnique.mockResolvedValue(report());
      prisma.communityReport.update.mockResolvedValue({
        id: 'r1',
        status: 'RESOLVED',
      });
      prisma.communityReport.count.mockResolvedValue(2);

      await service.resolveReport('p1', 'r1', 'a1', 'RESOLVE');
      expect(prisma.communityPost.update).not.toHaveBeenCalled();
    });
  });
});
