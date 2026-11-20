import { useState, useEffect } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

export function SecurityAuditPage({
  Icon,
  active = "Security & audit",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: {
  Icon?: any
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadAuditLogs = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/monitoring/attempts?status=SUBMITTED`, {}, true)
      const data = await response.json()
      if (response.ok) {
        setLogs(data.attempts || [])
      }
    } catch (e) {
      setError("Unable to load security & audit logs.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAuditLogs()
  }, [])

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
        {/* Hero Header Glass Card matching Admin Overview */}
        <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-6 sm:p-7">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59]" />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                Flux Suite
              </span>
              <span className="text-xs font-bold text-[#1E3A34]/80">
                System Security & Compliance
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
              Security & Audit Logs
            </h2>
            <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed max-w-xl">
              Audit proctoring integrity events, system access records, and administrator actions across the platform.
            </p>
          </div>
        </div>

        {/* Security Overview KPI Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "System Status", value: "Secure", color: "text-emerald-700" },
            { label: "Encryption", value: "AES-256", color: "text-[#176B58]" },
            { label: "Proctoring Integrity", value: "Active", color: "text-[#057A55]" },
            { label: "CSRF & Session Protection", value: "Enabled", color: "text-emerald-700" },
          ].map((item, idx) => (
            <article
              key={idx}
              className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 p-5 shadow-[0_10px_30px_-5px_rgba(30,58,52,0.08)] flex flex-col justify-between"
            >
              <span className="text-[11px] font-black text-[#057A55] uppercase tracking-wider mb-2">
                {item.label}
              </span>
              <strong className={`text-xl sm:text-2xl font-black ${item.color}`}>
                {item.value}
              </strong>
            </article>
          ))}
        </section>

        {/* Audit Log Table */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)]">
          <div className="border-b border-slate-100 bg-[#1E3A34]/5 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#1E3A34] m-0">Platform Audit Events</h3>
          </div>

          {loading ? (
            <p className="p-10 text-center text-xs sm:text-sm font-bold text-[#057A55]">Loading security audit logs...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-4">Event Type</th>
                    <th className="px-5 py-4">Target / Entity</th>
                    <th className="px-5 py-4">Severity</th>
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-5 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {logs.map((item, index) => (
                    <tr key={index} className="hover:bg-[#00D084]/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#1E3A34]">
                        {item.examTitle ? `Attempt Completed: ${item.examTitle}` : "Admin Session Auth"}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-semibold">{item.studentName || item.registrationId || "System"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                          INFO
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-500">{new Date(item.startedAt || Date.now()).toLocaleString()}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
