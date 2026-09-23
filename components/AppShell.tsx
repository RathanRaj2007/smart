'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { InterviewStateProvider } from './providers/InterviewStateProvider'

interface AppShellProps {
  children: React.ReactNode
  username?: string
  role?: string
}

export const AppShell = ({ children, username, role }: AppShellProps) => {
  return (
    <InterviewStateProvider>
      <Header username={username} role={role} />
      <div className="app-container">
        <Sidebar role={role} />
        <main className="main-content">
          {children}
        </main>
      </div>
      <footer className="app-footer no-print">
        <div className="footer-left">
          <span>Adaptive Interview Assistant &bull; v1.0</span>
        </div>
        <div className="footer-center">
          <span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600 }}>Powered by LLM + RAG</span>
        </div>
        <div className="footer-right">
          <span className="system-time" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
            Workspace Active
          </span>
        </div>
      </footer>
    </InterviewStateProvider>
  )
}
