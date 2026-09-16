import React from 'react'
import Icon from '@/components/Icon'

interface DashboardStatsProps {
  totalSessions: number
  completedSessions: number
  activeSession: { candidate?: { name?: string } } | null
}

export const DashboardStats = ({ totalSessions, completedSessions, activeSession }: DashboardStatsProps) => {

  const cardStyle = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.25rem'
  }

  const iconWrap = (color: string) => ({
    width: '48px', height: '48px', borderRadius: '12px',
    background: `rgba(${color}, 0.1)`,
    border: `1px solid rgba(${color}, 0.2)`,
    color: `rgb(${color})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
      
      <div style={cardStyle}>
        <div style={iconWrap('59, 130, 246')}><Icon name="analytics" size={24} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Total Evaluations</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalSessions}</span>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={iconWrap('16, 185, 129')}><Icon name="check_circle" size={24} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Completed Sessions</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{completedSessions}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Reports generated</span>
        </div>
      </div>

      <div style={{...cardStyle, border: activeSession ? '1px solid rgba(245, 158, 11, 0.3)' : cardStyle.border, background: activeSession ? 'rgba(245, 158, 11, 0.02)' : cardStyle.background }}>
        <div style={iconWrap('245, 158, 11')}><Icon name="record_voice_over" size={24} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Live Sessions</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: activeSession ? '#f59e0b' : '#f8fafc' }}>{activeSession ? 1 : 0}</div>
          {activeSession ? (
            <span style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', width: 'fit-content' }}>
              <Icon name="mic" size={12} /> {activeSession.candidate?.name || 'Active'}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>No active interviews</span>
          )}
        </div>
      </div>

    </div>
  )
}



