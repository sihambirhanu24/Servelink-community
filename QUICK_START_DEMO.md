# Quick Start - Payout Demo Tomorrow

## 🚀 Before Demo Starts

### 1. Start Backend
```bash
cd backend
npm run start:dev
```

### 2. Start Frontend
```bash
cd frontend  
npm run dev
```

### 3. Choose Demo Scenario

Edit `backend/src/payment/payment.service.ts` line ~858:

**For SUCCESS demo:**
```typescript
status: 'success', // Immediate completion
```

**For FAILURE demo:**
```typescript
status: 'failed', // Immediate failure + refund
```

**For PENDING demo:**
```typescript
status: 'pending', // Manual "Check Status" needed
```

Then restart backend after changing.

---

## 📋 Demo Flow

### Login
- URL: `http://localhost:3000`
- Use verified teacher account

### Navigate to Payouts
- Dashboard → Wallet → Payouts
- Show current balance

### Request Payout
1. Click "Request Payout"
2. Enter:
   - Amount: 100 ETB
   - Bank: 946 (Commercial Bank)
   - Account: 1234567890
   - Name: Teacher Name
3. Submit

### Observe Result
- **SUCCESS:** Immediate ✅ COMPLETED, Receipt button
- **FAILED:** Immediate ❌ FAILED, Balance refunded
- **PENDING:** ⏳ PROCESSING, "Check Status" button

---

## 🔧 Fix Broken Payout

The existing payout `PAYOUT_C4C3B4FCA3CE` is broken.

**To fix:**
1. Go to payouts page
2. Find the PROCESSING payout
3. Click "Check Status"
4. System will auto-fail it and refund

**Or use CLI:**
```bash
cd backend
npx ts-node scripts/test-payout-verify.ts PAYOUT_C4C3B4FCA3CE
```

---

## 🧪 Test Webhook (Optional)

If demo includes webhooks:

```bash
curl -X POST http://localhost:5000/api/payouts/chapa/webhook/simulate \
  -H "Content-Type: application/json" \
  -d '{"reference": "PAYOUT_XXXXX", "status": "success"}'
```

Replace `PAYOUT_XXXXX` with actual reference from UI.

---

## ✅ Key Points to Mention

1. **No Mock Data** - Everything is real database/API
2. **No Auto-Polling** - Page doesn't refresh automatically  
3. **Test Mode** - Simulates Chapa without real money
4. **Production Ready** - Just disable test mode for live

---

## 📱 URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- API Docs: `http://localhost:5000/api`
- Database: Run `npx prisma studio` in backend folder

---

## 🆘 Troubleshooting

**Backend won't start?**
```bash
cd backend
npm install
npm run start:dev
```

**Frontend won't start?**
```bash
cd frontend
npm install
npm run dev
```

**Can't see payouts?**
- Make sure you're logged in as verified teacher
- Check wallet has available balance
- Try requesting minimum 100 ETB

**Payout stuck?**
- Click "Check Status" button
- It will auto-resolve

---

## 📚 Full Documentation

- Complete fix report: `PAYOUT_SYSTEM_FIX_REPORT.md`
- Testing guide: `backend/PAYOUT_TESTING_GUIDE.md`
- Verification script: `backend/scripts/test-payout-verify.ts`

Good luck with the demo! 🎉
