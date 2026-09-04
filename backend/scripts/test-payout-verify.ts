/**
 * Test script to verify a specific payout with Chapa
 * Usage: npx ts-node scripts/test-payout-verify.ts PAYOUT_C4C3B4FCA3CE
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function verifyPayout(reference: string) {
  console.log('='.repeat(60));
  console.log('PAYOUT VERIFICATION TEST');
  console.log('='.repeat(60));
  console.log('Reference:', reference);
  console.log('');

  // 1. Check if payout exists in database
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
    },
  });

  if (!payout) {
    console.error('❌ Payout not found in database');
    process.exit(1);
  }

  console.log('✅ Payout found in database');
  console.log('');
  console.log('Database Status:');
  console.log('  ID:', payout.id);
  console.log('  Teacher:', `${payout.teacher.firstName} ${payout.teacher.lastName}`);
  console.log('  Status:', payout.status);
  console.log('  Amount:', payout.amount.toString(), 'ETB');
  console.log('  Net Amount:', payout.netAmount?.toString(), 'ETB');
  console.log('  Bank Code:', payout.bankCode);
  console.log('  Bank Account:', '****' + payout.bankAccountNumber?.slice(-4));
  console.log('  Chapa Transfer ID:', payout.chapaTransferId || 'N/A');
  console.log('  Chapa Reference:', payout.chapaReference || 'N/A');
  console.log('  Chapa Status:', payout.chapaStatus || 'N/A');
  console.log('  Bank Reference:', payout.bankReference || 'N/A');
  console.log('  Created At:', payout.createdAt);
  console.log('  Submitted At:', payout.submittedAt || 'N/A');
  console.log('  Last Verified:', payout.lastVerifiedAt || 'Never');
  console.log('  Completed At:', payout.completedAt || 'N/A');
  console.log('');

  // 2. Try to verify with Chapa
  const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
  
  if (!chapaSecretKey) {
    console.error('❌ CHAPA_SECRET_KEY not found in environment');
    process.exit(1);
  }

  console.log('Calling Chapa Verification API...');
  console.log('Endpoint:', `https://api.chapa.co/v1/transfers/verify/${reference}`);
  console.log('');

  try {
    const response = await axios.get(
      `https://api.chapa.co/v1/transfers/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`,
        },
      }
    );

    console.log('✅ Chapa API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');

    const chapaStatus = response.data?.data?.status;
    console.log('Chapa Transfer Status:', chapaStatus);
    console.log('');

    // 3. Suggest action
    if (chapaStatus === 'success' && payout.status !== 'COMPLETED') {
      console.log('⚠️  MISMATCH DETECTED');
      console.log('   Database Status: ', payout.status);
      console.log('   Chapa Status:    success');
      console.log('');
      console.log('💡 Recommended Action:');
      console.log('   Update payout to COMPLETED and mark earnings as PAID_OUT');
      console.log('');
      console.log('   Run this SQL:');
      console.log(`   UPDATE "Payout" SET status = 'COMPLETED', "completedAt" = NOW() WHERE reference = '${reference}';`);
      console.log(`   UPDATE "TeacherEarning" SET status = 'PAID_OUT' WHERE "payoutId" = '${payout.id}' AND status = 'PENDING';`);
    } else if (chapaStatus === 'failed' && payout.status !== 'FAILED') {
      console.log('⚠️  MISMATCH DETECTED');
      console.log('   Database Status: ', payout.status);
      console.log('   Chapa Status:    failed');
      console.log('');
      console.log('💡 Recommended Action:');
      console.log('   Update payout to FAILED and refund earnings');
      console.log('');
      console.log('   Run this SQL:');
      console.log(`   UPDATE "Payout" SET status = 'FAILED', "failedAt" = NOW() WHERE reference = '${reference}';`);
      console.log(`   UPDATE "TeacherEarning" SET status = 'AVAILABLE', "payoutId" = NULL WHERE "payoutId" = '${payout.id}' AND status = 'PENDING';`);
    } else {
      console.log('✅ Status is consistent');
    }

  } catch (error: any) {
    console.error('❌ Chapa API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    console.log('');
    console.log('💡 Possible Reasons:');
    console.log('   1. Payout was never submitted to Chapa');
    console.log('   2. Chapa reference is incorrect');
    console.log('   3. Transfer was rejected by Chapa');
    console.log('   4. Network/API connectivity issue');
  }

  console.log('');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

const reference = process.argv[2];
if (!reference) {
  console.error('Usage: npx ts-node scripts/test-payout-verify.ts <REFERENCE>');
  process.exit(1);
}

verifyPayout(reference).catch(console.error);
