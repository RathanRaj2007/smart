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
  adminDocId: number | null
  createdAt: string
  updatedAt: string
  chunkCount: number
}

export const KnowledgeBaseClient = () => {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingKB, setFetchingKB] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [adminKBStatus, setAdminKBStatus] = useState<{
    adminDocCount: number
    syncedDocCount: number
    latestAdminUpdate: string | null
  } | null>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents', { cache: 'no-store', credentials: 'include' })
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

  const fetchAdminKBStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge-base/fetch', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setAdminKBStatus({
          adminDocCount: data.adminDocCount ?? 0,
          syncedDocCount: data.syncedDocCount ?? 0,
          latestAdminUpdate: data.latestAdminUpdate ?? null,
        })
      }
    } catch {
      // Non-critical, ignore
    }
  }, [])

  useEffect(() => {
    fetchDocs()
    fetchAdminKBStatus()
  }, [fetchDocs, fetchAdminKBStatus])

  const handleFetchKB = async () => {
    if (!confirm('This will sync the latest Admin Knowledge Base documents to your account. Your private documents will NOT be affected. Continue?')) return
    setFetchingKB(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/knowledge-base/fetch', {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(data.message)
        await fetchDocs()
        await fetchAdminKBStatus()
      } else {
        setError(data.error || 'Fetch failed')
      }
    } catch {
      setError('Failed to fetch Knowledge Base')
    } finally {
      setFetchingKB(false)
    }
  }

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
        const res = await fetch('/api/documents', { method: 'POST', body: fd, credentials: 'include' })
        if (res.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    if (successCount === files.length) {
      setSuccess(`Successfully uploaded ${successCount} document(s) — processing in background...`)
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

  const onDelete = async (id: number, docSource: string) => {
    const label = docSource === 'SYNCED_FROM_ADMIN' ? 'Remove this synced admin document from your KB?' : 'Delete this document and all its chunks?'
    if (!confirm(label)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Delete failed')
      } else {
        await fetchDocs()
      }
    } catch {
      setError('Delete failed')
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
        borderRadius: '12px',
        padding: '4px 12px',
        fontSize: '0.75rem',
        fontWeight: 600,
        border: `1px solid ${colors[status] ?? 'rgba(100,116,139,0.2)'}`,
      }}>
        {status}
      </span>
    )
  }

  const sourceBadge = (docSource: string) => {
    if (docSource === 'SYNCED_FROM_ADMIN') {
      return (
        <span style={{
          background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: '8px',
          padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
          border: '1px solid rgba(59,130,246,0.2)', whiteSpace: 'nowrap'
        }}>
          📥 Admin KB
        </span>
      )
    }
    return (
      <span style={{
        background: 'rgba(168,85,247,0.1)', color: '#c084fc', borderRadius: '8px',
        padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600,
        border: '1px solid rgba(168,85,247,0.2)', whiteSpace: 'nowrap'
      }}>
        🔒 Private
      </span>
    )
  }

  const privateDocs = docs.filter(d => d.docSource === 'INTERVIEWER_PRIVATE')
  const syncedDocs = docs.filter(d => d.docSource === 'SYNCED_FROM_ADMIN')
  const totalChunks = docs.reduce((acc, doc) => acc + doc.chunkCount, 0)
  const totalSize = privateDocs.reduce((acc, doc) => acc + doc.fileSize, 0)
  const processedDocs = docs.filter(d => d.status === 'PROCESSED').length

  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-primary)', background: 'transparent', minHeight: '100%', fontFamily: 'var(--font-body)' }}>
      {/* Header Section */}
      <div className="kb-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.85rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="description" size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--color-text-primary)' }}>Knowledge Base</h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: 1.5 }}>
              Manage your private documents and sync the Admin Master KB. Documents are chunked for RAG retrieval.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Fetch Knowledge Base button */}
            <button
              onClick={handleFetchKB}
              disabled={fetchingKB || loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: fetchingKB ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                padding: '0.75rem 1.25rem', borderRadius: '10px',
                color: 'white', fontWeight: 500, cursor: fetchingKB ? 'not-allowed' : 'pointer',
                border: 'none', fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
                transition: 'all 0.2s ease', opacity: fetchingKB ? 0.7 : 1
              }}
            >
              <Icon name="download" size={18} />
              {fetchingKB ? 'Fetching...' : 'Fetch Knowledge Base'}
            </button>

            {/* Upload button */}
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '0.75rem 1.25rem', borderRadius: '10px',
              color: 'white', fontWeight: 500, cursor: 'pointer',
              border: 'none', fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)',
              transition: 'all 0.2s ease'
            }}>
              <Icon name="add" size={18} />
              Upload Private Document(s)
              <input type="file" multiple accept=".pdf,.txt,.md,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} disabled={loading} />
            </label>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Supported: PDF, DOCX, TXT, MD (Max 10 MB)</span>
        </div>
      </div>

      {/* Admin KB Status Banner */}
      {adminKBStatus && (
        <div style={{
          background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '10px', padding: '1rem 1.5rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#60a5fa' }}><Icon name="cloud_download" size={20} /></span>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                Admin Master KB: {adminKBStatus.adminDocCount} document{adminKBStatus.adminDocCount !== 1 ? 's' : ''}
              </span>
              <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                You have {syncedDocs.length} synced
              </span>
            </div>
          </div>
          {adminKBStatus.latestAdminUpdate && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Admin KB updated: {new Date(adminKBStatus.latestAdminUpdate).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{success}</div>}

      {/* Stats Cards Section */}
      <div className="kb-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Private Docs', value: privateDocs.length, sub: 'Your uploads', icon: 'lock', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.1)' },
          { label: 'Synced from Admin', value: syncedDocs.length, sub: 'Admin KB docs', icon: 'cloud_download', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Chunks', value: totalChunks, sub: 'Total chunks', icon: 'memory', color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'Storage', value: fmtSize(totalSize), sub: 'Private docs size', icon: 'description', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
          { label: 'Processed', value: processedDocs, sub: 'RAG-ready', icon: 'check_circle', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--color-card-bg)', padding: '1.25rem', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem'
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

      {/* Table Section */}
      <div style={{ background: 'var(--color-card-bg)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            <Icon name="description" size={18} style={{ color: 'var(--color-text-secondary)' }} /> Your Documents ({docs.length})
          </h3>
          <button onClick={fetchDocs} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-text-secondary)', cursor: 'pointer',
            fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderRadius: '6px'
          }}>
            <Icon name="refresh" size={14} /> Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>File Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Source</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Chunks</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Uploaded At</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No documents yet. Upload private documents or click &ldquo;Fetch Knowledge Base&rdquo; to sync admin docs.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ color: '#ef4444' }}>
                        <Icon name="description" size={20} />
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{d.originalFilename}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>{sourceBadge(d.docSource)}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{d.fileType.replace('.', '').toUpperCase()}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{fmtSize(d.fileSize)}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{d.chunkCount}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{new Date(d.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}>{statusBadge(d.status)}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => onDelete(d.id, d.docSource)} disabled={loading} style={{
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none',
                          padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex'
                        }} title={d.docSource === 'SYNCED_FROM_ADMIN' ? 'Remove from your KB' : 'Delete'}>
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

export default KnowledgeBaseClient
