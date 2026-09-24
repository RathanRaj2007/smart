"use client";

import { useFallbackFetch } from "@/components/providers/FallbackProvider";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';

interface SpeechRecognizerInstance {
  stop: () => void;
}

interface CandidateOption {
  id: string;
  name: string;
  email: string | null;
}

interface SessionData {
  id: string;
  candidateId: string;
  candidateName?: string;
}

interface QuestionData {
  id: string;
  content: string;
  questionNumber: number;
  topic?: string;
  difficulty?: string;
  expectedAnswer?: string;
}

interface EvaluationFeedback {
  score: number;
  correctness?: string;
  completeness?: string;
  technicalAccuracy?: string;
  feedback?: string;
  mentionedKeywords?: string[];
  missingKeywords?: string[];
  [key: string]: unknown;
}

interface EvaluationData {
  question: string;
  answer: string;
  feedback?: EvaluationFeedback | null;
}

interface SuggestionData {
  question: string;
  difficulty?: string;
  type?: string;
  reason?: string;
}

interface DocumentData {
  id: number;
  originalFilename: string;
}

export default function InterviewPage() {
  const fetchWithFallback = useFallbackFetch();
  const router = useRouter();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration state
  const [candidateList, setCandidateList] = useState<CandidateOption[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [candidateNameInput, setCandidateNameInput] = useState<string>('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [setupMode, setSetupMode] = useState('standard');
  const [setupData, setSetupData] = useState('');
  const [selectedLLM, setSelectedLLM] = useState('gemini');

  // Documents state
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  // Live session state
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<SuggestionData[]>([]);
  const [lastEvaluation, setLastEvaluation] = useState<EvaluationFeedback | null>(null);

  // Audio / STT state
  const [textAnswer, setTextAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognizerRef = useRef<SpeechRecognizerInstance | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Knowledge Base Documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch('/api/documents');
        const data = await res.json();
        if (res.ok) {
          setDocuments(data.documents || []);
        }
      } catch (e) {
        console.error("Failed to fetch documents:", e);
      }
    };
    fetchDocs();
  }, []);

  // Fetch Candidate List for Interviewer Setup
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch('/api/admin/candidates?limit=100');
        if (res.ok) {
          const data = await res.json();
          setCandidateList(data.candidates || []);
        }
      } catch (e) {
        console.error("Failed to fetch candidate list:", e);
      }
    };
    fetchCandidates();
  }, []);

  // Check Search Params for pre-selected candidate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const candId = searchParams.get('candidateId');
    const candName = searchParams.get('candidateName');
    if (candId) setSelectedCandidateId(candId);
    if (candName) setCandidateNameInput(candName);
  }, []);

  // Restore Active Session & Enforce Candidate Guard
  useEffect(() => {
    const resumeSession = async () => {
      try {
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const querySessionId = searchParams?.get('sessionId');
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('activeInterviewSession') : null;

        let url = '/api/interview/resume';
        if (querySessionId) {
          url += `?sessionId=${encodeURIComponent(querySessionId)}`;
        } else if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.id) url += `?sessionId=${encodeURIComponent(parsed.id)}`;
          } catch {
            // ignore JSON parse error
          }
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data?.userRole) {
          setUserRole(data.userRole);
          // STRICT CANDIDATE GUARD: Redirect candidate directly to candidate portal
          if (data.userRole === 'CANDIDATE') {
            router.push('/candidate');
            return;
          }
        }

        if (res.ok && data.activeSession && (data.sessionId || data.session?.id)) {
          const activeId = data.sessionId || data.session?.id;
          const candidateId = data.candidate?.id || data.session?.candidateId || '';
          const candidateName = data.candidate?.name || 'Candidate';

          setSession({ id: activeId, candidateId, candidateName });

          if (data.currentQuestion) {
            setCurrentQuestion(data.currentQuestion);
          }
          if (data.evaluations) {
            setEvaluations(data.evaluations);
            if (data.evaluations.length > 0) {
              setLastEvaluation(data.evaluations[data.evaluations.length - 1].feedback || null);
            }
          }

          const scope = data.session?.scope || {};
          if (scope.mode) setSetupMode(scope.mode);
          if (scope.llmProvider) setSelectedLLM(scope.llmProvider);
          if (Array.isArray(scope.selectedDocumentIds)) setSelectedDocIds(scope.selectedDocumentIds);
          if (data.session?.difficulty) setDifficulty(data.session.difficulty);

          localStorage.setItem('activeInterviewSession', JSON.stringify({ id: activeId, candidateId }));
        } else {
          localStorage.removeItem('activeInterviewSession');
        }
      } catch (e) {
        console.error("Resume interview error:", e);
        localStorage.removeItem('activeInterviewSession');
      } finally {
        setIsResuming(false);
      }
    };
    resumeSession();
  }, [router]);

  // Start Live Interview Handler
  const startLiveInterview = async () => {
    let activeCandidateName = candidateNameInput.trim();
    if (selectedCandidateId) {
      const found = candidateList.find(c => c.id === selectedCandidateId);
      if (found) activeCandidateName = found.name;
    }

    if (!activeCandidateName) {
      alert("Please select or enter a candidate name.");
      return;
    }

    if (setupMode === 'knowledge-base' && selectedDocIds.length === 0) {
      alert("Please select at least one Knowledge Base document.");
      return;
    }

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
          candidateId: selectedCandidateId || undefined,
          candidateName: activeCandidateName,
          difficulty: difficulty,
          mode: setupMode,
          setupData: finalSetupData,
          selectedDocumentIds: selectedDocIds,
          forceProvider: selectedLLM
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Failed to start interview: " + (data.error || "Unknown error"));
        setIsProcessing(false);
        return;
      }

      if (data.sessionId) {
        const newSession = {
          id: data.sessionId,
          candidateId: data.candidate.id,
          candidateName: data.candidate.name || activeCandidateName
        };
        setSession(newSession);
        setCurrentQuestion(data.firstQuestion);
        setEvaluations([]);
        setSuggestedQuestions([]);
        setLastEvaluation(null);
        setTextAnswer("");

        localStorage.setItem('activeInterviewSession', JSON.stringify({ id: data.sessionId, candidateId: data.candidate.id }));
      }
    } catch (error) {
      console.error("Failed to start live interview", error);
      alert("Error initializing interview session.");
    }
    setIsProcessing(false);
  };

  // Submit Answer & Evaluate Handler
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
          transcript: textAnswer,
          forceProvider: selectedLLM
        })
      });

      const evalData = await evalRes.json();
      if (!evalRes.ok) {
        throw new Error(evalData.error || evalData.message || "Failed to evaluate candidate answer");
      }

      const evalFeedback = evalData.evaluation;
      setLastEvaluation(evalFeedback);

      const isDuplicate = evaluations.some(e => e.question === currentQuestion?.content);
      if (!isDuplicate) {
        setEvaluations(prev => [...prev, {
          question: currentQuestion?.content || "",
          answer: textAnswer,
          feedback: evalFeedback
        }]);
      }

      if (evalData.suggestedQuestions && evalData.suggestedQuestions.length > 0) {
        setSuggestedQuestions(evalData.suggestedQuestions);
      } else if (evalData.nextQuestion) {
        setCurrentQuestion(evalData.nextQuestion);
        setTextAnswer("");
        setSuggestedQuestions([]);
      } else {
        setSuggestedQuestions([{ question: "Can you elaborate on a practical example of your solution?", difficulty: "medium" }]);
      }
    } catch (error: unknown) {
      console.error("Evaluation failed:", error);
      const msg = error instanceof Error ? error.message : "Unable to submit answer";
      alert("Evaluation failed: " + msg);
    }
    setIsProcessing(false);
  };

  const selectNextQuestion = async (suggestion: SuggestionData) => {
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

  // End Interview Handler
  const endInterview = async () => {
    if (!session) return;
    if (!window.confirm("End the live interview session and generate the final candidate report?")) {
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetchWithFallback("/api/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id, forceProvider: selectedLLM })
      });
      const data = await res.json();
      localStorage.removeItem('activeInterviewSession');
      if (data.reportId || session.id) {
        router.push(`/report/${session.id}`);
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error("Failed to end interview", e);
      localStorage.removeItem('activeInterviewSession');
      window.location.reload();
    }
    setIsProcessing(false);
  };

  // Audio Recording / Whisper STT Integration
  const getSupportedMimeType = () => {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
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
      setMicError("Audio recording not supported in this browser. Please type the answer manually.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      let liveSpeechCaptured = false;
      const win = window as unknown as Record<string, unknown>;
      const SpeechRecognition = (win.SpeechRecognition || win.webkitSpeechRecognition) as { new (): { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: { resultIndex: number; results: Array<Array<{ transcript: string }>> }) => void) | null } } | undefined;

      if (SpeechRecognition) {
        try {
          const recognizer = new SpeechRecognition();
          recognizer.continuous = true;
          recognizer.interimResults = true;
          recognizer.lang = 'en-US';
          const initialText = textAnswer;

          recognizer.onresult = (event: { resultIndex: number; results: Array<Array<{ transcript: string }>> }) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              finalTranscript += event.results[i][0].transcript;
            }
            if (finalTranscript.trim()) {
              liveSpeechCaptured = true;
              setTextAnswer(() => {
                const base = initialText ? initialText.trim() + ' ' : '';
                return base + finalTranscript.trim();
              });
            }
          };
          recognizer.start();
          speechRecognizerRef.current = recognizer;
        } catch {
          // ignore SpeechRecognition init errors
        }
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (speechRecognizerRef.current) {
          try { speechRecognizerRef.current.stop(); } catch {}
          speechRecognizerRef.current = null;
        }

        const actualMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: actualMime });
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
          formData.append("audio", audioBlob, `candidate_answer.${ext}`);

          const res = await fetch("/api/interview/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (!res.ok) {
            if (!liveSpeechCaptured) setMicError(data.error || "Transcription failed. Type answer manually.");
          } else if (data.text || data.transcript) {
            const transcript = (data.text || data.transcript).trim();
            if (transcript && !liveSpeechCaptured) {
              setTextAnswer(prev => prev.trim() ? `${prev.trim()} ${transcript}` : transcript);
            }
          }
        } catch (error) {
          console.error("Transcription error:", error);
          if (!liveSpeechCaptured) setMicError("Whisper STT service unavailable. Type candidate answer manually.");
        } finally {
          setIsTranscribing(false);
          setIsProcessing(false);
          setRecordingDuration(0);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 119) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic access error:", err);
      setMicError("Unable to access microphone. Please type answer manually.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognizerRef.current) {
      try { speechRecognizerRef.current.stop(); } catch {}
      speechRecognizerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  if (isResuming) {
    return (
      <div style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <h2 style={{ color: 'var(--color-text-muted)' }}>Restoring Interviewer Session...</h2>
      </div>
    );
  }

  // CANDIDATE REDIRECT GUARD
  if (userRole === 'CANDIDATE') {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-primary)' }}>
        <h2>Redirecting to Candidate Dashboard...</h2>
      </div>
    );
  }

  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((sum, ev) => sum + (ev.feedback?.score || 0), 0) / evaluations.length)
    : 0;

  return (
    <div className="interview-page-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="interview-header" style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--color-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: '1rem', background: 'var(--color-card-bg)' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.4rem', fontWeight: 700 }}>
            {session ? `Live Interview: ${session.candidateName || 'Candidate'}` : 'Live Interviewer Workspace'}
          </h1>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
            {session ? `Mode: ${setupMode}` : 'Interviewer conducts the live candidate evaluation session.'}
          </p>
        </div>

        {session && (
          <button
            onClick={endInterview}
            disabled={isProcessing}
            style={{
              padding: '0.65rem 1.25rem',
              background: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Icon name="check_circle" size={18} />
            {isProcessing ? 'Finalizing...' : 'End Interview & View Report'}
          </button>
        )}
      </div>

      <div className="interview-layout-container" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Content Area */}
        <div className="interview-main-col" style={{ flex: 3, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {!session ? (
            /* Interviewer Configuration Screen */
            <div className="interview-config-card" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-card-border)', borderRadius: '16px', padding: '2.5rem', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                  <Icon name="settings_suggest" size={32} />
                </div>
                <h2 style={{ color: 'var(--color-text-primary)', margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700 }}>Configure Live Interview</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  Set up candidate details, difficulty, interview mode, and Knowledge Base parameters.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Candidate Selection */}
                <div>
                  <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Candidate</label>
                  {candidateList.length > 0 ? (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <select
                        value={selectedCandidateId}
                        onChange={(e) => {
                          setSelectedCandidateId(e.target.value);
                          const found = candidateList.find(c => c.id === e.target.value);
                          if (found) setCandidateNameInput(found.name);
                        }}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                      >
                        <option value="">-- Select Candidate --</option>
                        {candidateList.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ''}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={candidateNameInput}
                        onChange={(e) => { setCandidateNameInput(e.target.value); setSelectedCandidateId(''); }}
                        placeholder="Or enter candidate name..."
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={candidateNameInput}
                      onChange={(e) => setCandidateNameInput(e.target.value)}
                      placeholder="e.g. Mahanth18"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                    />
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                  >
                    <option value="beginner">Beginner (Junior)</option>
                    <option value="intermediate">Intermediate (Mid-Level)</option>
                    <option value="advanced">Advanced (Senior / Architect)</option>
                  </select>
                </div>

                {/* Interview Mode */}
                <div>
                  <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Interview Mode</label>
                  <div className="interview-mode-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <label style={{ padding: '0.85rem', background: setupMode === 'standard' ? 'rgba(99,102,241,0.15)' : 'var(--color-bg-secondary)', border: setupMode === 'standard' ? '1px solid #6366f1' : '1px solid var(--color-card-border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                      <input type="radio" name="mode" value="standard" checked={setupMode === 'standard'} onChange={(e) => setSetupMode(e.target.value)} style={{ display: 'none' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Standard Adaptive</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Dynamic technical questions</div>
                    </label>
                    <label style={{ padding: '0.85rem', background: setupMode === 'keywords' ? 'rgba(99,102,241,0.15)' : 'var(--color-bg-secondary)', border: setupMode === 'keywords' ? '1px solid #6366f1' : '1px solid var(--color-card-border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                      <input type="radio" name="mode" value="keywords" checked={setupMode === 'keywords'} onChange={(e) => setSetupMode(e.target.value)} style={{ display: 'none' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Keyword Focused</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Targeted key concepts</div>
                    </label>
                    <label style={{ padding: '0.85rem', background: setupMode === 'knowledge-base' ? 'rgba(99,102,241,0.15)' : 'var(--color-bg-secondary)', border: setupMode === 'knowledge-base' ? '1px solid #6366f1' : '1px solid var(--color-card-border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}>
                      <input type="radio" name="mode" value="knowledge-base" checked={setupMode === 'knowledge-base'} onChange={(e) => setSetupMode(e.target.value)} style={{ display: 'none' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>Knowledge Base Only</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Restricted to PDF docs</div>
                    </label>
                  </div>
                </div>

                {/* Conditional Inputs */}
                {setupMode === 'keywords' && (
                  <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={setupData}
                      onChange={(e) => setSetupData(e.target.value)}
                      placeholder="e.g. Binary Search, Arrays, Recursion, Time Complexity"
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                )}

                {setupMode === 'knowledge-base' && (
                  <div>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Knowledge Base Documents</label>
                    {documents.length === 0 ? (
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                        No uploaded documents found. Please upload documents in Knowledge Base first.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto', background: 'var(--color-bg-secondary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-card-border)' }}>
                        {documents.map((doc: DocumentData) => (
                          <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <input
                              type="checkbox"
                              checked={selectedDocIds.includes(doc.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedDocIds([...selectedDocIds, doc.id]);
                                else setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                              }}
                              style={{ accentColor: '#6366f1' }}
                            />
                            <span>{doc.originalFilename}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* LLM Engine Selection */}
                <div>
                  <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>LLM Engine</label>
                  <select
                    value={selectedLLM}
                    onChange={(e) => setSelectedLLM(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-card-border)', background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}
                  >
                    <option value="gemini">Gemini (Google DeepMind)</option>
                    <option value="groq">Groq (High-Speed LLM)</option>
                  </select>
                </div>

                <button
                  onClick={startLiveInterview}
                  disabled={isProcessing || (!candidateNameInput.trim() && !selectedCandidateId) || (setupMode === 'knowledge-base' && selectedDocIds.length === 0)}
                  style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '1rem',
                    width: '100%',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                  }}
                >
                  {isProcessing ? 'Initializing Session...' : 'START LIVE INTERVIEW'}
                </button>

              </div>
            </div>
          ) : currentQuestion && (
            /* Interviewer Live Interview Interface */
            <>
              {/* Question Card */}
              <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                    QUESTION {currentQuestion.questionNumber}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', background: 'var(--color-bg-tertiary)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--color-card-border)' }}>
                    {currentQuestion.topic || 'Technical Question'} &bull; <span style={{ textTransform: 'capitalize' }}>{currentQuestion.difficulty || difficulty}</span>
                  </span>
                </div>

                <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.35rem', lineHeight: 1.5, margin: '0 0 1.5rem 0', fontWeight: 500 }}>
                  {currentQuestion.content}
                </h2>

                <hr style={{ borderColor: 'var(--color-card-border)', margin: '1.5rem 0' }} />

                {/* Candidate Answer Input Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Candidate Answer (Live Transcript)</label>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Ask candidate and type/record answer</span>
                  </div>

                  <textarea
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Enter or record candidate's response..."
                    disabled={isProcessing || isRecording}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '10px',
                      border: '1px solid var(--color-card-border)',
                      background: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-primary)',
                      minHeight: '130px',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                      resize: 'vertical'
                    }}
                  />

                  {micError && (
                    <div style={{ padding: '0.6rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Icon name="warning" size={16} />
                      <span>{micError}</span>
                    </div>
                  )}

                  {/* Actions Bar: Record (Whisper) & Submit */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {isRecording ? (
                        <button
                          onClick={stopRecording}
                          type="button"
                          style={{
                            padding: '0.75rem 1.25rem',
                            background: 'rgba(239,68,68,0.2)',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}
                        >
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                          Stop Recording ({String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:{String(recordingDuration % 60).padStart(2, '0')})
                        </button>
                      ) : isTranscribing ? (
                        <button
                          disabled
                          type="button"
                          style={{
                            padding: '0.75rem 1.25rem',
                            background: 'rgba(99,102,241,0.15)',
                            color: '#818cf8',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: '8px',
                            cursor: 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem'
                          }}
                        >
                          <Icon name="refresh" size={18} />
                          Transcribing via Whisper...
                        </button>
                      ) : (
                        <button
                          onClick={startRecording}
                          disabled={isProcessing}
                          type="button"
                          style={{
                            padding: '0.75rem 1.25rem',
                            background: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-card-border)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500,
                            fontSize: '0.875rem'
                          }}
                        >
                          <Icon name="mic" size={18} />
                          Record Candidate (Whisper STT)
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
                          Clear Answer
                        </button>
                      )}
                    </div>

                    <button
                      onClick={submitTextAnswer}
                      disabled={isProcessing || isRecording || isTranscribing || !textAnswer.trim()}
                      style={{
                        padding: '0.75rem 1.75rem',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
                      }}
                    >
                      {isProcessing ? 'Evaluating Answer...' : 'Submit Answer & Evaluate'}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Evaluation Result Box */}
              {lastEvaluation && (
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600 }}>
                      <Icon name="check_circle" size={20} />
                      <span>AI Answer Evaluation Complete</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: (lastEvaluation.score || 0) >= 75 ? '#10b981' : (lastEvaluation.score || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>
                      Score: {lastEvaluation.score}/100
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                    {lastEvaluation.correctness && (
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Correctness</span>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{lastEvaluation.correctness}</span>
                      </div>
                    )}
                    {lastEvaluation.completeness && (
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Completeness</span>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{lastEvaluation.completeness}</span>
                      </div>
                    )}
                    {lastEvaluation.technicalAccuracy && (
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Technical Accuracy</span>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{lastEvaluation.technicalAccuracy}</span>
                      </div>
                    )}
                  </div>

                  {lastEvaluation.feedback && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Feedback: </strong>
                      {lastEvaluation.feedback}
                    </div>
                  )}
                </div>
              )}

              {/* Next Question Suggestions */}
              {suggestedQuestions.length > 0 && (
                <div style={{ background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)', borderRadius: '16px', padding: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>Select Next Question</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {suggestedQuestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectNextQuestion(s)}
                        disabled={isProcessing}
                        style={{
                          textAlign: 'left',
                          padding: '1rem 1.25rem',
                          background: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-card-border)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem', fontWeight: 500 }}>{s.question}</div>
                        {s.reason && <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}><strong>AI Note:</strong> {s.reason}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Side Panel: AI Assistant & Session Stats */}
        <div className="interview-side-col" style={{ flex: 1, minWidth: '300px', maxWidth: '380px', background: 'var(--color-bg-tertiary)', borderLeft: '1px solid var(--color-card-border)', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ borderBottom: '1px solid var(--color-card-border)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Icon name="smart_toy" size={24} style={{ color: '#6366f1' }} />
              <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>Interviewer Assistant</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: session ? '#10b981' : '#6366f1', display: 'inline-block' }} />
              <span>{session ? 'Live Session Active' : 'Ready to Start'}</span>
            </div>
          </div>

          {session && (
            <>
              {/* Candidate Info */}
              <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-card-border)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Candidate</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{session.candidateName || 'Candidate'}</div>
              </div>

              {/* Progress & Live Score */}
              <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-card-border)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Questions Evaluated</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8' }}>{evaluations.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>Live Average Score</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: avgScore >= 75 ? '#10b981' : avgScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {evaluations.length > 0 ? `${avgScore}%` : '—'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Guidelines */}
          <div style={{ marginTop: 'auto', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 600 }}>
              <Icon name="lightbulb" size={16} />
              <span>Interviewer Instructions</span>
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              The Candidate does not access this live page. Read questions to the candidate and record or type their responses here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
