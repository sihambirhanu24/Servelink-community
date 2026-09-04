/**
 * Inspect the specific payout PAYOUT_C4C3B4FCA3CE
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectPayout() {
  const reference = 'PAYOUT_C4C3B4FCA3CE';
  
  console.log('='.repeat(60));
  console.log('PHASE 2 — TRACE THE CURRENT PAYOUT');
  console.log('='.repeat(60));
  console.log('\n1. Checking if payout exists in PostgreSQL...\n');

  const payout = await prisma.payout.findUnique({
    where: { reference },
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
          status: true,
          netAmount: true,
        },
      },
    },
  });

  if (!payout) {
    console.log('❌ Payout NOT FOUND in database');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Payout EXISTS in database\n');
  console.log('PAYOUT DETAILS:');
  console.log('─'.repeat(60));
  console.log('1. Database Status:', payout.status);
  console.log('2. ServeLink Reference:', payout.reference);
  console.log('3. Chapa Transfer ID:', payout.chapaTransferId || 'NULL');
  console.log('4. Chapa Reference:', payout.chapaReference || 'NULL');
  console.log('5. Bank Reference:', payout.bankReference || 'NULL');
  console.log('6. Gross Amount:', payout.amount.toString(), 'ETB');
  console.log('7. Fee Amount:', payout.feeAmount?.toString() || 'NULL', 'ETB');
  console.log('8. Net Amount (sent to Chapa):', payout.netAmount?.toString() || 'NULL', 'ETB');
  console.log('9. Bank Code:', payout.bankCode || 'NULL');
  console.log('10. Bank Name:', payout.bankName || 'NULL');
  console.log('11. Account Number:', payout.bankAccountNumber ? `****${payout.bankAccountNumber.slice(-4)}` : 'NULL');
  console.log('12. Account Name:', payout.bankAccountName || 'NULL');
  console.log('13. Currency:', payout.currency);
  console.log('14. Chapa Status:', payout.chapaStatus || 'NULL');
  console.log('15. Rejection Reason:', payout.rejectionReason || 'NONE');
  console.log('16. Submitted At:', payout.submittedAt?.toISOString() || 'NULL');
  console.log('17. Last Verified At:', payout.lastVerifiedAt?.toISOString() || 'NULL');
  console.log('18. Completed At:', payout.completedAt?.toISOString() || 'NULL');
  console.log('19. Failed At:', payout.failedAt?.toISOString() || 'NULL');
  console.log('20. Created At:', payout.createdAt.toISOString());
  console.log('21. Updated At:', payout.updatedAt.toISOString());
  console.log('22. Metadata:', JSON.stringify(payout.metadata, null, 2));
  console.log('\nTEACHER:');
  console.log('─'.repeat(60));
  console.log('Teacher ID:', payout.teacher.id);
  console.log('Teacher Name:', `${payout.teacher.firstName} ${payout.teacher.lastName}`);
  console.log('Teacher Email:', payout.teacher.email);
  console.log('\nRESERVED EARNINGS:');
  console.log('─'.repeat(60));
  console.log('Total Reserved Earnings:', payout.teacherEarnings.length);
  
  let totalReserved = 0;
  payout.teacherEarnings.forEach((earning, i) => {
    const amount = Number(earning.netAmount);
    totalReserved += amount;
    console.log(`  ${i + 1}. ${earning.id} - ${earning.status} - ${amount.toFixed(2)} ETB`);
  });
  
  console.log(`Total Reserved Amount: ${totalReserved.toFixed(2)} ETB`);

  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS:');
  console.log('='.repeat(60));
  
  const wasSubmittedToChapa = !!payout.submittedAt;
  const hasChapaReference = !!(payout.chapaReference || payout.chapaTransferId);
  
  console.log('Was submitted to Chapa API:', wasSubmittedToChapa ? 'YES' : 'NO');
  console.log('Has Chapa Reference:', hasChapaReference ? 'YES' : 'NO');
  
  if (!hasChapaReference && payout.status === 'FAILED') {
    console.log('\n⚠️  ROOT CAUSE: Transfer was never submitted to Chapa successfully');
    console.log('   OR Chapa response did not contain a valid transfer reference');
    console.log('   This payout has been correctly marked as FAILED');
    console.log('   Earnings should have been refunded to AVAILABLE status');
  } else if (hasChapaReference && payout.status === 'PROCESSING') {
    console.log('\n✅ Chapa reference exists - transfer was submitted');
    console.log('   Current Status: PROCESSING (waiting for Chapa confirmation)');
    console.log('   Can call Chapa verify API to check status');
  } else if (payout.status === 'COMPLETED') {
    console.log('\n✅ Payout COMPLETED successfully');
  }

  console.log('\n' + '='.repeat(60));

  await prisma.$disconnect();
}

inspectPayout().catch(console.error);
