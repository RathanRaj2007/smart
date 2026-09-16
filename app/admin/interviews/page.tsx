'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Icon from '@/components/Icon'

interface InterviewItem {
  id: string
  status: string
  difficulty: string
  interviewType: string
  score: number | null
  startedAt: string
  endedAt: string | null
  candidate: {
    id: string
    name: string
    email: string | null
  }
  interviewer: {
    id: number
    username: string
    role: string
  } | null
  report: {
    id: string
    overallScore: number
  } | null
  _count: {
    questions: number
  }
}

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInterviews, setTotalInterviews] = useState(0)

  const fetchInterviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'ALL') params.set('status', status)
      params.set('page', page.toString())
      params.set('limit', '15')

      const res = await fetch(`/api/admin/interviews?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setInterviews(data.interviews || [])
        setTotalPages(data.totalPages || 1)
        setTotalInterviews(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to load interviews:', err)
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    fetchInterviews()
  }, [fetchInterviews])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value)
    setPage(1)
  }

  const getScoreBadge = (score: number | null | undefined) => {
    if (score === null || score === undefined) {
      return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>N/A</span>
    }
    const percent = Math.round(score * 10) // score is 0-10
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
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Organization Interviews</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Monitor and review interview sessions across all interviewers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '8px' }}>
            Total Interviews: <strong>{totalInterviews}</strong>
          </span>
        </div>
      </div>

      {/* Filter controls */}
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
            placeholder="Search candidate, interviewer, or type..."
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

        <div style={{ minWidth: '160px' }}>
          <select
            value={status}
            onChange={handleStatusChange}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--color-card-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button
          onClick={fetchInterviews}
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
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Session ID</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Candidate</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Interviewer</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Type & Difficulty</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Score</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Started Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Loading interviews...
                </td>
              </tr>
            ) : interviews.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No interviews found matching criteria.
                </td>
              </tr>
            ) : (
              interviews.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {item.id.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)' }}>
                    <div style={{ fontWeight: 500 }}>{item.candidate?.name || 'Unknown'}</div>
                    {item.candidate?.email && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{item.candidate.email}</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    {item.interviewer?.username ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Icon name="person" size={16} />
                        {item.interviewer.username}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
                    <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>{item.interviewType}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                      Level: {item.difficulty}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      backgroundColor: item.status === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                      color: item.status === 'completed' ? '#10b981' : '#3b82f6',
                      border: item.status === 'completed' ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(59,130,246,0.3)',
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {getScoreBadge(item.score ?? item.report?.overallScore)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                    {new Date(item.startedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))
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
