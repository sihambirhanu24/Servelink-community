import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixOrphanedPosts() {
  console.log('=== Fixing Orphaned Posts by Auto-joining Authors ===\n');

  // Get all communities
  const communities = await prisma.community.findMany({
    select: {
      id: true,
      name: true,
      type: true,
    },
  });

  let totalMembershipsCreated = 0;
  const results: any[] = [];

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

    // Get all existing members for this community
    const existingMembers = await prisma.communityMember.findMany({
      where: { communityId: community.id },
      select: { teacherId: true },
    });

    const existingMemberIds = new Set(existingMembers.map(m => m.teacherId));

    // Find unique post authors who are not members
    const postAuthorIds = new Set(posts.map(p => p.teacherId));
    const orphanedAuthorIds = [...postAuthorIds].filter(id => !existingMemberIds.has(id));

    if (orphanedAuthorIds.length === 0) continue;

    console.log(`\n--- ${community.name} (${community.type}) ---`);
    console.log(`Community ID: ${community.id}`);
    console.log(`Orphaned Authors to Auto-join: ${orphanedAuthorIds.length}`);

    // Create APPROVED membership records for orphaned authors
    for (const teacherId of orphanedAuthorIds) {
      const author = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { firstName: true, lastName: true, email: true },
      });

      try {
        const membership = await prisma.communityMember.create({
          data: {
            teacherId,
            communityId: community.id,
            status: 'APPROVED',
          },
        });

        totalMembershipsCreated++;
        console.log(`  ✓ Created APPROVED membership for ${author?.firstName} ${author?.lastName} (${author?.email})`);

        results.push({
          communityId: community.id,
          communityName: community.name,
          teacherId,
          teacherName: `${author?.firstName} ${author?.lastName}`,
          teacherEmail: author?.email,
          membershipId: membership.id,
          status: 'APPROVED',
        });
      } catch (error: any) {
        console.log(`  ✗ Failed to create membership for ${author?.firstName} ${author?.lastName}: ${error.message}`);
      }
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Total Memberships Created: ${totalMembershipsCreated}`);

  console.log('\n=== VERIFICATION ===');
  // Verify the fix by checking the specific community mentioned in the issue
  const aastuCommunity = await prisma.community.findUnique({
    where: { id: 'cmt1vpqi70001und4mkf8cvnr' },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          communityMembers: true,
          posts: true,
        },
      },
    },
  });

  if (aastuCommunity) {
    console.log(`\nAASTU Communities after fix:`);
    console.log(`  Members: ${aastuCommunity._count.communityMembers}`);
    console.log(`  Posts: ${aastuCommunity._count.posts}`);
  }

  await prisma.$disconnect();
}

fixOrphanedPosts().catch(console.error);
