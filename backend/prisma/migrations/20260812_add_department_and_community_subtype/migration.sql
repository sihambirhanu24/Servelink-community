-- ============================================================
-- Migration: Add department field to Teacher and Community
-- Add CommunitySubtype enum (COMMON | DEPARTMENT) to Community
-- Add isActive field to Community
-- Add unique constraint to prevent duplicate community scopes
-- ============================================================

-- Step 1: Create the CommunitySubtype enum
CREATE TYPE "CommunitySubtype" AS ENUM ('COMMON', 'DEPARTMENT');

-- Step 2: Add department column to Teacher (optional, used for LEVEL_2–5)
ALTER TABLE "Teacher" ADD COLUMN "department" TEXT;

-- Step 3: Add new columns to Community
ALTER TABLE "Community"
  ADD COLUMN "subtype"    "CommunitySubtype" NOT NULL DEFAULT 'COMMON',
  ADD COLUMN "department" TEXT,
  ADD COLUMN "isActive"   BOOLEAN NOT NULL DEFAULT true;

-- Step 4: Drop old unique constraint if it somehow exists from a previous attempt
DROP INDEX IF EXISTS "Community_unique_community_scope";

-- Step 5: Create the unique constraint on community scope.
-- We use a partial-index strategy compatible with PostgreSQL < 15
-- (avoids NULLS NOT DISTINCT which requires pg 15+).
-- The approach: coalesce NULLs to a sentinel string so each combination
-- is truly unique in the index, but still queryable using real NULLs.
-- We create a UNIQUE index on expressions that coerce NULLs to ''.
CREATE UNIQUE INDEX "Community_unique_community_scope"
  ON "Community" (
    "type",
    "subtype",
    COALESCE("school",     ''),
    COALESCE("woreda",     ''),
    COALESCE("zone",       ''),
    COALESCE("region",     ''),
    COALESCE("department", '')
  );

-- Step 6: Performance indexes
CREATE INDEX "Community_department_idx" ON "Community" ("department");
CREATE INDEX "Community_type_subtype_idx" ON "Community" ("type", "subtype");
CREATE INDEX "Teacher_department_idx"   ON "Teacher"   ("department");
CREATE INDEX "Teacher_level_idx"        ON "Teacher"   ("level");
