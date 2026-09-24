'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Icon from '@/components/Icon'

type SystemInfo = {
  nodeVersion: string
  platform: string
  env: string
  geminiConfigured: boolean
  groqConfigured: boolean
  databaseConfigured: boolean
}

const defaultSettings: Record<string, string> = {
  'app.name': 'SmartInterview',
  'interview.default_difficulty': 'medium',
  'interview.default_type': 'technical',
  'rag.enabled': 'true',
  'rag.top_k': '5',
  'rag.chunk_size': '1200',
  'rag.chunk_overlap': '200',
  'auth.session_timeout_hours': '24',
  'llm.default_provider': 'gemini',
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(defaultSettings)
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setSettings({ ...defaultSettings, ...data.settings })
        setSystemInfo(data.systemInfo)
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }

  const sectionTitle = (icon: string, title: string) => (
    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', paddingBottom: '1rem', borderBottom: '1px solid var(--color-card-border)' }}>
      <span style={{ color: '#818cf8' }}><Icon name={icon} size={20} /></span>
      {title}
    </h2>
  )

  const fieldRow = (label: string, desc: string, children: React.ReactNode) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ flex: 1, paddingRight: '2rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )

  const selectStyle: React.CSSProperties = {
    background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
    border: '1px solid var(--color-card-border)', borderRadius: '8px',
    padding: '0.5rem 0.75rem', fontSize: '0.875rem', minWidth: '160px',
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
    border: '1px solid var(--color-card-border)', borderRadius: '8px',
    padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '80px', textAlign: 'right',
  }

  const statusDot = (ok: boolean) => (
    <span style={{ color: ok ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>
      {ok ? '● Configured' : '● Not configured'}
    </span>
  )

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', paddingTop: '4rem' }}>Loading settings...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>Admin Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          Configure application-wide settings. Changes are persisted to the database.
        </p>
      </div>

      {/* Section 1: Application Settings */}
      <div style={cardStyle}>
        {sectionTitle('settings', 'Application Settings')}
        {fieldRow('Application Name', 'Displayed in the interface and emails.', (
          <input
            value={settings['app.name'] || 'SmartInterview'}
            onChange={e => set('app.name', e.target.value)}
            style={{ ...inputStyle, width: '200px', textAlign: 'left' }}
          />
        ))}
      </div>

      {/* Section 2: Authentication / Security */}
      <div style={cardStyle}>
        {sectionTitle('security', 'Authentication & Security')}
        {fieldRow(
          'Session Timeout (hours)',
          'How long a user session remains active before requiring re-login.',
          <input
            type="number" min={1} max={168}
            value={settings['auth.session_timeout_hours'] || '24'}
            onChange={e => set('auth.session_timeout_hours', e.target.value)}
            style={inputStyle}
          />
        )}
        {fieldRow(
          'Session Secret',
          'Configured via SESSION_SECRET environment variable. Never exposed here.',
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>••••••••••••••••</span>
        )}
      </div>

      {/* Section 3: Interview Defaults */}
      <div style={cardStyle}>
        {sectionTitle('quiz', 'Interview Defaults')}
        {fieldRow('Default Difficulty', 'Base difficulty for newly created interviews.', (
          <select style={selectStyle} value={settings['interview.default_difficulty']} onChange={e => set('interview.default_difficulty', e.target.value)}>
            <option value="beginner">Beginner</option>
            <option value="medium">Medium</option>
            <option value="advanced">Advanced</option>
          </select>
        ))}
        {fieldRow('Default Interview Type', 'Default interview mode for new sessions.', (
          <select style={selectStyle} value={settings['interview.default_type']} onChange={e => set('interview.default_type', e.target.value)}>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="mixed">Mixed</option>
          </select>
        ))}
      </div>

      {/* Section 4: RAG / Knowledge Base Settings */}
      <div style={cardStyle}>
        {sectionTitle('memory', 'RAG / Knowledge Base Settings')}
        {fieldRow('RAG Enabled', 'Enable/disable RAG retrieval during interviews.', (
          <select style={selectStyle} value={settings['rag.enabled']} onChange={e => set('rag.enabled', e.target.value)}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        ))}
        {fieldRow('Top K Results', 'Number of document chunks retrieved per RAG query (1–20).', (
          <input type="number" min={1} max={20} value={settings['rag.top_k'] || '5'} onChange={e => set('rag.top_k', e.target.value)} style={inputStyle} />
        ))}
        {fieldRow('Chunk Size (chars)', 'Characters per document chunk during indexing.', (
          <input type="number" min={200} max={4000} step={100} value={settings['rag.chunk_size'] || '1200'} onChange={e => set('rag.chunk_size', e.target.value)} style={inputStyle} />
        ))}
        {fieldRow('Chunk Overlap (chars)', 'Overlap between consecutive document chunks.', (
          <input type="number" min={0} max={800} step={50} value={settings['rag.chunk_overlap'] || '200'} onChange={e => set('rag.chunk_overlap', e.target.value)} style={inputStyle} />
        ))}
        {fieldRow('Embedding Model', 'Local sentence embedding model (read-only).', (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>all-MiniLM-L6-v2 (384-dim, local)</span>
        ))}
        {fieldRow('Vector Store', 'Vector database backend (read-only).', (
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>pgvector (PostgreSQL)</span>
        ))}
      </div>

      {/* Section 5: LLM Settings */}
      <div style={cardStyle}>
        {sectionTitle('auto_awesome', 'LLM Settings')}
        {fieldRow('Default LLM Provider', 'Fallback provider when no user preference is set.', (
          <select style={selectStyle} value={settings['llm.default_provider']} onChange={e => set('llm.default_provider', e.target.value)}>
            <option value="gemini">Gemini</option>
            <option value="groq">Groq</option>
          </select>
        ))}
        {fieldRow(
          'Gemini API Key',
          'Configure via GEMINI_API_KEY environment variable. Never exposed here.',
          systemInfo ? statusDot(systemInfo.geminiConfigured) : null
        )}
        {fieldRow(
          'Groq API Key',
          'Configure via GROQ_API_KEY environment variable. Never exposed here.',
          systemInfo ? statusDot(systemInfo.groqConfigured) : null
        )}
      </div>

      {/* Section 6: System Information */}
      {systemInfo && (
        <div style={cardStyle}>
          {sectionTitle('info', 'System Information')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { label: 'Node.js Version', value: systemInfo.nodeVersion },
              { label: 'Platform', value: systemInfo.platform },
              { label: 'Environment', value: systemInfo.env },
              { label: 'Database', value: systemInfo.databaseConfigured ? '● Connected' : '● Not connected' },
              { label: 'Gemini API', value: systemInfo.geminiConfigured ? '● Configured' : '● Not configured' },
              { label: 'Groq API', value: systemInfo.groqConfigured ? '● Configured' : '● Not configured' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--color-bg-secondary)', borderRadius: '8px',
                padding: '1rem', border: '1px solid var(--color-card-border)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: value.startsWith('●') ? (value.includes('Connected') || value.includes('Configured') ? '#10b981' : '#ef4444') : 'var(--color-text-primary)', fontFamily: 'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', paddingBottom: '2rem' }}>
        {saveStatus === 'success' && <span style={{ color: '#10b981', fontWeight: 500 }}>✓ Settings saved successfully</span>}
        {saveStatus === 'error' && <span style={{ color: '#ef4444', fontWeight: 500 }}>✗ Failed to save settings</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', border: 'none', borderRadius: '10px',
            padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
