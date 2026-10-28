import { useEffect, useMemo, useState } from "react";
import { Exam } from "../../types";
import { API_BASE_URL, authFetch } from "../../api";
type ApiExam = Exam & {
  id: string;
  code?: string;
  scheduledAt?: string;
  nextAction?: string;
  maxAttempts?: number;
  integrityProfile?: string;
  readinessRequirements?: {
    camera?: boolean;
    microphone?: boolean;
    fullscreen?: boolean;
  };
  markingScheme?: {
    correctMarks?: number;
    incorrectMarks?: number;
    unansweredMarks?: number;
  };
};
interface Props {
  onStartExam: (exam: Exam) => void;
  onViewMarks: (exam: Exam) => void;
}
const tabs = [
  "AVAILABLE",
  "UPCOMING",
  "IN_PROGRESS",
  "COMPLETED",
  "RESULTS_PENDING",
] as const;
const label = (value: string) => value.replaceAll("_", " ");
export function StudentExaminations({ onStartExam, onViewMarks }: Props) {
  const [exams, setExams] = useState<ApiExam[]>([]);
  const [tab, setTab] = useState<(typeof tabs)[number]>("AVAILABLE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ApiExam | null>(null);
  const [showNoticeToast, setShowNoticeToast] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await authFetch(`${API_BASE_URL}/api/student/exams`);
      if (!r.ok) throw new Error("Unable to load your examinations.");
      const data = await r.json();
      setExams(
        (data.exams || []).map((exam: any) => ({
          ...exam,
          id: String(exam.id || exam._id),
          examCode: exam.code || exam.examCode || String(exam.id || exam._id),
          activeAttempt: exam.activeAttempt || null,
        })),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load your examinations.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const filtered = useMemo(
    () =>
      exams.filter((exam) =>
        tab === "COMPLETED"
          ? ["SUBMITTED", "RESULTS_RELEASED"].includes(exam.status)
          : exam.status === tab,
      ),
    [exams, tab],
  );
  const date = (exam: ApiExam) =>
    exam.scheduledAt
      ? new Date(exam.scheduledAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "To be announced";
  return (
    <main className="examinations-page">
      {showNoticeToast && (
        <div className="mb-4 flex items-center justify-between max-w-md w-full bg-blue-600/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-lg shadow-md transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 text-white"
            >
              <path
                d="M10 14.167q.354 0 .593-.24.24-.24.24-.594a.8.8 0 0 0-.24-.593.8.8 0 0 0-.594-.24.8.8 0 0 0-.593.24.8.8 0 0 0-.24.593q0 .354.24.594t.593.24m-.834-3.334h1.667v-5H9.166zm.833 7.5a8.1 8.1 0 0 1-3.25-.656 8.4 8.4 0 0 1-2.645-1.781 8.4 8.4 0 0 1-1.782-2.646A8.1 8.1 0 0 1 1.666 10q0-1.73.656-3.25a8.4 8.4 0 0 1 1.782-2.646 8.4 8.4 0 0 1 2.645-1.781A8.1 8.1 0 0 1 10 1.667q1.73 0 3.25.656a8.4 8.4 0 0 1 2.646 1.781 8.4 8.4 0 0 1 1.781 2.646 8.1 8.1 0 0 1 .657 3.25 8.1 8.1 0 0 1-.657 3.25 8.4 8.4 0 0 1-1.78 2.646 8.4 8.4 0 0 1-2.647 1.781 8.1 8.1 0 0 1-3.25.656"
                fill="currentColor"
              />
            </svg>
            <p className="text-xs font-semibold truncate">
              Portal Active! Your student examination sessions are fully synchronized.
            </p>
          </div>
          <button
            type="button"
            aria-label="close"
            className="active:scale-90 transition-all ml-2 hover:bg-white/20 p-1 rounded shrink-0"
            onClick={() => setShowNoticeToast(false)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5 5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="page-head">
        <div>
          <div className="eyebrow">STUDENT PORTAL</div>
          <h1>My examinations</h1>
          <p>View eligible examinations and track your participation.</p>
        </div>
      </div>
      <div className="exam-tabs">
        {tabs.map((value) => (
          <button
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
            key={value}
          >
            {label(value)}
            <span>
              {
                exams.filter((exam) =>
                  value === "COMPLETED"
                    ? ["SUBMITTED", "RESULTS_RELEASED"].includes(exam.status)
                    : exam.status === value,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      {loading ? (
        <div className="panel module-state">
          <h3>Loading examinations...</h3>
          <p>Checking eligibility and participation status.</p>
        </div>
      ) : error ? (
        <div className="panel module-state">
          <h3>Unable to load examinations</h3>
          <p>{error}</p>
          <button className="primary" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="panel module-state">
          <h3>No {label(tab).toLowerCase()} examinations</h3>
          <p>Eligible examinations will appear here when available.</p>
        </div>
      ) : (
        <div className="examination-list">
          {filtered.map((exam) => (
            <article className="panel examination-card" key={exam.id}>
              <div className="examination-card-main">
                <span className="pill">{label(exam.status)}</span>
                <h2>{exam.title}</h2>
                <p className="exam-id">
                  Examination ID: {exam.code || exam.examCode || exam.id}
                </p>
                <div className="exam-facts">
                  <span>
                    <small>SCHEDULED</small>
                    <b>{date(exam)}</b>
                  </span>
                  <span>
                    <small>DURATION</small>
                    <b>{exam.durationMinutes} minutes</b>
                  </span>
                  <span>
                    <small>QUESTIONS</small>
                    <b>{exam.totalQuestions || 0}</b>
                  </span>
                  <span>
                    <small>MAXIMUM MARKS</small>
                    <b>{exam.totalMarks || 0}</b>
                  </span>
                </div>
              </div>
              <div className="examination-card-actions">
                <button className="secondary" onClick={() => setSelected(exam)}>
                  Review details
                </button>
                {exam.nextAction === "RESUME_EXAM" && (
                  <button className="primary" onClick={() => onStartExam(exam)}>
                    Resume Examination
                  </button>
                )}
                {exam.nextAction === "VIEW_MARKS" && (
                  <button className="primary" onClick={() => onViewMarks(exam)}>
                    View Marks
                  </button>
                )}
                {exam.status === "AVAILABLE" && (
                  <button className="primary" onClick={() => onStartExam(exam)}>
                    Start Examination
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <div className="modal-scrim" onClick={() => setSelected(null)}>
          <div
            className="modal-card exam-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">EXAMINATION OVERVIEW</div>
                <h2>{selected.title}</h2>
                <p className="muted">{selected.code || selected.examCode}</p>
              </div>
              <button
                className="close-button"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div>
                  <small>STATUS</small>
                  <b>{label(selected.status)}</b>
                </div>
                <div>
                  <small>SCHEDULED</small>
                  <b>{date(selected)}</b>
                </div>
                <div>
                  <small>QUESTIONS</small>
                  <b>{selected.totalQuestions || 0}</b>
                </div>
                <div>
                  <small>DURATION</small>
                  <b>{selected.durationMinutes} minutes</b>
                </div>
                <div>
                  <small>MAXIMUM MARKS</small>
                  <b>{selected.totalMarks}</b>
                </div>
                <div>
                  <small>ALLOWED ATTEMPTS</small>
                  <b>{selected.maxAttempts || 1}</b>
                </div>
                <div>
                  <small>MARKING</small>
                  <b>Correct +{selected.markingScheme?.correctMarks ?? 1}</b>
                  <b>
                    Incorrect {selected.markingScheme?.incorrectMarks ?? 0} ·
                    Unanswered {selected.markingScheme?.unansweredMarks ?? 0}
                  </b>
                </div>
              </div>
              <h3>Instructions</h3>
              <ol>
                {(selected.instructions || []).map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>
              <div className="monitoring-notice">
                <strong>Monitoring requirements</strong>
                <p>
                  Profile: {selected.integrityProfile || "Configured"}. Camera:{" "}
                  {selected.readinessRequirements?.camera
                    ? "Required"
                    : "Not required"}
                  . Microphone:{" "}
                  {selected.readinessRequirements?.microphone
                    ? "Required"
                    : "Not required"}
                  . Fullscreen:{" "}
                  {selected.readinessRequirements?.fullscreen
                    ? "Required"
                    : "Not required"}
                  .
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary" onClick={() => setSelected(null)}>
                Close
              </button>
              {selected.status === "AVAILABLE" && (
                <button
                  className="primary"
                  onClick={() => {
                    setSelected(null);
                    onStartExam(selected);
                  }}
                >
                  Continue to Instructions
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
