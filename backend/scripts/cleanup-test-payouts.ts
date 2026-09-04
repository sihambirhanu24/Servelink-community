import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestPayouts() {
  console.log('=== PAYOUT CLEANUP INSPECTION ===\n');

  // 1. Find all PENDING and PROCESSING payouts
  const pendingPayouts = await prisma.payout.findMany({
    where: { status: 'PENDING' },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      teacherEarnings: {
        select: {
          id: true,
          netAmount: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const processingPayouts = await prisma.payout.findMany({
    where: { status: 'PROCESSING' },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      teacherEarnings: {
        select: {
          id: true,
          netAmount: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`PENDING payouts: ${pendingPayouts.length}`);
  console.log(`PROCESSING payouts: ${processingPayouts.length}\n`);

  // 2. Display PENDING payouts
  if (pendingPayouts.length > 0) {
    console.log('=== PENDING PAYOUTS ===');
    for (const payout of pendingPayouts) {
      console.log(`\nID: ${payout.id}`);
      console.log(`Teacher: ${payout.teacher.firstName} ${payout.teacher.lastName} (${payout.teacher.email})`);
      console.log(`Amount: ${payout.amount} ${payout.currency}`);
      console.log(`Reference: ${payout.reference}`);
      console.log(`Created: ${payout.createdAt.toISOString()}`);
      console.log(`Bank: ${payout.bankName} - ${payout.bankAccountNumber}`);
      console.log(`Reserved Earnings: ${payout.teacherEarnings.length}`);
      console.log(`Reserved Amount: ${payout.teacherEarnings.reduce((sum, e) => sum + Number(e.netAmount), 0)} ETB`);
      console.log(`Earnings Status: ${payout.teacherEarnings.map(e => e.status).join(', ')}`);
    }
  }

  // 3. Display PROCESSING payouts with Chapa info
  if (processingPayouts.length > 0) {
    console.log('\n=== PROCESSING PAYOUTS ===');
    for (const payout of processingPayouts) {
      console.log(`\nID: ${payout.id}`);
      console.log(`Teacher: ${payout.teacher.firstName} ${payout.teacher.lastName} (${payout.teacher.email})`);
      console.log(`Amount: ${payout.amount} ${payout.currency}`);
      console.log(`Reference: ${payout.reference}`);
      console.log(`Created: ${payout.createdAt.toISOString()}`);
      console.log(`Submitted: ${payout.submittedAt?.toISOString() || 'N/A'}`);
      console.log(`Last Verified: ${payout.lastVerifiedAt?.toISOString() || 'N/A'}`);
      console.log(`Chapa Transfer ID: ${payout.chapaTransferId || 'NONE'}`);
      console.log(`Chapa Reference: ${payout.chapaReference || 'NONE'}`);
      console.log(`Bank Reference: ${payout.bankReference || 'NONE'}`);
      console.log(`Reserved Earnings: ${payout.teacherEarnings.length}`);
      console.log(`Reserved Amount: ${payout.teacherEarnings.reduce((sum, e) => sum + Number(e.netAmount), 0)} ETB`);
      console.log(`Earnings Status: ${payout.teacherEarnings.map(e => e.status).join(', ')}`);
      
      // WARNING if Chapa reference exists
      if (payout.chapaReference || payout.chapaTransferId) {
        console.log(`⚠️  WARNING: This payout has Chapa references - may represent a real transfer!`);
      }
    }
  }

  // 4. Calculate total reserved amounts
  const totalPendingReserved = pendingPayouts.reduce((sum, p) => 
    sum + p.teacherEarnings.reduce((eSum, e) => eSum + Number(e.netAmount), 0), 0);
  const totalProcessingReserved = processingPayouts.reduce((sum, p) => 
    sum + p.teacherEarnings.reduce((eSum, e) => eSum + Number(e.netAmount), 0), 0);

  console.log('\n=== SUMMARY ===');
  console.log(`Total PENDING payouts: ${pendingPayouts.length}`);
  console.log(`Total PROCESSING payouts: ${processingPayouts.length}`);
  console.log(`Total reserved by PENDING: ${totalPendingReserved} ETB`);
  console.log(`Total reserved by PROCESSING: ${totalProcessingReserved} ETB`);
  console.log(`Total reserved: ${totalPendingReserved + totalProcessingReserved} ETB`);

  // 5. Check if any PROCESSING payouts have Chapa references
  const processingWithChapa = processingPayouts.filter(p => p.chapaReference || p.chapaTransferId);
  if (processingWithChapa.length > 0) {
    console.log(`\n⚠️  CRITICAL WARNING: ${processingWithChapa.length} PROCESSING payout(s) have Chapa references!`);
    console.log('These may represent real transfers to Chapa. Manual verification required before deletion.');
  }

  // 6. Ask for confirmation before deletion
  console.log('\n=== CLEANUP PROPOSAL ===');
  console.log(`Delete ${pendingPayouts.length} PENDING payout(s)`);
  console.log(`Delete ${processingPayouts.length} PROCESSING payout(s)`);
  console.log(`Restore ${totalPendingReserved + totalProcessingReserved} ETB to available earnings`);
  
  if (processingWithChapa.length > 0) {
    console.log('\n⚠️  CANNOT AUTOMATICALLY DELETE: PROCESSING payouts with Chapa references require manual verification.');
    console.log('Please verify with Chapa whether these transfers were actually processed before deletion.');
    process.exit(1);
  }

  console.log('\nProceed with cleanup? (yes/no)');
  
  // For automated execution, we'll proceed if no Chapa references exist
  // In manual mode, you would read from stdin here
  
  if (pendingPayouts.length === 0 && processingPayouts.length === 0) {
    console.log('No PENDING or PROCESSING payouts found. Cleanup not needed.');
    process.exit(0);
  }

  // 7. Perform cleanup in transaction
  console.log('\n=== PERFORMING CLEANUP ===');
  
  try {
    await prisma.$transaction(async (tx) => {
      // First, release reserved earnings for all affected payouts
      const allPayoutIds = [...pendingPayouts, ...processingPayouts].map(p => p.id);
      
      console.log(`Releasing earnings for ${allPayoutIds.length} payout(s)...`);
      
      await tx.teacherEarning.updateMany({
        where: {
          payoutId: { in: allPayoutIds },
          status: 'PENDING',
        },
        data: {
          status: 'AVAILABLE',
          payoutId: null,
        },
      });

      console.log('Earnings released.');

      // Delete the payout records
      console.log(`Deleting ${pendingPayouts.length} PENDING payout(s)...`);
      await tx.payout.deleteMany({
        where: { id: { in: pendingPayouts.map(p => p.id) } },
      });

      console.log(`Deleting ${processingPayouts.length} PROCESSING payout(s)...`);
      await tx.payout.deleteMany({
        where: { id: { in: processingPayouts.map(p => p.id) } },
      });

      console.log('Payout records deleted.');
    });

    console.log('\n=== CLEANUP COMPLETED SUCCESSFULLY ===');
    console.log(`Deleted ${pendingPayouts.length} PENDING payout(s)`);
    console.log(`Deleted ${processingPayouts.length} PROCESSING payout(s)`);
    console.log(`Restored ${totalPendingReserved + totalProcessingReserved} ETB to available earnings`);
    
  } catch (error) {
    console.error('\n=== CLEANUP FAILED ===');
    console.error(error);
    process.exit(1);
  }

  // 8. Verify cleanup
  console.log('\n=== VERIFICATION ===');
  const remainingPending = await prisma.payout.count({ where: { status: 'PENDING' } });
  const remainingProcessing = await prisma.payout.count({ where: { status: 'PROCESSING' } });
  
  console.log(`Remaining PENDING payouts: ${remainingPending}`);
  console.log(`Remaining PROCESSING payouts: ${remainingProcessing}`);
  
  if (remainingPending === 0 && remainingProcessing === 0) {
    console.log('✓ Verification passed: No PENDING or PROCESSING payouts remain.');
  } else {
    console.log('✗ Verification failed: Some payouts still exist.');
    process.exit(1);
  }

  await prisma.$disconnect();
}

cleanupTestPayouts()
  .catch((error) => {
    console.error(error);
    prisma.$disconnect();
    process.exit(1);
  });
