const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { username: 'admin' },
    data: { role: 'ADMIN' }
  });
  console.log('Updated admin user role to ADMIN');
}
main().finally(() => prisma.$disconnect());
