import { Question, AnswerState } from "../../types"

interface SubmissionModalProps {
  onClose: () => void
  onConfirmSubmit: () => void
  questions: Question[]
  answers: Record<string, AnswerState>
  examTitle: string
  submitting?: boolean
  error?: string
}

export function SubmissionModal({
  onClose,
  onConfirmSubmit,
  questions,
  answers,
  examTitle,
  submitting = false,
  error = "",
}: SubmissionModalProps) {
  let answeredCount = 0
  let markedCount = 0
  let unvisitedCount = 0
  let unansweredCount = 0

  questions.forEach((q) => {
    const st = answers[q.id]
    if (!st || !st.visited) {
      unvisitedCount++
    } else if (st.selectedOptionId) {
      answeredCount++
    } else {
      unansweredCount++
    }

    if (st?.isMarkedForReview) {
      markedCount++
    }
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[560px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
              ATTEMPT SUMMARY
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              Submit Examination
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {examTitle}
            </p>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm">
          <p className="text-slate-600 font-medium leading-relaxed m-0">
            Are you sure you want to finalize your exam attempt? Once submitted,
            you cannot modify your responses.
          </p>

          {error && (
            <div
              className="p-3.5 px-4 text-xs sm:text-sm font-semibold rounded-xl border border-red-200/80 bg-red-50 text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Summary Table */}
          <div className="flex flex-col rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden bg-slate-50/50 text-xs sm:text-sm">
            <div className="flex items-center justify-between p-3.5 px-4 bg-white">
              <span className="font-semibold text-slate-600">Total Questions</span>
              <strong className="font-bold text-slate-900 text-sm">{questions.length}</strong>
            </div>
            <div className="flex items-center justify-between p-3.5 px-4 bg-white">
              <span className="font-semibold text-slate-600">Answered Questions</span>
              <strong className="font-bold text-emerald-700 text-sm">{answeredCount}</strong>
            </div>
            <div className="flex items-center justify-between p-3.5 px-4 bg-white">
              <span className="font-semibold text-slate-600">Unanswered Questions</span>
              <strong className="font-bold text-red-600 text-sm">{unansweredCount + unvisitedCount}</strong>
            </div>
            <div className="flex items-center justify-between p-3.5 px-4 bg-white">
              <span className="font-semibold text-slate-600">Marked for Review</span>
              <strong className="font-bold text-amber-600 text-sm">{markedCount}</strong>
            </div>
          </div>

          {/* Unanswered Warning Callout */}
          {(unansweredCount > 0 || unvisitedCount > 0) && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs sm:text-sm font-medium flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>
                You have{" "}
                <strong className="font-bold text-amber-950">
                  {unansweredCount + unvisitedCount} unanswered question(s)
                </strong>
                . Unanswered questions earn 0 marks.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
          {submitting && (
            <span className="text-xs font-semibold text-slate-500 animate-pulse mr-auto">
              Submitting your examination...
            </span>
          )}
          <button
            className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
            onClick={onClose}
          >
            Return to Test
          </button>
          <button
            className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20 border-none"
            disabled={submitting}
            onClick={onConfirmSubmit}
          >
            Yes, Finalize & Submit →
          </button>
        </div>
      </div>
    </div>
  )
}
