'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/Icon'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError('')

    if (!username) { setError('Username is required.'); return }
    if (!password) { setError('Password is required.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create account')
      router.push(data.redirect || '/login')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#070913', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #d946ef)' }}></div>
        <div style={{ padding: '2.5rem' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="person_add" size={24} />
              </div>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>Create Account</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>Create a new account for your workspace</p>
          </div>

          {(error && submitted) && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="error" size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label htmlFor="username" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" required style={{ width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required style={{ width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat your password" required style={{ width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                  <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem', width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'var(--color-text-primary)', border: 'none', padding: '0.8rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            <span>Already have an account? </span>
            <Link href="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </div>

        </div>
      </div>
    </div>
  )
}
