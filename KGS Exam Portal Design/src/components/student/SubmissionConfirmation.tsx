import { useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"

interface Props {
  examTitle: string
  attemptId: string
  submittedAt: Date
  marksScored?: number
  maximumMarks?: number
  resultsReleased?: boolean
  onBackToDashboard: () => void
  onFeedbackSubmitted: () => void
  onViewMarks?: () => void
}

export function SubmissionConfirmation({
  examTitle,
  attemptId,
  submittedAt,
  marksScored,
  maximumMarks,
  resultsReleased = false,
  onBackToDashboard,
  onFeedbackSubmitted,
  onViewMarks,
}: Props) {
  const [showToast, setShowToast] = useState(true)
  const [showFeedback, setShowFeedback] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [feedbackSaving, setFeedbackSaving] = useState(false)
  const [feedbackError, setFeedbackError] = useState("")

  const saveFeedback = async () => {
    if (!rating || feedbackSaving) return
    setFeedbackSaving(true)
    setFeedbackError("")
    try {
      const response = await authFetch(`${API_BASE_URL}/api/attempts/${attemptId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "Unable to save feedback.")
      setShowFeedback(false)
      onFeedbackSubmitted()
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Unable to save feedback.")
    } finally {
      setFeedbackSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900">
      {showFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">★</div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Rate your examination experience</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Your feedback helps KGS improve future assessments.</p>
            <div className="mt-5 flex justify-center gap-2" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  onClick={() => setRating(value)}
                  className={`cursor-pointer border-0 bg-transparent p-1 text-4xl transition-transform hover:scale-110 ${value <= rating ? "text-amber-400" : "text-slate-200"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Tell us what worked well or what we can improve (optional)"
              className="mt-5 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {feedbackError && <p className="mt-3 text-sm font-semibold text-red-600" role="alert">{feedbackError}</p>}
            <button
              type="button"
              disabled={!rating || feedbackSaving}
              onClick={() => void saveFeedback()}
              className="mt-5 h-11 w-full cursor-pointer rounded-xl border-0 bg-blue-600 px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {feedbackSaving ? "Saving feedback…" : "Submit Feedback"}
            </button>
          </div>
        </div>
      )}
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10 flex flex-col items-center text-center">
        {/* Sync Toast */}
        {showToast && (
          <div className="mb-6 flex items-center justify-between w-full bg-blue-600/90 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-md transition-all">
            <div className="flex items-center gap-2">
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
              <p className="text-xs font-semibold m-0">
                Success! Your examination submission is fully recorded.
              </p>
            </div>
            <button
              type="button"
              aria-label="close"
              className="active:scale-90 transition-all ml-2 hover:bg-white/20 p-1 rounded cursor-pointer border-none bg-transparent"
              onClick={() => setShowToast(false)}
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

        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl font-black mb-4 shadow-inner">
          ✓
        </div>

        <div className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600 mb-1">
          SUBMISSION CONFIRMATION
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          Examination Submitted Successfully
        </h1>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 mb-6 text-left">
          <div className="flex flex-col gap-0.5">
            <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              EXAM
            </small>
            <b className="text-xs sm:text-sm font-semibold text-slate-900">
              {examTitle}
            </b>
          </div>
          <div className="flex flex-col gap-0.5">
            <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SUBMISSION STATUS
            </small>
            <b className="text-xs sm:text-sm font-bold text-emerald-700">
              Completed
            </b>
          </div>
          <div className="flex flex-col gap-0.5">
            <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SUBMITTED AT
            </small>
            <b className="text-xs font-medium text-slate-900">
              {submittedAt.toLocaleString("en-IN", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </b>
          </div>
        </div>

        {resultsReleased && (
          <div className="w-full p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-center mb-4">
            <small className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              MARKS SCORED
            </small>
            <strong className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
              {marksScored} / {maximumMarks}
            </strong>
          </div>
        )}

        <p className="text-xs sm:text-sm text-slate-600 font-medium mb-6">
          {resultsReleased
            ? "Your marks are available."
            : "Your results will be available after they are released."}
        </p>

        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            className="h-11 w-full sm:w-auto px-6 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none"
            onClick={onBackToDashboard}
          >
            Back to Dashboard
          </button>
          {resultsReleased && onViewMarks && (
            <button
              className="h-11 w-full sm:w-auto px-6 text-xs sm:text-sm font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              onClick={onViewMarks}
            >
              View Marks
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
