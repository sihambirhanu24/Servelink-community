# ServeLink Payout Integration Documentation

## Overview

This document describes the ServeLink teacher payout/withdrawal system integrated with Chapa Transfer API. The system enables teachers to withdraw their earnings directly to their bank accounts via Chapa's bank transfer service.

**IMPORTANT: TEST MODE DOES NOT MOVE REAL MONEY. LIVE MODE requires a properly approved/funded Chapa account.**

---

## Architecture

### Components

- **Frontend**: Next.js + TypeScript + Tailwind
- **Backend**: NestJS + Prisma 6.19.3 + PostgreSQL
- **Payment Provider**: Chapa Transfer API
- **Currency**: ETB (Ethiopian Birr)

### Key Principles

1. **No Frontend Polling**: The frontend does NOT continuously poll Chapa. Status updates come via webhooks.
2. **Backend-Only Secrets**: CHAPA_SECRET_KEY never exposed to frontend.
3. **Wallet Reservation**: Funds are reserved during transfer, not immediately deducted.
4. **Idempotency**: All operations (webhooks, verifications) are idempotent to prevent duplicate transactions.
5. **Real Integration**: This uses actual Chapa Transfer API, not simulated success.

---

## Request Flow

```
Teacher clicks "Request Payout"
        ↓
Frontend: POST /api/payouts/request
        ↓
Backend: Validate teacher + wallet + payout profile
        ↓
Backend: Calculate platform fee (15%) and net amount
        ↓
Backend: Generate unique reference (PAYOUT_{UUID})
        ↓
Backend: Reserve wallet funds (AVAILABLE → PENDING)
        ↓
Backend: Immediately call Chapa Transfer API
        ↓
Chapa: Accepts/queues the transfer
        ↓
Backend: Update payout status to PROCESSING
        ↓
Chapa: Processes the bank transfer
        ↓
Chapa: Sends webhook to backend
        ↓
Backend: Update payout to COMPLETED or FAILED
        ↓
Backend: Finalize or release wallet reservation
        ↓
Teacher: Sees updated status on next page load
```

---

## Chapa Transfer API

### Endpoint

```
POST https://api.chapa.co/v1/transfers
```

### Authentication

```
Authorization: Bearer ${CHAPA_SECRET_KEY}
```

### Required Data

```typescript
{
  account_number: string,  // Teacher's bank account number
  amount: number,          // Net amount after platform fee
  bank_code: string,       // Chapa bank code
  account_name?: string,   // Account holder name
  currency?: string,       // Default: ETB
  reference?: string       // Unique ServeLink reference
}
```

### Response

```typescript
{
  status: 'success',
  data: {
    id: string,            // Chapa transfer ID
    reference: string,     // Chapa reference
    status: string         // 'queued' | 'processing' | 'success' | 'failed'
  }
}
```

---

## Webhook Integration

### Endpoint

```
POST /api/payouts/chapa/webhook
```

### Webhook Events

The system handles:

- `payout.success` - Transfer completed successfully
- `payout.failed` - Transfer failed
- `payout.cancelled` - Transfer cancelled

### Webhook Payload

```typescript
{
  event: string,           // Event type
  type: string,           // Alternative event type
  reference: string,      // ServeLink payout reference
  chapa_reference: string, // Chapa's reference
  bank_reference: string,  // Bank transaction reference
  status: string,          // 'success' | 'failed' | 'cancelled'
  amount: number,          // Transfer amount
  currency: string         // Currency (ETB)
}
```

### Webhook Security

**IMPORTANT**: Implement HMAC SHA256 signature verification according to Chapa's documentation before processing webhook events.

Current implementation validates:
- Payout reference exists
- Amount matches netAmount
- Currency matches
- Idempotency (already processed?)

---

## Verification Endpoint

### Manual Verification

```
GET /api/payouts/verify/:reference
```

**Behavior:**
- If already COMPLETED/FAILED: Returns immediately (no Chapa call)
- If PROCESSING: Calls Chapa verify endpoint once
- Idempotent: Safe to call multiple times
- No automatic polling

### Chapa Verify Endpoint

```
GET https://api.chapa.co/v1/transfers/verify/:reference
```

---

## Status Lifecycle

### Valid Transitions

```
PENDING → PROCESSING (Chapa accepted transfer)
PROCESSING → COMPLETED (Chapa success webhook)
PROCESSING → FAILED (Chapa failure webhook)
PROCESSING → REJECTED (Chapa rejection during request)
PENDING → REJECTED (Chapa rejection during request)
```

### Invalid Transitions

```
COMPLETED → PROCESSING (not allowed)
COMPLETED → FAILED (not allowed)
FAILED → COMPLETED (not allowed)
```

---

## Wallet Accounting

### Wallet States

Teacher earnings have three states:

1. **AVAILABLE**: Can be withdrawn
2. **PENDING**: Reserved for active payout
3. **PAID_OUT**: Successfully paid to teacher

### Reservation Logic

**On Payout Request:**
```
availableBalance decreases
reservedBalance increases (via PENDING earnings)
```

**On Chapa Success:**
```
PENDING → PAID_OUT
reserved amount is finalized
```

**On Chapa Failure:**
```
PENDING → AVAILABLE
reserved amount is released back to available balance
```

### Idempotency

- Duplicate webhooks do NOT double-credit or double-debit
- Transaction checks prevent duplicate wallet updates
- Unique constraints on payout references prevent duplicate transfers

---

## Platform Fee

### Calculation

Current platform fee: **15%**

**Example:**
- Requested amount: 100 ETB
- Platform fee: 15 ETB
- Net amount to teacher: 85 ETB

**Important:** The system sends the **net amount** to Chapa for transfer.

### Configuration

Platform fee is stored in `PlatformSettings` table:

```prisma
platformFeePercent Decimal @default(15.00)
```

---

## Database Schema

### Payout Model

```prisma
model Payout {
  id                String           @id @default(cuid())
  teacherId         String
  amount            Decimal          @db.Decimal(10, 2)  // Gross amount
  feeAmount         Decimal?         @db.Decimal(10, 2)  // Platform fee
  netAmount         Decimal?         @db.Decimal(10, 2)  // Net amount sent to Chapa
  currency          String           @default("ETB")
  status            PayoutStatus     @default(PENDING)
  bankCode          String?
  bankName          String?
  bankAccountNumber String?
  bankAccountName   String?
  reference         String           @unique              // ServeLink reference
  rejectionReason   String?
  approvedBy        String?
  approvedAt        DateTime?
  processedBy       String?
  processedAt       DateTime?
  completedAt       DateTime?
  failedAt          DateTime?
  metadata          Json?
  chapaTransferId   String?          @unique              // Chapa transfer ID
  chapaReference    String?          @unique              // Chapa reference
  bankReference     String?                               // Bank reference
  chapaStatus       String?                               // Chapa's status
  webhookReceivedAt DateTime?
  submittedAt       DateTime?
  lastVerifiedAt    DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  teacher           Teacher          @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  teacherEarnings   TeacherEarning[]

  @@index([teacherId])
  @@index([status])
  @@index([createdAt])
  @@index([chapaTransferId])
  @@index([chapaReference])
  @@index([reference])
}
```

### PayoutStatus Enum

```prisma
enum PayoutStatus {
  PENDING
  APPROVED
  PROCESSING
  COMPLETED
  REJECTED
  CANCELLED
  FAILED
}
```

---

## Environment Variables

### Required

```bash
# Backend (.env)
CHAPA_SECRET_KEY=CHASECK_TEST-...  # Chapa secret key (backend only)
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_TEST_MODE=true               # true for test mode, false for live
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:3000
```

### Security Rules

- **NEVER** use `NEXT_PUBLIC_CHAPA_SECRET_KEY` - secret must stay backend-only
- **NEVER** expose CHAPA_SECRET_KEY to frontend code
- **NEVER** log CHAPA_SECRET_KEY or full bank account numbers

---

## Test Mode vs Live Mode

### Test Mode

```bash
CHAPA_TEST_MODE=true
CHAPA_SECRET_KEY=CHASECK_TEST-...
```

- Uses Chapa test environment
- Simulated transfers (no real money movement)
- For development and demonstration only

### Live Mode

```bash
CHAPA_TEST_MODE=false
CHAPA_SECRET_KEY=CHASECK_LIVE-...
```

- Uses Chapa production environment
- Real money transfers
- Requires approved/funded Chapa merchant account

---

## How to Test Locally

### 1. Start Backend

```bash
cd backend
npm run start:dev
```

Backend runs on: `http://localhost:5000`

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`

### 3. Expose Webhook for Local Development

Since Chapa cannot reach localhost, use a tunneling service:

**Option 1: ngrok**
```bash
ngrok http 5000
```

**Option 2: localtunnel**
```bash
lt --port 5000
```

Then configure Chapa webhook URL to:
```
https://your-tunnel-url.ngrok.io/api/payouts/chapa/webhook
```

### 4. Test Flow

1. Login as teacher
2. Navigate to `/dashboard/wallet/payouts`
3. Ensure wallet has available balance
4. Click "Request Payout"
5. Enter amount and bank details
6. Submit
7. Verify status shows "PROCESSING"
8. Check backend logs for Chapa transfer response
9. Simulate webhook (or wait for real Chapa webhook)
10. Refresh page to see COMPLETED/FAILED status

### 5. Simulate Webhook (for testing)

```bash
curl -X POST http://localhost:5000/api/payouts/chapa/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payout.success",
    "reference": "PAYOUT_ABC123",
    "status": "success",
    "amount": 85,
    "currency": "ETB",
    "chapa_reference": "CHAPA_REF_123",
    "bank_reference": "BANK_REF_456"
  }'
```

---

## Demonstration Scenarios

### Scenario 1: SUCCESS Payout

1. Teacher requests payout with sufficient balance
2. Backend calls Chapa Transfer API
3. Chapa accepts transfer → status = PROCESSING
4. Chapa processes transfer successfully
5. Chapa sends `payout.success` webhook
6. Backend updates status to COMPLETED
7. Wallet: PENDING → PAID_OUT
8. Teacher sees COMPLETED status with receipt

### Scenario 2: FAILED Payout

1. Teacher requests payout
2. Chapa accepts transfer → status = PROCESSING
3. Chapa transfer fails (insufficient balance, invalid account, etc.)
4. Chapa sends `payout.failed` webhook
5. Backend updates status to FAILED
6. Wallet: PENDING → AVAILABLE (funds released)
7. Teacher sees FAILED status with reason

### Scenario 3: PENDING/PROCESSING Payout

1. Teacher requests payout
2. Chapa accepts transfer → status = PROCESSING
3. Chapa still processing (no webhook yet)
4. Teacher sees PROCESSING status
5. Teacher can click "Check Status" for one-time verification
6. Status remains PROCESSING until webhook arrives

---

## API Endpoints

### Teacher Endpoints

```
GET  /api/payouts/wallet              # Get teacher wallet data
GET  /api/payouts/banks               # Get Chapa bank list
GET  /api/payouts/verify/:reference   # Verify payout status (one-time)
POST /api/payouts/request             # Request payout
GET  /api/payouts/history             # Get payout history
GET  /api/payouts/profile              # Get payout profile
POST /api/payouts/profile              # Update payout profile
```

### Admin Endpoints

```
GET  /api/payouts/admin/all           # Get all payouts
PATCH /api/payouts/admin/:id/approve   # Approve payout
PATCH /api/payouts/admin/:id/reject    # Reject payout
PATCH /api/payouts/admin/:id/process  # Process payout
PATCH /api/payouts/admin/:id/complete  # Complete payout
GET  /api/payouts/admin/dashboard     # Get finance dashboard
```

### Webhook Endpoint

```
POST /api/payouts/chapa/webhook       # Chapa webhook
```

---

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Insufficient balance | Requested amount > available balance | Teacher needs more earnings |
| Below minimum | Amount < minimum payout (default 100 ETB) | Request higher amount |
| Invalid bank | Bank code not supported by Chapa | Select valid bank |
| Invalid account | Account number format invalid | Verify account number |
| Chapa auth failure | Invalid CHAPA_SECRET_KEY | Check environment variables |
| Chapa insufficient balance | Merchant Chapa balance too low | Fund Chapa account |
| Duplicate payout | Teacher already has active payout | Wait for current payout to complete |
| Transfer hours | Chapa transfers outside supported hours | Try during business hours |

### Error Messages

Frontend shows user-friendly messages. Backend logs detailed errors for debugging.

---

## Security Considerations

1. **JWT Authentication**: All teacher endpoints require valid JWT token
2. **Teacher Ownership**: Teachers can only access their own payouts
3. **Role Permissions**: Admin endpoints require admin role
4. **Webhook Validation**: Validate webhook signature (to be implemented)
5. **Idempotency**: All operations safe to retry
6. **Unique Constraints**: Prevent duplicate transfers
7. **Transaction Safety**: Database transactions prevent race conditions

---

## Important Distinction

### ServeLink Teacher Wallet vs Chapa Merchant Balance

**ServeLink Teacher Wallet:**
- Internal accounting system
- Represents money owed to teachers
- Tracks earnings, withdrawals, balances
- Does NOT directly fund Chapa transfers

**Chapa Merchant Balance:**
- Actual money in Chapa merchant account
- Funds the external bank transfers
- Separate from teacher wallet balance
- Must be funded separately

**Important:** A teacher having available balance in ServeLink does NOT guarantee Chapa has sufficient merchant balance.

---

## Files Changed

### Backend

- `backend/prisma/schema.prisma` - Added webhook fields, FAILED status
- `backend/src/payment/payout.service.ts` - Implemented Chapa transfer, webhook, idempotency
- `backend/src/payment/payout.controller.ts` - Added webhook endpoint

### Frontend

- `frontend/src/app/dashboard/wallet/payouts/page.tsx` - Removed polling, simplified flow
- `frontend/src/app/payment/success/page.tsx` - Added Suspense boundary
- `frontend/src/app/payments/chapa/result/page.tsx` - Added Suspense boundary

---

## Build Commands

### Backend

```bash
cd backend
npx prisma generate
npx prisma db push
npm run build
npm run start:dev
```

### Frontend

```bash
cd frontend
npm run build
npm run dev
```

---

## Testing Checklist

- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] Prisma migration applied
- [ ] No frontend polling (setInterval, setTimeout, refetchInterval)
- [ ] CHAPA_SECRET_KEY only in backend
- [ ] Payout request calls Chapa immediately
- [ ] Webhook updates payout status
- [ ] Wallet accounting correct (reservation, finalization, release)
- [ ] Duplicate webhooks handled safely
- [ ] Manual verification is one-time only
- [ ] Receipt generated after COMPLETED
- [ ] Test mode works without real money

---

## Troubleshooting

### Payout stuck in PROCESSING

1. Check if webhook was received (backend logs)
2. Manually call verification endpoint
3. Check Chapa dashboard for transfer status
4. Verify webhook URL is correct in Chapa settings

### Wallet balance incorrect

1. Check TeacherEarning table for status
2. Verify PAYOUT → TeacherEarning relationships
3. Check audit logs for transactions
4. Verify no duplicate webhook processing

### Chapa API errors

1. Verify CHAPA_SECRET_KEY is correct
2. Check CHAPA_TEST_MODE setting
3. Verify Chapa merchant account is active
4. Check Chapa API status

---

## Support

For issues with:
- **Chapa API**: Check Chapa documentation at https://docs.chapa.co
- **Database**: Check Prisma documentation at https://www.prisma.io/docs
- **Backend**: Check NestJS documentation at https://docs.nestjs.com
- **Frontend**: Check Next.js documentation at https://nextjs.org/docs

---

**Last Updated:** September 4, 2026
