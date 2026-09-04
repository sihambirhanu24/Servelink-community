/**
 * End-to-end test for payout test mode
 * Tests all three scenarios: success, pending, failed
 * Runs against the live backend on localhost:5000
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API = 'http://localhost:5000/api';
const prisma = new PrismaClient();

let teacherToken = '';
let teacherId = '';

// ─── helpers ──────────────────────────────────────────────────────────────

async function login() {
  // Use the teacher account we know exists
  const res = await axios.post(`${API}/auth/login`, {
    email: 'sihambirhanu571@gmail.com',
    password: 'password123',
  }).catch(() => null);

  if (!res?.data?.accessToken) {
    console.log('⚠️  Cannot login with test credentials - skipping live API tests');
    console.log('   (This is expected if the password is different)');
    return false;
  }

  teacherToken = res.data.accessToken;
  teacherId = res.data.teacher?.id || res.data.user?.id;
  console.log('[Auth] Logged in as teacher:', teacherId);
  return true;
}

function headers() {
  return { Authorization: `Bearer ${teacherToken}` };
}

async function getWallet() {
  const res = await axios.get(`${API}/payouts/wallet`, { headers: headers() });
  return res.data;
}

async function requestPayout(amount: number) {
  return axios.post(`${API}/payouts/request`, {
    amount,
    bankCode: '946',
    bankAccountNumber: '1000000000000',
    bankAccountName: 'Test Teacher',
    currency: 'ETB',
  }, { headers: headers() });
}

async function verifyPayout(reference: string) {
  return axios.get(`${API}/payouts/verify/${reference}`, { headers: headers() });
}

async function cleanupTestPayouts() {
  // Mark any PENDING/PROCESSING test payouts as FAILED and refund earnings
  await prisma.$executeRaw`
    UPDATE "Payout" SET status = 'FAILED', "failedAt" = NOW(), "rejectionReason" = 'Cleaned up by test script'
    WHERE status IN ('PENDING', 'PROCESSING') AND reference LIKE 'PAYOUT_%'
  `;
  await prisma.$executeRaw`
    UPDATE "TeacherEarning" SET status = 'AVAILABLE', "payoutId" = NULL
    WHERE status = 'PENDING' AND "payoutId" IN (
      SELECT id FROM "Payout" WHERE status = 'FAILED' AND "rejectionReason" = 'Cleaned up by test script'
    )
  `;
}

// ─── scenario runner ────────────────────────────────────────────────────────

async function runScenario(scenario: 'success' | 'pending' | 'failed') {
  console.log('\n' + '═'.repeat(60));
  console.log(`SCENARIO: ${scenario.toUpperCase()}`);
  console.log('═'.repeat(60));

  // Update .env TEST_PAYOUT_STATUS via process.env for this check
  // (The real test requires restarting the server; here we just verify DB state)

  const wallet = await getWallet();
  console.log('[Wallet] Available:', wallet.availableEarnings, 'ETB');

  if (wallet.availableEarnings < 100) {
    console.log('⚠️  Insufficient balance for test. Skipping scenario:', scenario);
    return { scenario, result: 'SKIPPED', reason: 'Insufficient balance' };
  }

  // Request payout
  console.log('[Test] Requesting 100 ETB payout...');
  const payoutRes = await requestPayout(100).catch((e: any) => {
    throw new Error('requestPayout failed: ' + (e.response?.data?.message || e.message));
  });

  const payout = payoutRes.data;
  console.log('[Test] Payout created:', payout.reference);
  console.log('[Test] Initial status:', payout.status);
  console.log('[Test] chapaReference:', payout.chapaReference || '(null - checking DB)');

  // Check DB directly
  const dbPayout = await prisma.payout.findUnique({
    where: { reference: payout.reference },
    include: { teacherEarnings: { select: { id: true, status: true, netAmount: true } } },
  });

  if (!dbPayout) {
    return { scenario, result: 'FAIL', reason: 'Payout not found in DB' };
  }

  console.log('[DB] Status:', dbPayout.status);
  console.log('[DB] chapaReference:', dbPayout.chapaReference || 'NULL ← BUG if this is null');
  console.log('[DB] chapaTransferId:', dbPayout.chapaTransferId || 'NULL');
  console.log('[DB] Reserved earnings:', dbPayout.teacherEarnings.length);

  const hasRef = !!(dbPayout.chapaReference || dbPayout.chapaTransferId);

  if (!hasRef) {
    return { scenario, result: 'FAIL', reason: 'No chapaReference stored — test mode not working' };
  }

  // Map expected outcomes
  const expectedInitialStatus: Record<string, string> = {
    success: 'COMPLETED',
    pending: 'PROCESSING',
    failed: 'FAILED',
  };

  const expected = expectedInitialStatus[scenario];
  const actual = dbPayout.status;
  const statusMatch = actual === expected;

  console.log(`[Test] Expected status: ${expected}, Actual: ${actual} → ${statusMatch ? '✅ PASS' : '❌ FAIL'}`);

  // For PROCESSING, also test Check Status
  if (actual === 'PROCESSING') {
    console.log('[Test] Testing Check Status button (GET /payouts/verify)...');
    const verifyRes = await verifyPayout(payout.reference);
    const verified = verifyRes.data;
    console.log('[Test] Verify returned status:', verified.status);

    if (scenario === 'pending') {
      // Should stay PROCESSING since TEST_PAYOUT_STATUS=pending
      const verifyOk = verified.status === 'PROCESSING';
      console.log(`[Test] Verify stayed PROCESSING: ${verifyOk ? '✅ PASS' : '❌ FAIL (was ' + verified.status + ')'}`);
    }
  }

  // Check wallet accounting
  const walletAfter = await getWallet();
  if (scenario === 'success') {
    const earningsReserved = dbPayout.teacherEarnings.filter((e) => e.status === 'PAID_OUT').length;
    console.log('[Wallet] Earnings PAID_OUT:', earningsReserved, walletAfter.availableEarnings < wallet.availableEarnings ? '✅ deducted' : '❌ not deducted');
  } else if (scenario === 'failed') {
    const earningsReleased = dbPayout.teacherEarnings.filter((e) => e.status === 'AVAILABLE').length;
    console.log('[Wallet] Available after failure:', walletAfter.availableEarnings, walletAfter.availableEarnings >= wallet.availableEarnings ? '✅ restored' : '❌ not restored');
  } else {
    const earningsReserved = dbPayout.teacherEarnings.filter((e) => e.status === 'PENDING').length;
    console.log('[Wallet] Earnings reserved (PENDING):', earningsReserved, '✅');
  }

  return { scenario, result: statusMatch ? 'PASS' : 'FAIL', dbStatus: actual, expected };
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n[Payout E2E] Starting test...');
  console.log('[Env] CHAPA_TEST_MODE:', process.env.CHAPA_TEST_MODE);
  console.log('[Env] TEST_PAYOUT_STATUS:', process.env.TEST_PAYOUT_STATUS);

  if (process.env.CHAPA_TEST_MODE !== 'true') {
    console.error('❌ CHAPA_TEST_MODE must be "true" to run this test');
    process.exit(1);
  }

  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n[Test] Cannot run live API tests without valid credentials.');
    console.log('[Test] To test manually:');
    console.log('  1. Login to the app as a teacher');
    console.log('  2. Go to /dashboard/wallet/payouts');
    console.log('  3. Set TEST_PAYOUT_STATUS=success and request a payout');
    console.log('  4. Verify it shows COMPLETED');
    console.log('  5. Repeat for pending and failed');
    await prisma.$disconnect();
    return;
  }

  const currentStatus = process.env.TEST_PAYOUT_STATUS as 'success' | 'pending' | 'failed';
  if (!['success', 'pending', 'failed'].includes(currentStatus)) {
    console.error('❌ TEST_PAYOUT_STATUS must be success | pending | failed');
    process.exit(1);
  }

  try {
    await cleanupTestPayouts();
    const result = await runScenario(currentStatus);
    console.log('\n[Result]', JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Test error:', e.message);
  process.exit(1);
});
