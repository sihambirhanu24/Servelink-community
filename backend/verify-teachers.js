const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.teacher.updateMany({
    data: { verified: true }
  });
  console.log('All teachers verified successfully.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
