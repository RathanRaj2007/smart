import prisma from '../lib/db';

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { id: 'asc' }
  });
  console.log('=== USERS ===');
  console.log(JSON.stringify(users, null, 2));

  const candidates = await prisma.candidate.findMany({
    select: { id: true, name: true, email: true, userId: true },
    orderBy: { createdAt: 'asc' }
  });
  console.log('=== CANDIDATES ===');
  console.log(JSON.stringify(candidates, null, 2));

  const totalSessions = await prisma.interviewSession.count();
  const totalReports = await prisma.interviewReport.count();
  const totalQuestions = await prisma.question.count();
  const totalAnswers = await prisma.answer.count();
  const totalAuditLogs = await prisma.auditLog.count();

  console.log('=== COUNTS ===');
  console.log({
    users: users.length,
    candidates: candidates.length,
    sessions: totalSessions,
    reports: totalReports,
    questions: totalQuestions,
    answers: totalAnswers,
    auditLogs: totalAuditLogs
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
