'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/Icon'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'CANDIDATE' | 'INTERVIEWER'>('CANDIDATE')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getPasswordStrength = (pw: string): { label: string; color: string; pct: number } => {
    if (pw.length === 0) return { label: '', color: 'transparent', pct: 0 }
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw)) score++
    const map: Record<number, { label: string; color: string; pct: number }> = {
      0: { label: 'Too weak', color: '#ef4444', pct: 15 },
      1: { label: 'Weak', color: '#f97316', pct: 35 },
      2: { label: 'Fair', color: '#eab308', pct: 60 },
      3: { label: 'Good', color: '#22c55e', pct: 80 },
      4: { label: 'Strong', color: '#10b981', pct: 100 },
    }
    return map[score]
  }
  const strength = getPasswordStrength(password)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName) { setError('Please enter your full name.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please provide a valid email address.')
      return
    }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!/[0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      setError('Password must contain at least one number or special character.')
      return
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password, role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create account')
      setSuccessMsg(data.message || 'Account created successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const roleGradient =
    role === 'CANDIDATE'
      ? 'linear-gradient(135deg, #059669, #10b981)'
      : 'linear-gradient(135deg, #6366f1, #8b5cf6)'

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
                <Icon name="person_add" size={24} />
              </div>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.35rem 0' }}>
              Create Account
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              Join SmartInterview &mdash; Create your account
            </p>
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

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                Account Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('CANDIDATE')}
                  className={`auth-role-btn${role === 'CANDIDATE' ? ' active' : ''}`}
                >
                  <Icon name="person" size={17} /> Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setRole('INTERVIEWER')}
                  className={`auth-role-btn${role === 'INTERVIEWER' ? ' active' : ''}`}
                >
                  <Icon name="co_present" size={17} /> Interviewer
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="reg-name" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="reg-pass" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-pass"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, include a number or symbol"
                  required
                />
                <button type="button" className="auth-vis-toggle" onClick={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <div style={{ height: '3px', borderRadius: '99px', background: 'var(--color-card-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, transition: 'width 0.3s, background 0.3s', borderRadius: '99px' }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: strength.color, marginTop: '3px', display: 'block' }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.45rem', fontWeight: 500 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
                <button type="button" className="auth-vis-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                  <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <span style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '3px', display: 'block' }}>
                  Passwords do not match
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-btn"
              style={{ marginTop: '0.4rem', background: roleGradient }}
            >
              {isLoading ? 'Creating account…' : 'Create Account & Continue →'}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>Already have an account? </span>
            <Link href="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
