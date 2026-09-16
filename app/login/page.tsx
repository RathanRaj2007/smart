'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/Icon'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'INTERVIEWER' | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid username or password.')
        throw new Error(data.error || 'Failed to login')
      }
      router.push(data.redirect || '/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to login')
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
                <Icon name="memory" size={24} />
              </div>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0' }}>Adaptive Interview</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>Sign in to your AI workspace</p>
          </div>

          {(error && submitted) && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="error" size={16} /> {error}
            </div>
          )}

          {!selectedRole ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={() => setSelectedRole('ADMIN')} style={{ width: '100%', background: 'linear-gradient(135deg, #475569, #334155)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                Login as Admin
              </button>
              <button onClick={() => setSelectedRole('INTERVIEWER')} style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)', padding: '1rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}>
                Login as Interviewer
              </button>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <button type="button" onClick={() => setSelectedRole(null)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Icon name="arrow_back" size={16} /> Back
                </button>
                <h2 style={{ fontSize: '1.25rem', marginTop: '1rem', color: 'var(--color-text-primary)' }}>
                  {selectedRole === 'ADMIN' ? 'Admin Login' : 'Interviewer Login'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label htmlFor="username" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
                  <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" required style={{ width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required style={{ width: '100%', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', color: 'var(--color-text-primary)', padding: '0.75rem 2.5rem 0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                      <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ accentColor: '#6366f1' }} /> Remember me
                  </label>
                  <a href="#" style={{ color: '#818cf8', textDecoration: 'none' }}>Forgot password?</a>
                </div>

                <button type="submit" disabled={isLoading} style={{ marginTop: '0.5rem', width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'var(--color-text-primary)', border: 'none', padding: '0.8rem', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          )}

          {selectedRole === 'INTERVIEWER' && (
            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <span>Don&apos;t have an account? </span>
              <Link href="/register" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Create account</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
