import { useEffect, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"

interface ResultsViewProps {
  onBackToDashboard: () => void
}

export function ResultsView({ onBackToDashboard }: ResultsViewProps) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    authFetch(`${API_BASE_URL}/api/student/results`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}))
        if (!response.ok)
          throw new Error(payload.error || "Unable to load results.")
        if (active)
          setResults(Array.isArray(payload) ? payload : payload.results || [])
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load results.",
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-slate-900">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <button
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-transparent border-none p-0 mb-2 cursor-pointer inline-flex items-center gap-1"
            onClick={onBackToDashboard}
          >
            ← Back to Dashboard
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Examination Results</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Your submitted examinations and published marks.
          </p>
        </div>
      </header>

      {/* Results Content */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            Loading results...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-red-600 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Unable to load results</h3>
            <p>{error}</p>
          </div>
        ) : !results.length ? (
          <div className="py-16 text-center text-xs sm:text-sm text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-1.5">
            <h3 className="text-base font-bold text-slate-900">No results available</h3>
            <p className="text-slate-500 font-medium">
              Submitted examinations will appear here when results are released.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-w-5xl">
            {results.map((result) => (
              <article
                className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.5fr_0.8fr_0.9fr_1fr] items-center gap-4 sm:gap-6"
                key={result.attemptId}
              >
                <div className="flex flex-col gap-1">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EXAMINATION</small>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">{result.examName}</h3>
                  <p className="text-xs font-mono font-medium text-slate-500 m-0">{result.examCode || "Examination"}</p>
                </div>

                {result.released ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MARKS SCORED</small>
                      <strong className="text-lg font-extrabold text-slate-900">
                        {result.marksScored === null ||
                        result.marksScored === undefined ||
                        result.maximumMarks === null ||
                        result.maximumMarks === undefined
                          ? "Marks unavailable"
                          : `${result.marksScored} / ${result.maximumMarks}`}
                      </strong>
                    </div>
                    <div className="flex flex-col gap-1">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RESULT STATUS</small>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          Released
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <strong className="text-sm font-semibold text-slate-900">Examination Submitted Successfully</strong>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Results Awaiting Release
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SUBMITTED</small>
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    {result.submittedAt
                      ? new Date(result.submittedAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
