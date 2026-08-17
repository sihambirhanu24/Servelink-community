-- CreateEnum
CREATE TYPE "TeacherActivityType" AS ENUM ('POST_CREATED', 'LIKE_RECEIVED', 'BOOKMARK_RECEIVED', 'VIOLATION_CONFIRMED');

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "privilegeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "privilegeStartAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TeacherActivity" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "type" "TeacherActivityType" NOT NULL,
    "points" INTEGER NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherActivity_teacherId_idx" ON "TeacherActivity"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherActivity_teacherId_type_createdAt_idx" ON "TeacherActivity"("teacherId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherActivity_teacherId_type_referenceId_key" ON "TeacherActivity"("teacherId", "type", "referenceId");

-- AddForeignKey
ALTER TABLE "TeacherActivity" ADD CONSTRAINT "TeacherActivity_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
