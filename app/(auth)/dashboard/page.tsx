import React from 'react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentInterviews } from '@/components/dashboard/RecentInterviews'
import { ScoreChartWrapper } from '@/components/dashboard/ScoreChartWrapper'
import Icon from '@/components/Icon'
import prisma from '@/lib/db'
import { getAppSession } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getAppSession();
  const userId = session.userId;

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  // Fetch real data from DB in parallel
  const [totalSessions, completedSessions, activeSessions, recentSessions] = await Promise.all([
    prisma.interviewSession.count({ where: { interviewerId: userId } }),
    prisma.interviewSession.count({ where: { status: 'completed', interviewerId: userId } }),
    prisma.interviewSession.findMany({ where: { status: 'active', interviewerId: userId }, include: { candidate: true } }),
    prisma.interviewSession.findMany({
      where: { interviewerId: userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: { candidate: true, report: true }
    })
  ])

  return (
    <section className="screen active" style={{ padding: '1.5rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Overview Hub</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>Global metrics, recent interview sessions, and system health.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-card-border)', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            <Icon name="download" size={16} />
            Export Data
          </button>
          <a href="/interview" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)' }}>
            <Icon name="add" size={18} />
            New Session
          </a>
        </div>
      </div>

      <DashboardStats 
        totalSessions={totalSessions} 
        completedSessions={completedSessions} 
        activeSession={activeSessions[0]} 
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        <RecentInterviews sessions={recentSessions} />

        <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>Average Candidate Score Trend</h3>
            <div style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}><Icon name="more_vert" /></div>
          </div>
          <div style={{ flex: 1, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
              <ScoreChartWrapper />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
