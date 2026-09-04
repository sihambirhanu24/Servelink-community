-- CreateEnum
CREATE TYPE "LiveSessionProvider" AS ENUM ('LIVEKIT', 'GOOGLE_MEET');

-- AlterTable: add provider and meetingUrl to LiveSession
-- Existing rows default to LIVEKIT (safe for all current live sessions)
ALTER TABLE "LiveSession"
  ADD COLUMN "provider"   "LiveSessionProvider" NOT NULL DEFAULT 'LIVEKIT',
  ADD COLUMN "meetingUrl" TEXT;
