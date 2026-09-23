'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/Icon'

interface SidebarProps {
  role?: string
}

export const Sidebar = ({ role = 'INTERVIEWER' }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = role === 'CANDIDATE' ? [
    { href: '/candidate', icon: 'dashboard', text: 'Candidate Dashboard' },
    { href: '/report', icon: 'analytics', text: 'Interview History / My Reports' },
    { href: '/candidate?tab=performance', icon: 'trending_up', text: 'Performance' },
    { href: '/settings', icon: 'settings', text: 'Settings & Profile' },
  ] : [
    { href: '/dashboard', icon: 'dashboard', text: 'Overview Hub' },
    { href: '/interview', icon: 'mic', text: 'Live Interview' },
    { href: '/candidate', icon: 'person', text: 'Candidate Profile' },
    { href: '/suggestions', icon: 'lightbulb', text: 'Question Bank' },
    { href: '/report', icon: 'analytics', text: 'Evaluation Report' },
    { href: '/knowledge-base', icon: 'description', text: 'Knowledge Base' },
    { href: '/settings', icon: 'settings', text: 'Settings & Config' },
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <button 
        className="sidebar-toggle-btn"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle sidebar"
        style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', padding: '1rem', cursor: 'pointer' }}
      >
        <Icon name="menu" />
      </button>

      <nav className="sidebar-nav">
        <ul style={{ listStyle: 'none', padding: '0 0.75rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', 
                  borderRadius: '8px', color: isActive ? '#f8fafc' : '#94a3b8', 
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 500 : 400,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}>
                  <div style={{ color: isActive ? '#818cf8' : '#64748b' }}>
                    <Icon name={item.icon} size={20} />
                  </div>
                  {!collapsed && <span className="nav-text" style={{ flex: 1 }}>{item.text}</span>}
                  
                  {!collapsed && item.href === '/suggestions' && (
                    <span style={{ background: '#6366f1', color: 'var(--color-text-primary)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>12</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-system-status" style={{ background: 'var(--color-bg-tertiary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              {!collapsed && <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 500 }}>RAG Engine Online</span>}
            </div>
            {!collapsed && <div style={{ color: '#6366f1' }}><Icon name="analytics" size={16} /></div>}
          </div>
          {!collapsed && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>All systems operational</div>}
        </div>
      </div>
    </aside>
  )
}
