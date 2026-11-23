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
  initialShowFeedback?: boolean
}

export function SubmissionConfirmation({
  attemptId,
  onFeedbackSubmitted,
  initialShowFeedback = false,
}: Props) {
  const [showToast, setShowToast] = useState(true)
  const [showFeedback, setShowFeedback] = useState(initialShowFeedback)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/30 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white bg-white/95 backdrop-blur-2xl p-6 text-center shadow-2xl sm:p-8 text-[#1E3A34]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#00D084]/20 text-2xl">💬</div>
            <h2 className="mt-4 text-xl font-black text-[#1E3A34]">Rate your examination experience</h2>
            <p className="mt-1 text-xs font-bold text-[#057A55]">Help us improve future assessments by sharing your thoughts.</p>

            <div className="mt-5 flex justify-center gap-2.5" role="radiogroup" aria-label="Rating">
              {[
                { value: 1, label: "Very Dissatisfied", icon: "😡" },
                { value: 2, label: "Dissatisfied", icon: "🙁" },
                { value: 3, label: "Neutral", icon: "😐" },
                { value: 4, label: "Satisfied", icon: "🙂" },
                { value: 5, label: "Very Satisfied", icon: "😄" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="radio"
                  aria-checked={rating === item.value}
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => setRating(item.value)}
                  className={`cursor-pointer border-2 rounded-full w-11 h-11 flex items-center justify-center text-2xl transition-all duration-200 ${
                    rating === item.value
                      ? "border-[#057A55] bg-[#00D084]/20 scale-110 shadow-md"
                      : "border-slate-200 bg-white hover:bg-slate-50 hover:scale-105"
                  }`}
                >
                  {item.icon}
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell us what worked well or what we can improve (optional)"
              className="mt-5 w-full resize-none rounded-xl border border-[#E2DBD0] bg-white p-3 text-xs sm:text-sm text-[#1E3A34] placeholder:text-slate-400 outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 shadow-sm"
            />
            <p className="text-right text-[10px] font-bold text-slate-400 mt-1">{comment.length}/500 characters</p>

            {feedbackError && <p className="mt-2 text-xs font-bold text-rose-600" role="alert">⚠️ {feedbackError}</p>}

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowFeedback(false)
                  onFeedbackSubmitted()
                }}
                className="h-10 px-5 rounded-full border border-[#E2DBD0] bg-white text-xs font-bold text-[#1E3A34] hover:bg-slate-50 cursor-pointer shadow-sm"
              >
                Skip
              </button>
              <button
                type="button"
                disabled={!rating || feedbackSaving}
                onClick={() => void saveFeedback()}
                className="h-10 px-6 rounded-full border border-emerald-400/30 bg-[#057A55] text-xs font-black text-white shadow-md shadow-emerald-900/20 hover:bg-[#035E41] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {feedbackSaving ? "Saving feedback…" : "Submit Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="relative w-full max-w-[540px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10 flex flex-col items-center text-center">
        {/* Sync Toast */}
        {showToast && (
          <div className="mb-6 flex items-center justify-between w-full bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-md transition-all">
            <div className="flex items-center gap-2">
              <span className="text-base">✓</span>
              <p className="text-xs font-semibold m-0">
                Success! Your examination submission is fully recorded.
              </p>
            </div>
            <button
              type="button"
              aria-label="close"
              className="active:scale-90 transition-all ml-2 hover:bg-white/20 p-1 rounded cursor-pointer border-none bg-transparent text-white"
              onClick={() => setShowToast(false)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Center-aligned green success checkmark icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-500/40 flex items-center justify-center text-4xl font-black mb-5 shadow-sm">
          ✓
        </div>

        {/* Bold "Thank You!" heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
          Thank You!
        </h1>

        {/* Confirmation message */}
        <p className="text-base sm:text-lg text-slate-600 font-medium max-w-md mx-auto mb-8 leading-relaxed">
          Your examination has been successfully submitted. We will reach out to you soon.
        </p>

        {/* NEXT Action Button */}
        <div className="w-full flex items-center justify-center">
          <button
            className="h-12 w-full sm:w-auto px-10 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all cursor-pointer shadow-lg shadow-emerald-600/20 border-none"
            onClick={() => setShowFeedback(true)}
          >
            Next ➔
          </button>
        </div>
      </div>
    </div>
  )
}
