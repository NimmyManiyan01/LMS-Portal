import { useState, useEffect } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

export function ReportsPage({
  Icon,
  active = "Reports",
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
  const [exports, setExports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const loadExports = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/reports/exports`, {}, true)
      const data = await response.json()
      if (response.ok) {
        setExports(data.exports || [])
      }
    } catch (e) {
      setError("Unable to load export history.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExports()
  }, [])

  const generateExport = async () => {
    if (generating) return
    setGenerating(true)
    setMessage("")
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/admin/reports/exports`,
        { method: "POST" },
        true,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to generate report export.")

      const downloadRes = await authFetch(
        `${API_BASE_URL}/api/admin/reports/exports/${data.exportId}/download`,
        {},
        true,
      )
      if (downloadRes.ok) {
        const blob = await downloadRes.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = data.fileName || "kgs-examination-report.xlsx"
        a.click()
        URL.revokeObjectURL(url)
        setMessage("Report generated and downloaded successfully.")
      }
      await loadExports()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report export.")
    } finally {
      setGenerating(false)
    }
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
        {/* Hero Header Glass Card matching Admin Overview */}
        <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-6 sm:p-7">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                  Flux Suite
                </span>
                <span className="text-xs font-bold text-[#1E3A34]/80">
                  Data Exports & Analytics
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
                Reports & Data Exports
              </h2>
              <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed max-w-xl">
                Generate and export consolidated Excel workbooks containing examination scores, candidate attempt logs, and proctoring analytics.
              </p>
            </div>
            <button
              disabled={generating}
              onClick={() => void generateExport()}
              className="inline-flex items-center justify-center gap-2.5 h-11 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-lg shadow-[#176B58]/20 flex-shrink-0 border-none disabled:opacity-50"
            >
              📥 {generating ? "Generating Excel Report..." : "Export Excel Report"}
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-500/15 text-xs sm:text-sm font-extrabold text-emerald-900 shadow-md">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl border border-rose-300 bg-rose-500/15 text-xs sm:text-sm font-extrabold text-rose-900 shadow-md">
            ⚠️ {error}
          </div>
        )}

        {/* Export History Table */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)]">
          <div className="border-b border-slate-100 bg-[#1E3A34]/5 px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#1E3A34] m-0">Export History</h3>
            <span className="text-xs font-bold text-[#057A55]">{exports.length} reports generated</span>
          </div>

          {loading ? (
            <p className="p-10 text-center text-xs sm:text-sm font-bold text-[#057A55]">Loading report history...</p>
          ) : exports.length === 0 ? (
            <p className="p-10 text-center text-xs sm:text-sm font-bold text-slate-500">No report exports generated yet. Click above to export examination data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-4">File Name</th>
                    <th className="px-5 py-4">Generated Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {exports.map((exp) => (
                    <tr key={exp.id || exp.exportId} className="hover:bg-[#00D084]/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#1E3A34]">{exp.fileName || "examination-report.xlsx"}</td>
                      <td className="px-5 py-4 text-slate-600 font-semibold">{new Date(exp.createdAt || Date.now()).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                          {exp.status || "COMPLETED"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={`${API_BASE_URL}/api/admin/reports/exports/${exp.id || exp.exportId}/download`}
                          download
                          className="px-4 py-2 rounded-xl bg-[#176B58]/10 text-[#176B58] hover:bg-[#176B58] hover:text-white font-extrabold text-xs transition-all no-underline inline-block"
                        >
                          Download
                        </a>
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
