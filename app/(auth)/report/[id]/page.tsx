export const dynamic = 'force-dynamic';

import React from "react";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAppSession } from "@/lib/auth";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const userSession = await getAppSession();
  const userId = userSession.userId;

  if (!userId) {
    return <div>Unauthorized</div>;
  }
  
  const report = await prisma.interviewReport.findUnique({
    where: { sessionId: resolvedParams.id },
    include: {
      session: {
        include: {
          candidate: true,
          questions: {
            include: { answer: { include: { evaluation: true } } },
            orderBy: { askedAt: "asc" }
          },
          gaps: true
        }
      }
    }
  });

  if (!report || report.session.interviewerId !== userId) return notFound();

  return (
    <div style={{ padding: '2rem', color: 'var(--color-text-primary)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Interview Report: {report.session.candidate.name}</h1>
        <Link href="/dashboard" style={{ background: '#6366f1', color: 'var(--color-text-primary)', padding: '0.5rem 1rem', borderRadius: '8px', textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Executive Summary */}
        <div style={{ background: 'var(--color-bg-tertiary)', padding: '2rem', borderRadius: '12px' }}>
          <h3 style={{ color: '#818cf8', marginTop: 0 }}>Executive Summary</h3>
          <p style={{ lineHeight: 1.6 }}>{report.executiveSummary}</p>
          <h1 style={{ color: '#10b981', fontSize: '3rem', margin: '1rem 0 0 0' }}>{report.overallScore.toFixed(0)}%</h1>
          <span style={{ color: 'var(--color-text-secondary)' }}>Overall Score</span>
        </div>

        {/* Improvement Plan */}
        <div style={{ background: 'var(--color-bg-tertiary)', padding: '2rem', borderRadius: '12px' }}>
          <h3 style={{ color: '#818cf8', marginTop: 0 }}>Improvement Plan</h3>
          <p style={{ lineHeight: 1.6 }}>{report.improvementPlan}</p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div style={{ background: 'rgba(16,185,129,0.1)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
          <h3 style={{ color: '#10b981', marginTop: 0 }}>Strengths</h3>
          <ul>
            {report.strengths.map((s, i) => <li key={i} style={{ margin: '0.5rem 0' }}>{s}</li>)}
          </ul>
        </div>
        
        <div style={{ background: 'rgba(239,68,68,0.1)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <h3 style={{ color: '#ef4444', marginTop: 0 }}>Weaknesses & Gaps</h3>
          <ul>
            {report.weaknesses.map((w, i) => <li key={i} style={{ margin: '0.5rem 0' }}>{w}</li>)}
            {report.session.gaps.map((g, i) => <li key={`g${i}`} style={{ margin: '0.5rem 0', color: '#fca5a5' }}>{g.concept} (Confidence: {g.confidence})</li>)}
          </ul>
        </div>
      </div>

      {/* Question Analysis */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Question-by-Question Analysis</h2>
        {report.session.questions.map((q) => (
          <div key={q.id} style={{ background: 'var(--color-bg-tertiary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 1rem 0' }}>Q{q.questionNumber}: {q.content}</h4>
            <div style={{ background: 'var(--color-bg-tertiary)', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Answer:</strong>
              <p style={{ margin: '0.5rem 0 0 0' }}>{q.answer?.transcript || "No answer provided"}</p>
            </div>
            {q.answer?.evaluation && (
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#a855f7' }}>Score:</span> {q.answer.evaluation.score}</div>
                <div><span style={{ color: '#10b981' }}>Correctness:</span> {q.answer.evaluation.correctness}</div>
              </div>
            )}
            {q.answer?.evaluation?.missingKeywords && q.answer.evaluation.missingKeywords.length > 0 && (
              <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#ef4444' }}>
                <strong>Missing Expected Keywords:</strong> {q.answer.evaluation.missingKeywords.join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
