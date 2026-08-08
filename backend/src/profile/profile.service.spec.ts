import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: {
    communityPost: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      communityPost: {
        findMany: jest.fn(),
      },
    } as unknown as {
      communityPost: {
        findMany: jest.Mock;
      };
    };

    service = new ProfileService(prisma as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('includes attachments when fetching teacher posts', async () => {
    prisma.communityPost.findMany.mockResolvedValue([]);

    await service.myPosts('teacher-1');

    expect(prisma.communityPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { teacherId: 'teacher-1' },
        include: expect.objectContaining({
          attachments: true,
        }),
      }),
    );
  });
});
