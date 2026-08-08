/**
 * Seed script — creates the default ServeLink admin account.
 * Run once:  npx ts-node prisma/seed-admin.ts
 *
 * To change credentials later, update the constants below and re-run.
 * The script uses upsert so it is safe to run multiple times.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ADMIN_EMAIL    = 'admin@servelink.et';
const ADMIN_PASSWORD = 'Admin@ServeLink2025';
const ADMIN_NAME     = 'ServeLink Admin';

async function main() {
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.admin.upsert({
    where:  { email: ADMIN_EMAIL },
    update: { password: hashed, name: ADMIN_NAME },
    create: { email: ADMIN_EMAIL, password: hashed, name: ADMIN_NAME },
  });

  console.log('\n✅  Admin account ready:');
  console.log(`   ID    : ${admin.id}`);
  console.log(`   Email : ${admin.email}`);
  console.log(`   Name  : ${admin.name}`);
  console.log('\n🔐  Login at: http://localhost:3000/admin/login\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
