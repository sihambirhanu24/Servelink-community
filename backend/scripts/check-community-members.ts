import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCommunityMembers() {
  // Get the community ID from the route or use a specific one
  const communityId = process.argv[2];
  
  if (!communityId) {
    console.error('Please provide a community ID');
    process.exit(1);
  }

  console.log(`\n=== Checking Community: ${communityId} ===\n`);

  // Check if community exists
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
    },
  });

  if (!community) {
    console.log('Community not found');
    process.exit(1);
  }

  console.log('Community:', community);

  // Count all membership records
  const totalMembers = await prisma.communityMember.count({
    where: { communityId },
  });
  console.log(`\nTotal membership records: ${totalMembers}`);

  // Count by status
  const pendingMembers = await prisma.communityMember.count({
    where: { communityId, status: 'PENDING' },
  });
  const approvedMembers = await prisma.communityMember.count({
    where: { communityId, status: 'APPROVED' },
  });
  const rejectedMembers = await prisma.communityMember.count({
    where: { communityId, status: 'REJECTED' },
  });

  console.log(`  - PENDING: ${pendingMembers}`);
  console.log(`  - APPROVED: ${approvedMembers}`);
  console.log(`  - REJECTED: ${rejectedMembers}`);

  // Get all membership records with teacher details
  const members = await prisma.communityMember.findMany({
    where: { communityId },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n--- Membership Records ---');
  members.forEach((member, index) => {
    console.log(`${index + 1}. ${member.teacher.firstName} ${member.teacher.lastName} (${member.teacher.email}) - Status: ${member.status}`);
  });

  // Count posts
  const totalPosts = await prisma.communityPost.count({
    where: { communityId },
  });
  console.log(`\nTotal posts: ${totalPosts}`);

  // Get all posts with author details
  const posts = await prisma.communityPost.findMany({
    where: { communityId },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n--- Posts ---');
  posts.forEach((post, index) => {
    console.log(`${index + 1}. "${post.title}" by ${post.teacher.firstName} ${post.teacher.lastName} (${post.teacher.email})`);
  });

  // Check which post authors are members
  console.log('\n--- Post Authors Membership Status ---');
  const postAuthorIds = [...new Set(posts.map(p => p.teacherId))];
  
  for (const authorId of postAuthorIds) {
    const author = await prisma.teacher.findUnique({
      where: { id: authorId },
      select: { firstName: true, lastName: true, email: true },
    });
    
    const membership = await prisma.communityMember.findFirst({
      where: { teacherId: authorId, communityId },
    });
    
    if (author) {
      console.log(`${author.firstName} ${author.lastName}: ${membership ? `Member (status: ${membership.status})` : 'NOT A MEMBER'}`);
    } else {
      console.log(`Author ID ${authorId}: NOT FOUND (deleted teacher?)`);
    }
  }

  await prisma.$disconnect();
}

checkCommunityMembers().catch(console.error);
