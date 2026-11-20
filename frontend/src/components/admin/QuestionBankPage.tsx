import { useEffect, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

const API = API_BASE_URL

export function QuestionBankPage({
  Icon,
  PageHead,
  active = "Question bank",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: {
  Icon: any
  PageHead: any
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  const startEdit = (q: any) => {
    setEditForm({
      questionTitle: q.questionTitle || q.questionText || "",
      explanation: q.explanation || q.problemDescription || q.questionText || "",
      category: q.category || "General",
      difficulty: q.difficulty || "MEDIUM",
      marks: q.marks || 10,
      inputFormat: q.inputFormat || "",
      outputFormat: q.outputFormat || "",
      constraints: q.constraints || "",
      allowedLanguages: q.allowedLanguages || ["python", "javascript", "cpp", "java", "c"],
      testCases: q.testCases || [],
    })
    setEditModalOpen(true)
  }

  const addTestCase = () => {
    setEditForm({
      ...editForm,
      testCases: [
        ...(editForm.testCases || []),
        { id: `tc_${Date.now()}`, input: "", expectedOutput: "", isHidden: false, weightage: 1 }
      ]
    })
  }

  const updateTestCase = (index: number, field: string, value: any) => {
    const updated = [...(editForm.testCases || [])]
    updated[index] = { ...updated[index], [field]: value }
    setEditForm({ ...editForm, testCases: updated })
  }

  const removeTestCase = (index: number) => {
    const updated = [...(editForm.testCases || [])]
    updated.splice(index, 1)
    setEditForm({ ...editForm, testCases: updated })
  }

  const toggleLanguage = (langKey: string) => {
    const langs = editForm.allowedLanguages || []
    if (langs.includes(langKey)) {
      setEditForm({ ...editForm, allowedLanguages: langs.filter((l: string) => l !== langKey) })
    } else {
      setEditForm({ ...editForm, allowedLanguages: [...langs, langKey] })
    }
  }

  const saveEdit = async () => {
    if (!selected || saving) return
    setSaving(true)
    try {
      const r = await authFetch(
        `${API}/api/admin/questions/${selected.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        },
        true,
      )
      const d = await r.json()
      if (!r.ok) throw Error(d.error || "Unable to update question.")
      setSelected(d.question)
      setEditModalOpen(false)
      setMessage("Question updated successfully.")
      await load(page.page || 1)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to update question.")
    } finally {
      setSaving(false)
    }
  }

  const isCodingValidForActivation = (q: any) => {
    if (q.questionType !== "CODING") return true
    const hasText = Boolean(String(q.questionText || "").trim())
    const hasInput = Boolean(String(q.inputFormat || "").trim())
    const hasOutput = Boolean(String(q.outputFormat || "").trim())
    const hasConstraints = Boolean(String(q.constraints || "").trim())
    const hasMarks = Number(q.marks || 0) > 0
    const testCases = Array.isArray(q.testCases) ? q.testCases : []
    const hasSample = testCases.some((tc) => !tc.isHidden && String(tc.input || "").trim() && String(tc.expectedOutput || "").trim())
    const hasHidden = testCases.some((tc) => tc.isHidden && String(tc.input || "").trim() && String(tc.expectedOutput || "").trim())
    return hasText && hasInput && hasOutput && hasConstraints && hasMarks && hasSample && hasHidden
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                  Flux Suite
                </span>
                <span className="text-xs font-bold text-[#1E3A34]/80">
                  Examination Repository
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
                Question Management
              </h2>
              <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed max-w-xl">
                Manage, import, organize and review examination questions.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2.5 h-11 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-lg shadow-[#176B58]/20 flex-shrink-0 border-none"
              onClick={() => setImportOpen(true)}
            >
              <Icon name="plus" size={18} />
              Import Questions
            </button>
          </div>
        </div>

        {/* KPI Stats Grid matching Overview Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Questions",
              value: stats.total || 0,
              icon: "book",
              badgeBg: "bg-[#176B58]/15 text-[#176B58]",
            },
            {
              label: "Active Questions",
              value: stats.active || 0,
              icon: "check",
              badgeBg: "bg-[#00D084]/20 text-[#057A55]",
            },
            {
              label: "Draft Questions",
              value: stats.draft || 0,
              icon: "review",
              badgeBg: "bg-[#E5A23B]/15 text-[#E5A23B]",
            },
            {
              label: "Question Types",
              value: (stats.byType || []).length,
              icon: "pulse",
              badgeBg: "bg-[#203D39]/15 text-[#203D39]",
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

        {/* Notification Banner */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-3 shadow-md backdrop-blur-xl ${
              notice === "success"
                ? "text-emerald-900 bg-emerald-500/15 border-emerald-300"
                : notice === "warning"
                  ? "text-amber-900 bg-amber-500/15 border-amber-300"
                  : "text-rose-900 bg-rose-500/15 border-rose-300"
            }`}
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black bg-white/80 shrink-0 shadow-xs">
              {notice === "success" ? "✓" : "!"}
            </span>
            <span className="flex-1">{message}</span>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="flex flex-wrap items-center gap-3 bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/80 shadow-[0_8px_30px_-5px_rgba(30,58,52,0.06)]">
          <div className="relative flex-1 min-w-[240px]">
            <input
              placeholder="Search question ID or text..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && void load(1)}
              className="w-full h-11 pl-4 pr-4 text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] placeholder:text-slate-400 outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
          >
            <option value="">All Question Types</option>
            <option value="MCQ">Multiple Choice (MCQ)</option>
            <option value="MSQ">Multiple Select (MSQ)</option>
            <option value="TRUE_FALSE">True / False</option>
            <option value="SHORT_ANSWER">Short Answer</option>
            <option value="CODING">Coding Problem (Round 2)</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DRAFT">Draft</option>
          </select>
          <button
            className="h-11 px-6 text-xs sm:text-sm font-bold rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-md shadow-[#176B58]/20 border-none"
            onClick={() => void load(1)}
          >
            Search
          </button>
        </div>

        {/* Questions Data Table matching Admin Overview Tables */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)]">
          {loading ? (
            <div className="p-14 text-center text-xs sm:text-sm font-bold text-[#057A55]">
              Loading question bank...
            </div>
          ) : error ? (
            <div className="p-14 text-center text-xs sm:text-sm font-bold text-rose-600">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Question Preview</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Difficulty</th>
                    <th className="px-5 py-4">Marks</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#00D084]/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">
                        {row.questionId.slice(-8)}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#1E3A34] max-w-xs truncate">
                        {row.questionText}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-600">{row.questionType}</td>
                      <td className="px-5 py-4 font-semibold text-slate-600">{row.category}</td>
                      <td className="px-5 py-4 font-semibold text-slate-600">{row.difficulty}</td>
                      <td className="px-5 py-4 font-black text-[#1E3A34]">{row.marks}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            row.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                              : row.status === "INACTIVE"
                                ? "bg-rose-100 text-rose-800 border border-rose-300/80"
                                : "bg-amber-100 text-amber-800 border border-amber-300/80"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-500">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          className="px-3.5 py-1.5 rounded-xl bg-[#176B58]/10 text-[#176B58] hover:bg-[#176B58] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none"
                          onClick={() => void view(row)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 px-6 border-t border-slate-100 bg-white/40 text-xs text-[#1E3A34] font-bold">
            <span>Total {page.total || 0} questions</span>
            <div className="flex items-center gap-3">
              <button
                className="h-9 px-4 text-xs font-bold rounded-xl text-[#1E3A34] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                disabled={(page.page || 1) <= 1}
                onClick={() => void load((page.page || 1) - 1)}
              >
                Previous
              </button>
              <span className="font-extrabold">
                Page {page.page || 1} of {page.pages || 1}
              </span>
              <button
                className="h-9 px-4 text-xs font-bold rounded-xl text-[#1E3A34] bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto">
            <div className="relative w-full max-w-[700px] max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
              <button
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer border-none z-10"
                onClick={() => setSelected(null)}
              >
                ×
              </button>

              <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1 flex flex-col gap-5 text-xs sm:text-sm pt-8">
                <h2 className="text-2xl font-black text-[#1E3A34] leading-tight m-0">
                  Question Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/60">
                  <span className="flex flex-col text-xs">
                    <b className="font-black text-[#057A55] uppercase tracking-wider text-[10px] mb-0.5">
                      Question ID
                    </b>
                    <span className="font-mono text-[#1E3A34] font-bold truncate">
                      {selected.questionId}
                    </span>
                  </span>
                  <span className="flex flex-col text-xs">
                    <b className="font-black text-[#057A55] uppercase tracking-wider text-[10px] mb-0.5">
                      Status
                    </b>
                    <span className="font-extrabold text-[#1E3A34]">
                      {selected.status}
                    </span>
                  </span>
                  <span className="flex flex-col text-xs">
                    <b className="font-black text-[#057A55] uppercase tracking-wider text-[10px] mb-0.5">
                      Created Date
                    </b>
                    <span className="text-[#1E3A34] font-bold">
                      {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}
                    </span>
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1E3A34] m-0">
                    {selected.questionTitle || selected.questionText}
                  </h3>
                  <p className="text-xs font-bold text-[#057A55] m-0">
                    {selected.questionType} · {selected.category || selected.sectionName || "General"} · {selected.difficulty} · {selected.marks} marks
                  </p>
                </div>

                {selected.questionType === "CODING" ? (
                  <div className="space-y-4">
                    {/* Problem Description & Details */}
                    <div className="p-4 rounded-2xl bg-[#F6F2E6] border border-[#E2DBD0] space-y-2">
                      <b className="block font-black text-[#1E3A34] text-xs uppercase tracking-wider">Problem Description &amp; Details</b>
                      <p className="text-slate-800 font-medium m-0 leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                        {selected.explanation || selected.problemDescription || selected.questionText}
                      </p>
                    </div>

                    {/* Input/Output Formats & Constraints */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                        <b className="block font-black text-[#057A55] text-[10px] uppercase">Input Format</b>
                        <p className="font-medium text-slate-700 m-0 text-xs">{selected.inputFormat || "Standard Input"}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                        <b className="block font-black text-[#057A55] text-[10px] uppercase">Output Format</b>
                        <p className="font-medium text-slate-700 m-0 text-xs">{selected.outputFormat || "Standard Output"}</p>
                      </div>
                    </div>

                    {selected.constraints && (
                      <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 space-y-1">
                        <b className="block font-black text-amber-800 text-[10px] uppercase">Constraints</b>
                        <code className="font-mono text-xs font-bold text-amber-900">{selected.constraints}</code>
                      </div>
                    )}

                    {/* Sample Input & Expected Output */}
                    {(selected.sampleInput || selected.sampleOutput) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                        <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 space-y-1">
                          <b className="block font-sans font-black text-slate-400 text-[10px] uppercase">Sample Input</b>
                          <pre className="m-0 font-mono text-emerald-400">{selected.sampleInput || "(empty)"}</pre>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 space-y-1">
                          <b className="block font-sans font-black text-slate-400 text-[10px] uppercase">Expected Output</b>
                          <pre className="m-0 font-mono text-emerald-400">{selected.sampleOutput || "(empty)"}</pre>
                        </div>
                      </div>
                    )}

                    {/* Configured Test Cases */}
                    <div className="space-y-2">
                      <b className="block font-black text-[#1E3A34] text-xs uppercase tracking-wider">
                        Test Cases ({(selected.testCases || []).length})
                      </b>
                      {(selected.testCases || []).map((tc: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1 text-xs font-mono">
                          <div className="flex items-center justify-between font-sans">
                            <span className="font-extrabold text-[#1E3A34]">Test Case #{idx + 1}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${tc.isHidden ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                              {tc.isHidden ? "Hidden Test Case" : "Public Sample"}
                            </span>
                          </div>
                          <div><span className="text-slate-400 font-sans">Input:</span> {tc.input}</div>
                          <div><span className="text-slate-400 font-sans">Expected:</span> {tc.expectedOutput}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-2.5">
                      {["A", "B", "C", "D"].map((id) => {
                        const option = (selected.options || []).find((o: any) => o.id === id)
                        const isCorrect =
                          selected.correctOptionId === id ||
                          selected.correctOptionIds?.includes(id)
                        return (
                          <div
                            key={id}
                            className={`flex items-start gap-3 p-3.5 rounded-2xl border text-xs sm:text-sm transition-all ${
                              isCorrect
                                ? "bg-emerald-100/60 border-emerald-400/80 text-emerald-950 font-bold"
                                : "bg-slate-50 border-slate-200/80 text-slate-800"
                            }`}
                          >
                            <b className="flex items-center justify-center w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-black shrink-0 shadow-2xs">
                              {id}
                            </b>
                            <span className="flex-1 font-semibold mt-1">{option?.text || "—"}</span>
                            {isCorrect && (
                              <em className="not-italic text-[10px] font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                                Correct Choice
                              </em>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {selected.explanation && (
                      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs sm:text-sm text-blue-950">
                        <b className="block font-black text-blue-900 mb-1">Explanation</b>
                        <p className="text-blue-800 font-medium m-0">{selected.explanation}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
                <button
                  className="h-10 px-5 text-xs sm:text-sm font-bold rounded-2xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
                {selected.status !== "PUBLISHED" && selected.questionType === "CODING" && (selected.status === "DRAFT" || selected.status === "INACTIVE") && (
                  <button
                    className="h-10 px-5 text-xs sm:text-sm font-bold rounded-2xl text-[#1E3A34] bg-emerald-100 hover:bg-emerald-200 transition-all cursor-pointer shadow-xs border border-emerald-300"
                    onClick={() => startEdit(selected)}
                  >
                    Edit Question
                  </button>
                )}
                {selected.status !== "PUBLISHED" && (
                  <button
                    className={`h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white transition-all cursor-pointer shadow-md disabled:opacity-50 border-none ${
                      selected.status === "ACTIVE"
                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                        : "bg-[#176B58] hover:bg-[#125445] shadow-[#176B58]/20"
                    }`}
                    disabled={saving || (selected.status !== "ACTIVE" && selected.questionType === "CODING" && !isCodingValidForActivation(selected))}
                    title={selected.status !== "ACTIVE" && selected.questionType === "CODING" && !isCodingValidForActivation(selected) ? "Activation requires a complete problem description, input/output specifications, constraints, at least one sample test case, and at least one hidden test case." : ""}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto">
            <div className="relative w-full max-w-[500px] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
              <div className="p-6 sm:p-8 flex flex-col gap-3 text-xs sm:text-sm pt-8">
                <h2 className="text-xl font-black text-[#1E3A34] m-0">
                  {confirmAction === "ACTIVE" ? "Activate Question" : "Deactivate Question"}
                </h2>
                <p className="text-slate-600 font-medium leading-relaxed m-0">
                  {confirmAction === "ACTIVE"
                    ? "Are you sure you want to activate this question? Once activated, it will become available for selection in new examination papers."
                    : "Are you sure you want to deactivate this question? It will no longer be available for selection in new examination papers."}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
                <button
                  className="h-10 px-5 text-xs sm:text-sm font-bold rounded-2xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm"
                  disabled={saving}
                  onClick={() => setConfirmAction(null)}
                >
                  Cancel
                </button>
                <button
                  className={`h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white transition-all cursor-pointer shadow-md disabled:opacity-50 border-none ${
                    confirmAction === "ACTIVE"
                      ? "bg-[#176B58] hover:bg-[#125445] shadow-[#176B58]/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto">
            <div className="relative w-full max-w-[720px] max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
              <button
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer border-none z-10"
                onClick={() => setImportOpen(false)}
              >
                ×
              </button>

              <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1 flex flex-col gap-5 text-xs sm:text-sm pt-8">
                <h2 className="text-2xl font-black text-[#1E3A34] m-0">Import Questions</h2>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="text-xs font-extrabold text-[#176B58] hover:underline cursor-pointer bg-transparent border-none p-0"
                    onClick={() => void download("pdf")}
                  >
                    📥 Download PDF Template
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    className="text-xs font-extrabold text-[#176B58] hover:underline cursor-pointer bg-transparent border-none p-0"
                    onClick={() => void download("csv")}
                  >
                    📥 Download CSV Template
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    className="text-xs font-extrabold text-[#176B58] hover:underline cursor-pointer bg-transparent border-none p-0"
                    onClick={() => void download("xlsx")}
                  >
                    📥 Download XLSX Template
                  </button>
                </div>

                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#00D084]/40 hover:border-[#00D084] rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/70 text-[#1E3A34] font-bold cursor-pointer transition-all text-xs sm:text-sm text-center">
                  <span className="text-2xl mb-2">📄</span>
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
                  <p className="text-xs font-extrabold text-[#057A55] animate-pulse text-center m-0">
                    Processing question template file...
                  </p>
                )}

                {preview && (
                  <>
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 text-xs font-extrabold text-[#1E3A34]">
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
                          className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 flex flex-col gap-1 text-xs"
                          key={`${r.rowNumber}-${r.questionText}`}
                        >
                          <b className="font-extrabold text-[#1E3A34]">Row {r.rowNumber}</b>
                          <strong className="font-semibold text-slate-800">{r.questionText}</strong>
                          <span className="text-[#057A55] font-bold">
                            {r.result || r.errors?.join("; ") || "Valid"}
                          </span>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
                <button
                  className="h-10 px-5 text-xs sm:text-sm font-bold rounded-2xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm"
                  onClick={() => setImportOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] shadow-md shadow-[#176B58]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer border-none"
                  disabled={processing || !preview?.valid?.length}
                  onClick={() => void confirmImport()}
                >
                  Confirm Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Question Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto">
            <div className="relative w-full max-w-[760px] max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
              <button
                className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer border-none z-10"
                onClick={() => setEditModalOpen(false)}
              >
                ×
              </button>

              <div className="p-6 sm:p-8 pb-24 overflow-y-auto min-h-0 flex-1 flex flex-col gap-5 text-xs sm:text-sm pt-8">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#057A55]">Question Editor</span>
                  <h2 className="text-2xl font-black text-[#1E3A34] m-0 leading-tight">Edit Coding Question</h2>
                </div>

                <div className="space-y-4">
                  {/* Problem Title */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#057A55] mb-1">Problem Title</label>
                    <input
                      value={editForm.questionTitle || ""}
                      onChange={(e) => setEditForm({ ...editForm, questionTitle: e.target.value })}
                      placeholder="e.g. Sum of Array Elements"
                      className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-[#1E3A34] outline-none focus:border-[#00D084]"
                    />
                  </div>

                  {/* Problem Description */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#057A55] mb-1">Problem Description / Statement</label>
                    <textarea
                      rows={4}
                      value={editForm.explanation || ""}
                      onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value, questionText: e.target.value })}
                      placeholder="Detailed problem description..."
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-[#1E3A34] outline-none focus:border-[#00D084] leading-relaxed"
                    />
                  </div>

                  {/* Input Format, Output Format, Constraints, Marks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase text-[#057A55] mb-1">Input Format</label>
                      <input
                        value={editForm.inputFormat || ""}
                        onChange={(e) => setEditForm({ ...editForm, inputFormat: e.target.value })}
                        placeholder="e.g. N integers"
                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-[#1E3A34] outline-none focus:border-[#00D084]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-[#057A55] mb-1">Output Format</label>
                      <input
                        value={editForm.outputFormat || ""}
                        onChange={(e) => setEditForm({ ...editForm, outputFormat: e.target.value })}
                        placeholder="e.g. Integer sum"
                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-[#1E3A34] outline-none focus:border-[#00D084]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-black uppercase text-[#057A55] mb-1">Constraints</label>
                      <input
                        value={editForm.constraints || ""}
                        onChange={(e) => setEditForm({ ...editForm, constraints: e.target.value })}
                        placeholder="e.g. 1 <= N <= 100000"
                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-[#1E3A34] outline-none focus:border-[#00D084]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-[#057A55] mb-1">Marks</label>
                      <input
                        type="number"
                        value={editForm.marks || 10}
                        onChange={(e) => setEditForm({ ...editForm, marks: Number(e.target.value) })}
                        className="w-full h-11 px-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-[#1E3A34] outline-none focus:border-[#00D084]"
                      />
                    </div>
                  </div>

                  {/* Supported Programming Languages */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#057A55] mb-2">Supported Programming Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: "python", label: "Python 3" },
                        { key: "javascript", label: "JavaScript (Node.js)" },
                        { key: "java", label: "Java" },
                        { key: "cpp", label: "C++" },
                        { key: "c", label: "C" },
                      ].map((lang) => {
                        const selectedLangs = editForm.allowedLanguages || []
                        const isSelected = selectedLangs.includes(lang.key)
                        return (
                          <button
                            key={lang.key}
                            type="button"
                            onClick={() => toggleLanguage(lang.key)}
                            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-[#176B58] text-white border-[#176B58] shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}{lang.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Test Cases Management (Sample & Hidden) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-[#057A55]">
                        Test Cases ({(editForm.testCases || []).length})
                      </label>
                      <button
                        type="button"
                        onClick={addTestCase}
                        className="h-8 px-3 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-all cursor-pointer border border-emerald-300"
                      >
                        + Add Test Case
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(editForm.testCases || []).map((tc: any, index: number) => (
                        <div key={tc.id || index} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-black text-xs text-[#1E3A34]">Test Case #{index + 1}</span>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!Boolean(tc.isHidden)}
                                  onChange={(e) => updateTestCase(index, "isHidden", !e.target.checked)}
                                  className="rounded text-[#176B58] focus:ring-0 cursor-pointer"
                                />
                                <span className={!tc.isHidden ? "text-emerald-800 font-black" : "text-amber-800 font-bold"}>
                                  {!tc.isHidden ? "Sample Test Case (Visible to Students)" : "Hidden Test Case (Evaluated Secretly)"}
                                </span>
                              </label>
                              <button
                                type="button"
                                onClick={() => removeTestCase(index)}
                                className="h-7 px-2.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                            <div>
                              <span className="block font-sans font-bold text-slate-500 text-[10px] uppercase mb-1">Input</span>
                              <textarea
                                rows={2}
                                value={tc.input || ""}
                                onChange={(e) => updateTestCase(index, "input", e.target.value)}
                                placeholder="Test input..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#1E3A34] outline-none focus:border-[#00D084]"
                              />
                            </div>
                            <div>
                              <span className="block font-sans font-bold text-slate-500 text-[10px] uppercase mb-1">Expected Output</span>
                              <textarea
                                rows={2}
                                value={tc.expectedOutput || ""}
                                onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                                placeholder="Expected output..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-[#1E3A34] outline-none focus:border-[#00D084]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
                <button
                  type="button"
                  className="h-10 px-5 text-xs sm:text-sm font-bold rounded-2xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer shadow-sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] shadow-md shadow-[#176B58]/20 disabled:opacity-50 cursor-pointer border-none"
                  disabled={saving}
                  onClick={() => void saveEdit()}
                >
                  {saving ? "Saving..." : "Save Question Edits"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
