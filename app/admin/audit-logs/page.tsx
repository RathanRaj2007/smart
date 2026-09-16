'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Icon from '@/components/Icon'

interface AuditLogItem {
  id: string
  userId: number | null
  username: string
  action: string
  entityType: string | null
  entityId: string | null
  status: string
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)

  // Selected Log for Metadata Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (actionFilter !== 'ALL') params.set('action', actionFilter)
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      params.set('page', page.toString())
      params.set('limit', '25')

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.auditLogs || [])
        setTotalPages(data.totalPages || 1)
        setTotalLogs(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [search, actionFilter, statusFilter, page])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const getActionBadge = (action: string, status: string) => {
    let bg = 'rgba(99,102,241,0.15)'
    let text = '#6366f1'
    let icon = 'info'

    if (action.startsWith('AUTH_LOGIN_SUCCESS')) {
      bg = 'rgba(16,185,129,0.15)'
      text = '#10b981'
      icon = 'check_circle'
    } else if (action.startsWith('AUTH_LOGIN_FAILURE') || status === 'FAILURE') {
      bg = 'rgba(239,68,68,0.15)'
      text = '#ef4444'
      icon = 'error'
    } else if (action.startsWith('AUTH_LOGOUT')) {
      bg = 'rgba(107,114,128,0.15)'
      text = '#9ca3af'
      icon = 'logout'
    } else if (action.startsWith('INTERVIEW_')) {
      bg = 'rgba(59,130,246,0.15)'
      text = '#3b82f6'
      icon = 'question_answer'
    } else if (action.startsWith('KNOWLEDGE_')) {
      bg = 'rgba(139,92,246,0.15)'
      text = '#8b5cf6'
      icon = 'description'
    } else if (action.startsWith('LLM_')) {
      bg = 'rgba(245,158,11,0.15)'
      text = '#f59e0b'
      icon = 'smart_toy'
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: bg,
        color: text,
      }}>
        <Icon name={icon} size={14} />
        {action}
      </span>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', color: 'var(--color-text-primary)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>System Audit Logs</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Security events, authentication attempts, interview actions, and document activity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '8px' }}>
            Total Audit Records: <strong>{totalLogs}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
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
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search action, username, entity..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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

        <div style={{ minWidth: '180px' }}>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
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
            <option value="ALL">All Action Types</option>
            <option value="AUTH_LOGIN_SUCCESS">AUTH_LOGIN_SUCCESS</option>
            <option value="AUTH_LOGIN_FAILURE">AUTH_LOGIN_FAILURE</option>
            <option value="AUTH_LOGOUT">AUTH_LOGOUT</option>
            <option value="INTERVIEW_CREATED">INTERVIEW_CREATED</option>
            <option value="INTERVIEW_COMPLETED">INTERVIEW_COMPLETED</option>
            <option value="INTERVIEW_EVALUATED">INTERVIEW_EVALUATED</option>
            <option value="KNOWLEDGE_DOCUMENT_UPLOADED">KNOWLEDGE_DOCUMENT_UPLOADED</option>
            <option value="KNOWLEDGE_DOCUMENT_DELETED">KNOWLEDGE_DOCUMENT_DELETED</option>
          </select>
        </div>

        <div style={{ minWidth: '140px' }}>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
          </select>
        </div>

        <button
          onClick={fetchAuditLogs}
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

      {/* Logs Table */}
      <div style={{ backgroundColor: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '12px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-card-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Timestamp</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>User</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Action</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Entity Target</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No audit logs found matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-card-border)' }}>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
                    <div>{log.username}</div>
                    {log.userId && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>ID: #{log.userId}</div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {getActionBadge(log.action, log.status)}
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}>
                    {log.entityType ? (
                      <div>
                        <span style={{ fontWeight: 500 }}>{log.entityType}</span>
                        {log.entityId && (
                          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace', display: 'block' }}>
                            {log.entityId.length > 12 ? log.entityId.slice(0, 12) + '...' : log.entityId}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: log.status === 'SUCCESS' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          border: '1px solid var(--color-card-border)',
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Icon name="description" size={14} />
                        View Safe Metadata
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>None</span>
                    )}
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
                  fontSize: '0.875rem',
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
                  fontSize: '0.875rem',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            backgroundColor: 'var(--color-card-bg)',
            border: '1px solid var(--color-card-border)',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                Sanitized Audit Metadata
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Action: <strong>{selectedLog.action}</strong> | User: <strong>{selectedLog.username}</strong>
            </div>

            <pre style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-card-border)',
              borderRadius: '8px',
              padding: '1rem',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              maxHeight: '350px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {JSON.stringify(selectedLog.metadata, null, 2)}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-card-border)',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
