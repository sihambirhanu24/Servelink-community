-- FIX: Set department for teachers at LEVEL_2 and above
-- This is required for department-specific chat rooms to appear

-- Option 1: Update a specific teacher by email
UPDATE "Teacher"
SET "department" = 'Mathematics'  -- Change to: Physics, English, Chemistry, Biology, etc.
WHERE email = 'your-email@example.com';  -- Replace with actual email

-- Option 2: Update all LEVEL_3 (Zone) teachers who don't have a department
UPDATE "Teacher"
SET "department" = 'Mathematics'
WHERE level = 'LEVEL_3' AND "department" IS NULL;

-- Option 3: Update all teachers at LEVEL_2 and above with no department
UPDATE "Teacher"
SET "department" = 'Mathematics'
WHERE level IN ('LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5') 
  AND "department" IS NULL;

-- Verify the update
SELECT 
  id,
  "firstName",
  "lastName",
  email,
  level,
  department,
  zone
FROM "Teacher"
WHERE level != 'LEVEL_1'
ORDER BY level, "lastName";

-- After updating, you MUST:
-- 1. Logout from the application
-- 2. Login again (to get fresh JWT token with department)
-- 3. The backend will auto-create department-specific communities
-- 4. Click chat icon - should now show 2 different rooms
