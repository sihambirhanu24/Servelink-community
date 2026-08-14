-- Update teachers at LEVEL_2 and above to have a department if they don't have one
-- This fixes the issue where teachers upgraded from LEVEL_1 don't have departments

-- Update LEVEL_2 teachers (Woreda)
UPDATE "Teacher"
SET "department" = 'Mathematics'
WHERE "level" = 'LEVEL_2' AND "department" IS NULL;

-- Update LEVEL_3 teachers (Zone)  
UPDATE "Teacher"
SET "department" = 'Mathematics'
WHERE "level" = 'LEVEL_3' AND "department" IS NULL;

-- Update LEVEL_4 teachers (Region)
UPDATE "Teacher"
SET "department" = 'Mathematics'
WHERE "level" = 'LEVEL_4' AND "department" IS NULL;

-- Update LEVEL_5 teachers (National)
UPDATE "Teacher"
SET "department" = 'Mathematics'
WHERE "level" = 'LEVEL_5' AND "department" IS NULL;

-- Display updated teachers
SELECT id, "firstName", "lastName", email, level, department
FROM "Teacher"
WHERE level != 'LEVEL_1'
ORDER BY level, "lastName";
