-- Add LiveKit room name; keep existing meetingRoomId as a fallback identifier.
ALTER TABLE "LiveSession" ADD COLUMN IF NOT EXISTS "livekitRoomName" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "LiveSession_livekitRoomName_key" ON "LiveSession"("livekitRoomName");

UPDATE "LiveSession"
SET "livekitRoomName" = 'live-session-' || "id"
WHERE "livekitRoomName" IS NULL;

-- Remove Restream-specific columns. Session/payment/registration rows are preserved.
ALTER TABLE "LiveSession" DROP COLUMN IF EXISTS "restreamChannelId";
ALTER TABLE "LiveSession" DROP COLUMN IF EXISTS "restreamPlayerUrl";
ALTER TABLE "LiveSession" DROP COLUMN IF EXISTS "restreamEventId";
ALTER TABLE "LiveSession" DROP COLUMN IF EXISTS "restreamStatus";
