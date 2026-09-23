'use client'

import React from 'react'
import Cookies from 'js-cookie'
import { useInterviewState } from '@/components/providers/InterviewStateProvider'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function SettingsPage() {
  const { state, setState } = useInterviewState()
  const { isDark, toggleTheme } = useTheme()
  const [userRole, setUserRole] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/interview/resume')
      .then(res => res.json())
      .then(data => {
        if (data.userRole) setUserRole(data.userRole)
      })
      .catch(() => {})
  }, [])

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '16px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    width: '100%',
    marginTop: '0.5rem'
  }

  const toggleRow = (title: string, desc: string, checked: boolean, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-card-border)' }}>
      <div style={{ paddingRight: '2rem' }}>
        <div style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)', fontWeight: 500, marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={onChange ?? (() => {})} />
        <span className="slider round"></span>
      </label>
    </div>
  )

  const [saveStatus, setSaveStatus] = React.useState('')
  const handleSave = () => {
    Cookies.set('selectedLLM', state.selectedLLM, { expires: 365, path: '/' })
    setSaveStatus('✓ ' + (state.selectedLLM === 'groq' ? 'Groq' : 'Gemini') + ' selected')
    setTimeout(() => setSaveStatus(''), 3000)
  }

  const isCandidate = userRole === 'CANDIDATE'

  return (
    <section className="screen active" style={{ padding: '1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
          {isCandidate ? 'Preferences & Audio Settings' : 'System & LLM Settings'}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
          {isCandidate 
            ? 'Customize theme appearance and voice input preferences.'
            : 'Adjust hyperparameters, model weights, RAG paths, and general UI aesthetics.'}
        </p>
      </div>

      {isCandidate ? (
        <div style={{ maxWidth: '650px' }}>
          <div style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: 500, paddingBottom: '1rem', borderBottom: '1px solid var(--color-card-border)' }}>
              Audio &amp; Display Preferences
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {toggleRow(
                'Enable Voice Input (Whisper)',
                'Record audio streams and translate them to transcription timelines on-the-fly.',
                state.isVoiceActive,
                (e) => setState({ ...state, isVoiceActive: e.target.checked })
              )}
              {toggleRow(
                'Dark Mode',
                isDark
                  ? 'Currently in Dark Mode. Toggle to switch to Light Mode.'
                  : 'Currently in Light Mode. Toggle to switch to Dark Mode.',
                isDark,
                () => toggleTheme()
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="settings-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left Col */}
          <div style={cardStyle}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: 500, paddingBottom: '1rem', borderBottom: '1px solid var(--color-card-border)' }}>
              AI Configuration <span style={{ float: 'right', color: '#10b981', fontSize: '0.9rem' }}>● {state.selectedLLM === 'groq' ? 'Groq' : 'Gemini'}</span>
            </h3>

            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Core Large Language Model (LLM)</label>
              <select style={selectStyle} value={state.selectedLLM} onChange={(e) => setState({ ...state, selectedLLM: e.target.value })}>
                <option value="gemini">Gemini</option>
                <option value="groq">Groq</option>
              </select>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Controls suggestions generator engine and report compiler.</div>
            </div>

            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Interview Base Difficulty</label>
              <select style={selectStyle} value={state.difficulty} onChange={(e) => setState({ ...state, difficulty: e.target.value })}>
                <option value="beginner">Beginner (Junior Roles)</option>
                <option value="intermediate">Intermediate (Mid-Level Roles)</option>
                <option value="advanced">Advanced (Senior / Architect Roles)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {toggleRow('Enable Adaptive Learning', 'Automatically adjusts question difficulty based on dynamic candidate performance score.', true)}
              {toggleRow('RAG Engine Injection', 'Inject company\'s local codebase and resume corpus into LLM context window.', true)}
            </div>
          </div>

          {/* Right Col */}
          <div style={{ ...cardStyle, justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)', fontWeight: 500, paddingBottom: '1rem', borderBottom: '1px solid var(--color-card-border)', marginBottom: '2rem' }}>
                Audio &amp; Preferences
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {toggleRow(
                  'Enable Voice Input (Whisper)',
                  'Record audio streams and translate them to transcription timelines on-the-fly.',
                  state.isVoiceActive,
                  (e) => setState({ ...state, isVoiceActive: e.target.checked })
                )}
                {toggleRow(
                  'Dark Mode',
                  isDark
                    ? 'Currently in Dark Mode. Toggle to switch to Light Mode.'
                    : 'Currently in Light Mode. Toggle to switch to Dark Mode.',
                  isDark,
                  () => toggleTheme()
                )}
                {toggleRow('Email Notifications', 'Send finalized reports directly to recruiter email.', false)}
              </div>
            </div>

            <div className="settings-actions-row" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              {saveStatus && <span style={{ color: '#10b981', alignSelf: 'center', fontWeight: 'bold' }}>{saveStatus}</span>}
              <button
                onClick={handleSave}
                style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
              >
                Save Configurations
              </button>
              <button
                style={{ flex: 1, background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-card-border)', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
