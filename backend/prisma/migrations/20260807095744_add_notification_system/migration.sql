/*
  Warnings:

  - You are about to drop the column `teacherId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `receiverId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'COMMENT', 'BOOKMARK', 'COMMUNITY_JOIN', 'LEVEL_UPGRADE', 'REPORT', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_teacherId_fkey";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "teacherId",
ADD COLUMN     "receiverId" TEXT NOT NULL,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
