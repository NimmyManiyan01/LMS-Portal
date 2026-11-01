import { useCallback, useEffect, useState, type ComponentType } from "react"
import { API_BASE_URL, authFetch } from "../../api"
type Props = { PageHead: ComponentType<any> }

export function ResultsPage({ PageHead }: Props) {
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
            examId: examId || undefined,
            college: college || undefined,
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
    <>
      <PageHead
        eyebrow="ADMINISTRATION"
        title="Results"
        subtitle="Review finalized examination results and release statuses."
      />

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[
          ["Assigned students", data.counts.assignedStudents || 0],
          ["Submitted attempts", data.counts.submittedAttempts || 0],
          ["Pending evaluations", data.counts.pendingEvaluations || 0],
          ["Awaiting release", data.counts.awaitingRelease || 0],
          ["Released results", data.counts.released || 0],
        ].map(([label, value]) => (
          <article
            className="flex flex-col p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all"
            key={String(label)}
          >
            <small className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</small>
            <strong className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">{value}</strong>
          </article>
        ))}
      </section>

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-3.5 mb-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        {/* Row 1: General Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search student, ID, email, or exam..."
            className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />
          <select
            value={examId}
            onChange={(event) => {
              setExamId(event.target.value)
              setPage(1)
            }}
            className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
          >
            <option value="">All examinations</option>
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
            className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
          >
            <option value="">All colleges</option>
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
            className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
          >
            <option value="">All Release Statuses</option>
            <option value="RELEASED">Released Only</option>
            <option value="AWAITING">Awaiting Release Only</option>
          </select>
        </div>

        {/* Row 2: Marks & Performance Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="w-full sm:w-auto flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <select
              value={marksFilter}
              onChange={(event) => {
                setMarksFilter(event.target.value)
                setPage(1)
              }}
              className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
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
              className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
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
              className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {(marksFilter || minScore || maxScore || examId || college || releaseStatus || search) ? (
              <button
                className="h-10 px-3 text-xs font-semibold rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
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
              className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer shadow-sm"
              onClick={() => void load()}
            >
              Refresh
            </button>
            <button
              className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-sm shadow-blue-500/20 disabled:opacity-50 whitespace-nowrap"
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
        <div className="p-3.5 px-4 mb-6 text-xs sm:text-sm font-semibold rounded-xl border flex items-center justify-between gap-2 shadow-sm text-emerald-800 bg-emerald-50 border-emerald-200/80">
          {notice}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500">
            Loading results...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-red-600 flex flex-col items-center gap-3">
            <p>{error}</p>
            <button
              className="h-9 px-4 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        ) : !rows.length ? (
          <div className="py-16 text-center text-xs sm:text-sm text-slate-500 flex flex-col items-center gap-1.5">
            <h3 className="text-base font-bold text-slate-900">No finalized results found</h3>
            <p className="text-slate-500 font-medium">Results will appear here after an attempt is finalized.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Student</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">College</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Examination</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Attempt</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Marks</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Submitted</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Evaluation</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Release</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col text-xs sm:text-sm">
                        <strong className="font-semibold text-slate-900">
                          {row.student?.fullName || "Unknown student"}
                        </strong>
                        <span className="font-mono text-xs text-slate-500">{row.student?.studentId || "—"}</span>
                        <span className="text-xs text-slate-500">{row.student?.email || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{row.student?.college || "College Not Specified"}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col text-xs sm:text-sm">
                        <strong className="font-semibold text-slate-900">{row.exam?.title || "—"}</strong>
                        <span className="font-mono text-xs text-slate-500">{row.exam?.code || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600 font-semibold">{row.attemptNumber || row.attemptId.slice(-8)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <strong className="font-bold text-slate-900">
                          {row.maximumMarks === null
                            ? "Unavailable"
                            : `${row.marksScored} / ${row.maximumMarks}`}
                        </strong>
                        {row.maximumMarks && row.maximumMarks > 0 ? (
                          <span
                            className={`inline-flex items-center self-start px-2 py-0.5 mt-1 rounded text-[10px] font-extrabold ${
                              (row.marksScored / row.maximumMarks) * 100 >= 75
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : (row.marksScored / row.maximumMarks) * 100 >= 35
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
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
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {row.evaluationStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                          row.releaseStatus === "RELEASED"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {row.releaseStatus === "RELEASED"
                          ? "RELEASED"
                          : "AWAITING RELEASE"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0"
                          onClick={() => void viewDetails(row.id)}
                        >
                          View details
                        </button>
                        {row.releaseStatus !== "RELEASED" && (
                          <button
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0 disabled:opacity-50"
                            disabled={Boolean(busy)}
                            onClick={() => setPublication(row)}
                          >
                            Publish result
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600 font-medium">
          <span>{data.pagination?.total || 0} results</span>
          <div className="flex items-center gap-3">
            <button
              className="h-8 px-3 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {data.pagination?.pages || 1}
            </span>
            <button
              className="h-8 px-3 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
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
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                disabled={Boolean(busy)}
                onClick={() => setPublication(null)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                disabled={Boolean(busy)}
                onClick={() => void publish(publication.exam.id)}
              >
                {busy ? "Publishing..." : "Confirm Publication"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
