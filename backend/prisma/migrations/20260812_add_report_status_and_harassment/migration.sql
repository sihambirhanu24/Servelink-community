-- AlterEnum
-- This will fail if there are existing enum values to be migrated off of the old variant
ALTER TYPE "ReportReason" ADD VALUE 'HARASSMENT';
ALTER TYPE "ReportReason" ADD VALUE 'MISINFORMATION';

-- CreateEnum for ReportStatus
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- AlterTable CommunityReport
ALTER TABLE "CommunityReport" ADD COLUMN "status" "ReportStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "CommunityReport" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add unique constraint on (teacherId, postId) to prevent duplicate reports
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_teacherId_postId_key" UNIQUE("teacherId", "postId");

-- Add cascade delete
ALTER TABLE "CommunityReport" DROP CONSTRAINT "CommunityReport_postId_fkey";
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
