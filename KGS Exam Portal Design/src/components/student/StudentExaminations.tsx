import { useEffect, useMemo, useState } from "react"
import { Exam } from "../../types"
import { API_BASE_URL, authFetch } from "../../api"

type ApiExam = Exam & {
  id: string
  code?: string
  scheduledAt?: string
  nextAction?: string
  maxAttempts?: number
  integrityProfile?: string
  readinessRequirements?: {
    camera?: boolean
    microphone?: boolean
    fullscreen?: boolean
  }
  markingScheme?: {
    correctMarks?: number
    incorrectMarks?: number
    unansweredMarks?: number
  }
}

interface Props {
  onStartExam: (exam: Exam) => void
  onViewMarks: (exam: Exam) => void
}

const tabs = [
  "AVAILABLE",
  "UPCOMING",
  "IN_PROGRESS",
  "COMPLETED",
  "RESULTS_PENDING",
] as const

const label = (value: string) => value.replaceAll("_", " ")

export function StudentExaminations({ onStartExam, onViewMarks }: Props) {
  const [exams, setExams] = useState<ApiExam[]>([])
  const [tab, setTab] = useState<typeof tabs[number]>("AVAILABLE")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<ApiExam | null>(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const r = await authFetch(`${API_BASE_URL}/api/student/exams`)
      if (!r.ok) throw new Error("Unable to load your examinations.")
      const data = await r.json()
      setExams(
        (data.exams || []).map((exam: any) => ({
          ...exam,
          id: String(exam.id || exam._id),
          examCode: exam.code || exam.examCode || String(exam.id || exam._id),
          activeAttempt: exam.activeAttempt || null,
        })),
      )
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load your examinations.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(
    () =>
      exams.filter((exam) =>
        tab === "COMPLETED"
          ? ["SUBMITTED", "RESULTS_RELEASED"].includes(exam.status)
          : exam.status === tab,
      ),
    [exams, tab],
  )

  const date = (exam: ApiExam) =>
    exam.scheduledAt
      ? new Date(exam.scheduledAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "To be announced"

  return (
    <main className="w-full flex flex-col gap-6 font-sans text-slate-900">
      {false && (
        <div className="flex items-center justify-between max-w-md w-full bg-blue-600/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-md transition-all">
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
            <p className="text-xs font-semibold truncate m-0">
              Portal Active! Your student examination sessions are fully
              synchronized.
            </p>
          </div>
          <button
            type="button"
            aria-label="close"
            className="active:scale-90 transition-all ml-2 hover:bg-white/20 p-1 rounded shrink-0 cursor-pointer border-none bg-transparent"
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

      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium px-1"
      >
        <span className="p-0.5 text-slate-600">
          <svg
            width="18"
            height="18"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 7.609c.352 0 .69.122.96.343l.111.1 6.25 6.25v.001a1.5 1.5 0 0 1 .445 1.071v7.5a.89.89 0 0 1-.891.891H9.125a.89.89 0 0 1-.89-.89v-7.5l.006-.149a1.5 1.5 0 0 1 .337-.813l.1-.11 6.25-6.25c.285-.285.67-.444 1.072-.444Zm5.984 7.876L16 9.5l-5.984 5.985v6.499h11.968z"
              fill="#475569"
              stroke="#475569"
              strokeWidth=".094"
            />
          </svg>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-300 shrink-0"
        >
          <path
            d="m14.413 10.663-6.25 6.25a.939.939 0 1 1-1.328-1.328L12.42 10 6.836 4.413a.939.939 0 1 1 1.328-1.328l6.25 6.25a.94.94 0 0 1-.001 1.328"
            fill="#CBD5E1"
          />
        </svg>
        <span className="text-slate-600">Student Portal</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-300 shrink-0"
        >
          <path
            d="m14.413 10.663-6.25 6.25a.939.939 0 1 1-1.328-1.328L12.42 10 6.836 4.413a.939.939 0 1 1 1.328-1.328l6.25 6.25a.94.94 0 0 1-.001 1.328"
            fill="#CBD5E1"
          />
        </svg>
        <span className="text-blue-600 font-semibold">My Examinations</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">STUDENT PORTAL</div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">My examinations</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">View eligible examinations and track your participation.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60 scrollbar-thin">
        {tabs.map((value) => {
          const count = exams.filter((exam) =>
            value === "COMPLETED"
              ? ["SUBMITTED", "RESULTS_RELEASED"].includes(exam.status)
              : exam.status === value,
          ).length
          const isActive = tab === value
          return (
            <button
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none whitespace-nowrap ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
              onClick={() => setTab(value)}
              key={value}
            >
              {label(value)}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* State / Examinations List */}
      {loading ? (
        <div className="p-12 text-center text-xs sm:text-sm text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-1.5">
          <h3 className="text-base font-bold text-slate-900">Loading examinations...</h3>
          <p className="font-medium text-slate-500 m-0">Checking eligibility and participation status.</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center text-xs sm:text-sm text-red-600 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-3">
          <h3 className="text-base font-bold text-slate-900">Unable to load examinations</h3>
          <p className="m-0">{error}</p>
          <button
            className="h-9 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer border-none"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      ) : !filtered.length ? (
        <div className="py-16 text-center text-xs sm:text-sm text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-1.5">
          <h3 className="text-base font-bold text-slate-900">No {label(tab).toLowerCase()} examinations</h3>
          <p className="font-medium text-slate-500 m-0">Eligible examinations will appear here when available.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((exam) => (
            <article
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              key={exam.id}
            >
              <div className="flex flex-col gap-3 min-w-0 flex-1">
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                      exam.status === "AVAILABLE"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : exam.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {label(exam.status)}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight m-0">{exam.title}</h2>
                <p className="text-xs font-mono font-medium text-slate-500 m-0">
                  Examination ID: {exam.code || exam.examCode || exam.id}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 mt-1">
                  <span className="flex flex-col">
                    <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SCHEDULED</small>
                    <b className="text-xs font-medium text-slate-900 mt-0.5">{date(exam)}</b>
                  </span>
                  <span className="flex flex-col">
                    <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DURATION</small>
                    <b className="text-xs font-bold text-slate-900 mt-0.5">{exam.durationMinutes} minutes</b>
                  </span>
                  <span className="flex flex-col">
                    <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUESTIONS</small>
                    <b className="text-xs font-bold text-slate-900 mt-0.5">{exam.totalQuestions || 0}</b>
                  </span>
                  <span className="flex flex-col">
                    <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MAXIMUM MARKS</small>
                    <b className="text-xs font-bold text-slate-900 mt-0.5">{exam.totalMarks || 0}</b>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap lg:flex-col items-stretch justify-end gap-2.5 shrink-0 lg:min-w-[180px]">
                <button
                  className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                  onClick={() => setSelected(exam)}
                >
                  Review details
                </button>
                {exam.nextAction === "RESUME_EXAM" && (
                  <button
                    className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none"
                    onClick={() => onStartExam(exam)}
                  >
                    Resume Examination
                  </button>
                )}
                {exam.nextAction === "VIEW_MARKS" && (
                  <button
                    className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none"
                    onClick={() => onViewMarks(exam)}
                  >
                    View Marks
                  </button>
                )}
                {exam.status === "AVAILABLE" && (
                  <button
                    className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none"
                    onClick={() => onStartExam(exam)}
                  >
                    Start Examination
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-[760px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
                  EXAMINATION OVERVIEW
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight m-0">
                  {selected.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-mono font-medium mt-0.5 m-0">
                  {selected.code || selected.examCode}
                </p>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">STATUS</small>
                  <b className="text-xs sm:text-sm font-semibold text-slate-900">{label(selected.status)}</b>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">SCHEDULED</small>
                  <b className="text-xs sm:text-sm font-medium text-slate-900">{date(selected)}</b>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">QUESTIONS</small>
                  <b className="text-xs sm:text-sm font-bold text-slate-900">{selected.totalQuestions || 0}</b>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">DURATION</small>
                  <b className="text-xs sm:text-sm font-bold text-slate-900">{selected.durationMinutes} minutes</b>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">MAXIMUM MARKS</small>
                  <b className="text-xs sm:text-sm font-bold text-slate-900">{selected.totalMarks}</b>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ALLOWED ATTEMPTS</small>
                  <b className="text-xs sm:text-sm font-bold text-slate-900">{selected.maxAttempts || 1}</b>
                </div>
                <div className="flex flex-col sm:col-span-3">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">MARKING</small>
                  <b className="text-xs font-semibold text-slate-900">Correct +{selected.markingScheme?.correctMarks ?? 1}</b>
                  <b className="text-xs font-medium text-slate-600">
                    Incorrect {selected.markingScheme?.incorrectMarks ?? 0} ·
                    Unanswered {selected.markingScheme?.unansweredMarks ?? 0}
                  </b>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-1 mb-0">Instructions</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-700 font-medium pl-1 leading-relaxed m-0">
                {(selected.instructions || []).map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col gap-1 text-xs sm:text-sm my-1">
                <strong className="font-bold text-blue-950">Monitoring requirements</strong>
                <p className="text-blue-900 font-medium leading-relaxed m-0">
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

            <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              {selected.status === "AVAILABLE" && (
                <button
                  className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer shadow-sm shadow-blue-500/20 border-none"
                  onClick={() => {
                    setSelected(null)
                    onStartExam(selected)
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
  )
}
