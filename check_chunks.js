const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.document.findMany();
  console.log("Documents:", docs.length);
  
  const chunks = await prisma.$queryRawUnsafe(`SELECT id, "documentId", embedding IS NULL as embedding_is_null FROM "DocumentChunk" LIMIT 10;`);
  console.log("Chunks:", chunks);
}
main().catch(console.error).finally(() => prisma.$disconnect());
