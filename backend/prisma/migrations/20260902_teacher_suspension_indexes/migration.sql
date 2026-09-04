-- Indexes supporting server-enforced teacher suspension:
--  * status                      -> admin filters / counts by account state
--  * (status, suspensionUntil)   -> "expire due temporary suspensions" sweep
--  * (teacherId, restoredAt)     -> "open suspension record for this teacher" lookup
CREATE INDEX IF NOT EXISTS "Teacher_status_idx" ON "Teacher"("status");
CREATE INDEX IF NOT EXISTS "Teacher_status_suspensionUntil_idx" ON "Teacher"("status", "suspensionUntil");
CREATE INDEX IF NOT EXISTS "SuspensionHistory_teacherId_restoredAt_idx" ON "SuspensionHistory"("teacherId", "restoredAt");
