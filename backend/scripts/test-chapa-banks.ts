/**
 * Test Chapa API - get supported banks
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testChapaBanks() {
  const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
  
  console.log('='.repeat(60));
  console.log('PHASE 8 — BANK CODE VALIDATION');
  console.log('='.repeat(60));
  console.log('\nChapa Secret Key Loaded:', !!CHAPA_SECRET_KEY);
  console.log('Test Mode:', process.env.CHAPA_TEST_MODE);
  console.log('\nFetching supported banks from Chapa...\n');

  try {
    const response = await axios.get('https://api.chapa.co/v1/banks', {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    console.log('Chapa Banks Response Status:', response.status);
    console.log('Chapa Banks Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.data) {
      console.log('\nSupported Banks:');
      console.log('─'.repeat(60));
      response.data.data.forEach((bank: any) => {
        console.log(`Code: ${bank.code || bank.id} - ${bank.name}`);
      });
      
      // Check if 946 exists
      const bank946 = response.data.data.find((b: any) => b.code === '946' || b.id === '946');
      console.log('\n' + '='.repeat(60));
      if (bank946) {
        console.log('✅ Bank code 946 is VALID:', bank946.name);
      } else {
        console.log('❌ Bank code 946 is NOT FOUND in Chapa supported banks');
        console.log('   This may be why the transfer is failing!');
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to fetch Chapa banks');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('\n⚠️  Authentication failed - check CHAPA_SECRET_KEY');
    }
  }
}

testChapaBanks().catch(console.error);
