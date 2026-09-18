"use client";
import { useFallbackFetch } from "@/components/providers/FallbackProvider";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';



export default function InterviewPage() {
  const fetchWithFallback = useFallbackFetch();
    const router = useRouter();
  
  interface SessionData { id: string; candidateId: string; }
  interface QuestionData { id: string; content: string; questionNumber: number; topic?: string; difficulty?: string; }
  interface EvaluationData { question: string; answer: string; feedback?: { score: number; reason?: string; correctness?: string; missingKeywords?: string[]; [key: string]: unknown } | null; }
  interface SuggestionData { question: string; difficulty?: string; type?: string; reason?: string; }
  interface DocumentData { id: number; originalFilename: string; }

  const [session, setSession] = useState<SessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestionData[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isResuming, setIsResuming] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  
  const [setupMode, setSetupMode] = useState('standard');
  const [setupData, setSetupData] = useState('');
  
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const docsFetchedRef = useRef(false);
  useEffect(() => {
    if (docsFetchedRef.current) return;
    docsFetchedRef.current = true;
    const fetchDocs = async () => {
      try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (res.ok) {
          setDocuments(data.documents || []);
        }
      } catch (e) {
        console.error("Failed to fetch docs", e);
      }
    };
    fetchDocs();
  }, []);

  // Restore session
  const resumeFetchedRef = useRef(false);
  useEffect(() => {
    if (resumeFetchedRef.current) return;
    resumeFetchedRef.current = true;
    const resumeSession = async () => {
      const stored = localStorage.getItem('activeInterviewSession');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const res = await fetch(`/api/interview/resume?sessionId=` + parsed.id);
          const data = await res.json();
          if (data.session) {
            setSession(data.session);
            setCurrentQuestion(data.currentQuestion);
            if (data.evaluations) setEvaluations(data.evaluations);
          } else {
            localStorage.removeItem('activeInterviewSession');
          }
        } catch (e) {
          console.error(e);
          localStorage.removeItem('activeInterviewSession');
        }
      }
      setIsResuming(false);
    };
    resumeSession();
  }, [setSession]);

  const startInterview = async () => {
    setIsProcessing(true);
    let finalSetupData = setupData;
    if (setupMode === 'knowledge-base' || setupMode === 'knowledge') {
      finalSetupData = JSON.stringify(selectedDocIds);
    }
    
    try {
      const res = await fetchWithFallback("/api/interview/start", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: "Guest Candidate",
          subject: "Data Structures and Algorithms",
          mode: setupMode,
          setupData: finalSetupData,
          selectedDocumentIds: selectedDocIds
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Failed to start interview: " + (data.error || "Unknown error"));
        setIsProcessing(false);
        return;
      }
      if (data.sessionId) {
        setSession({ id: data.sessionId, candidateId: data.candidate.id });
        setCurrentQuestion(data.firstQuestion);
        setEvaluations([]);
        setSuggestedQuestions([]);
        localStorage.setItem('activeInterviewSession', JSON.stringify({ id: data.sessionId, candidateId: data.candidate.id }));
      }
    } catch (error) {
      console.error("Failed to start interview", error);
    }
    setIsProcessing(false);
  };

  const submitTextAnswer = async () => {
    if (!textAnswer.trim() || !session || !currentQuestion || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const evalRes = await fetchWithFallback("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          questionId: currentQuestion?.id,
          transcript: textAnswer
        })
      });
      
      const evalData = await evalRes.json();
      
      if (!evalRes.ok) {
        throw new Error(evalData.error || evalData.message || "Failed to evaluate answer");
      }
      
      const isDuplicate = evaluations.some(e => e.question === currentQuestion?.content);
      if (!isDuplicate) {
        setEvaluations(prev => [...prev, {
          question: currentQuestion?.content,
          answer: textAnswer,
          feedback: evalData.evaluation
        }]);
      }

      if (evalData.suggestedQuestions && evalData.suggestedQuestions.length > 0) {
        setSuggestedQuestions(evalData.suggestedQuestions);
      } else if (evalData.nextQuestion) {
        // Fallback if the endpoint returned nextQuestion directly
        setCurrentQuestion(evalData.nextQuestion);
        setTextAnswer("");
      } else {
        // Generate fallback suggestions if everything failed
        setSuggestedQuestions([{ question: "Could you explain a real-world application of your answer?", difficulty: "medium" }]);
      }
    } catch (error: unknown) {
      console.error("Text processing failed", error);
      // Avoid generic alert, prefer a proper notification if available, but for now we'll just log it or show a clean alert
      const errorMessage = error instanceof Error ? error.message : "Network or server error";
      alert("Unable to submit the answer. " + errorMessage);
    }
    
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isProcessing && textAnswer.trim()) {
        submitTextAnswer();
      }
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  const startRecording = async () => {
    if (isProcessing || isRecording || isTranscribing) return;
    setMicError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError("Audio recording is not supported in this browser environment. Please type your answer manually.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const actualMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: actualMime });
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size === 0) {
          setIsRecording(false);
          setRecordingDuration(0);
          return;
        }

        setIsRecording(false);
        setIsTranscribing(true);
        setIsProcessing(true);

        try {
          const ext = actualMime.includes('mp4') ? 'mp4' : actualMime.includes('ogg') ? 'ogg' : 'webm';
          const formData = new FormData();
          formData.append("audio", audioBlob, `answer.${ext}`);

          const res = await fetch("/api/interview/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            setMicError(data.error || "Transcription failed. Please type your answer manually.");
          } else if (data.text || data.transcript) {
            const transcript = (data.text || data.transcript).trim();
            if (transcript) {
              setTextAnswer(prev => prev.trim() ? `${prev.trim()} ${transcript}` : transcript);
            }
          }
        } catch (error) {
          console.error("Transcription pipeline error:", error);
          setMicError("Local transcription service is unavailable. You can type your answer manually.");
        } finally {
          setIsTranscribing(false);
          setIsProcessing(false);
          setRecordingDuration(0);
        }
      };

      mediaRecorder.start(250); // Collect data slices every 250ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer and auto-stop at 120s limit
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 119) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      const isDenied = err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setMicError(
        isDenied
          ? "Microphone permission was denied. Please enable microphone access in your browser settings or type your answer manually."
          : "Unable to access microphone. You can type your answer manually."
      );
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const selectQuestion = async (suggestion: SuggestionData) => {
    setIsProcessing(true);
    try {
      const res = await fetchWithFallback("/api/interview/select-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session?.id,
          questionNumber: (currentQuestion?.questionNumber || 0) + 1,
          suggestion
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentQuestion(data.question);
        setSuggestedQuestions([]);
        setTextAnswer("");
      } else {
        alert("Failed to load question: " + data.error);
      }
    } catch (e) {
      console.error("Failed to select question", e);
    }
    setIsProcessing(false);
  };

  const endInterview = async () => {
    if (!session) return;
    if (!window.confirm("Are you sure you want to end the interview and generate the final report?")) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetchWithFallback("/api/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id })
      });
      const data = await res.json();
      localStorage.removeItem('activeInterviewSession');
      if (data.reportId) {
        router.push(`/report/${session.id}`)
      } else {
        window.location.reload() /* Fallback to reload if needed, but Next.js router.refresh() does not reset client state. Reload is correct for a fresh interview. */
      }
    } catch (e) {
      console.error(e);
      localStorage.removeItem('activeInterviewSession');
      window.location.reload() /* Fallback to reload if needed, but Next.js router.refresh() does not reset client state. Reload is correct for a fresh interview. */
    }
    setIsProcessing(false);
  };

  if (isResuming) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2 style={{ color: 'var(--color-text-muted)' }}>Restoring Session...</h2>
      </div>
    );
  }

  // Calculate live average score
  const avgScore = evaluations.length > 0 
    ? Math.round(evaluations.reduce((sum, ev) => sum + (ev.feedback?.score || 0), 0) / evaluations.length)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--color-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.5rem' }}>Adaptive Technical Interview</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            AI-powered interview that adapts to your skills and responses.
          </p>
        </div>
        {!session ? (
          <button 
            onClick={startInterview}
            disabled={isProcessing}
            style={{ padding: '0.8rem 1.5rem', background: '#6366f1', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {isProcessing ? 'Initializing...' : 'Start Technical Interview'}
          </button>
        ) : (
          <button 
            onClick={endInterview}
            disabled={isProcessing}
            style={{ padding: '0.8rem 1.5rem', background: '#ef4444', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {isProcessing ? 'Ending...' : 'End Interview & View Report'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Interview Area */}
        <div style={{ flex: 3, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {!session ? (
            <div style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '2.5rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Icon name="rocket_launch" size={40} style={{ color: '#6366f1' }} />
                <h2 style={{ color: 'var(--color-text-primary)', marginTop: '1rem', marginBottom: '0.5rem' }}>Configure Interview</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>Choose how you want the AI to generate questions.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Mode Selection */}
                <div>
                  <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.75rem' }}>Interview Mode</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: setupMode === 'standard' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: setupMode === 'standard' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="mode" value="standard" checked={setupMode === 'standard'} onChange={(e) => setSetupMode(e.target.value)} style={{ accentColor: '#6366f1' }} />
                      <div>
                        <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Standard Adaptive</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Covers the entire configured syllabus dynamically.</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: setupMode === 'keywords' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: setupMode === 'keywords' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="mode" value="keywords" checked={setupMode === 'keywords'} onChange={(e) => setSetupMode(e.target.value)} style={{ accentColor: '#6366f1' }} />
                      <div>
                        <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Keyword Focused</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Limit questions to specific topics or keywords.</div>
                      </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: setupMode === 'knowledge-base' ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: setupMode === 'knowledge-base' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="mode" value="knowledge-base" checked={setupMode === 'knowledge-base'} onChange={(e) => setSetupMode(e.target.value)} style={{ accentColor: '#6366f1' }} />
                      <div>
                        <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>Knowledge Base Only</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Base the interview strictly on your uploaded documents.</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Conditional Inputs */}
                {setupMode === 'keywords' && (
                  <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Focus Keywords (comma separated)</label>
                    <input 
                      type="text" 
                      value={setupData} 
                      onChange={(e) => setSetupData(e.target.value)} 
                      placeholder="e.g. Arrays, Recursion, Time Complexity" 
                      style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                )}
                {setupMode === 'knowledge-base' && (
                  <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>Select Documents</label>
                    {documents.length === 0 ? (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>No documents uploaded. Please upload some in the Knowledge Base first.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', background: 'var(--color-bg-tertiary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
                        {documents.map((doc: DocumentData) => (
                          <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '0.9rem' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedDocIds.includes(doc.id)} 
                              onChange={(e) => {
                                if (e.target.checked) setSelectedDocIds([...selectedDocIds, doc.id]);
                                else setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                              }}
                              style={{ accentColor: '#6366f1' }}
                            />
                            {doc.originalFilename}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={startInterview}
                  disabled={isProcessing || (setupMode === 'keywords' && !setupData.trim()) || (setupMode === 'knowledge-base' && selectedDocIds.length === 0)}
                  style={{ marginTop: '1rem', padding: '1rem', background: '#6366f1', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', width: '100%' }}
                >
                  {isProcessing ? 'Initializing...' : 'Start Interview'}
                </button>
              </div>
            </div>
          ) : currentQuestion && (
            <>
              {/* Question Card */}
              <div style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', borderRadius: '12px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                    QUESTION {currentQuestion?.questionNumber}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', background: 'var(--color-bg-tertiary)', padding: '2px 8px', borderRadius: '12px' }}>
                    {currentQuestion?.topic} &bull; {currentQuestion?.difficulty}
                  </span>
                </div>
                <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.4rem', lineHeight: 1.5, margin: '0 0 2rem 0', fontWeight: 400 }}>
                  {currentQuestion?.content}
                </h2>
                
                <hr style={{ borderColor: 'rgba(255,255,255,0.05)', margin: '2rem 0' }} />

                {suggestedQuestions.length === 0 ? (
                  // Answer Input Area
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Your Answer</div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <textarea 
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type your answer here..."
                          disabled={isProcessing || isRecording}
                          style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', minHeight: '120px', fontFamily: 'inherit', resize: 'vertical', fontSize: '1rem', lineHeight: 1.5 }}
                        />
                      </div>
                    </div>
                    {micError && (
                      <div style={{ padding: '0.6rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Icon name="warning" size={16} />
                        <span>{micError}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isRecording ? (
                          <button
                            onClick={stopRecording}
                            type="button"
                            aria-label="Stop recording audio"
                            style={{
                              padding: '0.8rem 1.5rem',
                              background: 'rgba(239,68,68,0.2)',
                              color: '#ef4444',
                              border: '1px solid #ef4444',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: 600,
                              fontSize: '0.9rem'
                            }}
                          >
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                            Stop Recording ({String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:{String(recordingDuration % 60).padStart(2, '0')})
                          </button>
                        ) : isTranscribing ? (
                          <button
                            disabled
                            type="button"
                            aria-label="Transcribing audio"
                            style={{
                              padding: '0.8rem 1.5rem',
                              background: 'rgba(99,102,241,0.15)',
                              color: '#818cf8',
                              border: '1px solid rgba(99,102,241,0.3)',
                              borderRadius: '8px',
                              cursor: 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: 500,
                              fontSize: '0.9rem'
                            }}
                          >
                            <Icon name="refresh" size={18} />
                            Transcribing your answer...
                          </button>
                        ) : (
                          <button
                            onClick={startRecording}
                            disabled={isProcessing}
                            type="button"
                            aria-label="Start voice recording"
                            style={{
                              padding: '0.8rem 1.5rem',
                              background: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-card-border)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: 500,
                              fontSize: '0.9rem'
                            }}
                          >
                            <Icon name="mic" size={20} />
                            Voice Input (Speak Answer)
                          </button>
                        )}

                        {textAnswer.trim().length > 0 && !isRecording && !isTranscribing && (
                          <button
                            onClick={() => setTextAnswer('')}
                            type="button"
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: 'transparent',
                              color: 'var(--color-text-muted)',
                              border: '1px solid var(--color-card-border)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            Clear Text
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Press Enter to submit</span>
                        <button
                          onClick={submitTextAnswer}
                          disabled={isProcessing || isRecording || isTranscribing || !textAnswer.trim()}
                          style={{ padding: '0.8rem 2rem', background: '#6366f1', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {isProcessing ? 'Analyzing...' : 'Submit Answer'}
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                      * Voice transcription is processed locally by the application&apos;s Whisper service.
                    </div>
                  </div>
                ) : (
                  // Suggestions Area
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.5s ease-out' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
                      <Icon name="check_circle" size={20} />
                      <span style={{ fontWeight: 600 }}>Answer Analyzed</span>
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.1rem' }}>Choose your next question:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                      {suggestedQuestions.map((s, idx) => (
                        <button
                          key={idx}
                          className="suggestion-card"
                          onClick={() => selectQuestion(s)}
                          disabled={isProcessing}
                          style={{
                            textAlign: 'left',
                            padding: '1.25rem',
                            background: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-card-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}
                        >
                          <div style={{ color: 'var(--color-text-primary)', fontSize: '1rem', lineHeight: 1.4 }}>{s.question}</div>
                          {s.reason && <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}><strong>AI Note:</strong> {s.reason}</div>}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <span style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px' }}>{s.difficulty}</span>
                            <span style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px' }}>{s.type}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* AI Assistant Panel */}
        <div style={{ flex: 1, minWidth: '300px', maxWidth: '420px', background: 'var(--color-bg-tertiary)', borderLeft: '1px solid var(--color-card-border)', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Panel Header & Status Indicator */}
          <div style={{ borderBottom: '1px solid var(--color-card-border)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Icon name="smart_toy" size={24} style={{ color: '#6366f1' }} />
              <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>AI Assistant</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: session ? '#10b981' : '#6366f1',
                display: 'inline-block',
                boxShadow: session ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
              }} />
              <span>{session ? 'Interview in progress' : 'Ready to assist'}</span>
            </div>
          </div>

          {/* Current Question Context */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-card-border)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              Current Question
            </div>
            <div style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', lineHeight: 1.4, fontStyle: currentQuestion?.content ? 'normal' : 'italic' }}>
              {currentQuestion?.content ? (
                currentQuestion.content.length > 140 ? `${currentQuestion.content.substring(0, 140)}...` : currentQuestion.content
              ) : (
                "Waiting for the next question..."
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-card-border)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
              AI Insights
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Difficulty</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>
                  {currentQuestion?.difficulty || "Not available"}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Topic</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500, textTransform: 'capitalize', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentQuestion?.topic || (setupMode === 'keywords' && setupData ? setupData : "Adaptive / Technical")}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Response Mode</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {setupMode === 'standard' ? 'Standard Adaptive' : setupMode === 'keywords' ? 'Keyword Focused' : setupMode === 'knowledge-base' ? 'Knowledge Base' : 'Adaptive'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Answer Status</span>
                <span style={{ color: isProcessing ? '#f59e0b' : isRecording ? '#ef4444' : isTranscribing ? '#818cf8' : suggestedQuestions.length > 0 ? '#10b981' : currentQuestion ? '#3b82f6' : 'var(--color-text-muted)', fontWeight: 500 }}>
                  {isProcessing ? 'Evaluating answer...' : isRecording ? 'Recording answer...' : isTranscribing ? 'Transcribing...' : suggestedQuestions.length > 0 ? 'Choose next question' : currentQuestion ? 'Waiting for response' : 'Not started'}
                </span>
              </div>
            </div>
          </div>

          {/* Interview Progress */}
          <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-card-border)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Interview Progress
              </div>
              <div style={{ color: '#818cf8', fontSize: '0.8rem', fontWeight: 600 }}>
                {currentQuestion?.questionNumber ? `Question ${currentQuestion.questionNumber}` : session ? `Answered: ${evaluations.length}` : 'Not started'}
              </div>
            </div>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${session ? Math.min(100, Math.max(10, ((evaluations.length + (currentQuestion ? 1 : 0)) / 10) * 100)) : 0}%`,
                backgroundColor: '#6366f1',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Live Performance & History Trace (Preserved) */}
          {session && evaluations.length > 0 && (
            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-card-border)', borderRadius: '10px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Live Average Score</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: avgScore >= 75 ? '#10b981' : (avgScore >= 50 ? '#f59e0b' : '#ef4444') }}>
                  {avgScore}%
                </span>
              </div>
              <details style={{ marginTop: '0.5rem' }}>
                <summary style={{ fontSize: '0.8rem', color: '#818cf8', cursor: 'pointer' }}>
                  View Answer History ({evaluations.length})
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {evaluations.map((ev, idx) => (
                    <div key={idx} style={{ padding: '0.4rem 0.6rem', background: 'var(--color-bg-tertiary)', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                        <span>Q{idx + 1}</span>
                        <span style={{ color: (ev.feedback?.score || 0) >= 70 ? '#10b981' : '#f59e0b' }}>{ev.feedback?.score}%</span>
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ev.question}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Assistant Guidance Card */}
          <div style={{
            marginTop: 'auto',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '10px',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}>
              <Icon name="lightbulb" size={16} />
              <span>AI Interviewer</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Answer naturally and explain your reasoning clearly. The interview will adapt based on your responses.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}










