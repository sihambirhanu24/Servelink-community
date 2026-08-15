-- CreateEnum
CREATE TYPE "TeacherVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TeacherVerificationDocumentType" AS ENUM ('TEACHER_ID', 'EMPLOYMENT_LETTER', 'CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "TeacherVerificationAction" AS ENUM ('SUBMITTED', 'RESUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "teacherIdNumber" TEXT,
ADD COLUMN     "verificationStatus" "TeacherVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- Teachers that already existed before verification was introduced keep their
-- current access: they are grandfathered in as APPROVED instead of being locked out.
UPDATE "Teacher" SET "verificationStatus" = 'APPROVED', "approvedAt" = "createdAt";

-- CreateTable
CREATE TABLE "TeacherVerificationDocument" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "documentType" "TeacherVerificationDocumentType" NOT NULL DEFAULT 'OTHER',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherVerificationEvent" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "action" "TeacherVerificationAction" NOT NULL,
    "actorAdminId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherVerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherVerificationDocument_teacherId_idx" ON "TeacherVerificationDocument"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherVerificationEvent_teacherId_idx" ON "TeacherVerificationEvent"("teacherId");

-- AddForeignKey
ALTER TABLE "TeacherVerificationDocument" ADD CONSTRAINT "TeacherVerificationDocument_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherVerificationEvent" ADD CONSTRAINT "TeacherVerificationEvent_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
