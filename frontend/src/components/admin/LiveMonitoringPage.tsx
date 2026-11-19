import { useCallback, useEffect, useRef, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"

export function LiveMonitoringPage({ PageHead }: { PageHead: any }) {
  const [attempts, setAttempts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [status, setStatus] = useState("IN_PROGRESS")
  const initialLoad = useRef(true)

  const load = useCallback(async () => {
    try {
      setError("")
      if (initialLoad.current) setLoading(true)
      const query = status ? `?status=${encodeURIComponent(status)}` : ""
      const response = await authFetch(
        `${API_BASE_URL}/api/admin/monitoring/attempts${query}`,
        {},
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to load live monitoring.")
      setAttempts(data.attempts || [])
      setUpdatedAt(new Date())
      initialLoad.current = false
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load live monitoring.",
      )
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 3000)
    return () => window.clearInterval(timer)
  }, [load])

  const viewEvents = async (attempt: any) => {
    setSelected(attempt)
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/monitoring/attempts/${attempt.attemptId}/events`,
      {},
      true,
    )
    const data = await response.json()
    if (response.ok) setEvents(data.events || [])
  }

  return (
    <div className="w-full">
      <PageHead
        eyebrow="ADMINISTRATION"
        title="Live monitoring"
        subtitle="Review active examination attempts and recorded integrity incidents."
      />

      {error && (
        <div className="p-3.5 px-4 mb-6 text-xs sm:text-sm font-semibold rounded-xl border border-red-200/80 bg-red-50 text-red-800 flex items-center justify-between gap-3 shadow-sm">
          <span>{error}</span>
          <button
            className="h-8 px-3 text-xs font-semibold rounded-lg text-red-800 bg-white border border-red-300 hover:bg-red-100 transition-all cursor-pointer flex-shrink-0"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Monitoring Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <strong className="block text-sm sm:text-base font-bold text-slate-900 capitalize">
            {attempts.length}{" "}
            {status === "IN_PROGRESS"
              ? "active"
              : status.toLowerCase().replace("_", " ")}{" "}
            attempts
          </strong>
          <span className="block text-xs font-medium text-slate-500 mt-0.5">
            {updatedAt
              ? `Last updated ${updatedAt.toLocaleTimeString()}`
              : "Updating…"}
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-9 px-3 py-1 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
          >
            <option value="IN_PROGRESS">Active</option>
            <option value="AUTO_SUBMITTED">Auto-submitted</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </label>
      </div>

      {/* Attempts Table / Empty state */}
      {loading ? (
        <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-6">
          Loading attempts…
        </div>
      ) : attempts.length === 0 ? (
        <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-6">
          No{" "}
          {status === "IN_PROGRESS"
            ? "active"
            : status.toLowerCase().replace("_", " ")}{" "}
          attempts.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Examination</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Student</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Status</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Answered</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Incidents</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Camera</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Latest Incident</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attempts.map((attempt) => {
                  const incidentCount = Object.values(
                    attempt.integrityCounts || {},
                  ).reduce(
                    (sum: number, value: any) => sum + Number(value || 0),
                    0,
                  )
                  return (
                    <tr key={attempt.attemptId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        <div>{attempt.exam?.title}</div>
                        <div className="text-xs font-mono font-medium text-slate-500 mt-0.5">{attempt.exam?.code}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div>{attempt.student?.fullName}</div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">{attempt.student?.studentId}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                            attempt.status === "IN_PROGRESS"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : attempt.status === "TERMINATED"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">{attempt.answeredCount}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <span className={incidentCount > 0 ? "text-amber-600" : "text-slate-500"}>
                          {incidentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {attempt.exam?.readinessRequirements?.camera
                          ? "Required · health not reported"
                          : "Not required"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {attempt.latestIncident
                          ? new Date(
                              attempt.latestIncident.recordedAt,
                            ).toLocaleString()
                          : "None"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <button
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0"
                          onClick={() => void viewEvents(attempt)}
                        >
                          View incidents
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Incident Timeline Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[680px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none z-10"
              onClick={() => setSelected(null)}
            >
              ×
            </button>

            <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">Incident Timeline</h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
                  {selected.student?.fullName} · {selected.exam?.title}
                </p>
              </div>

              {events.length === 0 ? (
                <div className="py-12 text-center text-xs sm:text-sm font-medium text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  No incidents recorded for this attempt.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {events.map((event) => (
                    <div
                      className="py-3.5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1 sm:gap-4 items-start text-xs sm:text-sm"
                      key={event.eventId}
                    >
                      <strong className="font-bold text-slate-900">{event.eventType}</strong>
                      <span className="text-slate-500 font-mono text-xs">
                        {new Date(event.recordedAt).toLocaleString()}
                      </span>
                      <small className="sm:col-span-2 text-xs text-slate-500 font-medium">
                        Action: <span className="font-semibold text-slate-700">{event.action}</span> · Attempt:{" "}
                        <span className="font-mono text-slate-600">{selected.attemptId}</span>
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
