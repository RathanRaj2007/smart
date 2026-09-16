'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Icon from '@/components/Icon'

interface CandidateItem {
  id: string
  name: string
  email: string | null
  createdAt: string
  _count: {
    sessions: number
  }
  sessions: Array<{
    id: string
    startedAt: string
    endedAt: string | null
    status: string
    interviewType: string
    score: number | null
    report: {
      overallScore: number
    } | null
  }>
}

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCandidates, setTotalCandidates] = useState(0)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '15')

      const res = await fetch(`/api/admin/candidates?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCandidates(data.candidates || [])
        setTotalPages(data.totalPages || 1)
        setTotalCandidates(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to load candidates:', err)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const getScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>N/A</span>
    }
    const percent = Math.round(score * 10)
    let bg = 'rgba(16,185,129,0.15)'
    let text = '#10b981'
    if (percent < 50) {
      bg = 'rgba(239,68,68,0.15)'
      text = '#ef4444'
    } else if (percent < 75) {
      bg = 'rgba(245,158,11,0.15)'
      text = '#f59e0b'
    }

    return (
      <span style={{
        padding: '0.25rem 0.6rem',
        borderRadius: '8px',
        fontSize: '0.8rem',
        fontWeight: 600,
        backgroundColor: bg,
        color: text,
      }}>
        {percent}%
      </span>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Candidate Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            View and manage overall candidate profiles and interview records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '8px' }}>
            Total Candidates: <strong>{totalCandidates}</strong>
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        backgroundColor: 'var(--color-card-bg)',
        border: '1px solid var(--color-card-border)',
        padding: '1rem',
        borderRadius: '12px'
      }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={search}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.5rem',
              borderRadius: '8px',
              border: '1px solid var(--color-card-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', pointerEvents: 'none' }}>
            <Icon name="search" size={18} />
          </div>
        </div>

        <button
          onClick={fetchCandidates}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--color-card-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <Icon name="refresh" size={16} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Candidate</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Email</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Total Interviews</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Latest Interview</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Latest Score</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Loading candidates...
                </td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No candidates found matching criteria.
                </td>
              </tr>
            ) : (
              candidates.map((cand) => {
                const latestSession = cand.sessions && cand.sessions.length > 0 ? cand.sessions[0] : null
                const latestScore = latestSession ? (latestSession.score ?? latestSession.report?.overallScore) : null

                return (
                  <tr key={cand.id} style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(99,102,241,0.1)',
                          color: '#818cf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {cand.name ? cand.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{cand.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                            ID: {cand.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {cand.email || 'N/A'}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-primary)'
                      }}>
                        {cand._count.sessions} session{cand._count.sessions !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                      {latestSession ? (
                        <div>
                          <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>{latestSession.interviewType}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                            {new Date(latestSession.startedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No sessions</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {getScoreBadge(latestScore)}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {new Date(cand.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid var(--color-card-border)' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-card-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: page <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-card-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: page >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
