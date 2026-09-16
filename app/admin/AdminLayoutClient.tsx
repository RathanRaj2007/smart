'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Icon from '@/components/Icon'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { name: 'Users', path: '/admin/users', icon: 'people' },
    { name: 'Interviews', path: '/admin/interviews', icon: 'question_answer' },
    { name: 'Candidates', path: '/admin/candidates', icon: 'person_search' },
    { name: 'Knowledge Base', path: '/admin/knowledge-base', icon: 'library_books' },
    { name: 'Analytics', path: '/admin/analytics', icon: 'analytics' },
    { name: 'AI / LLM', path: '/admin/ai', icon: 'smart_toy' },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: 'history' },
    { name: 'Settings', path: '/admin/settings', icon: 'settings' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>SmartInterview</h2>
          <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', marginTop: '8px', display: 'inline-block' }}>Admin Area</span>
        </div>
        
        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link key={item.path} href={item.path} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', textDecoration: 'none', color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'transparent', fontWeight: isActive ? 500 : 400, transition: 'background-color 0.2s' }}>
                <Icon name={item.icon} size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', textAlign: 'left', fontSize: '1rem' }}>
            <Icon name="logout" size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
