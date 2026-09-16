import React from 'react'
import prisma from '@/lib/db'
import Icon from '@/components/Icon'
import { getAppSession } from '@/lib/auth'

export default async function CandidateProfilePage() {
  const session = await getAppSession();
  const userId = session.userId;

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const candidates = await prisma.candidate.findMany({ 
    where: { sessions: { some: { interviewerId: userId } } },
    take: 1, 
    orderBy: { createdAt: 'desc' } 
  })
  const activeCandidate = candidates[0] || { name: 'Unknown Candidate', email: 'N/A' }

  const card: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '16px',
    padding: '2rem',
  }

  return (
    <section className="screen active" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Candidate Profile Details</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>Basic details pulled dynamically from the database.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a href="/interview" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
            <Icon name="play_arrow" size={18} />
            Start Interview
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', marginBottom: '1.25rem' }}>
              <Icon name="person" size={50} />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>{activeCandidate.name}</h3>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '1rem' }}>{activeCandidate.email || 'No email provided'}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
