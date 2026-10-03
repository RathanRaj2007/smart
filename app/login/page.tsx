'use client'

import React, { useState, useEffect,  } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/Icon'

type Role = 'ADMIN' | 'INTERVIEWER' | 'CANDIDATE'
type Stage = 'role-select' | 'password' | 'set-password'

export default function LoginPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [stage, setStage] = useState<Stage>('role-select')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [setPasswordEmail, setSetPasswordEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    const r = p.get('role')
    const em = p.get('email')
    if (r === 'ADMIN' || r === 'INTERVIEWER' || r === 'CANDIDATE') setSelectedRole(r)
    if (em) setEmailOrUsername(em)
  }, [])

  const resetAll = () => {
    setSelectedRole(null)
    setStage('role-select')
    setError('')
    setSuccessMsg('')
    setLoginPassword('')
    setShowLoginPassword(false)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sign in')
      router.push(data.redirect || '/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    if (!emailOrUsername.trim()) { setError('Please enter your email or username.'); return }
    if (!loginPassword) { setError('Please enter your password.'); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailOrUsername.trim(), password: loginPassword }),
      })
      const data = await res.json()
      if (res.status === 403 && data.requiresPasswordSetup) {
        setSetPasswordEmail(data.email || emailOrUsername.trim().toLowerCase())
        setStage('set-password')
        setError('')
        return
      }
      if (!res.ok) throw new Error(data.error || 'Sign in failed')
      if (data.redirect) {
        router.push(data.redirect)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newPassword) { setError('Please enter a new password.'); return }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match.'); return }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: setPasswordEmail,
          newPassword,
          role: selectedRole,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to set password')
      setSuccessMsg(data.message || 'Password set! Redirecting...')
      if (data.redirect) {
        setTimeout(() => router.push(data.redirect), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password.')
    } finally {
      setIsLoading(false)
    }
  }

  const roleGradient =
    selectedRole === 'CANDIDATE'
      ? 'linear-gradient(135deg, #059669, #10b981)'
      : 'linear-gradient(135deg, #6366f1, #8b5cf6)'

  const badgeStyle: React.CSSProperties =
    selectedRole === 'CANDIDATE'
      ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
      : selectedRole === 'INTERVIEWER'
      ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8' }
      : { background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }

  const stageTitle =
    stage === 'role-select'
      ? 'Sign in to your workspace'
      : stage === 'password'
      ? selectedRole === 'ADMIN'
        ? 'Administrator Portal'
        : 'Sign In'
      : 'Set Your Password'

  const stageSubtitle =
    stage === 'role-select'
      ? 'Choose your account type to continue'
      : stage === 'password' && selectedRole === 'ADMIN'
      ? 'Secure administrator access'
      : stage === 'password'
      ? 'Access your workspace'
      : 'Your account needs a password before you can sign in'

  return (
    <div className="auth-page-bg">
      <div className="auth-card">
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)' }} />
        <div style={{ padding: '2.25rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
              <div style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#818cf8',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="memory" size={24} />
              </div>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.35rem 0' }}>
              SmartInterview AI
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {stageTitle}
            </p>
            {stage !== 'role-select' && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', margin: '0.3rem 0 0 0' }}>
                {stageSubtitle}
              </p>
            )}
          </div>

          {error && (
            <div className="auth-alert auth-alert-error">
              <Icon name="error" size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="auth-alert auth-alert-success">
              <Icon name="check_circle" size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{successMsg}</span>
            </div>
          )}

          {stage === 'role-select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <button
                onClick={() => { setSelectedRole('ADMIN'); setStage('password') }}
                style={{
                  width: '100%',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-card-border)',
                  color: 'var(--color-text-primary)',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                }}
              >
                <Icon name="shield" size={18} /> Login as Admin
              </button>

              <button
                onClick={() => { setSelectedRole('INTERVIEWER'); setStage('password') }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                }}
              >
                <Icon name="co_present" size={18} /> Login as Interviewer
              </button>

              <button
                onClick={() => { setSelectedRole('CANDIDATE'); setStage('password') }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
                }}
              >
                <Icon name="person" size={18} /> Login as Candidate
              </button>
            </div>
          )}

          {stage === 'password' && selectedRole === 'ADMIN' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <button className="auth-back-btn" onClick={resetAll}>
                  <Icon name="arrow_back" size={16} /> Change Role
                </button>
                <span className="auth-role-badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                  Admin
                </span>
              </div>
              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label htmlFor="admin-user" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                    Admin Username
                  </label>
                  <input
                    id="admin-user"
                    type="text"
                    className="auth-input"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="admin-pass" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="admin-pass"
                      type={showAdminPassword ? 'text' : 'password'}
                      className="auth-input auth-input-password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                    <button type="button" className="auth-vis-toggle" onClick={() => setShowAdminPassword(!showAdminPassword)}>
                      <Icon name={showAdminPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-submit-btn"
                  style={{ marginTop: '0.4rem', background: 'linear-gradient(135deg, #475569, #334155)' }}
                >
                  {isLoading ? 'Signing in…' : 'Sign In as Admin'}
                </button>
              </form>
            </div>
          )}

          {stage === 'password' && (selectedRole === 'INTERVIEWER' || selectedRole === 'CANDIDATE') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <button className="auth-back-btn" onClick={resetAll}>
                  <Icon name="arrow_back" size={16} /> Change Role
                </button>
                <span className="auth-role-badge" style={badgeStyle}>
                  {selectedRole === 'CANDIDATE' ? 'Candidate' : 'Interviewer'}
                </span>
              </div>
              <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label htmlFor="login-email" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                    Email / Username
                  </label>
                  <input
                    id="login-email"
                    type="text"
                    className="auth-input"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="e.g., user@example.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-pass" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-pass"
                      type={showLoginPassword ? 'text' : 'password'}
                      className="auth-input auth-input-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button type="button" className="auth-vis-toggle" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                      <Icon name={showLoginPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-submit-btn"
                  style={{ marginTop: '0.4rem', background: roleGradient }}
                >
                  {isLoading ? 'Verifying password…' : 'Continue →'}
                </button>
              </form>
            </div>
          )}

          {stage === 'set-password' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <button className="auth-back-btn" onClick={() => { setStage('password'); setError(''); setSuccessMsg('') }}>
                  <Icon name="arrow_back" size={16} /> Back
                </button>
                <span className="auth-role-badge" style={badgeStyle}>
                  {selectedRole === 'CANDIDATE' ? 'Candidate' : 'Interviewer'}
                </span>
              </div>
              <div className="auth-alert auth-alert-info" style={{ marginBottom: '1.25rem' }}>
                <Icon name="info" size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  Your account (<strong style={{ wordBreak: 'break-all' }}>{setPasswordEmail}</strong>) was created without a password. Set one now to activate two-step login.
                </div>
              </div>
              <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label htmlFor="new-pass" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="new-pass"
                      type={showNewPassword ? 'text' : 'password'}
                      className="auth-input auth-input-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 chars, include a number or symbol"
                      required
                    />
                    <button type="button" className="auth-vis-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                      <Icon name={showNewPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-new-pass" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirm-new-pass"
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      className="auth-input auth-input-password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                    />
                    <button type="button" className="auth-vis-toggle" onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                      <Icon name={showConfirmNewPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="auth-submit-btn"
                  style={{ marginTop: '0.4rem', background: roleGradient }}
                >
                  {isLoading ? 'Setting password…' : 'Set Password & Continue →'}
                </button>
              </form>
            </div>
          )}

          {(stage === 'role-select' || ((stage === 'password') && selectedRole !== 'ADMIN')) && (
            <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <span>Don&apos;t have an account? </span>
              <Link href="/register" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
