import React from 'react'

import prisma from '@/lib/db'
import { getAppSession } from '@/lib/auth'

export default async function SuggestionsPage() {
  const session = await getAppSession();
  const userId = session.userId;

  if (!userId) {
    return <div>Unauthorized</div>;
  }

  const allQuestions = await prisma.question.findMany({
    where: { session: { interviewerId: userId } },
    orderBy: { askedAt: 'desc' },
    include: { session: { include: { candidate: true } }, answer: { include: { evaluation: true } } },
    take: 20
  })

  const diffBadge = (diff: string) => {
    switch(diff.toLowerCase()) {
      case 'easy': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }
      case 'medium': return { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }
      case 'hard': return { bg: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }
      case 'expert': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }
      default: return { bg: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-card-border)' }
    }
  }

  return (
    <section className="screen active" style={{ padding: '1.5rem 2rem', maxWidth: '1600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>Adaptive Question Bank</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>History of AI-generated questions deployed across all active and past sessions.</p>
        </div>
      </div>

      <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, width: '40%' }}>Generated Question</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Topic Domain</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Diff.</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, width: '25%' }}>Candidate / Context</th>
              </tr>
            </thead>
            <tbody>
              {allQuestions.map(q => (
                <tr key={q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--color-text-primary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    <div style={{ marginBottom: '0.5rem' }}>{q.content}</div>
                    {q.answer ? (
                      <details style={{ background: 'var(--color-bg-tertiary)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--color-card-border)' }}>
                        <summary style={{ cursor: 'pointer', color: '#818cf8', fontWeight: 500 }}>View Candidate Answer</summary>
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div><strong style={{ color: 'var(--color-text-secondary)' }}>Transcript:</strong> <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{q.answer.transcript}</span></div>
                          {q.answer.evaluation && (
                            <>
                              <div><strong style={{ color: 'var(--color-text-secondary)' }}>Score:</strong> <span style={{ color: q.answer.evaluation.score >= 70 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{q.answer.evaluation.score}%</span></div>
                              <div><strong style={{ color: 'var(--color-text-secondary)' }}>Feedback:</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{q.answer.evaluation.correctness}</span></div>
                              {q.answer.evaluation.missingKeywords && q.answer.evaluation.missingKeywords.length > 0 && (
                                <div style={{ color: '#ef4444' }}><strong>Missing Keywords:</strong> {q.answer.evaluation.missingKeywords.join(", ")}</div>
                              )}
                            </>
                          )}
                        </div>
                      </details>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No answer provided</span>
                    )}
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <span style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>{q.topic || 'General'}</span>
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <span style={{ ...diffBadge(q.difficulty), padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem 1rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Session ID: {q.sessionId.substring(0,8)}...<br/>
                    {q.session.candidate?.name || 'Unknown Candidate'}
                  </td>
                </tr>
              ))}
              {allQuestions.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No questions generated yet. Start an interview first!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}



