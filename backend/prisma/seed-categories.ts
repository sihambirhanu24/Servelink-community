import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

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

async function main() {
  console.log('🌱 Seeding 15 professional post categories...\n');

  let created = 0;
  let skipped = 0;

  for (const name of CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      console.log(`⊘ Skipped: "${name}" (already exists)`);
      skipped++;
    } else {
      await prisma.category.create({
        data: { name },
      });
      console.log(`✓ Created: "${name}"`);
      created++;
    }
  }

  console.log(
    `\n📊 Seed complete: ${created} created, ${skipped} skipped, ${CATEGORIES.length} total\n`,
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
