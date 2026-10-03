const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const otps = await prisma.otpVerification.findMany();
  console.log(otps);
}

main().catch(console.error).finally(() => prisma.$disconnect());
