import { Test, TestingModule } from '@nestjs/testing';
import { CommunityService } from './community.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CommunityService', () => {
  let service: CommunityService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      communityPost: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      attachment: {
        deleteMany: jest.fn(),
      },
      communityComment: {
        deleteMany: jest.fn(),
      },
      communityLike: {
        deleteMany: jest.fn(),
      },
      communityBookmark: {
        deleteMany: jest.fn(),
      },
      communityReport: {
        deleteMany: jest.fn(),
      },
      postTag: {
        deleteMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deletes a post and its related records in a transaction', async () => {
    prisma.communityPost.findUnique.mockResolvedValue({
      id: 'post-1',
      teacherId: 'teacher-1',
    } as never);

    prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));

    await service.deletePost('post-1', 'teacher-1');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.attachment.deleteMany).toHaveBeenCalledWith({ where: { postId: 'post-1' } });
    expect(prisma.communityComment.deleteMany).toHaveBeenCalledWith({ where: { postId: 'post-1' } });
    expect(prisma.communityLike.deleteMany).toHaveBeenCalledWith({ where: { postId: 'post-1' } });
    expect(prisma.communityBookmark.deleteMany).toHaveBeenCalledWith({ where: { postId: 'post-1' } });
    expect(prisma.communityReport.deleteMany).toHaveBeenCalledWith({ where: { postId: 'post-1' } });
    expect(prisma.postTag.deleteMany).toHaveBeenCalledWith({ where: { postId: 'post-1' } });
    expect(prisma.communityPost.delete).toHaveBeenCalledWith({ where: { id: 'post-1' } });
  });
});
