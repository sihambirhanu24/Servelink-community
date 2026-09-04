/**
 * Test Chapa Transfer API directly - Phase 3
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testChapaTransfer() {
  const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
  const TEST_MODE = process.env.CHAPA_TEST_MODE === 'true';
  
  console.log('='.repeat(60));
  console.log('PHASE 3 — DEBUG CHAPA TRANSFER');
  console.log('='.repeat(60));
  console.log('\n[PAYOUT] chapaKeyLoaded:', !!CHAPA_SECRET_KEY);
  console.log('[PAYOUT] mode:', TEST_MODE ? 'TEST' : 'LIVE');
  console.log('\nTesting Chapa Transfer API...\n');

  const testPayload = {
    account_name: 'Test Teacher',
    account_number: '1000000000000', // 13 digits for CBE
    amount: 85, // Net amount after 15% fee from 100 ETB
    currency: 'ETB',
    reference: `TEST_PAYOUT_${Date.now()}`,
    bank_code: '946', // CBE
    callback_url: 'http://localhost:5000/api/payouts/chapa/webhook',
  };

  // In test mode, add status parameter
  const requestPayload: any = TEST_MODE ? {
    ...testPayload,
    // status: 'success', // TESTING WITHOUT status parameter
  } : testPayload;

  console.log('[PAYOUT] Request Payload:');
  console.log(JSON.stringify({
    ...requestPayload,
    account_number: `****${requestPayload.account_number.slice(-4)}`,
  }, null, 2));

  try {
    console.log('\n[PAYOUT] Calling POST https://api.chapa.co/v1/transfers...\n');
    
    const response = await axios.post(
      'https://api.chapa.co/v1/transfers',
      requestPayload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Chapa Transfer Response:');
    console.log('HTTP Status:', response.status);
    console.log('Response Body:', JSON.stringify(response.data, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('ANALYSIS:');
    console.log('='.repeat(60));
    console.log('Chapa Status:', response.data.status);
    console.log('Transfer ID:', response.data.data?.id || 'NULL');
    console.log('Transfer Reference:', response.data.data?.reference || 'NULL');
    console.log('Transfer Status:', response.data.data?.status || 'NULL');
    console.log('Bank Reference:', response.data.data?.bank_reference || 'NULL');
    console.log('\nMapping to ServeLink:');
    
    if (response.data.status === 'success' && response.data.data) {
      const chapaStatus = response.data.data.status?.toLowerCase();
      let servelinkStatus = 'PROCESSING';
      
      if (chapaStatus === 'success') {
        servelinkStatus = 'COMPLETED';
      } else if (chapaStatus === 'failed') {
        servelinkStatus = 'FAILED';
      }
      
      console.log(`Chapa Transfer Status: ${chapaStatus} → ServeLink Status: ${servelinkStatus}`);
    }

  } catch (error: any) {
    console.error('\n❌ Chapa Transfer Failed');
    console.error('HTTP Status:', error.response?.status);
    console.error('Error Response:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
    
    console.log('\n' + '='.repeat(60));
    console.log('ROOT CAUSE:');
    console.log('='.repeat(60));
    
    if (error.response?.status === 401) {
      console.log('⚠️  Authentication failed - CHAPA_SECRET_KEY may be invalid');
    } else if (error.response?.status === 400) {
      console.log('⚠️  Bad Request - check payload format:');
      console.log('   - Bank code must be valid');
      console.log('   - Account number length must match bank requirements');
      console.log('   - Amount must be positive');
    } else if (error.response?.status === 422) {
      console.log('⚠️  Validation Error - check field values');
    }
  }
}

testChapaTransfer().catch(console.error);
