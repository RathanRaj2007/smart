'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Icon from '@/components/Icon'

type Provider = {
  id: string
  name: string
  model: string
  configured: boolean
  keyStatus: string
}

type AIConfig = {
  providers: Provider[]
  ragEnabled: boolean
  embeddingModel: string
  vectorStore: string
  chunkSize: number
  chunkOverlap: number
  topK: number
}

export default function AdminAIPage() {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-config', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      } else {
        setError('Failed to load AI configuration')
      }
    } catch {
      setError('Failed to load AI configuration')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', paddingTop: '4rem' }}>
        Loading AI configuration...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px' }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>AI / LLM Management</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', margin: 0 }}>
          View LLM provider status and RAG pipeline configuration. API keys are stored server-side only and never exposed here.
        </p>
      </div>

      {/* LLM Providers */}
      <div style={cardStyle}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', paddingBottom: '1rem', borderBottom: '1px solid var(--color-card-border)' }}>
          <span style={{ color: '#a855f7' }}><Icon name="auto_awesome" size={20} /></span>
          LLM Providers
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {config?.providers.map((provider) => (
            <div key={provider.id} style={{
              background: provider.configured ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${provider.configured ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: '10px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
                    {provider.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    {provider.model}
                  </div>
                </div>
                <span style={{
                  background: provider.configured ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: provider.configured ? '#10b981' : '#ef4444',
                  borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600,
                  border: `1px solid ${provider.configured ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  whiteSpace: 'nowrap'
                }}>
                  {provider.configured ? '● Active' : '● Not configured'}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                <strong>API Key:</strong> {provider.keyStatus}
              </div>

              {!provider.configured && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', padding: '0.5rem 0.75rem', border: '1px solid rgba(245,158,11,0.2)' }}>
                  ⚠ Add to <code style={{ fontFamily: 'monospace' }}>.env.local</code> and restart the server to activate.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LLM Selection Info */}
      <div style={cardStyle}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', paddingBottom: '1rem', borderBottom: '1px solid var(--color-card-border)' }}>
          <span style={{ color: '#818cf8' }}><Icon name="settings" size={20} /></span>
          LLM Selection Behavior
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              icon: 'person',
              color: '#818cf8',
              title: 'User Selection',
              desc: 'Each interviewer/user can select their preferred LLM provider in their Settings page (Gemini or Groq). The choice is stored in a browser cookie.',
            },
            {
              icon: 'sync',
              color: '#60a5fa',
              title: 'Fallback Behavior',
              desc: 'If the selected provider is unavailable, the user is prompted to retry with the other provider. No silent fallback occurs.',
            },
            {
              icon: 'lock',
              color: '#10b981',
              title: 'API Key Security',
              desc: 'All API keys (GEMINI_API_KEY, GROQ_API_KEY) are stored exclusively as server-side environment variables. They are never sent to the browser or logged.',
            },
          ].map(({ icon, color, title, desc }) => (
            <div key={title} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
              <div style={{ color, flexShrink: 0, paddingTop: '0.1rem' }}><Icon name={icon} size={20} /></div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAG / Embedding Pipeline */}
      <div style={cardStyle}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', paddingBottom: '1rem', borderBottom: '1px solid var(--color-card-border)' }}>
          <span style={{ color: '#34d399' }}><Icon name="memory" size={20} /></span>
          RAG / Embedding Pipeline
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'RAG Status', value: config?.ragEnabled ? '● Enabled' : '● Disabled', color: config?.ragEnabled ? '#10b981' : '#ef4444' },
            { label: 'Embedding Model', value: config?.embeddingModel || '—', color: 'var(--color-text-primary)' },
            { label: 'Vector Store', value: config?.vectorStore || '—', color: 'var(--color-text-primary)' },
            { label: 'Chunk Size', value: `${config?.chunkSize || 1200} chars`, color: 'var(--color-text-primary)' },
            { label: 'Chunk Overlap', value: `${config?.chunkOverlap || 200} chars`, color: 'var(--color-text-primary)' },
            { label: 'Top K Retrieval', value: `${config?.topK || 5} chunks`, color: 'var(--color-text-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--color-card-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color, fontFamily: 'monospace' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>How RAG works in SmartInterview:</strong><br />
            1. Documents are chunked ({config?.chunkSize} chars, {config?.chunkOverlap} char overlap) and embedded using <em>{config?.embeddingModel}</em>.<br />
            2. Embeddings are stored in <em>{config?.vectorStore}</em> using pgvector cosine similarity.<br />
            3. During interviews, the AI retrieves the top {config?.topK} semantically similar chunks from the interviewer&rsquo;s authorized documents.<br />
            4. Only documents owned by (or synced to) the interviewer are ever retrieved — strict server-side ownership filtering is enforced.
          </div>
        </div>
      </div>

      {/* Refresh button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '2rem' }}>
        <button
          onClick={fetchConfig}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
            border: '1px solid var(--color-card-border)', borderRadius: '8px',
            padding: '0.75rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem',
          }}
        >
          <Icon name="refresh" size={16} /> Refresh Status
        </button>
      </div>
    </div>
  )
}
