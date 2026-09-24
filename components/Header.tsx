'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/providers/ToastProvider'
import Icon from '@/components/Icon'

import { formatInterviewerName } from '@/lib/formatters'

interface HeaderProps {
  username?: string
  role?: string
}

export const Header = ({ username = 'User', role = 'INTERVIEWER' }: HeaderProps) => {
  const router = useRouter()
  const { showToast } = useToast()

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' })
      if (res.ok) {
        router.push('/login')
      } else {
        showToast('Logout failed', 'error')
      }
    } catch (_error) {
      showToast('Logout error', 'error')
    }
  }

  const roleLabel = role === 'CANDIDATE' ? 'Candidate' : role === 'ADMIN' ? 'Administrator' : 'Lead Tech Recruiter'
  const displayName = formatInterviewerName({ username })

  return (
    <header className="app-header no-print">
      <div className="header-left">
        <div className="logo-container">
          <div className="logo-container" style={{ alignItems: 'center' }}>
            <div className="logo-icon">Smart Interview</div>
            <div className="logo-text">
              <h1>Adaptive Interview</h1>
              <span className="logo-tagline">AI-Powered Assessor</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="header-center">
        {role !== 'CANDIDATE' && (
          <div className="search-bar">
            <Icon name="search" className="search-icon" size={18} />
            <input type="text" placeholder="Search candidates, skills, or past sessions..." />
          </div>
        )}
      </div>
      
      <div className="header-right">
        <div className="header-actions">
          {role !== 'CANDIDATE' && (
            <button className="icon-btn" title="Add Candidate">
              <Icon name="person_add" />
            </button>
          )}
          <button className="icon-btn notification-btn" title="Notifications">
            <Icon name="notifications" />
            <span className="badge">1</span>
          </button>
          <button className="icon-btn" onClick={handleLogout} title="Logout">
            <Icon name="logout" />
          </button>
        </div>
        
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 12px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', background: 'var(--color-bg-tertiary)' }}>
          <div className="avatar-placeholder" style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: role === 'CANDIDATE' ? 'rgba(16,185,129,0.1)' : 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role === 'CANDIDATE' ? '#10b981' : '#6366f1', border: role === 'CANDIDATE' ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(99, 102, 241, 0.2)' }}>
            <Icon name="person" size={18} />
          </div>
          <div className="user-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span className="user-name" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>{displayName}</span>
            <span className="user-role" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{roleLabel}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
