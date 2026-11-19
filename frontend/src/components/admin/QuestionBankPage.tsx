import { useEffect, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"

const API = API_BASE_URL

export function QuestionBankPage({
  Icon,
  PageHead,
}: {
  Icon: any
  PageHead: any
}) {
  const [rows, setRows] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [page, setPage] = useState<any>({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    status: "",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<any>(null)
  const [confirmAction, setConfirmAction] = useState<"ACTIVE" | "INACTIVE" | null>(
    null,
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [importOpen, setImportOpen] = useState(false)
  const [file, setFile] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const r = await authFetch(
        `${API}/api/admin/questions?${new URLSearchParams({ page: String(p), ...filters })}`,
        {},
        true,
      )
      const d = await r.json()
      if (!r.ok) throw Error(d.error || "Unable to load question bank.")
      setRows(d.questions || [])
      setStats(d.stats || {})
      setPage(d.pagination || {})
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load question bank.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [filters.type, filters.category, filters.status])

  const view = async (row: any) => {
    const r = await authFetch(`${API}/api/admin/questions/${row.id}`, {}, true)
    const d = await r.json()
    if (r.ok) setSelected(d.question)
    else setMessage(d.error || "Unable to load question.")
  }

  const updateStatus = async () => {
    if (!selected || !confirmAction || saving) return
    setSaving(true)
    try {
      const r = await authFetch(
        `${API}/api/admin/questions/${selected.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: confirmAction }),
        },
        true,
      )
      const d = await r.json()
      if (!r.ok) throw Error(d.error || "Unable to update question status.")
      setSelected(d.question)
      setConfirmAction(null)
      setMessage(
        confirmAction === "ACTIVE"
          ? "Question activated successfully."
          : "Question deactivated successfully.",
      )
      await load(page.page || 1)
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to update question status.",
      )
    } finally {
      setSaving(false)
    }
  }

  const parse = async (f: any) => {
    setFile(f)
    setProcessing(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const r = await authFetch(
        `${API}/api/admin/questions/import-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: f.name,
            fileBase64: reader.result,
          }),
        },
        true,
      )
      const d = await r.json()
      setProcessing(false)
      if (r.ok) setPreview(d)
      else setMessage(d.error || "Unable to process file.")
    }
    reader.readAsDataURL(f)
  }

  const confirmImport = async () => {
    if (!preview?.valid?.length) return
    setProcessing(true)
    const r = await authFetch(
      `${API}/api/admin/questions/import`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview.valid }),
      },
      true,
    )
    const d = await r.json()
    setProcessing(false)
    if (!r.ok) return setMessage(d.error || "Import failed.")
    setMessage(
      `Import completed: ${d.imported || 0} questions imported, ${(preview.duplicates || []).length} duplicates skipped, ${(preview.invalid || []).length} invalid.`,
    )
    setPreview(null)
    setFile(null)
    setImportOpen(false)
    void load(1)
  }

  const download = async (format: string) => {
    const r = await authFetch(
      `${API}/api/admin/questions/import-template?format=${format}`,
      {},
      true,
    )
    if (!r.ok) return
    const a = document.createElement("a")
    a.href = URL.createObjectURL(await r.blob())
    a.download = `kgs-question-import-template.${format}`
    a.click()
  }

  const notice =
    message.endsWith("successfully.") ||
    (message.startsWith("Import completed") &&
      message.includes("0 duplicates skipped"))
      ? "success"
      : message.toLowerCase().includes("warning") ||
          message.includes("duplicates skipped")
        ? "warning"
        : "error"

  return (
    <>
      <PageHead
        admin
        student={null}
        title="Question Bank"
        description="Create, organize, and manage examination questions."
        showCreateAction={false}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Import and manage examination questions from approved templates.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-sm shadow-blue-500/20 flex-shrink-0"
          onClick={() => setImportOpen(true)}
        >
          <Icon name="plus" />
          Import Questions
        </button>
      </div>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <article className="flex flex-col p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <small className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Questions</small>
          <strong className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">{stats.total || 0}</strong>
        </article>
        <article className="flex flex-col p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <small className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Questions</small>
          <strong className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">{stats.active || 0}</strong>
        </article>
        <article className="flex flex-col p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <small className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Draft Questions</small>
          <strong className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">{stats.draft || 0}</strong>
        </article>
        <article className="flex flex-col p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <small className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Question Types</small>
          <strong className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">{(stats.byType || []).length}</strong>
        </article>
      </section>

      {/* Message Notice */}
      {message && (
        <div
          className={`p-3.5 px-4 mb-6 text-xs sm:text-sm font-semibold rounded-xl border flex items-center gap-2.5 shadow-sm ${
            notice === "success"
              ? "text-emerald-800 bg-emerald-50 border-emerald-200/80"
              : notice === "warning"
                ? "text-amber-800 bg-amber-50 border-amber-200/80"
                : "text-red-800 bg-red-50 border-red-200/80"
          }`}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-white/60">
            {notice === "success" ? "✓" : "×"}
          </span>
          {message}
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <input
          placeholder="Search question ID or text"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && void load(1)}
          className="flex-1 min-w-[220px] h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="DRAFT">Draft</option>
        </select>
        <button
          className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer shadow-sm"
          onClick={() => void load(1)}
        >
          Search
        </button>
      </div>

      {/* Questions Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500">
            Loading question bank...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-red-600">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Question ID</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Question Preview</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Type</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Category</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Difficulty</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Marks</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Status</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Created Date</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600">{row.questionId.slice(-8)}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 max-w-xs truncate">{row.questionText}</td>
                    <td className="px-4 py-3.5 text-slate-600">{row.questionType}</td>
                    <td className="px-4 py-3.5 text-slate-600">{row.category}</td>
                    <td className="px-4 py-3.5 text-slate-600">{row.difficulty}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{row.marks}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                          row.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : row.status === "INACTIVE"
                              ? "bg-red-100 text-red-800 border border-red-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0"
                        onClick={() => void view(row)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600 font-medium">
          <span>{page.total || 0} questions</span>
          <div className="flex items-center gap-3">
            <button
              className="h-8 px-3 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              disabled={(page.page || 1) <= 1}
              onClick={() => void load((page.page || 1) - 1)}
            >
              Previous
            </button>
            <span>
              Page {page.page || 1} of {page.pages || 1}
            </span>
            <button
              className="h-8 px-3 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              disabled={(page.page || 1) >= (page.pages || 1)}
              onClick={() => void load((page.page || 1) + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Question Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[680px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none z-10"
              onClick={() => setSelected(null)}
            >
              ×
            </button>

            <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Question Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="flex flex-col text-xs text-slate-500">
                  <b className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">Question ID</b>
                  <span className="font-mono text-slate-900 font-medium truncate">{selected.questionId}</span>
                </span>
                <span className="flex flex-col text-xs text-slate-500">
                  <b className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">Status</b>
                  <span className="font-semibold text-slate-900">{selected.status}</span>
                </span>
                <span className="flex flex-col text-xs text-slate-500">
                  <b className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-0.5">Created</b>
                  <span className="text-slate-900 font-medium">
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
                  </span>
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{selected.questionText}</h3>
              <p className="text-xs font-semibold text-slate-500">
                {selected.questionType} · {selected.category} · {selected.difficulty} · {selected.marks} marks
              </p>

              <div className="grid grid-cols-1 gap-2">
                {["A", "B", "C", "D"].map((id) => {
                  const option = (selected.options || []).find((o: any) => o.id === id)
                  const isCorrect =
                    selected.correctOptionId === id ||
                    selected.correctOptionIds?.includes(id)
                  return (
                    <div
                      key={id}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm transition-all ${
                        isCorrect
                          ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
                          : "bg-slate-50/60 border-slate-200/80 text-slate-800"
                      }`}
                    >
                      <b className="flex items-center justify-center w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-bold shrink-0">
                        {id}
                      </b>
                      <span className="flex-1 font-medium mt-0.5">{option?.text || "—"}</span>
                      {isCorrect && (
                        <em className="not-italic text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                          Correct answer
                        </em>
                      )}
                    </div>
                  )
                })}
              </div>

              {selected.explanation && (
                <div className="mt-1 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs sm:text-sm text-blue-900">
                  <b className="block font-bold text-blue-950 mb-1">Explanation</b>
                  <p className="text-blue-800 font-medium">{selected.explanation}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
              {selected.status !== "PUBLISHED" && (
                <button
                  className={`h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                    selected.status === "ACTIVE"
                      ? "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-500/20"
                      : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20"
                  }`}
                  disabled={saving}
                  onClick={() =>
                    setConfirmAction(
                      selected.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                    )
                  }
                >
                  {selected.status === "ACTIVE" ? "Deactivate Question" : "Activate Question"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[500px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            <div className="p-5 sm:p-7 overflow-y-auto flex flex-col gap-3 text-xs sm:text-sm">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {confirmAction === "ACTIVE" ? "Activate Question" : "Deactivate Question"}
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                {confirmAction === "ACTIVE"
                  ? "Are you sure you want to activate this question? Once activated, it will become available for selection in new examination papers."
                  : "Are you sure you want to deactivate this question? It will no longer be available for selection in new examination papers."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                disabled={saving}
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className={`h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
                  confirmAction === "ACTIVE"
                    ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20"
                    : "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-500/20"
                }`}
                disabled={saving}
                onClick={() => void updateStatus()}
              >
                {saving
                  ? "Saving..."
                  : confirmAction === "ACTIVE"
                    ? "Confirm Activation"
                    : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Questions Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[720px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none z-10"
              onClick={() => setImportOpen(false)}
            >
              ×
            </button>

            <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm">
              <h2 className="text-xl font-bold text-slate-900">Import Questions</h2>

              <div className="flex flex-wrap items-center gap-2.5 pb-1">
                <button
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer bg-transparent border-none p-0 mr-2"
                  onClick={() => void download("pdf")}
                >
                  Download PDF Template
                </button>
                <button
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer bg-transparent border-none p-0 mr-2"
                  onClick={() => void download("csv")}
                >
                  Download CSV Template
                </button>
                <button
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer bg-transparent border-none p-0"
                  onClick={() => void download("xlsx")}
                >
                  Download XLSX Template
                </button>
              </div>

              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl bg-slate-50/60 hover:bg-blue-50/20 text-slate-600 hover:text-blue-600 font-semibold cursor-pointer transition-all text-xs sm:text-sm text-center">
                <span>{file ? file.name : "Choose or drag a CSV, XLSX, or PDF file"}</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.pdf"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && void parse(e.target.files[0])
                  }
                />
              </label>

              {processing && (
                <p className="text-xs font-medium text-slate-500 animate-pulse text-center">
                  Processing file...
                </p>
              )}

              {preview && (
                <>
                  <div className="p-3 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                    Total: {preview.total || 0} · Valid: {preview.valid?.length || 0} · Invalid:{" "}
                    {preview.invalid?.length || 0} · Duplicate: {preview.duplicates?.length || 0}
                  </div>

                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2 p-1">
                    {[
                      ...(preview.valid || []),
                      ...(preview.invalid || []),
                      ...(preview.duplicates || []),
                    ].map((r: any) => (
                      <article
                        className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-1 text-xs"
                        key={`${r.rowNumber}-${r.questionText}`}
                      >
                        <b className="font-bold text-slate-900">Question {r.rowNumber}</b>
                        <strong className="font-semibold text-slate-800">{r.questionText}</strong>
                        <span className="text-slate-500 font-medium">
                          {r.result || r.errors?.join("; ") || "Valid"}
                        </span>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
                onClick={() => setImportOpen(false)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20"
                disabled={processing || !preview?.valid?.length}
                onClick={() => void confirmImport()}
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
