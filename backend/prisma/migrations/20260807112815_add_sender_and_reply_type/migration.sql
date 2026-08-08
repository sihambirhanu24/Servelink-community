-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'REPLY';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "senderId" TEXT,
ADD COLUMN     "senderName" TEXT;
