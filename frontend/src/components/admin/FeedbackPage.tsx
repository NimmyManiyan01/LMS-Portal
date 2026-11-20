import { useEffect, useState, type ComponentType } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

type Props = {
  PageHead: ComponentType<any>
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}

const ratingMap: Record<number, { label: string; icon: string; badgeStyle: string }> = {
  1: { label: "Very Dissatisfied", icon: "😡", badgeStyle: "bg-rose-500/20 text-rose-800 border-rose-300" },
  2: { label: "Dissatisfied", icon: "🙁", badgeStyle: "bg-orange-500/20 text-orange-800 border-orange-300" },
  3: { label: "Neutral", icon: "😐", badgeStyle: "bg-amber-500/20 text-amber-800 border-amber-300" },
  4: { label: "Satisfied", icon: "🙂", badgeStyle: "bg-cyan-500/20 text-cyan-800 border-cyan-300" },
  5: { label: "Very Satisfied", icon: "😄", badgeStyle: "bg-emerald-500/20 text-emerald-800 border-emerald-300" },
}

export function FeedbackPage({
  PageHead,
  active = "Feedback",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: Props) {
  const [data, setData] = useState<any>({ rows: [], summary: { total: 0, average: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/admin/feedback?limit=100`, {}, true)
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || "Unable to load feedback.")
        setData(payload)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load feedback.")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="relative min-h-screen w-full max-w-full bg-[#F6F2E6] text-[#1E3A34] font-sans overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* Continuous Full-Page Atmospheric Background Lighting Orbs */}
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
        className={`relative z-10 w-full max-w-[1550px] mx-auto space-y-6 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-68"
        }`}
      >
        {/* Floating Glass Page Header */}
        <header className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59]" />
          <div className="space-y-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                Flux Suite
              </span>
              <span className="text-xs font-bold text-[#1E3A34]/80">
                Candidate Voice &amp; Experience
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
              Student Feedback
            </h1>

            <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed">
              Ratings and comments submitted by candidates after completing examination attempts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-4 py-2 rounded-full bg-[#1E3A34] text-white text-xs font-extrabold shadow-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
              Live Feedback Feed
            </span>
          </div>
        </header>

        {/* Summary Glass Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="group relative overflow-hidden bg-white/50 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#057A55]">Average Candidate Rating</span>
              <span className="text-lg">⭐</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#1E3A34]">
              {data.summary.average ? Number(data.summary.average).toFixed(1) : "—"}{" "}
              <span className="text-amber-500 text-2xl sm:text-3xl font-normal">/ 5.0</span>
            </div>
            <small className="text-[11px] font-semibold text-[#1E3A34]/70 mt-1 block">Cumulative satisfaction rating</small>
          </article>

          <article className="group relative overflow-hidden bg-white/50 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#FF7A59]">Total Responses Submitted</span>
              <span className="text-lg">💬</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#1E3A34]">
              {data.summary.total ?? 0}
            </div>
            <small className="text-[11px] font-semibold text-[#1E3A34]/70 mt-1 block">Feedback entries recorded</small>
          </article>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="rounded-3xl border border-white/80 bg-white/50 backdrop-blur-xl p-12 text-center text-xs sm:text-sm font-bold text-[#1E3A34] shadow-sm">
            Loading student feedback data...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/90 p-5 text-xs sm:text-sm font-bold text-rose-900 shadow-sm">
            ⚠️ {error}
          </div>
        ) : !data.rows.length ? (
          <div className="rounded-3xl border border-white/80 bg-white/50 backdrop-blur-xl p-12 text-center text-xs sm:text-sm font-bold text-[#1E3A34] shadow-sm">
            📋 No student feedback has been submitted yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/80 bg-white/50 backdrop-blur-xl shadow-2xl p-5 sm:p-6">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[760px] text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E3A34]/5 border-b border-[#F0EBE1] text-[#1E3A34] font-black text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Examination</th>
                    <th className="px-5 py-3.5">Experience Rating</th>
                    <th className="px-5 py-3.5">Comments</th>
                    <th className="px-5 py-3.5">Submitted Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1]/60">
                  {data.rows.map((row: any) => {
                    const ratingInfo = ratingMap[row.rating] || { label: `Rating ${row.rating}`, icon: "⭐", badgeStyle: "bg-amber-100 text-amber-800 border-amber-200" }
                    return (
                      <tr key={row.id} className="align-top hover:bg-white/80 transition-colors">
                        <td className="px-5 py-4">
                          <strong className="block text-[#1E3A34] font-extrabold">{row.student?.fullName || "Student"}</strong>
                          <span className="text-xs text-[#1E3A34]/70 font-medium">{row.student?.email || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <strong className="block text-[#1E3A34] font-extrabold">{row.exam?.title || "Examination"}</strong>
                          <span className="text-xs font-mono font-bold text-[#057A55]">{row.exam?.code || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-xs ${ratingInfo.badgeStyle}`}>
                            <span>{ratingInfo.icon}</span>
                            <span>{ratingInfo.label} ({row.rating}/5)</span>
                          </span>
                        </td>
                        <td className="max-w-sm px-5 py-4 text-xs font-semibold text-[#1E3A34]/85 leading-relaxed">
                          {row.comment ? (
                            `"${row.comment}"`
                          ) : (
                            <span className="text-[#1E3A34]/40 italic">No comment provided</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs font-bold text-[#1E3A34]/60">
                          {new Date(row.createdAt).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
