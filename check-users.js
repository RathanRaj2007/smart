const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(users);
  const candidates = await prisma.candidate.findMany();
  console.log(candidates);
}

main().catch(console.error).finally(() => prisma.$disconnect());
