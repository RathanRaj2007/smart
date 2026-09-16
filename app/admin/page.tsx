import React from 'react'
import prisma from '@/lib/db'
import Icon from '@/components/Icon'

export default async function AdminDashboardPage() {
  const [
    totalInterviewers,
    totalCandidates,
    totalInterviews,
    activeInterviews,
    totalDocuments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'INTERVIEWER' } }),
    prisma.candidate.count(),
    prisma.interviewSession.count(),
    prisma.interviewSession.count({ where: { status: 'active' } }),
    prisma.document.count(),
  ])

  const stats = [
    { name: 'Interviewers', value: totalInterviewers, icon: 'people' },
    { name: 'Candidates', value: totalCandidates, icon: 'person_search' },
    { name: 'Total Interviews', value: totalInterviews, icon: 'question_answer' },
    { name: 'Active Interviews', value: activeInterviews, icon: 'pending' },
    { name: 'Documents', value: totalDocuments, icon: 'library_books' },
  ]

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '2rem' }}>Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {stats.map((stat) => (
          <div key={stat.name} style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: 'var(--color-bg-tertiary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>{stat.name}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
