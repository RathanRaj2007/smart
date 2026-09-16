import React from 'react'
import Icon from '@/components/Icon'

export const RecentInterviews = ({ sessions }: { sessions: Array<{ id: string; candidate?: { name?: string }; interviewType?: string; startedAt: string | Date; score: number | null; status: string }> }) => {
  return (
    <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>Recent Activity</h3>
        <button style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>View All</button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {sessions.map((session, idx) => (
          <div key={session.id} style={{ padding: '1.25rem 1.5rem', borderBottom: idx !== sessions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.2s ease', cursor: 'pointer' }} className="hover-bg-light">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '1.1rem' }}>
                {session.candidate?.name?.[0] || 'C'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, fontSize: '0.95rem' }}>{session.candidate?.name || 'Unknown Candidate'}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{session.interviewType || 'Interview'} • {new Date(session.startedAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Score</span>
                <span style={{ color: (session.score || 0) > 80 ? '#10b981' : (session.score || 0) > 60 ? '#f59e0b' : '#ef4444', fontWeight: 600, fontSize: '1rem' }}>
                  {session.score ? Math.round(session.score) + '%' : 'N/A'}
                </span>
              </div>
              <div style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500, 
                background: session.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: session.status === 'completed' ? '#10b981' : '#f59e0b',
                border: `1px solid ${session.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
              }}>
                {session.status}
              </div>
              {session.status === 'completed' && (
                <a href={`/report/${session.id}`} style={{ color: '#6366f1', textDecoration: 'none' }}>
                  <Icon name="chevron_right" />
                </a>
              )}
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No recent sessions found.
          </div>
        )}
      </div>
    </div>
  )
}





