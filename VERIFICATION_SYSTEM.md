# Teacher Verification and Admin Approval System

## Overview

Complete implementation of a secure teacher verification system that ensures only approved teachers can access full community features. This system includes document upload, admin review workflows, and verification-based access control integrated with the existing teacher progression system.

## System Architecture

### Database Schema

**TeacherVerificationStatus Enum:**
- `PENDING` - Initial status for new registrations
- `APPROVED` - Admin-approved, full access granted
- `REJECTED` - Rejected with reason, can resubmit

**VerificationDocumentType Enum:**
- `TEACHER_ID` - Teacher ID card
- `EMPLOYMENT_LETTER` - Employment verification letter
- `TEACHING_CERTIFICATE` - Teaching certificate/license
- `OTHER` - Other supporting documents

**Teacher Model Updates:**
- `verificationStatus` (TeacherVerificationStatus, default: PENDING)
- `rejectionReason` (String, nullable)
- `approvedAt` (DateTime, nullable)
- `approvedBy` (String, nullable) - Admin ID who approved

**TeacherVerificationDocument Model:**
- `id` (UUID, primary key)
- `teacherId` (FK to Teacher, CASCADE delete)
- `fileName` (String)
- `filePath` (String) - Secure server path
- `fileType` (VerificationDocumentType)
- `mimeType` (String)
- `fileSize` (Int)
- `uploadedAt` (DateTime)
- Unique constraint: `teacherId + fileType + fileName`

## Backend Implementation

### Security Features

1. **Automatic PENDING Status**
   - `AuthService.register()` always sets `verificationStatus = PENDING`
   - Client-provided status values are ignored
   - No teacher can bypass the verification requirement

2. **JWT Token Enhancement**
   - Added `teacherId` field to JWT payload
   - Used by `VerifiedTeacherGuard` for verification checks
   - Maintains compatibility with existing auth flow

3. **Secure Document Storage**
   - Documents stored in `./uploads/verification-documents/`
   - NOT publicly accessible via static file serving
   - Access controlled through authenticated endpoints only
   - Admins and document owners can view via secure routes

4. **Access Control Guards**
   - `VerifiedTeacherGuard` - Blocks non-APPROVED teachers
   - Runs after `JwtAuthGuard` (authentication required first)
   - Admins bypass verification checks (`isAdmin=true`)
   - Clear error messages guide teachers to verification page

### API Endpoints

#### Teacher Endpoints (Protected by JWT)

**POST /verification/upload**
- Upload verification document with document type
- File validation: PDF, DOCX, JPG, PNG (max 5MB)
- Returns: Document metadata (excludes secure file path)

**GET /verification/status**
- Get current verification status
- Returns: Status, rejection reason (if any), documents list

**POST /verification/resubmit**
- Resubmit after rejection (requires uploaded documents)
- Changes status from REJECTED → PENDING

**GET /verification/documents/:documentId**
- Securely view own document
- File streamed, not exposed via public URL

**DELETE /verification/documents/:documentId**
- Delete own document (only if not APPROVED)
- Removes file from server and database

#### Admin Endpoints (Protected by Admin Role)

**GET /admin/teachers/pending-verification**
- List all teachers with PENDING status
- Includes document metadata and teacher info

**GET /admin/teachers/:id/verification**
- Get detailed verification info for specific teacher
- Full document list with upload timestamps

**PATCH /admin/teachers/:id/approve-verification**
- Approve teacher verification
- Sets: verificationStatus=APPROVED, approvedAt, approvedBy
- Sends notification to teacher

**PATCH /admin/teachers/:id/reject-verification**
- Reject with required reason (min 10 chars)
- Sets: verificationStatus=REJECTED, rejectionReason
- Sends notification with rejection reason

**GET /admin/teachers/:teacherId/documents/:documentId**
- Securely view any teacher's document
- Admin-only access for review purposes

### Service Layer

**TeacherVerificationService Methods:**
- `uploadDocument()` - Handles file validation and storage
- `getVerificationStatus()` - Teacher's current status
- `getPendingTeachers()` - Admin list of pending verifications
- `getTeacherVerificationInfo()` - Detailed teacher info
- `approveTeacher()` - Admin approval with notification
- `rejectTeacher()` - Admin rejection with reason
- `resubmitVerification()` - Teacher resubmission
- `getDocument()` - Secure document access
- `deleteDocument()` - Document removal
- `isTeacherVerified()` - Quick verification check

### Integration Points

**1. Teacher Progression System**
- `TeacherProgressService.awardPostPoints()` checks verification
- Only APPROVED teachers earn progression points
- Non-verified teachers can still post but earn 0 points
- Returns reason: "Teacher verification required to earn points"

**2. Protected Routes**
- **Community Actions:** createPost, likePost, createComment, bookmarkPost
- **Post Management:** createPost, updatePost, deletePost
- **Engagement:** like, unlike, comment, bookmark, report
- All use `@UseGuards(JwtAuthGuard, VerifiedTeacherGuard)`

**3. Notification System**
- Approval notification: "Verification Approved! 🎉"
- Rejection notification: Includes admin's rejection reason
- Notifications sent via existing `NotificationService`

## Frontend Implementation

### Components

**1. VerificationUpload Component**
- File upload with drag-and-drop support
- Document type selection (dropdown)
- Client-side validation: file size (5MB), file type
- Real-time upload progress
- Success/error messaging

**2. VerificationStatus Component**
- Visual status display with icons and colors
  - APPROVED: Green badge with checkmark
  - PENDING: Yellow badge with clock
  - REJECTED: Red badge with X
- Displays rejection reason when rejected
- Lists uploaded documents with metadata
- Document management (view, delete)
- Resubmit button for rejected status

**3. VerificationBanner Component**
- Dashboard alert banner
- Context-aware messages based on status
- Direct link to verification page
- Auto-hides when approved

**4. Admin Verification Dashboard**
- Pending teachers list with full details
- Document preview/download buttons
- Approve/Reject actions with confirmation
- Rejection modal with reason input (min 10 chars)
- Real-time updates after actions

### React Hooks

**useVerification() - Teacher Hook**
```typescript
{
  status: VerificationStatus | null
  documents: VerificationDocument[]
  isLoading: boolean
  uploadDocument: (file, type) => Promise
  deleteDocument: (id) => Promise
  resubmit: () => Promise
  isUploading: boolean
  isDeleting: boolean
  isResubmitting: boolean
}
```

**useAdminVerification() - Admin Hook**
```typescript
{
  pendingTeachers: PendingTeacher[]
  isLoading: boolean
  approveTeacher: (id) => Promise
  rejectTeacher: (id, reason) => Promise
  viewDocument: (teacherId, docId) => void
  isApproving: boolean
  isRejecting: boolean
}
```

### Pages

**1. /verification (Teacher Page)**
- Verification status overview
- Document upload interface
- Requirements and help section
- Resubmission workflow

**2. /admin/verification (Admin Page)**
- List of pending verifications
- Teacher details and documents
- Approve/reject with audit trail
- Statistics dashboard

**3. /dashboard (Updated)**
- VerificationBanner shown when not approved
- Links to verification page
- Context-aware messaging

## Testing Guide

### Manual Testing Workflow

#### 1. New Teacher Registration
```bash
# Expected Behavior:
✓ Teacher created with verificationStatus = PENDING
✓ JWT includes teacherId field
✓ Login response includes verificationStatus
✓ Dashboard shows VerificationBanner
✓ Cannot create posts (blocked by VerifiedTeacherGuard)
```

#### 2. Document Upload
```bash
# Test Cases:
✓ Upload PDF (< 5MB) - Success
✓ Upload DOCX (< 5MB) - Success
✓ Upload JPG/PNG (< 5MB) - Success
✓ Upload > 5MB file - Error "File size exceeds maximum"
✓ Upload .txt file - Error "Invalid file type"
✓ Upload same document twice - Unique constraint error
```

#### 3. Admin Approval Flow
```bash
# Expected Behavior:
✓ Admin sees teacher in pending list
✓ Admin can view all uploaded documents
✓ Approve action sets: verificationStatus=APPROVED, approvedAt, approvedBy
✓ Teacher receives notification
✓ Teacher can now create posts
✓ Teacher earns progression points
✓ VerificationBanner disappears
```

#### 4. Admin Rejection Flow
```bash
# Test Cases:
✓ Reject with <10 char reason - Error validation
✓ Reject with ≥10 char reason - Success
✓ Teacher receives notification with reason
✓ Teacher sees rejection reason in UI
✓ Teacher can delete documents
✓ Teacher can upload new documents
✓ Teacher can resubmit for review
✓ Status changes REJECTED → PENDING after resubmit
```

#### 5. Access Control Tests
```bash
# Protected Actions (PENDING teacher):
✓ POST /community/posts - 403 Forbidden
✓ POST /posts/:id/like - 403 Forbidden
✓ POST /posts/:id/comment - 403 Forbidden
✓ POST /posts/:id/bookmark - 403 Forbidden

# Protected Actions (APPROVED teacher):
✓ All above actions - Success (200/201)
✓ Points awarded for posts
✓ Points awarded for likes received

# Admin Bypass:
✓ Admin can access all routes regardless of verification
```

#### 6. Progression System Integration
```bash
# Test Scenarios:
PENDING Teacher:
✓ Creates post - Post created but 0 points awarded
✓ Receives like - Post owner gets 0 points
✓ Progression UI shows points but no increase

APPROVED Teacher:
✓ Creates post - +5 points (up to 3/day)
✓ Receives like - +1 point
✓ Receives bookmark - +1 point
✓ Violation - -10 points
✓ Level upgrades work normally
```

### API Testing with cURL/Postman

**Upload Document:**
```bash
POST http://localhost:3000/verification/upload
Headers: Authorization: Bearer <token>
Body: form-data
  - file: [binary]
  - documentType: "TEACHER_ID"
```

**Get Status:**
```bash
GET http://localhost:3000/verification/status
Headers: Authorization: Bearer <token>
```

**Admin Approve:**
```bash
PATCH http://localhost:3000/admin/teachers/{teacherId}/approve-verification
Headers: Authorization: Bearer <admin_token>
```

**Admin Reject:**
```bash
PATCH http://localhost:3000/admin/teachers/{teacherId}/reject-verification
Headers: Authorization: Bearer <admin_token>
Body: { "reason": "Documents are not clear, please upload higher quality images" }
```

## Configuration

### Environment Setup

**Backend (.env):**
```env
# Existing variables remain unchanged
# No new environment variables required
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Existing variables remain unchanged
```

### File Storage

**Location:** `backend/uploads/verification-documents/`

**Security:**
- Directory excluded from public serving
- Access via authenticated API endpoints only
- .gitignore configured to exclude uploaded files
- .gitkeep preserves directory structure

### Database Migration

**Already Applied:** `20260817153508_add_teacher_verification_system`

If you need to re-apply:
```bash
cd backend
npx prisma migrate deploy
```

## Security Considerations

### Implemented Security Measures

1. **Server-Side Status Control**
   - Backend always sets PENDING on registration
   - Client cannot manipulate verification status
   - Admin-only approval/rejection

2. **Document Security**
   - No public URL access to documents
   - Authorization check on every document view
   - Owner or admin access only

3. **File Validation**
   - Size limit: 5MB per file
   - Type whitelist: PDF, DOCX, JPG, PNG only
   - MIME type validation
   - Unique filename constraints

4. **Access Control**
   - JWT required for all verification endpoints
   - Admin role required for approval endpoints
   - VerifiedTeacherGuard blocks non-approved teachers
   - Proper error messages (no info leakage)

5. **Audit Trail**
   - `approvedBy` field tracks which admin approved
   - `approvedAt` timestamp for compliance
   - `createdAt` on documents for tracking
   - Activity logs in service layer

### Recommended Additional Security

1. **Rate Limiting**
   - Limit upload attempts per teacher
   - Prevent spam uploads

2. **File Scanning**
   - Integrate antivirus scanning
   - Check for malicious content

3. **Encryption at Rest**
   - Encrypt sensitive documents on disk
   - Use encrypted storage service

4. **Audit Logging**
   - Log all approval/rejection actions
   - Track document access
   - Monitor suspicious patterns

## Troubleshooting

### Common Issues

**Issue 1: "Module not found: @/lib/axios"**
```bash
Solution: Check that axios configuration exists at frontend/src/lib/axios.ts
Verify API_URL environment variable is set
```

**Issue 2: "403 Forbidden" on post creation**
```bash
Cause: Teacher not verified
Solution: Admin must approve teacher verification
Check: GET /verification/status should show "APPROVED"
```

**Issue 3: File upload fails with "Invalid file type"**
```bash
Cause: File MIME type not in whitelist
Solution: Only upload PDF, DOCX, JPG, PNG files
Check file extension matches content type
```

**Issue 4: "Teacher verification required to earn points"**
```bash
Cause: TeacherProgressService checks verification status
Solution: This is expected behavior for PENDING/REJECTED teachers
Admin approval needed to earn points
```

**Issue 5: Documents not visible in admin dashboard**
```bash
Check: Teacher actually uploaded documents
Check: Backend uploads/verification-documents/ directory exists
Check: Multer configuration is correct
Check: File permissions on uploads directory
```

## Maintenance

### Monitoring

**Key Metrics to Track:**
- Average verification approval time
- Rejection rate and common reasons
- Document upload success rate
- Pending verification backlog
- Failed verification attempts

**Database Queries:**
```sql
-- Pending verifications count
SELECT COUNT(*) FROM "Teacher" WHERE "verificationStatus" = 'PENDING';

-- Average approval time
SELECT AVG(EXTRACT(EPOCH FROM ("approvedAt" - "createdAt"))/3600) as avg_hours
FROM "Teacher" WHERE "verificationStatus" = 'APPROVED';

-- Rejection reasons breakdown
SELECT "rejectionReason", COUNT(*) 
FROM "Teacher" 
WHERE "verificationStatus" = 'REJECTED' 
GROUP BY "rejectionReason";
```

### Backup Recommendations

1. **Database Backups**
   - Regular backups of Teacher and TeacherVerificationDocument tables
   - Retain approval audit trail

2. **Document Backups**
   - Regular backups of uploads/verification-documents/
   - Encrypted backup storage recommended

3. **Retention Policy**
   - Define how long to keep rejected documents
   - GDPR compliance considerations

## Future Enhancements

### Potential Improvements

1. **Automated Verification**
   - OCR for automatic document parsing
   - Integration with government teacher databases
   - AI-powered document validation

2. **Batch Operations**
   - Bulk approve/reject functionality
   - CSV export of pending verifications

3. **Enhanced Admin Tools**
   - Verification statistics dashboard
   - Performance metrics
   - Rejection reason templates

4. **User Experience**
   - Email notifications (in addition to in-app)
   - SMS verification code
   - Document upload via mobile app

5. **Compliance Features**
   - Document expiry tracking
   - Periodic re-verification
   - Compliance report generation

## Support

### For Developers

- Backend code: `backend/src/verification/`
- Frontend components: `frontend/src/components/verification/`
- Database schema: `backend/prisma/schema.prisma`
- Migration: `backend/prisma/migrations/20260817153508_add_teacher_verification_system/`

### For Administrators

- Admin panel: `https://yourdomain.com/admin/verification`
- Training documentation needed for approval process
- Escalation process for edge cases
- Support contact for technical issues

## Conclusion

The Teacher Verification and Admin Approval System is now fully implemented with:
- ✅ Secure backend API with comprehensive validation
- ✅ Access control guards on all protected routes
- ✅ Integration with teacher progression system
- ✅ Complete frontend UI for teachers and admins
- ✅ Document upload and management
- ✅ Notification system integration
- ✅ Audit trail and compliance features

The system ensures that only verified teachers can access full community features while maintaining a smooth user experience and secure administrative workflow.
