'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Icon from '@/components/Icon'

type Doc = {
  id: number
  name: string
  originalFilename: string
  fileType: string
  fileSize: number
  status: string
  docSource: string
  createdAt: string
  updatedAt: string
  chunkCount: number
}

export default function AdminKnowledgeBasePage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/knowledge-base', { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setDocs(data.documents || [])
      } else {
        setError(data.error || 'Failed to fetch documents')
      }
    } catch {
      setError('Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    let successCount = 0
    let failCount = 0

    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', file.name)

      try {
        const res = await fetch('/api/admin/knowledge-base', { method: 'POST', body: fd, credentials: 'include' })
        if (res.ok) {
          successCount++
        } else {
          const data = await res.json()
          console.error('Upload error:', data.error)
          failCount++
        }
      } catch {
        failCount++
      }
    }

    if (successCount === files.length) {
      setSuccess(`Successfully uploaded ${successCount} document(s) to Admin Master KB — processing in background...`)
    } else if (successCount > 0) {
      setSuccess(`Uploaded ${successCount} document(s), but ${failCount} failed.`)
    } else {
      setError('Upload failed for all documents.')
    }

    e.target.value = ''
    fetchDocs()
    setTimeout(() => fetchDocs(), 2000)
    setTimeout(() => fetchDocs(), 5000)
    setLoading(false)
  }

  const onDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}" from the Admin Master Knowledge Base?\n\nThis will remove it for all interviewers who have synced it.`)) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/knowledge-base/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Delete failed')
      } else {
        setSuccess('Document deleted from Admin Master KB.')
        await fetchDocs()
      }
    } catch {
      setError('Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const onTriggerProcess = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/knowledge-base/trigger-process/${id}`, { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Processing failed to start')
      } else {
        setSuccess('Processing started — refresh in a few seconds.')
        setTimeout(() => fetchDocs(), 3000)
        setTimeout(() => fetchDocs(), 7000)
      }
    } catch {
      setError('Failed to trigger processing')
    } finally {
      setLoading(false)
    }
  }

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      UPLOADED: 'rgba(99, 102, 241, 0.1)',
      PROCESSING: 'rgba(245, 158, 11, 0.1)',
      PROCESSED: 'rgba(16, 185, 129, 0.15)',
      FAILED: 'rgba(239, 68, 68, 0.1)',
    }
    const textColors: Record<string, string> = {
      UPLOADED: '#818cf8',
      PROCESSING: '#fbbf24',
      PROCESSED: '#10b981',
      FAILED: '#ef4444',
    }
    return (
      <span style={{
        background: colors[status] ?? 'rgba(100,116,139,0.2)',
        color: textColors[status] ?? '#94a3b8',
        borderRadius: '12px', padding: '4px 12px', fontSize: '0.75rem',
        fontWeight: 600, border: `1px solid ${colors[status] ?? 'rgba(100,116,139,0.2)'}`,
      }}>
        {status}
      </span>
    )
  }

  const totalChunks = docs.reduce((acc, doc) => acc + doc.chunkCount, 0)
  const processedDocs = docs.filter(d => d.status === 'PROCESSED').length
  const totalSize = docs.reduce((acc, doc) => acc + doc.fileSize, 0)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', color: '#818cf8', display: 'flex' }}>
              <Icon name="library_books" size={28} />
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              Admin Master Knowledge Base
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: '0 0 0 0' }}>
            Global document repository. All documents uploaded here are available for interviewers to sync to their personal Knowledge Bases.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            padding: '0.75rem 1.25rem', borderRadius: '10px',
            color: 'white', fontWeight: 500, cursor: 'pointer',
            border: 'none', fontSize: '0.9rem',
            boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
          }}>
            <Icon name="cloud_upload" size={18} />
            Upload to Admin Master KB
            <input type="file" multiple accept=".pdf,.txt,.md,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} disabled={loading} />
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PDF, DOCX, TXT, MD — Max 10 MB</span>
        </div>
      </div>

      {/* Admin KB Banner */}
      <div style={{
        background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '10px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem'
      }}>
        <Icon name="admin_panel_settings" size={20} style={{ color: '#818cf8' }} />
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--color-text-primary)' }}>Admin Master KB</strong> — Documents here are the global source of truth.
          Interviewers can click &ldquo;Fetch Knowledge Base&rdquo; in their KB to get a copy of these documents.
          Only Admin users can add, delete, or reprocess documents here.
        </span>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(16,185,129,0.2)' }}>{success}</div>}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Documents', value: docs.length, sub: 'In Admin Master KB', icon: 'library_books', color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Processed', value: processedDocs, sub: 'RAG-ready', icon: 'check_circle', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Total Chunks', value: totalChunks, sub: 'Vector chunks', icon: 'memory', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Storage', value: fmtSize(totalSize), sub: 'Total size', icon: 'storage', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--color-card-bg)', padding: '1.25rem', borderRadius: '12px',
            border: '1px solid var(--color-card-border)', display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <div style={{ background: stat.bg, color: stat.color, padding: '0.85rem', borderRadius: '10px', display: 'flex' }}>
              <Icon name={stat.icon} size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--color-text-primary)' }}>{stat.value}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Documents Table */}
      <div style={{ background: 'var(--color-card-bg)', borderRadius: '12px', border: '1px solid var(--color-card-border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-card-border)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            <Icon name="library_books" size={18} style={{ color: 'var(--color-text-secondary)' }} />
            Master Documents ({docs.length})
          </h3>
          <button onClick={fetchDocs} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent',
            border: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)', cursor: 'pointer',
            fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderRadius: '6px'
          }}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Document Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Source</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Chunks</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Upload Date</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && docs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Loading...
                  </td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No documents in Admin Master KB yet. Upload documents to make them available to all interviewers.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ color: '#ef4444' }}><Icon name="description" size={20} /></div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{d.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{d.originalFilename}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '8px',
                        padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
                        border: '1px solid rgba(99,102,241,0.2)'
                      }}>🌐 Admin Master</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{d.fileType.replace('.', '').toUpperCase()}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{fmtSize(d.fileSize)}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{d.chunkCount}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{new Date(d.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}>{statusBadge(d.status)}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {(d.status === 'UPLOADED' || d.status === 'FAILED') && (
                          <button
                            onClick={() => onTriggerProcess(d.id)}
                            disabled={loading}
                            style={{
                              background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none',
                              padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem'
                            }} title="Process / Re-index">
                            <Icon name="refresh" size={14} /> Process
                          </button>
                        )}
                        <button
                          onClick={() => onDelete(d.id, d.name)}
                          disabled={loading}
                          style={{
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none',
                            padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex'
                          }} title="Delete from Admin Master KB">
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
