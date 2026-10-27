import { useState, useEffect, useRef } from 'react';
import { Exam, Question, AnswerState } from '../../types';
import { API_BASE_URL, authFetch } from '../../api';

interface ExamPlayerProps {
  exam: Exam;
  questions: Question[];
  candidateName?: string;
  onSubmitExam: (answers: Record<string, AnswerState>, tabSwitches: number) => void;
}

interface PersistedAttempt {
  answers: Record<string, AnswerState>;
  currentIdx: number;
  tabSwitches: number;
  expiresAt: number;
}

export function ExamPlayer({ exam, questions, candidateName = 'Student', onSubmitExam }: ExamPlayerProps) {
  const storageKey = `kgs-exam-attempt:${exam.id}`;
  const [currentIdx, setCurrentIdx] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as PersistedAttempt | null;
      return saved?.currentIdx ?? 0;
    } catch { return 0; }
  });
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as PersistedAttempt | null;
      return saved?.answers ?? {};
    } catch { return {}; }
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as PersistedAttempt | null;
      return saved?.expiresAt ? Math.max(0, Math.ceil((saved.expiresAt - Date.now()) / 1000)) : exam.durationMinutes * 60;
    } catch { return exam.durationMinutes * 60; }
  });
  const [tabSwitches, setTabSwitches] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as PersistedAttempt | null;
      return saved?.tabSwitches ?? 0;
    } catch { return 0; }
  });
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed' | 'retrying'>('saved');
  const [answerVersions, setAnswerVersions] = useState<Record<string, number>>({});
  const [connectionOnline, setConnectionOnline] = useState(() => navigator.onLine);
  const lastVisibilityIncident = useRef(0);

  const currentQ = questions[currentIdx] || questions[0];

  useEffect(() => {
    const online = () => setConnectionOnline(true);
    const offline = () => setConnectionOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); };
  }, []);

  // Initialize answer states
  useEffect(() => {
    const initial: Record<string, AnswerState> = {};
    questions.forEach((q) => {
      initial[q.id] = {
        questionId: q.id,
        isMarkedForReview: false,
        visited: false,
        timeSpentSeconds: 0,
      };
    });
    // Mark first question visited
    if (questions[0]) {
      initial[questions[0].id].visited = true;
    }
    setAnswers((existing) => Object.keys(existing).length ? existing : initial);
  }, [questions]);

  // Keep an attempt recoverable across refreshes or short disconnects. The
  // server remains authoritative in production; this provides a safe client
  // recovery layer for the current frontend prototype.
  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem(storageKey) || 'null') as PersistedAttempt | null;
    const expiresAt = existing?.expiresAt || Date.now() + exam.durationMinutes * 60 * 1000;
    localStorage.setItem(storageKey, JSON.stringify({ answers, currentIdx, tabSwitches, expiresAt } satisfies PersistedAttempt));
  }, [answers, currentIdx, tabSwitches, exam.durationMinutes, storageKey]);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onSubmitExam(answers, tabSwitches);
          localStorage.removeItem(storageKey);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [answers, tabSwitches, onSubmitExam]);

  // Tab switch & Window Blur detection (Proctoring)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastVisibilityIncident.current < 1500) return;
        lastVisibilityIncident.current = now;
        setTabSwitches((prev) => {
          const count = prev + 1;
          // The browser only reports the signal. Violation thresholds and any
          // automatic submission are decided by the backend integrity rules.
          setShowWarningModal(true);
          return count;
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [answers, onSubmitExam]);

  const persistAnswer = async (answer: AnswerState, retry = false) => {
    const version = (answerVersions[answer.questionId] || 0) + 1;
    setSaveState(retry ? 'retrying' : 'saving');
    try {
      const response = await authFetch(`${API_BASE_URL}/api/exams/attempts/${exam.id}/answers/${answer.questionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...answer, version }) });
      if (!response.ok) throw new Error('save failed');
      setAnswerVersions((prev) => ({ ...prev, [answer.questionId]: version }));
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
  };

  const selectOption = (optId: string) => {
    setAnswers((prev) => {
      const next = {
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOptionId: optId,
        visited: true,
      },
      };
      void persistAnswer(next[currentQ.id]);
      return next;
    });
  };

  const clearResponse = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        selectedOptionId: undefined,
      },
    }));
  };

  const toggleMarkForReview = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        ...prev[currentQ.id],
        isMarkedForReview: !prev[currentQ.id]?.isMarkedForReview,
      },
    }));
  };

  const goToQuestion = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      const targetQ = questions[idx];
      setAnswers((prev) => ({
        ...prev,
        [targetQ.id]: {
          ...prev[targetQ.id],
          visited: true,
        },
      }));
      setCurrentIdx(idx);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(remM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentAns = answers[currentQ.id] || {};

  // Palette counts
  let answeredCount = 0;
  let markedCount = 0;
  let unvisitedCount = 0;
  let unansweredCount = 0;

  questions.forEach((q) => {
    const st = answers[q.id];
    if (!st || !st.visited) {
      unvisitedCount++;
    } else if (st.selectedOptionId) {
      answeredCount++;
    } else {
      unansweredCount++;
    }
    if (st?.isMarkedForReview) {
      markedCount++;
    }
  });

  const isLowTime = timeLeft <= 600; // 10 mins
  const isCriticalTime = timeLeft <= 120; // 2 mins

  if (!currentQ) {
    return <div className="exam-player-shell exam-player-empty"><div className="panel"><h2>Questions are not available</h2><p>The assigned examination questions could not be loaded. Your attempt has not been reset.</p><button className="primary" onClick={() => window.location.reload()}>Retry loading questions</button></div></div>;
  }

  return (
    <div className="exam-player-shell">
      {!connectionOnline && (
        <div className="connection-banner" role="alert">
          <div><strong>Connection Lost</strong><span>Your examination timer is still running. We are attempting to reconnect.</span></div>
          <button className="secondary" onClick={() => { setConnectionOnline(navigator.onLine); window.dispatchEvent(new Event('online')); }}>Retry Connection</button>
        </div>
      )}
      {/* Proctoring Warning Modal */}
      {showWarningModal && (
        <div className="modal-scrim warning-scrim">
          <div className="modal-card warning-card">
            <div className="warning-icon">⚠️</div>
            <h3>Proctoring Security Warning</h3>
            <p>
              A tab-switch or window-visibility incident has been recorded. <strong>Recorded incidents: {tabSwitches}</strong>.
              Review the examination monitoring policy before continuing. The backend evaluates incidents according to the configured rules.
            </p>
            <button className="primary" onClick={() => setShowWarningModal(false)}>
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Exam Header Toolbar */}
      <header className="exam-player-header">
        <div className="exam-title-group">
          <h2>{exam.title}</h2>
          <span className="exam-code">{exam.examCode}</span>
        </div>

        <div className="header-actions">
          <div className="offline-status">
            {saveState === 'saved' ? <span className="saved">✓ All changes saved</span> : saveState === 'saving' ? <span className="saving">Saving answer...</span> : saveState === 'retrying' ? <span className="saving">Reconnecting and retrying...</span> : <button className="save-failed" onClick={() => persistAnswer(currentAns, true)}>Unable to save answer · Retry</button>}
          </div>

          <div className={`timer-box ${isCriticalTime ? 'critical' : isLowTime ? 'warning' : ''}`}>
            <small>TIME REMAINING</small>
            <b>{formatTimer(timeLeft)}</b>
          </div>

          <button className="secondary" onClick={() => setPaletteOpen(!paletteOpen)}>
            {paletteOpen ? 'Hide Palette' : 'Question Palette'}
          </button>

          <button className="primary submit-btn" onClick={() => onSubmitExam(answers, tabSwitches)}>
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Examination Viewport */}
      <div className="exam-body-grid">
        <main className="question-viewport">
          <div className="section-bar">
            <span>SECTION: <strong>{currentQ.sectionName}</strong></span>
            <div className="marks-info">
              <span>Marks: +{currentQ.marks}</span>
              <span className="neg">Neg: -{currentQ.negativeMarks}</span>
            </div>
          </div>

          <div className="question-card">
            <div className="question-header">
              <span className="q-number">Question {currentIdx + 1} of {questions.length}</span>
              <button
                className={`flag-button ${currentAns.isMarkedForReview ? 'active' : ''}`}
                onClick={toggleMarkForReview}
              >
                🚩 {currentAns.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>

            <div className="question-text">{currentQ.questionText}</div>

            {currentQ.codeSnippet && (
              <pre className="code-block"><code>{currentQ.codeSnippet}</code></pre>
            )}

            <div className="options-group">
              {currentQ.options.map((opt) => {
                const isSelected = currentAns.selectedOptionId === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => selectOption(opt.id)}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQ.id}`}
                      checked={isSelected}
                      onChange={() => selectOption(opt.id)}
                    />
                    <span className="opt-key">{opt.id.split('-')[1].toUpperCase()}</span>
                    <span className="opt-text">{opt.text}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Viewport Footer Actions */}
          <footer className="viewport-footer">
            <div className="left-actions">
              <button
                className="secondary"
                disabled={currentIdx === 0}
                onClick={() => goToQuestion(currentIdx - 1)}
              >
                ← Previous
              </button>
              <button className="secondary" onClick={clearResponse}>
                Clear Response
              </button>
            </div>

            <div className="right-actions">
              <button
                className="secondary mark-next"
                onClick={() => {
                  toggleMarkForReview();
                  if (currentIdx < questions.length - 1) goToQuestion(currentIdx + 1);
                }}
              >
                Mark for Review & Next
              </button>
              <button
                className="primary save-next"
                onClick={() => {
                  if (currentIdx < questions.length - 1) goToQuestion(currentIdx + 1);
                }}
              >
                Save & Next →
              </button>
            </div>
          </footer>
        </main>

        {/* Question Palette Sidebar */}
        {paletteOpen && (
          <aside className="palette-sidebar">
            <div className="palette-header">
              <h4>Question Palette</h4>
              <p>Candidate: <strong>{candidateName}</strong></p>
            </div>

            <div className="palette-legend">
              <div className="legend-item"><span className="dot answered" /> Answered ({answeredCount})</div>
              <div className="legend-item"><span className="dot unanswered" /> Not Answered ({unansweredCount})</div>
              <div className="legend-item"><span className="dot marked" /> Marked ({markedCount})</div>
              <div className="legend-item"><span className="dot unvisited" /> Not Visited ({unvisitedCount})</div>
            </div>

            <div className="palette-grid">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                let statusClass = 'unvisited';
                if (ans?.selectedOptionId && ans?.isMarkedForReview) {
                  statusClass = 'ans-marked';
                } else if (ans?.selectedOptionId) {
                  statusClass = 'answered';
                } else if (ans?.isMarkedForReview) {
                  statusClass = 'marked';
                } else if (ans?.visited) {
                  statusClass = 'unanswered';
                }

                return (
                  <button
                    key={q.id}
                    className={`palette-tile ${statusClass} ${currentIdx === idx ? 'current' : ''}`}
                    onClick={() => goToQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="proctoring-info-box">
              <div className="proctor-title">🛡️ Automated Proctoring Active</div>
              <small>Tab-switch incidents: <strong>{tabSwitches}</strong></small>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
