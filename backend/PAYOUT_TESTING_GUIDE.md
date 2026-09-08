# ServeLink Payout System Testing Guide

## Overview
This guide explains how to test the complete payout flow including test mode simulation.

## Environment Setup

### Required Environment Variables (.env)
```
CHAPA_SECRET_KEY=CHASECK_TEST-lL72SKbOOciHte1sxDimJidD2JB7iNc7
CHAPA_TEST_MODE=true
CHAPA_WEBHOOK_SECRET=change_this_to_random_secret
NODE_ENV=development
```

## Test Mode Configuration

### How Test Mode Works
When `CHAPA_TEST_MODE=true`, the system sends a `status` parameter to Chapa's API to simulate immediate results:

- `status=success` → Transfer succeeds immediately → Payout = COMPLETED
- `status=failed` → Transfer fails immediately → Payout = FAILED
- `status=pending` → Transfer stays in queue → Payout = PROCESSING

### Changing Test Mode Behavior
Edit `backend/src/payment/payment.service.ts` line ~858:

```typescript
const requestPayload = isTestMode ? {
  ...payload,
  callback_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:5000'}/api/payouts/chapa/webhook`,
  status: 'success', // ← Change this to 'failed' or 'pending' to test different scenarios
} : {
  ...payload,
  callback_url: `${this.configService.get('FRONTEND_URL') || 'http://localhost:5000'}/api/payouts/chapa/webhook`,
};
```

## Demo Scenarios

### Demo 1: Successful Immediate Payout
**Setup:** Set `status: 'success'` in payment.service.ts

**Steps:**
1. Login as teacher
2. Navigate to Dashboard → Wallet → Payouts
3. Click "Request Payout"
4. Fill in bank details and amount (minimum 100 ETB)
5. Submit

**Expected Result:**
- Payout immediately shows as **COMPLETED**
- Wallet balance decreases
- Receipt button appears
- No need to click "Check Status"

### Demo 2: Failed Immediate Payout
**Setup:** Set `status: 'failed'` in payment.service.ts

**Steps:**
1. Login as teacher
2. Navigate to Dashboard → Wallet → Payouts
3. Click "Request Payout"
4. Fill in bank details and amount
5. Submit

**Expected Result:**
- Payout immediately shows as **FAILED**
- Error message displayed
- Wallet balance NOT decreased (funds refunded)
- Can request new payout

### Demo 3: Pending Payout with Manual Verification
**Setup:** Set `status: 'pending'` in payment.service.ts

**Steps:**
1. Login as teacher
2. Navigate to Dashboard → Wallet → Payouts
3. Click "Request Payout"
4. Fill in bank details and amount
5. Submit
6. Payout shows as **PROCESSING**
7. Click "Check Status" button

**Expected Result:**
- Initially shows as **PROCESSING**
- "Check Status" button visible
- No automatic polling (page doesn't refresh repeatedly)
- After clicking "Check Status", status updates based on Chapa response

### Demo 4: Webhook Simulation (Local Testing)
When testing locally without a public URL for webhooks:

**HTTP Request:**
```http
POST http://localhost:5000/api/payouts/chapa/webhook/simulate
Content-Type: application/json

{
  "reference": "PAYOUT_XXXXX",
  "status": "success"
}
```

**Or use curl:**
```bash
curl -X POST http://localhost:5000/api/payouts/chapa/webhook/simulate \
  -H "Content-Type: application/json" \
  -d '{"reference": "PAYOUT_C4C3B4FCA3CE", "status": "success"}'
```

**Expected Result:**
- Payout updates from PROCESSING → COMPLETED
- Earnings marked as PAID_OUT
- Audit log created

## Fixing Existing Broken Payout

### Current Payout: PAYOUT_C4C3B4FCA3CE

**Problem:** This payout is stuck in PROCESSING with no Chapa reference (transfer was never submitted).

**Solution:** Click "Check Status" button on the payout. The system will:
1. Detect missing Chapa reference
2. Automatically mark as FAILED
3. Refund the reserved earnings
4. Allow teacher to request new payout

**Alternative (Manual):**
```bash
cd backend
npx ts-node scripts/test-payout-verify.ts PAYOUT_C4C3B4FCA3CE
```

## Verification Commands

### Check Payout in Database
```bash
cd backend
npx prisma studio
# Navigate to Payout table and search for reference
```

### Verify with Chapa API
```bash
cd backend
npx ts-node scripts/test-payout-verify.ts <PAYOUT_REFERENCE>
```

### Check Backend Logs
```bash
# Look for these log patterns:
[Payout] Request received
[Payout] Chapa transfer response
[Payout] Payout status: COMPLETED/PROCESSING/FAILED
```

## Important Notes

### Production Mode
When deploying to production:
1. Set `CHAPA_TEST_MODE=false`
2. Remove or comment out the `status` parameter in `payment.service.ts`
3. Ensure webhook URL is publicly accessible
4. Configure proper webhook signature verification

### Wallet Accounting
- **PENDING Status**: Funds reserved but not yet transferred
- **COMPLETED Status**: Funds successfully transferred
- **FAILED Status**: Funds refunded to available balance
- Platform fee (15%) is deducted from payout amount

### No Automatic Polling
The frontend does NOT automatically refresh payout status. Teachers must:
- Manually click "Check Status" for PROCESSING payouts
- Wait for webhook notification (in production)

## Troubleshooting

### Payout Stuck in PROCESSING
**Cause:** Chapa transfer is pending or webhook not received
**Solution:** Click "Check Status" button to manually verify

### No Chapa Reference
**Cause:** Transfer API call failed or response not saved
**Solution:** System will auto-fail the payout on next "Check Status" click

### Amount Mismatch
**Cause:** Platform fee calculation or currency conversion
**Solution:** Check platform settings and fee percentage

### Webhook Not Received
**Cause:** Local development without public URL
**Solution:** Use webhook simulation endpoint

## Support

For issues or questions:
1. Check backend logs for detailed error messages
2. Run verification script to diagnose
3. Check Prisma Studio for database state
4. Review audit logs in FinancialAuditLog table
