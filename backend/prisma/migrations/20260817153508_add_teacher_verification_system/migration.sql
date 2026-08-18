-- CreateEnum
CREATE TYPE "VerificationDocumentType" AS ENUM ('TEACHER_ID', 'EMPLOYMENT_LETTER', 'TEACHING_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "TeacherVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verificationStatus" "TeacherVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "TeacherVerificationDocument" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" "VerificationDocumentType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherVerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherVerificationDocument_teacherId_idx" ON "TeacherVerificationDocument"("teacherId");

-- AddForeignKey
ALTER TABLE "TeacherVerificationDocument" ADD CONSTRAINT "TeacherVerificationDocument_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
