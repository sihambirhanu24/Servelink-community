import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
  'Lesson Plans',
  'Teaching Strategies',
  'Learning Activities',
  'Assessments & Exams',
  'Teaching Resources',
  'Curriculum & Syllabus',
  'Classroom Management',
  'Educational Technology',
  'Student Support',
  'Professional Development',
  'STEM & Innovation',
  'Best Practices',
  'Discussion & Questions',
  'Announcements',
  'General',
];

async function seedCategories() {
  console.log('🌱 Seeding 15 professional post categories...');

  let created = 0;
  let skipped = 0;

  for (const name of CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      skipped++;
    } else {
      await prisma.category.create({
        data: { name },
      });
      created++;
    }
  }

  console.log(`  ✓ Categories: ${created} created, ${skipped} skipped\n`);
}

async function seedCommunities() {
  console.log('🌱 Seeding real test communities for all teacher levels...\n');

  const communities: Array<{
    name: string;
    type: 'SCHOOL' | 'WOREDA' | 'ZONE' | 'REGION' | 'NATIONAL';
    school: string | null;
    woreda: string | null;
    zone: string | null;
    region: string | null;
    description: string;
  }> = [
    {
      name: 'School Community',
      type: 'SCHOOL',
      school: 'Addis Ababa School',
      woreda: 'Addis Ababa',
      zone: 'Addis Ababa',
      region: 'Addis Ababa',
      description: 'A school-level community for LEVEL_1 teachers to collaborate and share resources.',
    },
    {
      name: 'Woreda Community',
      type: 'WOREDA',
      school: null,
      woreda: 'Addis Ababa',
      zone: 'Addis Ababa',
      region: 'Addis Ababa',
      description: 'A woreda-level community for LEVEL_2 teachers to coordinate and discuss district-wide initiatives.',
    },
    {
      name: 'Zone Community',
      type: 'ZONE',
      school: null,
      woreda: null,
      zone: 'Addis Ababa',
      region: 'Addis Ababa',
      description: 'A zone-level community for LEVEL_3 teachers to share best practices across zones.',
    },
    {
      name: 'Region Community',
      type: 'REGION',
      school: null,
      woreda: null,
      zone: null,
      region: 'Addis Ababa',
      description: 'A regional community for LEVEL_4 leaders to coordinate regional education strategies.',
    },
    {
      name: 'National Community',
      type: 'NATIONAL',
      school: null,
      woreda: null,
      zone: null,
      region: null,
      description: 'A national community for LEVEL_5 administrators to discuss country-wide policies and initiatives.',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const community of communities) {
    const existing = await prisma.community.findFirst({
      where: {
        name: community.name,
        type: community.type,
      },
    });

    if (existing) {
      console.log(`  ⊘ ${community.type}: "${community.name}" already exists`);
      skipped++;
    } else {
      await prisma.community.create({
        data: community,
      });
      console.log(`  ✓ ${community.type}: "${community.name}" created`);
      created++;
    }
  }

  console.log(`\n  Total: ${created} created, ${skipped} skipped\n`);
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@servelink.et';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@ServeLink2024!';
  const adminName = process.env.ADMIN_NAME ?? 'System Administrator';

  // Seed categories first
  await seedCategories();

  // Seed communities for testing chat
  await seedCommunities();

  const existing = await prisma.admin.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`✓ Admin already exists: ${adminEmail}`);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.create({
    data: {
      email: adminEmail,
      password: hashed,
      name: adminName,
    },
  });

  console.log(`✓ Admin created:`);
  console.log(`  Email   : ${admin.email}`);
  console.log(`  Name    : ${admin.name}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`\n⚠  Change the password immediately after first login in production!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
