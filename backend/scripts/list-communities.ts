import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCommunities() {
  console.log('=== All Communities ===\n');

  const communities = await prisma.community.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      _count: {
        select: {
          communityMembers: true,
          posts: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  communities.forEach((community) => {
    console.log(`ID: ${community.id}`);
    console.log(`Name: ${community.name}`);
    console.log(`Type: ${community.type}`);
    console.log(`Active: ${community.isActive}`);
    console.log(`Members (count): ${community._count.communityMembers}`);
    console.log(`Posts (count): ${community._count.posts}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

listCommunities().catch(console.error);
