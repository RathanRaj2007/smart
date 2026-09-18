export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import prisma from '@/lib/db'
import React from 'react'
import { getAppSession } from '@/lib/auth'

export default async function ReportIndexPage() {
  const session = await getAppSession();
  const userId = session.userId;

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const latestSession = await prisma.interviewSession.findFirst({
    where: {
      interviewerId: userId,
      report: { isNot: null }
    },
    orderBy: {
      startedAt: 'desc'
    }
  })

  if (latestSession) {
    redirect(`/report/${latestSession.id}`)
  }

  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem' }}>No Reports Available</h2>
      <p>You have not completed any interviews yet.</p>
      <a href="/interview" style={{ display: 'inline-block', marginTop: '1.5rem', background: '#6366f1', color: 'var(--color-text-primary)', textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px' }}>
        Start an Interview
      </a>
    </div>
  )
}
