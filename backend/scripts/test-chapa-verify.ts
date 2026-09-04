/**
 * Test Chapa Verify Transfer API
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testChapaVerify() {
  const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
  
  console.log('='.repeat(60));
  console.log('TESTING CHAPA VERIFY API');
  console.log('='.repeat(60));

  const testReference = 'TEST_PAYOUT_1788474106657'; // From previous test

  try {
    console.log(`\nCalling GET /v1/transfers/verify/${testReference}...\n`);
    
    const response = await axios.get(
      `https://api.chapa.co/v1/transfers/verify/${testReference}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      }
    );

    console.log('✅ Chapa Verify Response:');
    console.log('HTTP Status:', response.status);
    console.log('Response Body:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    console.error('\n❌ Chapa Verify Failed');
    console.error('HTTP Status:', error.response?.status);
    console.error('Error Response:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
  }
}

testChapaVerify().catch(console.error);
