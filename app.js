/* ==========================================================================
   ADAPTIVE INTERVIEW ASSISTANT - APPLICATION CORE LOGIC
   ========================================================================== */

// --- Global Application State ---
const state = {
  activeScreen: 'dashboard',
  currentInterviewer: 'Dr. Sarah Jenkins',
  selectedLLM: 'Gemini 1.5 Pro',
  difficulty: 'intermediate',
  isVoiceActive: false,
  isRecording: false,
  voiceTimerInterval: null,
  waveformInterval: null,
  timerSeconds: 872, // starts at 14:32

  // Candidates Dataset
  candidates: {
    alex: {
      name: "Alex Carter",
      title: "Senior Full Stack Engineer",
      experience: "6.5 Years",
      education: "B.Tech Computer Science (Stanford UI)",
      location: "San Francisco, CA (Remote)",
      stack: "Node.js, TypeScript, React, PostgreSQL",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
      badge: "Highly Qualified",
      scores: {
        technical: 85,
        problemSolving: 90,
        confidence: 80,
        communication: 75,
        overall: 82,
        radar: [85, 80, 75, 70, 85, 88] // Programming, OOP, DBMS, OS, Aptitude, Comm
      },
      currentQuestionIndex: 0,
      questions: [
        {
          num: "Question #1 &bull; Frontend Performance",
          question: "Can you explain how React's Virtual DOM works, and what optimization strategies you'd use for a list rendering a thousand complex items?",
          mockAnswer: "React uses a virtual representation of the DOM. When state changes, a new Virtual DOM tree is built, compared with the old one using a diffing algorithm (Reconciliation), and only changes are patched to the real DOM. For rendering a thousand complex items, I'd use windowing or virtualization libraries like React Window to render only visible elements. I would also wrap subcomponents in React.memo(), use write-efficient keys instead of index-based keys, and ensure callback functions are memoized with useCallback.",
          aiFeedback: {
            understanding: 95,
            completeness: 88,
            confidence: 90,
            comm: 85,
            tech: 92,
            match: 90,
            missing: [
              "Didn't explain how key reconciliation matching works internally under O(n)",
              "Could mention CSS content-visibility: auto as a native web alternative"
            ],
            followups: [
              {
                id: "f-react-1",
                text: "How does React reconcile keys when they are reordered?",
                topic: "React Internals",
                diff: "advanced",
                skill: "React",
                reason: "Candidate mentioned keys but didn't describe reconciliation internals."
              },
              {
                id: "f-react-2",
                text: "Can you explain the difference between useMemo and useCallback?",
                topic: "React Hooks",
                diff: "intermediate",
                skill: "React",
                reason: "Candidate proposed memoizing subcomponents."
              }
            ]
          }
        },
        {
          num: "Question #2 &bull; DB Architecture",
          question: "What is database partitioning, and when would you choose horizontal sharding over standard database replication?",
          mockAnswer: "Database partitioning splits tables into smaller segments. Horizontal sharding distributes data rows across multiple physical machine nodes. I would choose sharding when write throughput becomes a bottleneck that a single write-primary database cannot handle, or when the data set size exceeds single-node SSD capacity. Replication, on the other hand, is mostly for high availability and scaling read performance by having multiple read-replicas pointing to a single write-primary database.",
          aiFeedback: {
            understanding: 90,
            completeness: 85,
            confidence: 88,
            comm: 80,
            tech: 87,
            match: 86,
            missing: [
              "Didn't discuss partition keys selection drawbacks (hot-spot nodes)",
              "Missing discussion on cross-shard join queries performance impact"
            ],
            followups: [
              {
                id: "f-db-1",
                text: "How do you handle queries that require joining tables across different shards?",
                topic: "Databases",
                diff: "advanced",
                skill: "System Design",
                reason: "Sharding was proposed, which complicates joins."
              },
              {
                id: "f-db-2",
                text: "What strategy would you use to rebalance shards if one node becomes hot?",
                topic: "Databases",
                diff: "advanced",
                skill: "Infrastructure",
                reason: "Candidate did not touch upon partition key load hotspots."
              }
            ]
          }
        },
        {
          num: "Question #3 &bull; OOP Design",
          question: "Can you explain the differences between interface-based programming and inheritance-based programming, and in what scenarios you would choose one over the other?",
          mockAnswer: "Interface-based programming defines contracts that classes must implement, encouraging composition. Inheritance-based programming relies on extending class hierarchies, sharing implementations. I prefer interfaces because they decouple the caller from the concrete class, facilitating testing. Inheritance couples children to parents (tight coupling), which can break subclasses when parents change (Fragile Base Class problem). Inheritance is good only when there is a true, strict hierarchical relationship.",
          aiFeedback: {
            understanding: 85,
            completeness: 70,
            confidence: 90,
            comm: 78,
            tech: 82,
            match: 88,
            missing: [
              "Didn't explain interface vs class-based polymorphism properly",
              "Missing runtime example of polymorphism in real production systems",
              "Didn't mention Liskov Substitution Principle (LSP) in inheritance context"
            ],
            followups: [
              {
                id: "f-oop-1",
                text: "Can you explain runtime polymorphism and how dynamic dispatch works?",
                topic: "OOP",
                diff: "intermediate",
                skill: "OOP Principles",
                reason: "Candidate discussed contracts but skipped dynamic runtime dispatch."
              },
              {
                id: "f-oop-2",
                text: "How does the Liskov Substitution Principle guide our usage of class inheritance?",
                topic: "OOP",
                diff: "advanced",
                skill: "System Design",
                reason: "Important SOLID validation missing from initial answer."
              }
            ]
          }
        },
        {
          num: "Question #4 &bull; Systems Integration",
          question: "Describe the Saga pattern for managing distributed transactions and contrast it with Two-Phase Commit.",
          mockAnswer: "The Saga pattern manages distributed transactions by executing a series of local transactions in sequence. Each local transaction updates database state and triggers the next step via events. If a step fails, the Saga runs compensating transactions in reverse order to undo changes. Two-Phase Commit (2PC) is a blocking orchestrator protocol that ensures all nodes commit or abort together. Saga is eventually consistent, whereas 2PC is immediately consistent but reduces system throughput due to locking.",
          aiFeedback: {
            understanding: 95,
            completeness: 92,
            confidence: 85,
            comm: 80,
            tech: 94,
            match: 93,
            missing: [
              "Did not mention Saga choreography vs orchestration implementation details",
              "Could explain isolation anomalies in Saga databases due to lack of global locks"
            ],
            followups: [
              {
                id: "f-sys-1",
                text: "What is the difference between Orchestrated and Choreographed Sagas?",
                topic: "System Design",
                diff: "advanced",
                skill: "Microservices",
                reason: "Candidate proposed Saga pattern but left implementation unspecified."
              }
            ]
          }
        }
      ]
    },
    sophia: {
      name: "Sophia Patel",
      title: "AI Research Scientist",
      experience: "4 Years",
      education: "M.S. in Machine Learning (MIT)",
      location: "Boston, MA (Hybrid)",
      stack: "Python, PyTorch, HuggingFace, LangChain, vector DBs",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop",
      badge: "Outstanding R&D",
      scores: {
        technical: 92,
        problemSolving: 85,
        confidence: 85,
        communication: 90,
        overall: 88,
        radar: [94, 70, 80, 60, 92, 90]
      },
      currentQuestionIndex: 0,
      questions: [
        {
          num: "Question #1 &bull; Transformer Models",
          question: "Explain the core attention mechanism in Transformers, specifically how Query, Key, and Value vectors interact.",
          mockAnswer: "The self-attention mechanism computes a weighted sum of values based on compatibility scores between queries and keys. Specifically, we project input embeddings into Query (Q), Key (K), and Value (V) matrices. We compute dot products of Q and K, scale them by the square root of the head dimension to avoid vanishing gradients, apply softmax to get attention weights, and multiply the weights by V. This allows the model to dynamically focus on different words in a sequence regardless of distance.",
          aiFeedback: {
            understanding: 98,
            completeness: 95,
            confidence: 90,
            comm: 92,
            tech: 96,
            match: 94,
            missing: [
              "Could briefly touch upon causal masking in decoder-only models"
            ],
            followups: [
              {
                id: "f-ai-1",
                text: "Why do we scale the dot products by square root of the head dimension?",
                topic: "AI Internals",
                diff: "advanced",
                skill: "Deep Learning",
                reason: "Candidate mentioned scaling briefly; let's drill down."
              }
            ]
          }
        }
      ]
    }
  },

  activeCandidateKey: 'alex',
  allGeneratedFollowUps: [],
  recentSessions: [
    { name: "Alex Carter", position: "Senior Full Stack Engineer", date: "Aug 1, 2026", score: "8.2/10", status: "active", key: "alex" },
    { name: "Sophia Patel", position: "AI Research Scientist", date: "Jul 30, 2026", score: "8.8/10", status: "completed", key: "sophia" },
    { name: "Marcus Vance", position: "DevOps Architect", date: "Jul 28, 2026", score: "6.5/10", status: "pending", key: null },
    { name: "Emily Zhao", position: "Product Manager", date: "Jul 25, 2026", score: "7.9/10", status: "completed", key: null }
  ]
};

// --- DOM Elements Cache ---
const el = {
  screens: document.querySelectorAll('.screen'),
  navItems: document.querySelectorAll('.nav-item'),
  sidebar: document.getElementById('sidebar'),
  sidebarToggle: document.getElementById('sidebar-toggle'),
  globalSearch: document.getElementById('global-search'),
  notificationTrigger: document.getElementById('notification-trigger'),
  
  // Dashboard elements
  startInterviewBtn: document.getElementById('start-interview-btn'),
  recentSessionsTable: document.getElementById('recent-sessions-table'),
  activeSessionText: document.getElementById('active-session-text'),
  
  // Interview Panel elements
  questionLabel: document.getElementById('question-label'),
  interviewerQuestionText: document.getElementById('interviewer-question-text'),
  skipQuestionBtn: document.getElementById('skip-question-btn'),
  askQuestionBtn: document.getElementById('ask-question-btn'),
  nextQuestionBtn: document.getElementById('next-question-btn'),
  
  candidateAnswerTextarea: document.getElementById('candidate-answer-textarea'),
  uploadResumeBtn: document.getElementById('upload-resume-btn'),
  recordVoiceBtn: document.getElementById('record-voice-btn'),
  micIcon: document.getElementById('mic-icon'),
  voiceVisualizer: document.getElementById('voice-visualizer'),
  submitAnswerBtn: document.getElementById('submit-answer-btn'),
  dialogueTimeline: document.getElementById('dialogue-timeline'),
  interviewTimer: document.getElementById('interview-timer'),
  
  // AI Diagnostics
  valQuestionUnderstanding: document.getElementById('val-question-understanding'),
  barQuestionUnderstanding: document.getElementById('bar-question-understanding'),
  valAnswerCompleteness: document.getElementById('val-answer-completeness'),
  barAnswerCompleteness: document.getElementById('bar-answer-completeness'),
  valConfidenceLevel: document.getElementById('val-confidence-level'),
  barConfidenceLevel: document.getElementById('bar-confidence-level'),
  valCommScore: document.getElementById('val-comm-score'),
  barCommScore: document.getElementById('bar-comm-score'),
  valTechAccuracy: document.getElementById('val-tech-accuracy'),
  barTechAccuracy: document.getElementById('bar-tech-accuracy'),
  valSkillMatch: document.getElementById('val-skill-match'),
  barSkillMatch: document.getElementById('bar-skill-match'),
  missingConceptsContainer: document.getElementById('missing-concepts-container'),
  suggestedQuestionsContainer: document.getElementById('suggested-questions-container'),
  
  // Candidate Profile screen
  btnToggleCandidate: document.getElementById('btn-toggle-candidate'),
  
  // Live Analysis screen
  waveBarsHolder: document.getElementById('wave-bars-holder'),
  transcriptionTicker: document.getElementById('transcription-ticker'),
  
  // AI Suggestions Screen
  allSuggestionsTableBody: document.getElementById('all-suggestions-table-body'),
  filterDifficulty: document.getElementById('filter-difficulty'),
  filterTopic: document.getElementById('filter-topic'),
  
  // Evaluation Report Screen
  btnEditReport: document.getElementById('btn-edit-report'),
  btnSaveReport: document.getElementById('btn-save-report'),
  btnPdfReport: document.getElementById('btn-pdf-report'),
  btnPrintReport: document.getElementById('btn-print-report'),
  reportOverallScoreBadge: document.getElementById('report-overall-score-badge'),
  repName: document.getElementById('rep-name'),
  repPosition: document.getElementById('rep-position'),
  repInterviewer: document.getElementById('rep-interviewer'),
  repSummary: document.getElementById('rep-summary'),
  repStarTech: document.getElementById('rep-star-tech'),
  repStarComm: document.getElementById('rep-star-comm'),
  repStarConf: document.getElementById('rep-star-conf'),
  repTextTech: document.getElementById('rep-text-tech'),
  repTextComm: document.getElementById('rep-text-comm'),
  repTextConf: document.getElementById('rep-text-conf'),
  repStrengths: document.getElementById('rep-strengths'),
  repWeaknesses: document.getElementById('rep-weaknesses'),
  repLearning: document.getElementById('rep-learning'),
  repHiringDecision: document.getElementById('rep-hiring-decision'),
  
  // Settings Screen
  settingsLLM: document.getElementById('settings-llm'),
  settingsDifficulty: document.getElementById('settings-difficulty'),
  settingsAdaptive: document.getElementById('settings-adaptive'),
  settingsVoice: document.getElementById('settings-voice'),
  settingsDarkMode: document.getElementById('settings-darkmode'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  resetSettingsBtn: document.getElementById('reset-settings-btn'),
  
  // Modals & toast
  uploadModal: document.getElementById('upload-modal'),
  closeUploadModal: document.getElementById('close-upload-modal'),
  cancelUploadBtn: document.getElementById('cancel-upload-btn'),
  confirmUploadBtn: document.getElementById('confirm-upload-btn'),
  dragDropZone: document.getElementById('drag-drop-zone'),
  resumeFileInput: document.getElementById('resume-file-input'),
  toastContainer: document.getElementById('toast-container')
};

// --- Chart Handles ---
let dashboardTrendChartInstance = null;
let candidateRadarChartInstance = null;

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initDashboard();
  initInterviewSession();
  initLiveTelemetry();
  initAISuggestionsTab();
  initReportActions();
  initSettings();
  initUploadModal();
  startInterviewTimer();
  
  // Show welcome notification
  showToast("Adaptive Interview Assistant initialized. Model connected.", "success");
});

// --- Toast System ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'warning') icon = 'warning';
  if (type === 'error') icon = 'error';
  
  toast.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span>${message}</span>
  `;
  el.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Navigation Controller ---
function initNavigation() {
  // Sidebar expand/collapse toggle
  el.sidebarToggle.addEventListener("click", () => {
    el.sidebar.classList.toggle("collapsed");
    setTimeout(() => {
      // Re-resize charts on transition completion
      if (dashboardTrendChartInstance) dashboardTrendChartInstance.resize();
      if (candidateRadarChartInstance) candidateRadarChartInstance.resize();
    }, 310);
  });

  // Switch screens on click
  el.navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetScreen = item.getAttribute("data-screen");
      switchScreen(targetScreen);
    });
  });

  // Global search mock
  el.globalSearch.addEventListener("keypress", (e) => {
    if (e.key === 'Enter') {
      showToast(`Search query "${el.globalSearch.value}" returned 0 matches in static mock database.`, "warning");
    }
  });

  // Notifications icon click handler
  el.notificationTrigger.addEventListener("click", () => {
    showToast("AI Alerts: Sophia's report generated; Liam's evaluation is pending; 2 new suggested questions injected.", "info");
  });
}

function switchScreen(screenId) {
  // Hide active screen
  el.screens.forEach(screen => screen.classList.remove("active"));
  
  // Show target screen
  const targetEl = document.getElementById(`${screenId}-screen`);
  if (targetEl) {
    targetEl.classList.add("active");
  }

  // Set active nav class
  el.navItems.forEach(item => {
    if (item.getAttribute("data-screen") === screenId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  state.activeScreen = screenId;
  
  // Trigger custom screen initializers
  if (screenId === 'dashboard') {
    renderDashboardTrendChart();
  } else if (screenId === 'candidate-profile') {
    renderCandidateRadarChart();
  } else if (screenId === 'ai-suggestions') {
    populateAISuggestionsTable();
  } else if (screenId === 'evaluation-report') {
    populateEvaluationReport();
  }
}

// --- Dashboard Code ---
function initDashboard() {
  el.startInterviewBtn.addEventListener("click", () => {
    switchScreen('interview-session');
    showToast("Starting live workspace session.", "info");
  });
  
  // Populate dashboard table
  const tbody = el.recentSessionsTable;
  tbody.innerHTML = '';
  
  state.recentSessions.forEach(session => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${session.name}</strong></td>
      <td>${session.position}</td>
      <td>${session.date}</td>
      <td><span class="score-num">${session.score}</span></td>
      <td><span class="badge-status ${session.status}">${session.status}</span></td>
      <td>
        <button class="secondary-btn icon-only-btn load-session-btn" data-key="${session.key || ''}" data-name="${session.name}">
          <span class="material-symbols-outlined">visibility</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach session selection callbacks
  tbody.querySelectorAll('.load-session-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      const candidateKey = btn.getAttribute("data-key");
      const name = btn.getAttribute("data-name");
      if (candidateKey) {
        state.activeCandidateKey = candidateKey;
        el.activeSessionText.innerText = name;
        switchScreen('interview-session');
        resetWorkspaceForActiveCandidate();
        showToast(`Loaded live session workspace for ${name}`, "success");
      } else {
        showToast(`Dossier archives for ${name} are archived off-site. Demo files locked.`, "warning");
      }
    });
  });

  // Render chart
  renderDashboardTrendChart();
}

function renderDashboardTrendChart() {
  if (dashboardTrendChartInstance) {
    dashboardTrendChartInstance.destroy();
  }
  
  const ctx = document.getElementById('dashboardTrendChart').getContext('2d');
  const isDark = !document.body.classList.contains('light-theme');
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.08)';

  dashboardTrendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Session #1', 'Session #2', 'Session #3', 'Session #4', 'Session #5', 'Session #6', 'Session #7'],
      datasets: [
        {
          label: 'Candidate Average Score Trend',
          data: [6.8, 7.2, 6.9, 8.1, 7.5, 8.4, 7.8],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Target Requirement Benchmark',
          data: [7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0],
          borderColor: '#06b6d4',
          borderDash: [5, 5],
          pointStyle: 'none',
          fill: false,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Inter' } }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor }
        },
        y: {
          min: 4,
          max: 10,
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    }
  });
}

// --- Interview Session Workspace Panel Actions ---
function initInterviewSession() {
  // Ask Question Click
  el.askQuestionBtn.addEventListener("click", () => {
    const candidate = state.candidates[state.activeCandidateKey];
    const qIndex = candidate.currentQuestionIndex;
    const qObj = candidate.questions[qIndex];
    if (!qObj) return;

    // Put interviewer bubble into timeline
    appendChatBubble(state.currentInterviewer, qObj.question, 'interviewer');
    showToast("Interviewer question transmitted.", "info");

    // Mock speech text transcription simulation in live analysis screen
    triggerLiveTranscription(state.currentInterviewer, qObj.question);
  });

  // Next Question Click
  el.nextQuestionBtn.addEventListener("click", () => {
    const candidate = state.candidates[state.activeCandidateKey];
    if (candidate.currentQuestionIndex < candidate.questions.length - 1) {
      candidate.currentQuestionIndex++;
      showQuestionOnInterviewerPanel();
      showToast("Advanced to next planned question.", "success");
    } else {
      showToast("No further pre-planned questions. Use AI Suggested Follow-ups on the right.", "warning");
    }
  });

  // Skip Question Click
  el.skipQuestionBtn.addEventListener("click", () => {
    showToast("Interviewer skipped current question.", "info");
    el.nextQuestionBtn.click();
  });

  // Submit Answer Click
  el.submitAnswerBtn.addEventListener("click", () => {
    const candidate = state.candidates[state.activeCandidateKey];
    const qIndex = candidate.currentQuestionIndex;
    const qObj = candidate.questions[qIndex];
    if (!qObj) return;

    let answerText = el.candidateAnswerTextarea.value.trim();
    
    // Auto-fill mock response if user submitted empty text area
    if (answerText === "") {
      answerText = qObj.mockAnswer;
      el.candidateAnswerTextarea.value = answerText;
      showToast("Auto-filled candidate mock answer.", "info");
    }

    // Append candidate bubble
    appendChatBubble(candidate.name, answerText, 'candidate');
    triggerLiveTranscription(candidate.name, answerText);
    
    // Reset inputs
    el.candidateAnswerTextarea.value = '';
    
    // Trigger mock AI Copilot review step
    processAICopilotEvaluation(qObj.aiFeedback);
  });

  // Record Voice Simulation (UI visualizer toggle)
  el.recordVoiceBtn.addEventListener("click", () => {
    state.isRecording = !state.isRecording;
    if (state.isRecording) {
      el.micIcon.style.color = 'var(--color-rose)';
      el.voiceVisualizer.classList.add("active");
      showToast("Whisper Live Stream Recording active...", "success");
    } else {
      el.micIcon.style.color = 'var(--color-text-primary)';
      el.voiceVisualizer.classList.remove("active");
      showToast("Voice stream paused.", "info");
    }
  });

  // Switch Candidate (Alternate mockup demo)
  el.btnToggleCandidate.addEventListener("click", () => {
    state.activeCandidateKey = state.activeCandidateKey === 'alex' ? 'sophia' : 'alex';
    const cObj = state.candidates[state.activeCandidateKey];
    showToast(`Switched active profile to ${cObj.name}`, "info");
    
    // Reset displays
    el.activeSessionText.innerText = cObj.name;
    document.querySelector(".profile-hero h3").innerText = cObj.name;
    document.querySelector(".profile-hero .profile-designation").innerText = cObj.title;
    document.querySelector(".profile-avatar-large").src = cObj.avatar;
    document.querySelector(".candidate-profile-pic").src = cObj.avatar;
    document.querySelector(".candidate-brief-details h4").innerText = cObj.name;
    document.querySelector(".candidate-brief-details .candidate-applied-position").innerText = cObj.title;
    document.querySelector(".profile-meta-list").innerHTML = `
      <div class="meta-item"><span class="meta-label">Experience</span><span class="meta-value">${cObj.experience}</span></div>
      <div class="meta-item"><span class="meta-label">Current Role</span><span class="meta-value">${cObj.experience} AI specialist</span></div>
      <div class="meta-item"><span class="meta-label">Education</span><span class="meta-value">${cObj.education}</span></div>
      <div class="meta-item"><span class="meta-label">Location</span><span class="meta-value">${cObj.location}</span></div>
      <div class="meta-item"><span class="meta-label">Primary Stack</span><span class="meta-value">${cObj.stack}</span></div>
    `;

    resetWorkspaceForActiveCandidate();
    renderCandidateRadarChart();
  });

  // Initial populate
  resetWorkspaceForActiveCandidate();
}

function resetWorkspaceForActiveCandidate() {
  const candidate = state.candidates[state.activeCandidateKey];
  
  // Clear dialogue timeline
  el.dialogueTimeline.innerHTML = '';
  
  // Setup interviewer display panel
  showQuestionOnInterviewerPanel();
  
  // Initial empty metrics
  updateAIMetrics(50, 50, 50, 50, 50, 50);
  el.missingConceptsContainer.innerHTML = '<li><span class="material-symbols-outlined">hourglass_empty</span>Waiting for candidate submission...</li>';
  el.suggestedQuestionsContainer.innerHTML = '<div style="color:var(--color-text-muted);font-size:0.8rem;text-align:center;">Ask the question to begin RAG extraction.</div>';
}

function showQuestionOnInterviewerPanel() {
  const candidate = state.candidates[state.activeCandidateKey];
  const qObj = candidate.questions[candidate.currentQuestionIndex];
  if (qObj) {
    el.questionLabel.innerHTML = qObj.num;
    el.interviewerQuestionText.innerText = qObj.question;
  }
}

function appendChatBubble(author, text, type) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${type}`;
  bubble.innerHTML = `
    <span class="chat-bubble-author">${author}</span>
    <p>${text}</p>
  `;
  el.dialogueTimeline.appendChild(bubble);
  
  // Smooth scroll
  el.dialogueTimeline.scrollTop = el.dialogueTimeline.scrollHeight;
}

// Simulated dynamic AI copilot logic
function processAICopilotEvaluation(feedback) {
  // 1. Slow-load simulated progress bar animation
  setTimeout(() => {
    updateAIMetrics(
      feedback.understanding, 
      feedback.completeness, 
      feedback.confidence, 
      feedback.comm, 
      feedback.tech, 
      feedback.match
    );
  }, 400);

  // 2. Populate Missing Concepts Checkbox Gaps
  el.missingConceptsContainer.innerHTML = '';
  if (feedback.missing.length === 0) {
    el.missingConceptsContainer.innerHTML = '<li><span class="material-symbols-outlined" style="color:var(--color-emerald)">check_circle</span>All key concepts met.</li>';
  } else {
    feedback.missing.forEach(concept => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span class="material-symbols-outlined icon-missing">cancel</span>
        <span>${concept}</span>
      `;
      el.missingConceptsContainer.appendChild(li);
    });
  }

  // 3. Inject Suggested Follow-ups
  el.suggestedQuestionsContainer.innerHTML = '';
  feedback.followups.forEach((fup) => {
    // Check if not already in global suggestions list
    if (!state.allGeneratedFollowUps.some(s => s.id === fup.id)) {
      state.allGeneratedFollowUps.push(fup);
    }

    const card = document.createElement('div');
    card.className = 'suggested-q-card';
    card.innerHTML = `
      <p>"${fup.text}"</p>
      <div class="q-card-actions">
        <button class="secondary-btn text-rose q-ignore-btn" data-id="${fup.id}">Ignore</button>
        <button class="primary-btn q-accept-btn" data-id="${fup.id}">Accept</button>
      </div>
    `;
    el.suggestedQuestionsContainer.appendChild(card);
  });

  // Attach button event listeners in the generated cards
  el.suggestedQuestionsContainer.querySelectorAll('.q-accept-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      const fupId = btn.getAttribute("data-id");
      const fupObj = state.allGeneratedFollowUps.find(item => item.id === fupId);
      if (fupObj) {
        acceptSuggestedFollowUp(fupObj);
        btn.closest('.suggested-q-card').remove();
      }
    });
  });

  el.suggestedQuestionsContainer.querySelectorAll('.q-ignore-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest('.suggested-q-card').remove();
      showToast("Follow-up question ignored.", "warning");
    });
  });

  // 4. Inject a friendly AI Advice system bubble on timeline
  setTimeout(() => {
    const systemAdviceText = `RAG Analysis: Candidate matched ${feedback.match}% of criteria. Suggest drilling down on: "${feedback.followups[0].text}"`;
    appendChatBubble("AI Assist System", systemAdviceText, "ai-advice");
  }, 1000);
}

function updateAIMetrics(understanding, completeness, confidence, comm, tech, match) {
  el.valQuestionUnderstanding.innerText = `${understanding}%`;
  el.barQuestionUnderstanding.style.width = `${understanding}%`;
  
  el.valAnswerCompleteness.innerText = `${completeness}%`;
  el.barAnswerCompleteness.style.width = `${completeness}%`;
  
  el.valConfidenceLevel.innerText = `${confidence}%`;
  el.barConfidenceLevel.style.width = `${confidence}%`;
  
  el.valCommScore.innerText = `${comm}%`;
  el.barCommScore.style.width = `${comm}%`;
  
  el.valTechAccuracy.innerText = `${tech}%`;
  el.barTechAccuracy.style.width = `${tech}%`;
  
  el.valSkillMatch.innerText = `${match}%`;
  el.barSkillMatch.style.width = `${match}%`;
}

function acceptSuggestedFollowUp(fupObj) {
  // Push the suggested question dynamically to the candidate's active questions queue so they can answer it
  const candidate = state.candidates[state.activeCandidateKey];
  
  const newQ = {
    num: `Follow-up &bull; ${fupObj.topic}`,
    question: fupObj.text,
    mockAnswer: `This is simulated follow-up response addressing ${fupObj.topic} and dynamic parameter matching.`,
    aiFeedback: {
      understanding: 90,
      completeness: 85,
      confidence: 88,
      comm: 80,
      tech: 85,
      match: 86,
      missing: ["Candidate answered basic parameters but skipped corner case checks."],
      followups: []
    }
  };

  candidate.questions.push(newQ);
  candidate.currentQuestionIndex = candidate.questions.length - 1;
  
  showQuestionOnInterviewerPanel();
  showToast(`Injected suggested follow-up into workspace: "${fupObj.text}"`, "success");
}

function startInterviewTimer() {
  state.voiceTimerInterval = setInterval(() => {
    state.timerSeconds++;
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    el.interviewTimer.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, 1000);
}

// --- Live Telemetry Screen Code ---
function initLiveTelemetry() {
  // Spawn simulated waveform audio bars
  const totalBars = 65;
  el.waveBarsHolder.innerHTML = '';
  
  for(let i=0; i<totalBars; i++) {
    const bar = document.createElement('div');
    bar.className = 'audio-wave-bar';
    bar.style.height = `${Math.floor(Math.random() * 80) + 10}px`;
    el.waveBarsHolder.appendChild(bar);
  }

  // Waveform heights randomizer loop
  state.waveformInterval = setInterval(() => {
    const bars = el.waveBarsHolder.querySelectorAll('.audio-wave-bar');
    bars.forEach(bar => {
      // If voice is active or recording is on, make waveforms jump dynamically
      const factor = (state.isRecording || state.activeScreen === 'live-analysis') ? 100 : 15;
      const height = Math.floor(Math.random() * factor) + 5;
      bar.style.height = `${height}px`;
    });
  }, 120);
}

function triggerLiveTranscription(speaker, message) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const bubble = document.createElement('p');
  
  let speakerClass = 'speaker-candidate';
  if (speaker === state.currentInterviewer) speakerClass = 'speaker-interviewer';
  
  bubble.className = `transcription-bubble ${speakerClass}`;
  bubble.innerHTML = `
    <span class="timestamp">[${timestamp}]</span> 
    <strong>${speaker}:</strong> ${message}
  `;
  el.transcriptionTicker.appendChild(bubble);
  el.transcriptionTicker.scrollTop = el.transcriptionTicker.scrollHeight;
}

// --- Candidate Dossier Radar Chart Code ---
function renderCandidateRadarChart() {
  if (candidateRadarChartInstance) {
    candidateRadarChartInstance.destroy();
  }

  const activeC = state.candidates[state.activeCandidateKey];
  const scores = activeC.scores.radar;
  
  const ctx = document.getElementById('candidateRadarChart').getContext('2d');
  const isDark = !document.body.classList.contains('light-theme');
  const labelColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.12)';

  candidateRadarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Programming', 'OOP', 'DBMS', 'OS', 'Aptitude', 'Communication'],
      datasets: [{
        label: `${activeC.name} Extracted Indices`,
        data: scores,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#fff',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: labelColor, font: { family: 'Inter' } }
        }
      },
      scales: {
        r: {
          angleLines: { color: gridColor },
          grid: { color: gridColor },
          pointLabels: {
            color: labelColor,
            font: { family: 'Outfit', size: 11, weight: '600' }
          },
          ticks: {
            backdropColor: 'transparent',
            color: labelColor,
            stepSize: 20
          },
          min: 0,
          max: 100
        }
      }
    }
  });
}

// --- AI Suggestions Library Table Code ---
function initAISuggestionsTab() {
  el.filterDifficulty.addEventListener("change", populateAISuggestionsTable);
  el.filterTopic.addEventListener("change", populateAISuggestionsTable);
}

function populateAISuggestionsTable() {
  const tbody = el.allSuggestionsTableBody;
  tbody.innerHTML = '';
  
  const diffVal = el.filterDifficulty.value;
  const topicVal = el.filterTopic.value;
  
  // Filter questions
  const filtered = state.allGeneratedFollowUps.filter(s => {
    const diffMatch = diffVal === 'all' || s.diff === diffVal;
    const topicMatch = topicVal === 'all' || s.topic === topicVal;
    return diffMatch && topicMatch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; color:var(--color-text-muted); padding: var(--space-xl)">
          No AI suggestions generated matching parameters. Run questions in Interview Live Session.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(s => {
    const tr = document.createElement('tr');
    tr.id = `row-${s.id}`;
    tr.innerHTML = `
      <td class="question-text-cell" id="qtext-${s.id}">${s.text}</td>
      <td><span class="badge-topic">${s.topic}</span></td>
      <td><span class="badge-difficulty ${s.diff}">${s.diff}</span></td>
      <td class="reason-cell">${s.reason}</td>
      <td>${s.skill}</td>
      <td>
        <div class="table-actions">
          <button class="secondary-btn icon-only-btn edit-fup-btn" data-id="${s.id}" title="Modify Question Inline">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="primary-btn icon-only-btn accept-fup-btn" data-id="${s.id}" title="Send to Live Interview workspace">
            <span class="material-symbols-outlined">check</span>
          </button>
          <button class="secondary-btn icon-only-btn reject-fup-btn" data-id="${s.id}" title="Reject suggestion">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach suggestions page events
  tbody.querySelectorAll('.accept-fup-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const fupObj = state.allGeneratedFollowUps.find(x => x.id === id);
      acceptSuggestedFollowUp(fupObj);
      switchScreen('interview-session');
    });
  });

  tbody.querySelectorAll('.reject-fup-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      // Remove from table
      document.getElementById(`row-${id}`).remove();
      showToast("Question discarded from library list.", "warning");
    });
  });

  tbody.querySelectorAll('.edit-fup-btn').forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const cell = document.getElementById(`qtext-${id}`);
      const isEditing = cell.querySelector('input');
      
      if (isEditing) {
        // Save action
        const newText = isEditing.value.trim();
        cell.innerHTML = newText;
        const targetObj = state.allGeneratedFollowUps.find(x => x.id === id);
        if (targetObj) targetObj.text = newText;
        btn.querySelector('span').innerText = 'edit';
        showToast("AI question modified successfully.", "success");
      } else {
        // Edit Action
        const currentText = cell.innerText;
        cell.innerHTML = `<input type="text" class="editable-question-input" value="${currentText}">`;
        cell.querySelector('input').focus();
        btn.querySelector('span').innerText = 'save';
      }
    });
  });
}

// --- Evaluation Report Page Code ---
function populateEvaluationReport() {
  const activeC = state.candidates[state.activeCandidateKey];
  
  // Overall score sync
  el.reportOverallScoreBadge.innerText = activeC.scores.overall / 10;
  el.repName.innerText = activeC.name;
  el.repPosition.innerText = activeC.title;
  el.repInterviewer.innerText = state.currentInterviewer;
  el.repLLM.innerText = state.selectedLLM;
  
  // Set quantitative stars widths
  el.repStarTech.style.width = `${activeC.scores.technical}%`;
  el.repStarComm.style.width = `${activeC.scores.communication}%`;
  el.repStarConf.style.width = `${activeC.scores.confidence}%`;
  
  el.repTextTech.innerText = `${activeC.scores.technical / 10} / 10`;
  el.repTextComm.innerText = `${activeC.scores.communication / 10} / 10`;
  el.repTextConf.innerText = `${activeC.scores.confidence / 10} / 10`;
  
  // Selection box sync
  if (activeC.scores.overall >= 80) {
    el.repHiringDecision.value = "strong-hire";
  } else if (activeC.scores.overall >= 70) {
    el.repHiringDecision.value = "hire";
  } else {
    el.repHiringDecision.value = "borderline";
  }
}

function initReportActions() {
  let isEditing = false;
  
  el.btnEditReport.addEventListener("click", () => {
    isEditing = !isEditing;
    
    // Toggle contenteditable
    const fields = [el.repName, el.repPosition, el.repInterviewer, el.repSummary, el.repStrengths, el.repWeaknesses, el.repLearning];
    fields.forEach(field => {
      field.setAttribute("contenteditable", isEditing ? "true" : "false");
    });
    
    // Toggle hiring decision select
    el.repHiringDecision.disabled = !isEditing;
    
    if (isEditing) {
      el.btnEditReport.innerHTML = `<span class="material-symbols-outlined">edit_off</span> Lock Layout`;
      el.btnEditReport.style.border = '1px solid var(--color-rose)';
      showToast("Report layout unlocked. Click directly on text boxes to edit content.", "info");
    } else {
      el.btnEditReport.innerHTML = `<span class="material-symbols-outlined">edit</span> Edit Report`;
      el.btnEditReport.style.border = '1px solid var(--color-card-border)';
      showToast("Report layout locked.", "success");
    }
  });

  el.btnSaveReport.addEventListener("click", () => {
    if (isEditing) el.btnEditReport.click(); // turn off editing mode
    showToast("Evaluation report synced back to main database schema.", "success");
  });

  el.btnPdfReport.addEventListener("click", () => {
    showToast("Opening operating system print spooler for PDF rendering...", "info");
    window.print();
  });

  el.btnPrintReport.addEventListener("click", () => {
    window.print();
  });
}

// --- Settings Module Code ---
function initSettings() {
  el.saveSettingsBtn.addEventListener("click", () => {
    state.selectedLLM = el.settingsLLM.options[el.settingsLLM.selectedIndex].text;
    state.difficulty = el.settingsDifficulty.value;
    
    // Process Dark Mode Toggle
    const isDarkModeChecked = el.settingsDarkMode.checked;
    if (isDarkModeChecked) {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
    }
    
    showToast("Settings configurations cached successfully.", "success");
    
    // Redraw charts since grid line colors and axis text must match light/dark mode
    if (state.activeScreen === 'dashboard') renderDashboardTrendChart();
    if (state.activeScreen === 'candidate-profile') renderCandidateRadarChart();
  });

  el.resetSettingsBtn.addEventListener("click", () => {
    el.settingsLLM.value = 'gemini';
    el.settingsDifficulty.value = 'intermediate';
    el.settingsAdaptive.checked = true;
    el.settingsVoice.checked = true;
    el.settingsDarkMode.checked = true;
    
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
    
    showToast("Factory settings defaults restored.", "warning");
    
    if (state.activeScreen === 'dashboard') renderDashboardTrendChart();
    if (state.activeScreen === 'candidate-profile') renderCandidateRadarChart();
  });
}

// --- Upload Resume Mock Modal Code ---
function initUploadModal() {
  el.uploadResumeBtn.addEventListener("click", () => {
    el.uploadModal.classList.add("active");
  });
  
  const close = () => {
    el.uploadModal.classList.remove("active");
    el.confirmUploadBtn.disabled = true;
    el.confirmUploadBtn.innerText = "Process Resume";
    el.resumeFileInput.value = '';
    el.dragDropZone.innerHTML = `
      <span class="material-symbols-outlined upload-large-icon">cloud_upload</span>
      <p>Drag & Drop candidate's PDF resume or click to browse</p>
      <span class="file-spec">Supported formats: PDF, DOCX (Max 10MB)</span>
    `;
  };

  el.closeUploadModal.addEventListener("click", close);
  el.cancelUploadBtn.addEventListener("click", close);
  
  // Drag over actions
  el.dragDropZone.addEventListener("click", () => {
    el.resumeFileInput.click();
  });

  el.resumeFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  el.dragDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.dragDropZone.classList.add("dragover");
  });

  el.dragDropZone.addEventListener("dragleave", () => {
    el.dragDropZone.classList.remove("dragover");
  });

  el.dragDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    el.dragDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  el.confirmUploadBtn.addEventListener("click", () => {
    el.confirmUploadBtn.innerText = "Parsing Data...";
    setTimeout(() => {
      close();
      showToast("Resume parsed successfully. RAG database updated with candidate index.", "success");
    }, 1500);
  });
}

function handleFileSelected(file) {
  el.dragDropZone.innerHTML = `
    <span class="material-symbols-outlined upload-large-icon" style="color:var(--color-emerald)">check_circle</span>
    <p>Selected: <strong>${file.name}</strong></p>
    <span class="file-spec">Ready to parse. Click 'Process Resume' to start.</span>
  `;
  el.confirmUploadBtn.disabled = false;
}
