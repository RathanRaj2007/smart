export const dynamic = 'force-dynamic'

import React from 'react'
import prisma from '@/lib/db'
import Icon from '@/components/Icon'
import Link from 'next/link'
import { getAppSession } from '@/lib/auth'

import { formatInterviewerName } from '@/lib/formatters'

export default async function CandidateProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; search?: string }>
}) {
  const resolvedParams = searchParams ? await searchParams : {}
  const activeTab = resolvedParams.tab || 'results'
  const searchQuery = resolvedParams.search || ''

  const session = await getAppSession()
  const userId = session.userId

  if (!userId) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-primary)' }}>
        Unauthorized access. Please log in.
      </div>
    )
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }

  const statBoxStyle: React.CSSProperties = {
    background: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }

  // Handle CANDIDATE role view
  if (session.role === 'CANDIDATE') {
    let candidate = await prisma.candidate.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          userId: userId,
          name: session.username || 'Candidate',
          email: session.username?.includes('@') ? session.username : null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        }
      })
    }

    const [totalInterviews, completedInterviews, _activeInterviews, scoreAgg, sessions] = await Promise.all([
      prisma.interviewSession.count({ where: { candidateId: candidate.id } }),
      prisma.interviewSession.count({ where: { candidateId: candidate.id, status: 'completed' } }),
      prisma.interviewSession.count({ where: { candidateId: candidate.id, status: 'active' } }),
      prisma.interviewSession.aggregate({
        where: { candidateId: candidate.id, score: { not: null } },
        _avg: { score: true },
        _max: { score: true },
      }),
      prisma.interviewSession.findMany({
        where: { candidateId: candidate.id },
        include: {
          interviewer: { select: { username: true, email: true, candidate: { select: { name: true } } } },
          report: { select: { id: true, overallScore: true, executiveSummary: true, strengths: true, weaknesses: true } },
          questions: {
            include: {
              answer: {
                include: { evaluation: true }
              }
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: 50
      })
    ])

    const avgScore = scoreAgg._avg.score !== null ? Number(scoreAgg._avg.score.toFixed(1)) : null
    const bestScore = scoreAgg._max.score !== null ? Number(scoreAgg._max.score.toFixed(1)) : null

    return (
      <section className="screen active" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Notice Card */}
        <div className="candidate-welcome-card" style={{ ...cardStyle, marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                  My Interview Results
                </h1>
                <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                  Candidate Portal
                </span>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                Your interviewer creates and conducts live interviews. Access your generated reports, evaluation scores, and complete Q&amp;A history below.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="candidate-tabs-group" style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-bg-tertiary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--color-card-border)' }}>
              <Link
                href="/candidate"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: activeTab !== 'performance' ? '#ffffff' : 'var(--color-text-secondary)',
                  background: activeTab !== 'performance' ? '#6366f1' : 'transparent',
                }}
              >
                My Results
              </Link>
              <Link
                href="/candidate?tab=performance"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  color: activeTab === 'performance' ? '#ffffff' : 'var(--color-text-secondary)',
                  background: activeTab === 'performance' ? '#6366f1' : 'transparent',
                }}
              >
                Performance Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Real PostgreSQL Statistics Grid */}
        <div className="candidate-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={statBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Total Interviews</span>
              <Icon name="assignment" size={20} style={{ color: '#818cf8' }} />
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalInterviews}</span>
          </div>

          <div style={statBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Completed</span>
              <Icon name="check_circle" size={20} style={{ color: '#10b981' }} />
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981' }}>{completedInterviews}</span>
          </div>

          <div style={statBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Average Score</span>
              <Icon name="analytics" size={20} style={{ color: '#6366f1' }} />
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {avgScore !== null ? `${avgScore}%` : '—'}
            </span>
          </div>

          <div style={statBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Best Score</span>
              <Icon name="emoji_events" size={20} style={{ color: '#ec4899' }} />
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ec4899' }}>
              {bestScore !== null ? `${bestScore}%` : '—'}
            </span>
          </div>
        </div>

        {activeTab === 'performance' ? (
          /* Performance Analytics Tab View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Performance &amp; Evaluation Analysis
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
                Summary of your performance trends compiled from your completed interviewer evaluations.
              </p>

              {completedInterviews === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <Icon name="analytics" size={48} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>No Performance Data Yet</h3>
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>Once your interviewer completes an evaluation session, your detailed performance breakdown will appear here.</p>
                </div>
              ) : (
                <div className="candidate-performance-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--color-bg-tertiary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-card-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Average Performance</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{avgScore}%</div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Across {completedInterviews} completed interview session(s).</p>
                  </div>

                  <div style={{ background: 'var(--color-bg-tertiary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-card-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Peak Evaluation</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ec4899' }}>{bestScore}%</div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Your top overall evaluation score.</p>
                  </div>

                  <div style={{ background: 'var(--color-bg-tertiary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-card-border)' }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Completed Reports</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#818cf8' }}>{completedInterviews}</div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Full Q&amp;A transcripts generated.</p>
                  </div>
                </div>
              )}
            </div>

            {/* List of Recent Completed Reports */}
            {sessions.filter(s => s.status === 'completed' || s.report !== null).length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Completed Reports &amp; Summaries
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sessions.filter(s => s.status === 'completed' || s.report !== null).map((s) => {
                    const scope = (s.scope as { subject?: string; mode?: string } | null)
                    const subject = scope?.subject || s.interviewType || 'Technical Interview'
                    const score = s.score ?? s.report?.overallScore ?? 0

                    return (
                      <div key={s.id} style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{subject}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                            Interviewer: {formatInterviewerName(s.interviewer)} &bull; Date: {new Date(s.startedAt).toLocaleDateString()}
                          </div>
                          {s.report?.executiveSummary && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.5rem 0 0 0', maxWidth: '800px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {s.report.executiveSummary}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                            {score.toFixed(1)}%
                          </span>
                          <Link
                            href={`/report/${s.id}`}
                            style={{
                              textDecoration: 'none',
                              background: '#6366f1',
                              color: '#ffffff',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Icon name="visibility" size={16} /> View Report
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Main Results Table View */
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Interview Sessions &amp; Reports
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Showing {sessions.length} session(s)
              </span>
            </div>

            {sessions.length === 0 ? (
              <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Icon name="inbox" size={48} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  No interview results yet
                </p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Your interviewer conducts the live interview. Once completed, your generated evaluation report and full Q&amp;A transcript will appear here.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-card-border)', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Interview / Mode</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Subject</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Interviewer</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Score</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((sess) => {
                      const scope = (sess.scope as { subject?: string; mode?: string } | null)
                      const subject = scope?.subject || sess.interviewType || 'Adaptive Interview'
                      const mode = scope?.mode || 'standard'
                      const displayScore = sess.score !== null 
                        ? `${sess.score.toFixed(1)}%` 
                        : sess.report?.overallScore !== undefined 
                          ? `${sess.report.overallScore.toFixed(1)}%` 
                          : '—'
                      const isCompleted = sess.status === 'completed' || sess.report !== null
                      const isActive = sess.status === 'active'
                      const hasAnswers = sess.questions.some(q => q.answer !== null)
                      const interviewerName = formatInterviewerName(sess.interviewer)

                      const statusLabel = isCompleted 
                        ? 'Completed' 
                        : isActive 
                          ? (hasAnswers ? 'In Progress' : 'Scheduled') 
                          : 'Pending Results'

                      return (
                        <tr key={sess.id} style={{ borderBottom: '1px solid var(--color-card-border)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            <div style={{ fontWeight: 600 }}>{subject}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                              Mode: {mode}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                            {subject}
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Icon name="person" size={16} style={{ color: '#818cf8' }} />
                              <span>{interviewerName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>
                            {new Date(sess.startedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: isCompleted ? 'rgba(16,185,129,0.12)' : isActive ? 'rgba(245,158,11,0.12)' : 'rgba(107,114,128,0.12)',
                              color: isCompleted ? '#10b981' : isActive ? '#f59e0b' : 'var(--color-text-muted)',
                              border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : isActive ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--color-card-border)',
                            }}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 700, color: isCompleted ? '#10b981' : 'var(--color-text-secondary)' }}>
                            {displayScore}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {isCompleted ? (
                              <Link
                                href={`/report/${sess.id}`}
                                style={{
                                  textDecoration: 'none',
                                  color: '#ffffff',
                                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(99,102,241,0.25)'
                                }}
                              >
                                <Icon name="visibility" size={16} /> View Report
                              </Link>
                            ) : (
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                {isActive ? 'Conducted by interviewer' : 'Pending'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    )
  }

  // Interviewer / Admin Candidate Profile View
  const candidates = await prisma.candidate.findMany({
    where: searchQuery.trim() ? {
      OR: [
        { name: { contains: searchQuery.trim(), mode: 'insensitive' } },
        { email: { contains: searchQuery.trim(), mode: 'insensitive' } },
      ]
    } : undefined,
    include: {
      user: { select: { username: true } },
      _count: { select: { sessions: true } },
      sessions: {
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          startedAt: true,
          status: true,
          interviewType: true,
          score: true,
          report: { select: { overallScore: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return (
    <section className="screen active" style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Candidate Profiles &amp; Interview Assignments</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Select a candidate profile to create, configure, and launch a live technical interview.
          </p>
        </div>
        <div>
          <Link
            href="/interview"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '0.65rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
            }}
          >
            <Icon name="play_arrow" size={18} />
            Create &amp; Start Live Interview
          </Link>
        </div>
      </div>

      {/* Candidates List / Cards Grid */}
      <div className="candidate-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {candidates.length === 0 ? (
          <div style={{ ...cardStyle, gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            <Icon name="person_off" size={48} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>No candidates found</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>You can create a new interview session directly from the Live Interview section.</p>
          </div>
        ) : (
          candidates.map((cand) => {
            const latestSession = cand.sessions[0] || null
            const latestScore = latestSession ? (latestSession.score ?? latestSession.report?.overallScore) : null

            return (
              <div key={cand.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.2rem'
                    }}>
                      {cand.name ? cand.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)', fontWeight: 600 }}>{cand.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cand.email || 'No email registered'}</span>
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: '10px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', border: '1px solid var(--color-card-border)' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Total Sessions</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>{cand._count.sessions}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Latest Score</span>
                      <strong style={{ color: latestScore !== null && latestScore !== undefined ? (latestScore >= 75 ? '#10b981' : '#f59e0b') : 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        {latestScore !== null && latestScore !== undefined ? `${latestScore.toFixed(1)}%` : '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--color-card-border)', paddingTop: '1rem' }}>
                  <Link
                    href={`/interview?candidateId=${cand.id}&candidateName=${encodeURIComponent(cand.name)}`}
                    style={{
                      flex: 1,
                      textDecoration: 'none',
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#ffffff',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
                    }}
                  >
                    <Icon name="play_arrow" size={16} />
                    Create &amp; Start Interview
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
