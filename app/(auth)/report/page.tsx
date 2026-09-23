export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import React from 'react'
import Link from 'next/link'
import { getAppSession } from '@/lib/auth'

export default async function ReportIndexPage() {
  const session = await getAppSession();
  const userId = session.userId;

  if (!userId) {
    return <div style={{ padding: '2rem', color: 'var(--color-text-primary)' }}>Unauthorized</div>;
  }

  const whereCondition = session.role === 'CANDIDATE'
    ? { candidate: { userId: userId }, report: { isNot: null } }
    : session.role === 'ADMIN'
      ? { report: { isNot: null } }
      : { interviewerId: userId, report: { isNot: null } }

  const latestSession = await prisma.interviewSession.findFirst({
    where: whereCondition,
    orderBy: {
      startedAt: 'desc'
    }
  })

  if (latestSession) {
    redirect(`/report/${latestSession.id}`)
  }

  const isCandidate = session.role === 'CANDIDATE'

  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem' }}>No Reports Available</h2>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
        {isCandidate
          ? 'You do not have any completed interview reports yet. Your interviewer conducts live interviews, and your results will appear here once finalized.'
          : 'No completed interview reports found for your account.'}
      </p>

      {isCandidate ? (
        <Link
          href="/candidate"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            background: '#6366f1',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600
          }}
        >
          Go to Candidate Dashboard
        </Link>
      ) : (
        <Link
          href="/interview"
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            background: '#6366f1',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '0.8rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 600
          }}
        >
          Conduct Live Interview
        </Link>
      )}
    </div>
  )
}
