import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@servelink.et';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@ServeLink2024!';
  const adminName = process.env.ADMIN_NAME ?? 'System Administrator';

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
