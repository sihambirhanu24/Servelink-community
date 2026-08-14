-- Check the current logged-in teacher's department
-- Replace the email with the actual logged-in user's email

SELECT 
  id,
  "firstName",
  "lastName",
  email,
  level,
  department,
  zone,
  woreda,
  region,
  school
FROM "Teacher"
WHERE email = 'your-email@example.com'  -- Replace with actual email
ORDER BY "createdAt" DESC
LIMIT 1;

-- Check all teachers at LEVEL_3 (Zone)
SELECT 
  id,
  "firstName",
  "lastName",
  email,
  level,
  department,
  zone
FROM "Teacher"
WHERE level = 'LEVEL_3'
ORDER BY "createdAt" DESC;

-- Check all Zone communities
SELECT 
  id,
  name,
  type,
  subtype,
  department,
  zone,
  "isActive"
FROM "Community"
WHERE type = 'ZONE'
ORDER BY subtype, department, name;
