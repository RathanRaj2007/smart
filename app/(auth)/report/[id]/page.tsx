export const dynamic = 'force-dynamic';

import React from "react";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppSession } from "@/lib/auth";
import Icon from "@/components/Icon";

import { formatInterviewerName } from "@/lib/formatters";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const userSession = await getAppSession();
  const userId = userSession.userId;

  if (!userId) {
    return (
      <div style={{ padding: '2rem', color: 'var(--color-text-primary)' }}>
        Unauthorized access. Please log in.
      </div>
    );
  }
  
  const session = await prisma.interviewSession.findUnique({
    where: { id: resolvedParams.id },
    include: {
      candidate: true,
      interviewer: {
        select: {
          username: true,
          email: true,
          candidate: { select: { name: true } }
        }
      },
      report: true,
      questions: {
        include: {
          answer: {
            include: {
              evaluation: true
            }
          }
        },
        orderBy: { askedAt: "asc" }
      },
      gaps: true
    }
  });

  if (!session) return notFound();

  // Strict server-side ownership authorization
  const isOwner =
    userSession.role === 'ADMIN' ||
    session.interviewerId === userId ||
    (session.candidate?.userId !== null && session.candidate?.userId === userId);

  if (!isOwner) return notFound();

  if (userSession.role === 'CANDIDATE') {
    const { createAuditLog } = await import("@/lib/audit-log");
    createAuditLog({
      userId,
      username: userSession.username,
      action: 'CANDIDATE_REPORT_VIEWED',
      entityType: 'InterviewSession',
      entityId: session.id,
      metadata: { candidateId: session.candidateId }
    });
  }

  const scope = (session.scope as { subject?: string; mode?: string } | null);
  const subject = scope?.subject || session.interviewType || 'Technical Interview';
  const mode = scope?.mode || 'standard';
  const interviewerName = formatInterviewerName(session.interviewer);
  const isCompleted = session.status === 'completed';
  const displayScore = session.score !== null 
    ? `${session.score.toFixed(1)}%` 
    : session.report?.overallScore !== undefined 
      ? `${session.report.overallScore.toFixed(1)}%` 
      : 'In Progress';

  const backHref = userSession.role === 'CANDIDATE' ? '/candidate' : '/dashboard';

  const cardStyle: React.CSSProperties = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-primary)', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Top Bar / Header */}
      <div className="report-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              {userSession.role === 'CANDIDATE' ? 'My Interview Q&A Report' : `Interview Report: ${session.candidate.name}`}
            </h1>
            <span style={{
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              color: isCompleted ? '#10b981' : '#f59e0b',
              border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(245,158,11,0.3)',
              textTransform: 'capitalize'
            }}>
              {session.status}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Session ID: {session.id} &bull; Started {new Date(session.startedAt).toLocaleString()}
          </p>
        </div>

        <Link href={backHref} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#6366f1', color: '#ffffff', padding: '0.6rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
          <Icon name="arrow_back" size={18} />
          Back to {userSession.role === 'CANDIDATE' ? 'Candidate Dashboard' : 'Dashboard'}
        </Link>
      </div>

      {/* Overview Metadata Grid */}
      <div className="report-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ ...cardStyle, padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Candidate</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{session.candidate.name}</span>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Interviewer</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{interviewerName}</span>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Subject</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{subject}</span>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Mode &amp; Difficulty</span>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', textTransform: 'capitalize' }}>
            {mode} &bull; {session.difficulty}
          </span>
        </div>

        <div style={{ ...cardStyle, padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(99,102,241,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Overall Score</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: isCompleted ? '#10b981' : '#f59e0b' }}>{displayScore}</span>
        </div>
      </div>

      {/* Executive Report Summary (if report available) */}
      {session.report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="report-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <h3 style={{ color: '#818cf8', marginTop: 0, fontSize: '1.1rem', fontWeight: 600 }}>Executive Summary</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.95rem' }}>{session.report.executiveSummary}</p>
            </div>

            <div style={cardStyle}>
              <h3 style={{ color: '#818cf8', marginTop: 0, fontSize: '1.1rem', fontWeight: 600 }}>Improvement Plan</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.95rem' }}>{session.report.improvementPlan}</p>
            </div>
          </div>

          <div className="report-two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ ...cardStyle, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <h3 style={{ color: '#10b981', marginTop: 0, fontSize: '1.1rem', fontWeight: 600 }}>Strengths</h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                {session.report.strengths.map((s, i) => <li key={i} style={{ margin: '0.35rem 0' }}>{s}</li>)}
              </ul>
            </div>
            
            <div style={{ ...cardStyle, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <h3 style={{ color: '#ef4444', marginTop: 0, fontSize: '1.1rem', fontWeight: 600 }}>Weaknesses &amp; Gaps</h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                {session.report.weaknesses.map((w, i) => <li key={i} style={{ margin: '0.35rem 0' }}>{w}</li>)}
                {session.gaps.map((g, i) => <li key={`g${i}`} style={{ margin: '0.35rem 0', color: '#fca5a5' }}>{g.concept} (Confidence: {g.confidence})</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Interview Transcript & Q&A History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
            Interview Transcript &amp; Q&amp;A History
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {session.questions.length} question(s) asked
          </span>
        </div>

        {session.questions.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
            <Icon name="help_outline" size={40} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p style={{ margin: 0, fontSize: '0.95rem' }}>No questions recorded for this interview session yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {session.questions.map((q) => {
              const hasAnswer = q.answer !== null;
              const evalData = q.answer?.evaluation;
              const score = evalData?.score;

              return (
                <div key={q.id} style={{ ...cardStyle, borderLeft: hasAnswer ? '4px solid #6366f1' : '4px solid #f59e0b' }}>
                  {/* Question Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                        Q{q.questionNumber}
                      </span>
                      {q.topic && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-tertiary)', padding: '2px 8px', borderRadius: '6px' }}>
                          Topic: {q.topic}
                        </span>
                      )}
                      {q.difficulty && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                          Difficulty: {q.difficulty}
                        </span>
                      )}
                    </div>

                    {score !== undefined && score !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Score:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {score}/100
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Question Content */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                      {q.content}
                    </h4>
                  </div>

                  {/* Candidate Answer */}
                  <div style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      {userSession.role === 'CANDIDATE' ? 'Your Answer' : 'Candidate Answer'}
                    </div>
                    {hasAnswer ? (
                      <p style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {q.answer?.transcript}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        <Icon name="hourglass_top" size={18} />
                        <span>Waiting for candidate answer...</span>
                      </div>
                    )}
                  </div>

                  {/* Evaluation Details */}
                  {evalData && (
                    <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        AI Evaluation &amp; Feedback
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                        {evalData.correctness && (
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Correctness</span>
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{evalData.correctness}</span>
                          </div>
                        )}
                        {evalData.completeness && (
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Completeness</span>
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{evalData.completeness}</span>
                          </div>
                        )}
                        {evalData.technicalAccuracy && (
                          <div>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Technical Accuracy</span>
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{evalData.technicalAccuracy}</span>
                          </div>
                        )}
                      </div>

                      {evalData.feedback && (
                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginTop: '0.25rem' }}>
                          <strong style={{ color: 'var(--color-text-primary)' }}>Feedback: </strong>
                          {evalData.feedback}
                        </div>
                      )}

                      {evalData.mentionedKeywords && evalData.mentionedKeywords.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#10b981' }}>
                          <strong>Mentioned Keywords: </strong>
                          {evalData.mentionedKeywords.join(', ')}
                        </div>
                      )}

                      {evalData.missingKeywords && evalData.missingKeywords.length > 0 && (
                        <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                          <strong>Missing Expected Keywords: </strong>
                          {evalData.missingKeywords.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
