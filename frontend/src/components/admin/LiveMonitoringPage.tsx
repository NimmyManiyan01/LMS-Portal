import { useCallback, useEffect, useRef, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

export function LiveMonitoringPage({
  PageHead,
  active = "Live monitoring",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: {
  PageHead: any
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
    <div className="relative min-h-screen bg-[#F6F2E6] text-[#1E3A34] font-sans overflow-x-hidden p-4 sm:p-8 -m-4 sm:-m-8">
      {/* Continuous Full-Page Atmospheric Background Ambient Lighting Blobs */}
      <div className="fixed -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-[#00C4DF]/30 blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-1/4 -right-24 w-[650px] h-[650px] rounded-full bg-[#00D084]/30 blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/3 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#FFB800]/28 blur-[150px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-10 w-[700px] h-[700px] rounded-full bg-[#FF7A59]/28 blur-[160px] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20 pointer-events-none z-0" />

      {/* Floating Vertical Glass Sidebar */}
      <AdminFloatingSidebar
        active={active}
        onNav={onNav}
        adminUser={adminUser}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Page Content Wrapper */}
      <div
        className={`relative z-10 max-w-[1550px] mx-auto space-y-6 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-68"
        }`}
      >
        <PageHead
          eyebrow="ADMINISTRATION"
          title="Live monitoring"
          subtitle="Review active examination attempts and recorded integrity incidents."
        />

        {/* Hero Header Glass Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-6 sm:p-7">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                  Flux Suite
                </span>
                <span className="text-xs font-bold text-[#1E3A34]/80">
                  Real-time Proctoring
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
                Live Monitoring
              </h2>
              <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed">
                Automated live candidate attempt tracking, telemetry streams, and security breach flags.
              </p>
            </div>
            {updatedAt && (
              <span className="text-xs font-bold text-[#057A55] bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/80 shadow-xs self-start sm:self-auto">
                Updated {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 text-xs sm:text-sm font-extrabold rounded-2xl border border-rose-300 bg-rose-500/15 text-rose-900 flex items-center justify-between gap-3 shadow-md backdrop-blur-xl">
            <span>{error}</span>
            <button
              className="h-8 px-4 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer border-none shadow-xs"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/80 shadow-[0_8px_30px_-5px_rgba(30,58,52,0.06)]">
          <div className="flex items-center gap-2">
            {["IN_PROGRESS", "SUBMITTED", ""].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`h-9 px-4 text-xs font-black rounded-2xl transition-all cursor-pointer border-none ${
                  status === st
                    ? "bg-[#176B58] text-white shadow-md shadow-[#176B58]/20"
                    : "bg-white/80 text-[#1E3A34] hover:bg-white border border-slate-200/80"
                }`}
              >
                {st === "IN_PROGRESS" ? "Active Candidates" : st === "SUBMITTED" ? "Completed" : "All Statuses"}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)]">
          {loading ? (
            <div className="p-14 text-center text-xs sm:text-sm font-bold text-[#057A55]">
              Connecting to live telemetry feed...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">College / Reg ID</th>
                    <th className="px-5 py-4">Exam Name</th>
                    <th className="px-5 py-4">Started At</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Flags</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {attempts.map((attempt) => (
                    <tr key={attempt.attemptId} className="hover:bg-[#00D084]/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#1E3A34]">
                        {attempt.studentName || "Candidate"}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-semibold">
                        {attempt.registrationId || attempt.college || "—"}
                      </td>
                      <td className="px-5 py-4 font-extrabold text-[#1E3A34]">{attempt.examTitle}</td>
                      <td className="px-5 py-4 font-medium text-slate-500">
                        {new Date(attempt.startedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            attempt.status === "IN_PROGRESS"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                              : "bg-blue-100 text-blue-800 border border-blue-300/80"
                          }`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-amber-700">
                        {attempt.incidentCount || 0} incidents
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          className="px-3.5 py-1.5 rounded-xl bg-[#176B58]/10 text-[#176B58] hover:bg-[#176B58] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none"
                          onClick={() => void viewEvents(attempt)}
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Incident Events Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-[650px] max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer border-none z-10"
              onClick={() => setSelected(null)}
            >
              ×
            </button>

            <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm pt-8">
              <h2 className="text-2xl font-black text-[#1E3A34] leading-tight m-0">
                Security Incident Logs
              </h2>

              {events.length === 0 ? (
                <p className="p-6 text-center text-xs font-bold text-[#057A55] bg-emerald-50/50 rounded-2xl border border-emerald-200/60 m-0">
                  No security or proctoring incidents recorded for this candidate attempt.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {events.map((ev, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 flex flex-col gap-1 text-xs"
                    >
                      <b className="font-extrabold text-[#1E3A34] text-sm">{ev.eventType || "Incident"}</b>
                      <span className="font-semibold text-slate-700">{ev.details || "Proctoring flag detected."}</span>
                      <small className="text-slate-500 font-medium mt-1">
                        {new Date(ev.timestamp).toLocaleString()} · Attempt ID:{" "}
                        <span className="font-mono text-slate-600">{selected.attemptId}</span>
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer border-none shadow-md"
                onClick={() => setSelected(null)}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
