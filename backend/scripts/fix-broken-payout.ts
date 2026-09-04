/**
 * Fix the broken payout PAYOUT_C4C3B4FCA3CE
 * This will mark it as FAILED and refund the earnings
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBrokenPayout() {
  const reference = 'PAYOUT_C4C3B4FCA3CE';
  
  console.log('Fixing broken payout:', reference);

  const payout = await prisma.payout.findUnique({
    where: { reference },
  });

  if (!payout) {
    console.error('Payout not found');
    process.exit(1);
  }

  console.log('Current status:', payout.status);

  if (payout.status === 'COMPLETED' || payout.status === 'FAILED') {
    console.log('Payout already finalized. No action needed.');
    process.exit(0);
  }

  // Mark as FAILED and refund earnings
  await prisma.$transaction(async (tx) => {
    await tx.payout.update({
      where: { reference },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        rejectionReason: 'Chapa transfer was not submitted successfully. No transfer reference found. (Auto-fixed by script)',
        lastVerifiedAt: new Date(),
      },
    });

    // Refund earnings
    await tx.teacherEarning.updateMany({
      where: { payoutId: payout.id, status: 'PENDING' },
      data: { status: 'AVAILABLE', payoutId: null },
    });

    // Create audit log
    await tx.financialAuditLog.create({
      data: {
        action: 'PAYOUT_FAILED_SCRIPT',
        actorId: payout.teacherId,
        actorIsAdmin: false,
        metadata: {
          entityType: 'PAYOUT',
          entityId: payout.id,
          previousStatus: payout.status,
          newStatus: 'FAILED',
          reason: 'Fixed by script - no Chapa reference found',
        },
      },
    });
  });

  console.log('✅ Payout marked as FAILED');
  console.log('✅ Earnings refunded to AVAILABLE');
  console.log('✅ You can now request a new payout');

  await prisma.$disconnect();
}

fixBrokenPayout().catch(console.error);
