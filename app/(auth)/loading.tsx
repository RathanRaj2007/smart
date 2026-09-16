import React from 'react'
import Icon from '@/components/Icon'

export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', minHeight: '50vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)' }}>
        <div className="spinner" style={{ animation: 'spin 1s linear infinite' }}>
          <Icon name="progress_activity" size={40} />
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>Loading...</div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
