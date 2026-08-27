# Teacher Suspension & Appeal System - Testing Guide

## Prerequisites

1. **Backend running** on `http://localhost:5000`
2. **Frontend running** on `http://localhost:3000`
3. **Admin account** ready:
   - Email: `admin@servelink.et`
   - Password: `Admin123`
4. **Teacher account** ready (for testing suspension)

---

## Test 1: Admin Suspends a Teacher

### Steps:
1. Log in as admin at `http://localhost:3000/admin/login`
2. Navigate to **Teachers** page
3. Find a teacher to suspend
4. Click the action menu (three dots) → **Suspend Teacher**
5. Fill in the suspension form:
   - Type: `TEMPORARY`
   - Duration: `7` days
   - Reason: `Test suspension for verification`
   - Admin Notes: (optional)
6. Click **Suspend Teacher**

### Expected Results:
- ✅ Teacher status changes to `SUSPENDED`
- ✅ Success message appears
- ✅ Suspension is recorded in database
- ✅ Teacher receives notification

---

## Test 2: Teacher Sees Suspension Status

### Steps:
1. Log out of admin
2. Log in as the suspended teacher
3. Navigate to **Dashboard**

### Expected Results:
- ✅ Red suspension banner appears at top of dashboard
- ✅ Banner shows:
  - Suspension reason
  - Suspended date
  - Suspension end date
  - Days remaining
- ✅ Link to view full suspension details

---

## Test 3: Backend Enforcement - Restricted Actions

### Steps (while logged in as suspended teacher):
1. Try to create a new post
2. Try to comment on a post
3. Try to like a post
4. Try to send a direct message
5. Try to create a discussion
6. Try to report content

### Expected Results:
- ✅ Each action returns `403 Forbidden`
- ✅ Error response includes:
  ```json
  {
    "code": "ACCOUNT_SUSPENDED",
    "message": "Your account has been suspended",
    "suspensionReason": "...",
    "suspensionStart": "...",
    "suspensionUntil": "..."
  }
  ```
- ✅ Frontend redirects to `/suspended` page

---

## Test 4: Teacher Views Suspension Details

### Steps:
1. As suspended teacher, click **View Suspension Details** in the banner
2. Or navigate directly to `http://localhost:3000/suspended`

### Expected Results:
- ✅ Suspension details page loads
- ✅ Shows:
  - Suspension type
  - Reason
  - Start date
  - End date
  - Remaining time
  - Restricted features list
- ✅ **Appeal Suspension** button is visible

---

## Test 5: Teacher Submits Appeal

### Steps:
1. On suspension details page, click **Appeal Suspension**
2. Fill in appeal form:
   - Subject: `Request for review`
   - Explanation: `This is a test appeal. I believe the suspension was applied in error.`
3. Click **Submit Appeal**

### Expected Results:
- ✅ Appeal submitted successfully
- ✅ Success message appears
- ✅ Appeal status shows as `PENDING`
- ✅ Duplicate appeal submission is prevented
- ✅ Teacher receives notification

---

## Test 6: Admin Reviews Appeal

### Steps:
1. Log out of teacher account
2. Log in as admin
3. Navigate to **Suspension Appeals** in sidebar
4. Find the pending appeal
5. Click **Review**
6. Review the appeal details
7. Click **Approve Appeal** or **Reject Appeal**

### Expected Results (Approve):
- ✅ Teacher status changes to `ACTIVE`
- ✅ Suspension is removed
- ✅ Teacher receives notification: "Appeal Approved - Your account has been restored"

### Expected Results (Reject):
- ✅ Appeal status changes to `REJECTED`
- ✅ Suspension remains active
- ✅ Teacher receives notification: "Appeal Rejected"

---

## Test 7: Admin Unsuspends Teacher

### Steps:
1. As admin, navigate to **Teachers** page
2. Find the suspended teacher
3. Click action menu → **Unsuspend**
4. Optionally provide a reason

### Expected Results:
- ✅ Teacher status changes to `ACTIVE`
- ✅ Suspension fields cleared
- ✅ Teacher receives notification: "Account Restored"

---

## Test 8: Automatic Suspension Expiration

### Steps:
1. As admin, suspend a teacher with a short duration (e.g., 1 minute)
2. Wait for the duration to expire
3. As the teacher, try to perform a restricted action

### Expected Results:
- ✅ Backend automatically expires the suspension
- ✅ Teacher status changes to `ACTIVE`
- ✅ Teacher can perform restricted actions again
- ✅ Teacher receives notification: "Your suspension has ended"

---

## Test 9: Permanent Suspension

### Steps:
1. As admin, suspend a teacher with type `PERMANENT`
2. Log in as that teacher

### Expected Results:
- ✅ Teacher status shows `PERMANENTLY_SUSPENDED`
- ✅ No end date shown
- ✅ Restricted actions still blocked
- ✅ Appeal system still available

---

## Test 10: Suspension History

### Steps:
1. As admin, navigate to **Teachers** page
2. Find a teacher with multiple suspensions
3. Click action menu → **View Suspension History**

### Expected Results:
- ✅ Modal shows all past suspensions
- ✅ Each entry shows:
  - Suspension type
  - Reason
  - Dates
  - Who suspended/restored
  - Related report ID (if any)

---

## Test 11: Report → Suspension Workflow

### Steps:
1. As admin, navigate to **Reports** page
2. Open a report for review
3. Click **Suspend Teacher** button
4. Fill in suspension form

### Expected Results:
- ✅ Suspension modal opens with teacher info pre-filled
- ✅ Report ID is linked to the suspension
- ✅ Teacher is suspended
- ✅ Report can be resolved separately

---

## Test 12: Security - API Bypass Prevention

### Steps:
1. As a suspended teacher, get your JWT token
2. Use Postman/curl to directly call protected endpoints:
   ```bash
   POST http://localhost:5000/api/community/posts
   Authorization: Bearer <your_token>
   ```
3. Try to create a post

### Expected Results:
- ✅ Request returns `403 Forbidden`
- ✅ Error code: `ACCOUNT_SUSPENDED`
- ✅ Post is NOT created in database
- ✅ Cannot bypass frontend restrictions

---

## Test 13: Read-Only Access

### Steps (while suspended):
1. Navigate to **Profile**
2. Navigate to **Communities**
3. View existing posts
4. Read discussions
5. View notifications

### Expected Results:
- ✅ All read operations work normally
- ✅ Teacher can view their content
- ✅ Teacher can browse the platform
- ✅ Only write operations are blocked

---

## Test 14: Edge Cases

### Case 1: Teacher suspended while logged in
1. Teacher is logged in and active
2. Admin suspends the teacher
3. Teacher tries to perform an action

**Expected:** Action is blocked, teacher redirected to suspension page

### Case 2: Suspension expires while logged in
1. Teacher is suspended and logged in
2. Wait for suspension to expire
3. Teacher refreshes page or tries an action

**Expected:** Suspension auto-expires, permissions restored

### Case 3: Multiple appeals
1. Teacher submits an appeal
2. Teacher tries to submit another appeal while first is pending

**Expected:** Second submission blocked with error "You already have a pending appeal"

---

## Test 15: Notification System

### Verify all notifications are sent:
- ✅ Suspension notification to teacher
- ✅ Appeal submitted notification to teacher
- ✅ Appeal approved notification to teacher
- ✅ Appeal rejected notification to teacher
- ✅ Account restored notification to teacher
- ✅ Suspension ended notification to teacher

---

## Troubleshooting

### Issue: Admin can't suspend teacher
- Check admin JWT token in localStorage (`admin_token`)
- Verify admin has `isAdmin: true` in JWT payload
- Check backend logs for errors

### Issue: Teacher not redirected when suspended
- Check axios interceptor in `lib/axios.ts`
- Verify `ACCOUNT_SUSPENDED` error code is handled
- Check browser console for errors

### Issue: Suspension not auto-expiring
- Check `checkSuspensionExpiration` in `SuspensionService`
- Verify `suspensionUntil` date is set correctly
- Check backend logs for auto-restore attempts

### Issue: Appeals not showing for admin
- Check admin token is being used in appeals page
- Verify appeal controller is registered
- Check database for appeal records

---

## Success Criteria

The suspension system is complete when:
- ✅ Admin can suspend/unsuspend teachers
- ✅ Teachers see suspension status clearly
- ✅ Backend enforces restrictions on all protected endpoints
- ✅ Frontend blocks restricted actions with clear messages
- ✅ Teachers can submit appeals
- ✅ Admins can review appeals
- ✅ Automatic suspension expiration works
- ✅ Notifications are sent for all events
- ✅ Read-only access is maintained during suspension
- ✅ API bypass is prevented
- ✅ Suspension history is tracked
- ✅ Report → suspension workflow works
