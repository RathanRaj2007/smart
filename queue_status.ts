import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const activeSessions = await prisma.interviewSession.findMany({
    where: { status: 'active' },
    include: { questions: true }
  });
  console.log('Active Sessions:', activeSessions.length);
  for (const s of activeSessions) {
    if (s.questions.length === 0) {
      console.log('Marking zombie session completed:', s.id);
      await prisma.interviewSession.update({ where: { id: s.id }, data: { status: 'completed' }});
    }
  }
  process.exit(0);
}
main().catch(console.error);
