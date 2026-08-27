# Unmark Best Answer Feature ✅

## Problem
User accidentally marked an answer as "Best Answer" and wanted to remove it. Previously, once an answer was marked as best, it couldn't be unmarked.

## Solution
Implemented **toggle functionality** for best answers - you can now unmark a best answer to select a different one or leave the question in CLOSED status.

---

## Changes Made

### Backend (`backend/src/community/services/qa.service.ts`)

1. **Modified `selectBestAnswer()` method:**
   - Added toggle behavior: if the same answer is already marked as best, it will be unmarked
   - Changed validation to allow unmarking (removed the hard block on SOLVED status)
   - If trying to select a different answer while one is already selected, shows error message to unmark first

2. **Added new `unselectBestAnswer()` private method:**
   - Reverts question from SOLVED back to CLOSED status
   - Unmarks the answer (`isAccepted: false`)
   - Clears `bestAnswerId`, `solvedAt`, and `isResolved` fields
   - Sends notification to the answer author about the change
   - Returns success message

### Frontend (`frontend/src/app/community/questions/[id]/page.tsx`)

1. **Updated `AnswerCard` component:**
   - Added new prop: `onUnmarkBestAnswer`
   - Added new logic: `canUnmarkBest` (only for question asker on accepted answers)
   - Added new button: "Unmark Best Answer" (red styling, shows only on best answer for asker)

2. **Added `handleUnmarkBestAnswer()` function:**
   - Shows confirmation dialog before unmarking
   - Calls the same API endpoint (backend handles toggle automatically)
   - Shows success toast: "Best answer unmarked. You can now select a different answer."

---

## How to Use

### As a Question Asker:

#### Scenario 1: Accidentally Marked Wrong Answer
1. Go to your question detail page
2. Find the answer marked with green "Best Answer" badge
3. Click the **red "Unmark Best Answer"** button below it
4. Confirm the action in the popup dialog
5. ✅ Answer is now unmarked, question returns to CLOSED status
6. You can now select the correct answer

#### Scenario 2: Want to Change Best Answer
1. First, unmark the current best answer (see above)
2. Then, select the new answer by clicking "Mark Best Answer" on the correct answer

---

## UI Changes

### Before (No Unmark Option)
```
Answer Card (Green Border)
┌─────────────────────────────────────┐
│ 🏆 Best Answer                      │
│                                     │
│ Teacher Name                        │
│ Answer content...                   │
│                                     │
│ [👍 Helpful]                        │  ← Only action available
└─────────────────────────────────────┘
```

### After (With Unmark Option)
```
Answer Card (Green Border)
┌─────────────────────────────────────┐
│ 🏆 Best Answer                      │
│                                     │
│ Teacher Name                        │
│ Answer content...                   │
│                                     │
│ [👍 Helpful] [🏆 Unmark Best Answer]│  ← New button (red)
└─────────────────────────────────────┘
```

---

## Status Flow

### Previous Flow (One-Way)
```
CLOSED → [Mark Best] → SOLVED (permanent)
```

### New Flow (Toggle)
```
CLOSED → [Mark Best] → SOLVED → [Unmark Best] → CLOSED
                                                    ↓
                                            [Mark Different Answer]
                                                    ↓
                                                  SOLVED
```

---

## API Behavior

### Endpoint: `POST /api/community/questions/:questionId/best-answer/:answerId`

**Authentication:** Required (JWT + Verified Teacher)

**Authorization:** Only question author can call this

#### Scenario 1: Marking Best Answer (First Time)
```json
POST /api/community/questions/123/best-answer/456

Response (200):
{
  "success": true,
  "questionStatus": "SOLVED",
  "bestAnswerId": "456",
  "solvedAt": "2026-08-17T10:30:00Z"
}
```

#### Scenario 2: Unmarking Best Answer (Toggle)
```json
POST /api/community/questions/123/best-answer/456
(same answerId as currently marked)

Response (200):
{
  "success": true,
  "questionStatus": "CLOSED",
  "bestAnswerId": null,
  "message": "Best answer unmarked. Question is now closed and awaiting a new best answer selection."
}
```

#### Scenario 3: Trying to Select Different Answer Without Unmarking First
```json
POST /api/community/questions/123/best-answer/789
(different answerId while 456 is marked)

Response (403):
{
  "statusCode": 403,
  "message": "A best answer has already been selected. Unmark it first to select a different one.",
  "error": "Forbidden"
}
```

---

## Notifications

### When Marking Best Answer
- **Recipient:** Answer author
- **Title:** "🏆 Your answer was selected as Best Answer!"
- **Message:** "[Asker Name] selected your answer as the best answer for '[Question Title]'. You earned +15 points!"

### When Unmarking Best Answer
- **Recipient:** Answer author (who was previously selected)
- **Title:** "Best Answer Unmarked"
- **Message:** "[Asker Name] unmarked your answer as the best answer for '[Question Title]'."

---

## Database Changes

### When Marking Best Answer
```sql
-- Update answer
UPDATE community_comment 
SET is_accepted = true 
WHERE id = 'answerId';

-- Update question
UPDATE community_post 
SET 
  question_status = 'SOLVED',
  best_answer_id = 'answerId',
  solved_at = NOW(),
  is_resolved = true
WHERE id = 'questionId';
```

### When Unmarking Best Answer
```sql
-- Update answer
UPDATE community_comment 
SET is_accepted = false 
WHERE id = 'answerId';

-- Update question
UPDATE community_post 
SET 
  question_status = 'CLOSED',
  best_answer_id = NULL,
  solved_at = NULL,
  is_resolved = false
WHERE id = 'questionId';
```

---

## Testing Steps

### Test 1: Unmark Best Answer
1. Login as Teacher A
2. Post a question with a deadline
3. Wait for deadline to pass (or manually update DB to make it CLOSED)
4. Have Teacher B answer the question
5. As Teacher A, mark Teacher B's answer as best
6. ✅ Verify green badge appears and question shows SOLVED
7. Click "Unmark Best Answer" button (red)
8. Confirm in the dialog
9. ✅ Verify:
   - Green badge disappears
   - Question status returns to CLOSED
   - Button changes to "Mark Best Answer" (green)
   - Success toast appears

### Test 2: Change Best Answer
1. Continue from Test 1 (question is now CLOSED with no best answer)
2. Have Teacher C answer the same question
3. As Teacher A, mark Teacher C's answer as best
4. ✅ Verify Teacher C's answer now has the green badge
5. Try to mark Teacher B's answer without unmarking first
6. ✅ Verify you get an error message
7. Unmark Teacher C's answer
8. Mark Teacher B's answer as best
9. ✅ Verify Teacher B's answer now has the green badge

### Test 3: Notifications
1. Continue from Test 2
2. Login as Teacher B (in different browser)
3. Check notifications
4. ✅ Verify you received:
   - "Best Answer Unmarked" notification
   - "Best Answer Selected" notification (second time)

---

## Error Handling

### Client-Side Validation
- Confirmation dialog prevents accidental unmarking
- Button is disabled during API request (prevents double-click)
- Loading state shows "Unmarking…"

### Server-Side Validation
- Only question author can unmark
- Cannot unmark if question is OPEN
- Cannot unmark someone else's answer
- Atomic transaction ensures data consistency

---

## Status: ✅ READY TO USE

The feature is fully implemented and tested. You can now:
- ✅ Mark best answers
- ✅ Unmark best answers
- ✅ Change best answers (unmark then mark different one)
- ✅ See proper notifications
- ✅ Question status flows correctly (CLOSED ↔ SOLVED)

**Your issue is solved! Just reload the page and you'll see the "Unmark Best Answer" button on the answer you marked.** 🎉
