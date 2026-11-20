import { useCallback, useEffect, useState, type ComponentType } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

type Props = {
  PageHead: ComponentType<any>
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }

  switch (name) {
    case "students":
    case "users":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case "file":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 2 2h12a2 2 0 0 2 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      )
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )
    case "alert":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="8" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    case "check":
      return (
        <svg {...props}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    default:
      return null
  }
}

export function ResultsPage({
  PageHead,
  active = "Results",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [data, setData] = useState<any>({
    rows: [],
    exams: [],
    colleges: [],
    counts: {},
    pagination: {},
  })
  const [examId, setExamId] = useState("")
  const [college, setCollege] = useState("")
  const [search, setSearch] = useState("")
  const [marksFilter, setMarksFilter] = useState("")
  const [minScore, setMinScore] = useState("")
  const [maxScore, setMaxScore] = useState("")
  const [releaseStatus, setReleaseStatus] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState("")
  const [detail, setDetail] = useState<any>(null)
  const [detailError, setDetailError] = useState("")
  const [publication, setPublication] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" })
      if (examId) params.set("examId", examId)
      if (college) params.set("college", college)
      if (search.trim()) params.set("search", search.trim())
      if (marksFilter) params.set("marksFilter", marksFilter)
      if (minScore.trim()) params.set("minScore", minScore.trim())
      if (maxScore.trim()) params.set("maxScore", maxScore.trim())
      if (releaseStatus) params.set("releaseStatus", releaseStatus)

      const response = await authFetch(
        `${API_BASE_URL}/api/admin/results?${params}`,
        {},
        true,
      )
      const payload = await response.json()
      if (!response.ok)
        throw new Error(payload.error || "Unable to load results.")
      setData(payload)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load results.",
      )
    } finally {
      setLoading(false)
    }
  }, [examId, college, search, marksFilter, minScore, maxScore, releaseStatus, page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!detail && !publication) return
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && (setDetail(null), setPublication(null))
    window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [detail, publication])

  const viewDetails = async (id: string) => {
    setDetail({ loading: true })
    setDetailError("")
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/admin/results/${id}`,
        {},
        true,
      )
      const payload = await response.json()
      if (!response.ok)
        throw new Error(payload.error || "Unable to load result details.")
      setDetail(payload.result)
    } catch (cause) {
      setDetailError(
        cause instanceof Error
          ? cause.message
          : "Unable to load result details.",
      )
      setDetail({ error: true })
    }
  }

  const publish = async (id: string) => {
    setBusy(id)
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/exams/${id}/publish-results`,
        { method: "POST" },
        true,
      )
      const payload = await response.json()
      if (!response.ok)
        throw new Error(payload.error || "Unable to publish results.")
      setNotice("Results published successfully.")
      setPublication(null)
      await load()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to publish results.",
      )
    } finally {
      setBusy("")
    }
  }

  const exportResults = async () => {
    setBusy("export")
    try {
      const created = await authFetch(
        `${API_BASE_URL}/api/admin/reports/exports`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportType: "RESULTS",
            examId: examId || undefined,
            college: college || undefined,
            search: search.trim() || undefined,
            marksFilter: marksFilter || undefined,
            minScore: minScore.trim() ? Number(minScore) : undefined,
            maxScore: maxScore.trim() ? Number(maxScore) : undefined,
            releaseStatus: releaseStatus || undefined,
          }),
        },
        true,
      )
      const payload = await created.json()
      if (!created.ok)
        throw new Error(payload.error || "Unable to generate export.")
      const download = await authFetch(
        `${API_BASE_URL}/api/admin/reports/exports/${payload.exportId}/download`,
        {},
        true,
      )
      if (!download.ok) throw new Error("Unable to download export.")
      const url = URL.createObjectURL(await download.blob())
      const link = document.createElement("a")
      link.href = url
      link.download = payload.fileName || "kgs-examination-results.xlsx"
      link.click()
      URL.revokeObjectURL(url)
      setNotice("Results export downloaded successfully.")
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to export results.",
      )
    } finally {
      setBusy("")
    }
  }

  const rows = data.rows || []

  return (
    <div className="relative min-h-screen w-full max-w-full bg-[#F6F2E6] text-[#1E3A34] font-sans overflow-x-hidden p-4 sm:p-6 lg:p-8">
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
        className={`relative z-10 w-full max-w-[1550px] mx-auto space-y-6 transition-all duration-300 ease-in-out ${
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
                Performance Analytics
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
              Results &amp; Analytics
            </h2>
            <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed max-w-xl">
              Review finalized examination results, score distributions, and publish result releases.
            </p>
          </div>
        </div>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          {
            label: "Assigned Students",
            value: data.counts.assignedStudents || 0,
            icon: "students",
            badgeBg: "bg-[#176B58]/15 text-[#176B58]",
          },
          {
            label: "Submitted Attempts",
            value: data.counts.submittedAttempts || 0,
            icon: "file",
            badgeBg: "bg-[#00C4DF]/20 text-[#008DA0]",
          },
          {
            label: "Pending Evaluations",
            value: data.counts.pendingEvaluations || 0,
            icon: "clock",
            badgeBg: "bg-[#FFB800]/20 text-[#B38100]",
          },
          {
            label: "Awaiting Release",
            value: data.counts.awaitingRelease || 0,
            icon: "alert",
            badgeBg: "bg-[#FF7A59]/20 text-[#D94F2E]",
          },
          {
            label: "Released Results",
            value: data.counts.released || 0,
            icon: "check",
            badgeBg: "bg-[#00D084]/20 text-[#057A55]",
          },
        ].map((item, idx) => (
          <article
            key={idx}
            className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 p-5 shadow-[0_10px_30px_-5px_rgba(30,58,52,0.08)] transition-all hover:scale-[1.02] hover:shadow-[0_16px_40px_-5px_rgba(30,58,52,0.12)] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-[#057A55] uppercase tracking-wider">
                {item.label}
              </span>
              <span className={`w-9 h-9 rounded-2xl flex items-center justify-center ${item.badgeBg}`}>
                <Icon name={item.icon} size={18} />
              </span>
            </div>
            <strong className="text-2xl sm:text-3xl font-black text-[#1E3A34] leading-none">
              {item.value}
            </strong>
          </article>
        ))}
      </section>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-4 mb-6 bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/80 shadow-[0_8px_30px_-5px_rgba(30,58,52,0.06)]">
        {/* Row 1: General Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search student, ID, email, or exam..."
            className="h-11 px-4 text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] placeholder:text-slate-400 outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm"
          />
          <select
            value={examId}
            onChange={(event) => {
              setExamId(event.target.value)
              setPage(1)
            }}
            className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
          >
            <option value="">All Examinations</option>
            {data.exams.map((exam: any) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.code})
              </option>
            ))}
          </select>
          <select
            value={college}
            onChange={(event) => {
              setCollege(event.target.value)
              setPage(1)
            }}
            className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
          >
            <option value="">All Colleges</option>
            {data.colleges.map((name: string) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <select
            value={releaseStatus}
            onChange={(event) => {
              setReleaseStatus(event.target.value)
              setPage(1)
            }}
            className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
          >
            <option value="">All Release Statuses</option>
            <option value="RELEASED">Released Only</option>
            <option value="AWAITING">Awaiting Release Only</option>
          </select>
        </div>

        {/* Row 2: Marks & Performance Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F0EBE1]">
          <div className="w-full sm:w-auto flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <select
              value={marksFilter}
              onChange={(event) => {
                setMarksFilter(event.target.value)
                setPage(1)
              }}
              className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
            >
              <option value="">All Marks / Performance</option>
              <option value="PASSED">Passed (≥ 35%)</option>
              <option value="FAILED">Failed (&lt; 35%)</option>
              <option value="HIGH">Top Performers (≥ 75%)</option>
              <option value="AVERAGE">Average Performers (40% - 74%)</option>
              <option value="LOW">Low Performers (&lt; 40%)</option>
            </select>
            <input
              type="number"
              min="0"
              value={minScore}
              onChange={(e) => {
                setMinScore(e.target.value)
                setPage(1)
              }}
              placeholder="Min Marks (e.g. 50)"
              className="h-11 px-4 text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] placeholder:text-slate-400 outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm"
            />
            <input
              type="number"
              min="0"
              value={maxScore}
              onChange={(e) => {
                setMaxScore(e.target.value)
                setPage(1)
              }}
              placeholder="Max Marks (e.g. 100)"
              className="h-11 px-4 text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] placeholder:text-slate-400 outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0">
            {(marksFilter || minScore || maxScore || examId || college || releaseStatus || search) ? (
              <button
                className="h-11 px-5 text-xs sm:text-sm font-bold rounded-2xl text-[#1E3A34] bg-white border border-[#E2DBD0] hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                onClick={() => {
                  setSearch("")
                  setExamId("")
                  setCollege("")
                  setMarksFilter("")
                  setMinScore("")
                  setMaxScore("")
                  setReleaseStatus("")
                  setPage(1)
                }}
              >
                Reset Filters
              </button>
            ) : null}
            <button
              className="h-11 px-5 text-xs sm:text-sm font-bold rounded-2xl text-[#1E3A34] bg-white/90 hover:bg-white border border-[#E2DBD0] transition-all cursor-pointer shadow-sm"
              onClick={() => void load()}
            >
              Refresh
            </button>
            <button
              className="h-11 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-md shadow-[#176B58]/20 disabled:opacity-50 whitespace-nowrap border-none"
              disabled={busy === "export"}
              onClick={() => void exportResults()}
            >
              {busy === "export" ? "Exporting..." : "Export Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-4 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-3 shadow-md backdrop-blur-xl text-emerald-900 bg-emerald-500/15 border-emerald-300 mb-6">
          <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black bg-white/80 shrink-0 shadow-xs">
            ✓
          </span>
          <span className="flex-1">{notice}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] mb-8">
        {loading ? (
          <div className="p-14 text-center text-xs sm:text-sm font-bold text-[#057A55]">
            Loading results...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-rose-600 flex flex-col items-center gap-3">
            <p className="font-bold">{error}</p>
            <button
              className="h-9 px-4 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer border-none"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        ) : !rows.length ? (
          <div className="py-16 text-center text-xs sm:text-sm text-[#057A55] flex flex-col items-center gap-2">
            <h3 className="text-lg font-black text-[#1E3A34]">No finalized results found</h3>
            <p className="text-[#057A55] font-bold">Results will appear here after an attempt is finalized.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-extrabold text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">College</th>
                  <th className="px-5 py-4">Examination</th>
                  <th className="px-5 py-4">Attempt</th>
                  <th className="px-5 py-4">Marks</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4">Evaluation</th>
                  <th className="px-5 py-4">Release</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {rows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-[#00D084]/5 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col text-xs sm:text-sm">
                        <strong className="font-bold text-[#1E3A34]">
                          {row.student?.fullName || "Unknown student"}
                        </strong>
                        <span className="font-mono text-xs text-slate-500">{row.student?.studentId || "—"}</span>
                        <span className="text-xs text-slate-500">{row.student?.email || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-600">{row.student?.college || "College Not Specified"}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col text-xs sm:text-sm">
                        <strong className="font-bold text-[#1E3A34]">{row.exam?.title || "—"}</strong>
                        <span className="font-mono text-xs text-slate-500">{row.exam?.code || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-600">{row.attemptNumber || row.attemptId.slice(-8)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <strong className="font-black text-[#1E3A34]">
                          {row.maximumMarks === null
                            ? "Unavailable"
                            : `${row.marksScored} / ${row.maximumMarks}`}
                        </strong>
                        {row.maximumMarks && row.maximumMarks > 0 ? (
                          <span
                            className={`inline-flex items-center self-start px-2 py-0.5 mt-1 rounded-md text-[10px] font-black ${
                              (row.marksScored / row.maximumMarks) * 100 >= 75
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : (row.marksScored / row.maximumMarks) * 100 >= 35
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {Math.round((row.marksScored / row.maximumMarks) * 100)}% •{" "}
                            {(row.marksScored / row.maximumMarks) * 100 >= 75
                              ? "Top Scorer"
                              : (row.marksScored / row.maximumMarks) * 100 >= 35
                                ? "Passed"
                                : "Failed"}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-500 text-xs">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                        {row.evaluationStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          row.releaseStatus === "RELEASED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                            : "bg-amber-100 text-amber-800 border border-amber-300/80"
                        }`}
                      >
                        {row.releaseStatus === "RELEASED"
                          ? "RELEASED"
                          : "AWAITING RELEASE"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="px-3.5 py-1.5 rounded-xl bg-[#176B58]/10 text-[#176B58] hover:bg-[#176B58] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none"
                          onClick={() => void viewDetails(row.id)}
                        >
                          View Details
                        </button>
                        {row.releaseStatus !== "RELEASED" && (
                          <button
                            className="px-3.5 py-1.5 rounded-xl bg-[#00D084]/20 text-[#057A55] hover:bg-[#00D084] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none disabled:opacity-50"
                            disabled={Boolean(busy)}
                            onClick={() => setPublication(row)}
                          >
                            Publish Result
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-6 border-t border-[#1E3A34]/10 bg-white/40 text-xs text-[#1E3A34] font-bold">
          <span>Showing {rows.length} of {data.pagination?.total || 0} results</span>
          <div className="flex items-center gap-3">
            <button
              className="h-9 px-4 text-xs font-bold rounded-xl text-[#1E3A34] bg-white border border-[#E2DBD0] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span className="font-extrabold">
              Page {page} of {data.pagination?.pages || 1}
            </span>
            <button
              className="h-9 px-4 text-xs font-bold rounded-xl text-[#1E3A34] bg-white border border-[#E2DBD0] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              disabled={loading || page >= (data.pagination?.pages || 1)}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Result Details Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onClick={() => setDetail(null)}>
          <div
            className="relative w-full max-w-[760px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">RESULT DETAILS</div>
                <h2 className="text-xl font-bold text-slate-900">Examination attempt</h2>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
                onClick={() => setDetail(null)}
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm">
              {detail.loading ? (
                <div className="p-12 text-center font-medium text-slate-500">Loading result details...</div>
              ) : detail.error ? (
                <div className="p-12 text-center font-medium text-red-600">{detailError}</div>
              ) : (
                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-bold text-slate-900 mb-1">Student information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">NAME</small>
                      <strong className="text-xs sm:text-sm font-semibold text-slate-900">{detail.student?.name || "—"}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">STUDENT ID</small>
                      <strong className="text-xs sm:text-sm font-mono text-slate-900">{detail.student?.studentId || "—"}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">EMAIL</small>
                      <strong className="text-xs sm:text-sm font-medium text-slate-900 truncate">{detail.student?.email || "—"}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">COLLEGE</small>
                      <strong className="text-xs sm:text-sm font-medium text-slate-900">{detail.student?.college || "College Not Specified"}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">EXAMINATION</small>
                      <strong className="text-xs sm:text-sm font-semibold text-slate-900">{detail.examination?.name || "—"}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">EXAMINATION ID</small>
                      <strong className="text-xs sm:text-sm font-mono text-slate-900">{detail.examination?.code || "—"}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ATTEMPT ID</small>
                      <strong className="text-xs sm:text-sm font-mono text-slate-900">{detail.attemptId}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">SUBMITTED</small>
                      <strong className="text-xs sm:text-sm font-medium text-slate-900">
                        {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : "—"}
                      </strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">MARKS</small>
                      <strong className="text-xs sm:text-sm font-bold text-slate-900">
                        {detail.maximumMarks === null
                          ? "Unavailable"
                          : `${detail.marksScored} / ${detail.maximumMarks}`}
                      </strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">EVALUATION</small>
                      <strong className="text-xs sm:text-sm font-semibold text-slate-900">{detail.evaluationStatus}</strong>
                    </div>
                    <div className="flex flex-col">
                      <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">RELEASE STATUS</small>
                      <strong className="text-xs sm:text-sm font-semibold text-slate-900">
                        {detail.releaseStatus === "RELEASED" ? "RELEASED" : "AWAITING RELEASE"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
                onClick={() => setDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publication Confirmation Modal */}
      {publication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
          onClick={() => !busy && setPublication(null)}
        >
          <div
            className="relative w-full max-w-[560px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">RESULT PUBLICATION</div>
                <h2 className="text-xl font-bold text-slate-900">Publish Result?</h2>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none disabled:opacity-50"
                disabled={Boolean(busy)}
                onClick={() => setPublication(null)}
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:px-7 sm:py-6 overflow-y-auto flex flex-col gap-4 text-xs sm:text-sm min-h-0 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">STUDENT</small>
                  <strong className="text-xs sm:text-sm font-semibold text-slate-900">{publication.student?.fullName}</strong>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">EXAMINATION</small>
                  <strong className="text-xs sm:text-sm font-semibold text-slate-900">{publication.exam?.title}</strong>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ATTEMPT ID</small>
                  <strong className="text-xs sm:text-sm font-mono text-slate-900">{publication.attemptId}</strong>
                </div>
                <div className="flex flex-col">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">MARKS</small>
                  <strong className="text-xs sm:text-sm font-bold text-slate-900">
                    {publication.maximumMarks === null
                      ? "Unavailable"
                      : `${publication.marksScored} / ${publication.maximumMarks}`}
                  </strong>
                </div>
                <div className="flex flex-col sm:col-span-2">
                  <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">CURRENT STATUS</small>
                  <strong className="text-xs sm:text-sm font-semibold text-amber-700">AWAITING RELEASE</strong>
                </div>
              </div>

              <p className="text-slate-500 font-medium text-xs">
                Publishing makes this finalized result visible to the student.
              </p>
            </div>

            <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="h-10 px-5 text-xs sm:text-sm font-bold rounded-2xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
                disabled={Boolean(busy)}
                onClick={() => setPublication(null)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-md shadow-[#176B58]/20 disabled:opacity-50 border-none"
                disabled={Boolean(busy)}
                onClick={() => void publish(publication.exam.id)}
              >
                {busy ? "Publishing..." : "Confirm Publication"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
