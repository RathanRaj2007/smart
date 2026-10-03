const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { searchChunks } = require('./lib/knowledge-base/searchChunks');

async function main() {
  try {
    const results = await searchChunks("test query", 1, 5);
    console.log("Results:", results);
  } catch (error) {
    console.error("Error:", error);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
