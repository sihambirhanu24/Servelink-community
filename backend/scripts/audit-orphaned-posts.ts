import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditOrphanedPosts() {
  console.log('=== Auditing Orphaned Posts (posts by non-members) ===\n');

  // Get all communities
  const communities = await prisma.community.findMany({
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  let totalOrphanedPosts = 0;
  let totalOrphanedAuthors = 0;
  const orphanedPostsByCommunity: any[] = [];

  for (const community of communities) {
    // Get all posts for this community
    const posts = await prisma.communityPost.findMany({
      where: { communityId: community.id },
      select: {
        id: true,
        title: true,
        teacherId: true,
        createdAt: true,
      },
    });

    if (posts.length === 0) continue;

    // Get all approved members for this community
    const approvedMembers = await prisma.communityMember.findMany({
      where: {
        communityId: community.id,
        status: 'APPROVED',
      },
      select: { teacherId: true },
    });

    const approvedMemberIds = new Set(approvedMembers.map(m => m.teacherId));

    // Find posts by non-members
    const orphanedPosts = posts.filter(post => !approvedMemberIds.has(post.teacherId));

    if (orphanedPosts.length > 0) {
      const orphanedAuthorIds = new Set(orphanedPosts.map(p => p.teacherId));
      totalOrphanedPosts += orphanedPosts.length;
      totalOrphanedAuthors += orphanedAuthorIds.size;

      orphanedPostsByCommunity.push({
        communityId: community.id,
        communityName: community.name,
        communityType: community.type,
        orphanedPostCount: orphanedPosts.length,
        orphanedAuthorCount: orphanedAuthorIds.size,
        totalPostCount: posts.length,
        totalMemberCount: approvedMembers.length,
      });

      console.log(`\n--- ${community.name} (${community.type}) ---`);
      console.log(`Community ID: ${community.id}`);
      console.log(`Total Posts: ${posts.length}`);
      console.log(`Approved Members: ${approvedMembers.length}`);
      console.log(`Orphaned Posts: ${orphanedPosts.length}`);
      console.log(`Orphaned Authors: ${orphanedAuthorIds.size}`);

      // Get author details for orphaned posts
      for (const authorId of orphanedAuthorIds) {
        const author = await prisma.teacher.findUnique({
          where: { id: authorId },
          select: { firstName: true, lastName: true, email: true },
        });

        const authorPosts = orphanedPosts.filter(p => p.teacherId === authorId);
        console.log(`  - ${author?.firstName} ${author?.lastName} (${author?.email}): ${authorPosts.length} posts`);
      }
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total Communities with Orphaned Posts: ${orphanedPostsByCommunity.length}`);
  console.log(`Total Orphaned Posts: ${totalOrphanedPosts}`);
  console.log(`Total Orphaned Authors: ${totalOrphanedAuthors}`);

  console.log('\n=== RECOMMENDATIONS ===');
  console.log('1. Option A: Auto-join post authors to communities (create APPROVED membership records)');
  console.log('2. Option B: Delete orphaned posts (data loss)');
  console.log('3. Option C: Mark orphaned posts for moderation review');
  console.log('4. Option D: Leave as-is (new posts will require membership)');

  await prisma.$disconnect();
}

auditOrphanedPosts().catch(console.error);
