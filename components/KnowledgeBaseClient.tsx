'use client'

import React, { useEffect, useState } from 'react'
import { marked } from 'marked'
import Icon from '@/components/Icon'
import { useFallbackFetch } from '@/components/providers/FallbackProvider'

type Doc = {
  id: number
  name: string
  originalFilename: string
  fileType: string
  fileSize: number
  status: string
  createdAt: string
  chunkCount: number
}

export const KnowledgeBaseClient = () => {
  const fetchWithFallback = useFallbackFetch();
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documents', { cache: 'no-store', credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setDocs(data.documents || [])
      } else {
        setError(data.error || 'Failed to fetch documents')
      }
    } catch (_e) {
      setError('Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setError(null)
    setSuccess(null)
    setLoading(true)
    
    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', file.name)

      try {
        const res = await fetch('/api/documents', { method: 'POST', body: fd, credentials: 'include' })
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (_e) {
        failCount++;
      }
    }
    
    if (successCount === files.length) {
      setSuccess(`Successfully uploaded ${successCount} document(s) — processing in background...`)
    } else if (successCount > 0) {
      setSuccess(`Uploaded ${successCount} document(s), but ${failCount} failed.`)
    } else {
      setError('Upload failed for all documents.')
    }

    // Reset file input
    e.target.value = ''
    
    fetchDocs()
    setTimeout(() => fetchDocs(), 2000)
    setTimeout(() => fetchDocs(), 5000)
    
    setLoading(false)
  }

  const onDelete = async (id: number) => {
    if (!confirm('Delete this document and all its chunks?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Delete failed')
      } else {
        await fetchDocs()
      }
    } catch (_e) {
      alert('Delete failed')
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

  const totalChunks = docs.reduce((acc, doc) => acc + doc.chunkCount, 0)
  const totalSize = docs.reduce((acc, doc) => acc + doc.fileSize, 0)
  const processedDocs = docs.filter(d => d.status === 'PROCESSED').length

  const handleRagSearch = async () => {
    const q = (document.getElementById('rag-query-input') as HTMLInputElement).value;
    if (!q) return;
    const res = await fetch('/api/documents/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    const data = await res.json();
    document.getElementById('ai-answer-content')!.innerHTML = 
      `<div style="color: var(--color-text-primary); margin-bottom: 1rem;">Raw Search Results:</div>` + 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.results.map((r: any) => 
        `<div style="margin-bottom:0.75rem; padding:0.75rem; background:var(--color-bg-tertiary); border-radius:8px; border: 1px solid var(--color-card-border);">
          <div style="font-size:0.75rem; color:#818cf8; margin-bottom: 0.25rem;">Doc: ${r.documentName} | Score: ${r.similarity}</div>
          <div style="font-size:0.85rem; color: var(--color-text-secondary); line-height: 1.5;">${r.content}</div>
         </div>`
      ).join('');
  }

  const handleRagAsk = async () => {
    const q = (document.getElementById('rag-query-input') as HTMLInputElement).value;
    if (!q) return;
    
    // Clear previous state
    document.getElementById('ai-answer-content')!.innerHTML = '<em style="color:#a855f7;">✨ Generating answer...</em>';
    const t = document.getElementById("ai-answer-title");
    if (t) {
      t.innerHTML = `<span style="color: #a855f7; font-size: 1.2rem; line-height: 1">✨</span> AI Answer`;
    }

    const res = await fetchWithFallback('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q })
    });
    const data = await res.json();
    
    if (t && data.provider) {
        t.innerHTML = `<span style="color: #a855f7; font-size: 1.2rem; line-height: 1">✨</span> AI Answer <span style="font-size: 0.8rem; background: rgba(168,85,247,0.1); color: #c084fc; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(168,85,247,0.2)">${data.provider.toUpperCase()}</span>`;
    }

    const uniqueDocs = new Set();
    const uniqueSources: { documentName: string; [key: string]: unknown }[] = [];
    (data.sources || []).forEach((r: { documentName: string; [key: string]: unknown }) => {
      const normalizedName = (r.documentName || '').trim().toLowerCase();
      if (normalizedName && !uniqueDocs.has(normalizedName)) {
        uniqueDocs.add(normalizedName);
        uniqueSources.push(r);
      }
    });

    const parsedAnswer = data.answer ? marked.parse(data.answer) : data.error;

    document.getElementById('ai-answer-content')!.innerHTML = 
      `<div class="markdown-body" style="color: var(--color-text-primary); line-height: 1.6; font-size: 0.95rem; overflow-wrap: break-word;">
         ${parsedAnswer}
       </div>
       <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-card-border);">
         <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
           Sources
         </div>
         <div style="display: flex; flex-direction: column; gap: 0.25rem;">
           ${uniqueSources.map((r) => `<div style="font-size:0.75rem; color:var(--color-text-muted); line-height: 1.4;">• ${r.documentName}</div>`).join('') || ''}
         </div>
       </div>`;
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-primary)', background: 'transparent', minHeight: '100%', fontFamily: 'var(--font-body)' }}>
      {/* Header Section */}
      <div className="kb-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ padding: '0.85rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="description" size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--color-text-primary)' }}>Knowledge Base</h1>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '600px', lineHeight: 1.5 }}>
              Institution-approved material used by the AI interviewer. Upload PDFs, DOCX or plain text documents.<br/>
              Documents are chunked for RAG retrieval.
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
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
            Upload Document(s)
            <input type="file" multiple accept=".pdf,.txt,.md,.doc,.docx" style={{ display: 'none' }} onChange={handleFileChange} disabled={loading} />
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Supported: PDF, DOCX, TXT, MD (Max 10 MB)</span>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{success}</div>}

      {/* Stats Cards Section */}
      <div className="kb-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Documents', value: docs.length, sub: 'Total uploaded', icon: 'description', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.1)' },
          { label: 'Chunks', value: totalChunks, sub: 'Total chunks', icon: 'memory', color: '#34d399', bg: 'rgba(16, 185, 129, 0.1)' },
          { label: 'Embeddings', value: totalChunks, sub: 'Vectorized', icon: 'analytics', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Storage Used', value: fmtSize(totalSize), sub: 'Total size', icon: 'description', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.1)' },
          { label: 'Status', value: processedDocs, sub: 'Processed', icon: 'check_circle', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' }
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
            <Icon name="description" size={18} style={{ color: 'var(--color-text-secondary)' }} /> Uploaded Documents
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
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ color: '#ef4444' }}>
                        <Icon name="description" size={20} />
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{d.originalFilename}</span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{d.fileType.replace('.', '').toUpperCase()}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{fmtSize(d.fileSize)}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{d.chunkCount}</td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{new Date(d.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '1rem' }}>{statusBadge(d.status)}</td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => onDelete(d.id)} disabled={loading} style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', 
                          padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex'
                        }} title="Delete">
                          <Icon name="delete" size={16} />
                        </button>
                        <button style={{ 
                          background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: 'none', 
                          padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex'
                        }} title="More">
                          <Icon name="more_vert" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Rows per page: 
            <select style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-primary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 4px' }}>
              <option>10</option>
              <option>20</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px 8px' }}>&lt;</button>
            <button style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: '4px', padding: '2px 8px' }}>1</button>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px 8px' }}>&gt;</button>
          </div>
        </div>
      </div>

      {/* RAG Section */}
      <div className="kb-rag-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* RAG Index Tester */}
        <div style={{ background: 'var(--color-card-bg)', borderRadius: '12px', border: '1px solid var(--color-card-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            <Icon name="search" size={18} style={{ color: 'var(--color-text-secondary)' }} /> RAG Index Tester
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            Test the embedding pipeline and semantic search directly against the database using pgvector.
          </p>
          
          <div style={{ flex: 1 }}>
            <textarea
              id="rag-query-input"
              placeholder="e.g., What are the key points in the system design doc?"
              rows={3}
              style={{ 
                width: '100%', padding: '0.85rem', borderRadius: '8px', 
                border: '1px solid var(--color-card-border)', background: 'var(--color-bg-tertiary)', 
                color: 'var(--color-text-primary)', fontSize: '0.9rem', resize: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
            <button 
              onClick={handleRagSearch}
              style={{ 
                flex: 1, padding: '0.75rem', background: 'var(--color-bg-tertiary)', 
                color: 'var(--color-text-primary)', border: '1px solid var(--color-card-border)', 
                borderRadius: '8px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s',
                fontSize: '0.9rem'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
            >
              Raw Search
            </button>
            <button 
              onClick={handleRagAsk}
              style={{ 
                flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', 
                color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', 
                fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>✨</span> Ask RAG
            </button>
          </div>
        </div>

        {/* AI Answer (Gemini) */}
        <div style={{ background: 'var(--color-card-bg)', borderRadius: '12px', border: '1px solid var(--color-card-border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 id="ai-answer-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            <span style={{ color: '#a855f7', fontSize: '1.2rem', lineHeight: 1 }}>✨</span> AI Answer
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
            Answer generated by the AI based on the retrieved context.
          </p>
          
          <div id="ai-answer-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)', padding: '1.25rem', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '0.5rem', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
                <Icon name="record_voice_over" size={16} />
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, paddingTop: '0.2rem' }}>
                Ask a question to get an AI-generated answer using your uploaded documents.
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginTop: 'auto', paddingTop: '1rem' }}>
              <div style={{ color: 'var(--color-text-muted)', padding: '0.2rem' }}>
                <Icon name="description" size={16} />
              </div>
              <div>
                <div style={{ color: 'var(--color-text-primary)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>Sources</div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Relevant document chunks will appear here.</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default KnowledgeBaseClient
