import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

const API = API_BASE_URL
type Notice = { type: "success" | "error" | "warning"; text: string }
const emptyForm = {
  name: "",
  examId: "",
  description: "",
  durationMinutes: "",
  totalMarks: "",
  passingMarks: "",
  instructions: "",
  questionIds: [] as string[],
}

export function PaperSetsPage({
  Icon,
  PageHead,
  active = "Paper sets",
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
  const [sets, setSets] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [exams, setExams] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: "",
    examId: "",
    status: "",
  })
  const [questionFilters, setQuestionFilters] = useState({
    search: "",
    category: "",
    difficulty: "",
  })
  const [form, setForm] = useState<any>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [publishTarget, setPublishTarget] = useState<any>(null)
  const [viewTarget, setViewTarget] = useState<any>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<Notice | null>(null)
  const [examError, setExamError] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const load = async () => {
    setLoading(true)
    try {
      const [p, e, q] = await Promise.all([
        authFetch(
          `${API}/api/admin/paper-sets?${new URLSearchParams(filters)}`,
          {},
          true,
        ),
        authFetch(`${API}/api/admin/exams`, {}, true),
        authFetch(`${API}/api/admin/paper-sets/questions/eligible`, {}, true),
      ])
      const pd = await p.json()
      const ed = await e.json()
      const qd = await q.json()

      if (!p.ok) throw new Error(pd.error || "Unable to load paper sets.")
      setSets(pd.paperSets || [])
      setStats(pd.stats || {})

      if (!e.ok) setExamError(ed.error || "Unable to load examinations.")
      else {
        setExamError("")
        setExams(ed.exams || [])
      }

      if (!q.ok) throw new Error(qd.error || "Unable to load active questions.")
      setQuestions(qd.questions || [])
    } catch (cause) {
      setMessage({
        type: "error",
        text:
          cause instanceof Error ? cause.message : "Unable to load paper sets.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [filters.examId, filters.status])

  const selectedQuestions = useMemo(() => {
    const selected = new Set((form.questionIds || []).map(String))
    return questions.filter((q) =>
      selected.has(String(q.id || q._id || q.questionId)),
    )
  }, [questions, form.questionIds])

  const calculatedMarks = selectedQuestions.reduce((sum, q) => {
    const marks = Number(q.marks ?? q.mark ?? q.totalMarks ?? 0)
    return sum + (Number.isFinite(marks) && marks > 0 ? marks : 0)
  }, 0)

  const visibleQuestions = questions.filter(
    (q) =>
      (!questionFilters.search ||
        `${q.questionId} ${q.questionText}`
          .toLowerCase()
          .includes(questionFilters.search.toLowerCase())) &&
      (!questionFilters.category || q.category === questionFilters.category) &&
      (!questionFilters.difficulty ||
        q.difficulty === questionFilters.difficulty),
  )

  const categories = [
    ...new Set(questions.map((q) => q.category).filter(Boolean)),
  ]

  const updateForm = (key: string, value: any) => {
    setForm((current: any) => ({ ...current, [key]: value }))
    setErrors((current) => ({
      ...current,
      [key]:
        key === "passingMarks" && Number(value) <= 0
          ? "Passing marks must be greater than zero."
          : key === "passingMarks" && Number(value) > calculatedMarks
            ? "Passing marks cannot exceed total selected marks."
            : "",
    }))
  }

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm, questionIds: [] })
    setErrors({})
    setMessage(null)
    setOpen(true)
  }

  const openView = async (id: string) => {
    setViewLoading(true)
    setViewError("")
    setViewTarget({ id })
    try {
      const response = await authFetch(
        `${API}/api/admin/paper-sets/${id}`,
        {},
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to load paper set details.")
      setViewTarget(data.paperSet)
    } catch (cause) {
      setViewError(
        cause instanceof Error
          ? cause.message
          : "Unable to load paper set details.",
      )
    } finally {
      setViewLoading(false)
    }
  }

  const openEdit = async (id: string) => {
    try {
      const response = await authFetch(
        `${API}/api/admin/paper-sets/${id}`,
        {},
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to load paper set.")
      const set = data.paperSet
      setEditingId(id)
      setForm({
        name: set.name || set.code || "",
        examId: String(set.examId?._id || set.examId || ""),
        description: set.description || "",
        durationMinutes: set.durationMinutes ?? "",
        passingMarks: set.passingMarks ?? "",
        instructions: Array.isArray(set.instructions)
          ? set.instructions.join("\n")
          : set.instructions || "",
        questionIds: (set.questionIds || []).map((q: any) =>
          String(q._id || q.id || q),
        ),
      })
      setErrors({})
      setOpen(true)
    } catch (cause) {
      setMessage({
        type: "error",
        text:
          cause instanceof Error ? cause.message : "Unable to load paper set.",
      })
    }
  }

  const selectExam = (examId: string) => {
    updateForm("examId", examId)
    const exam = exams.find((e) => String(e.id || e._id) === examId)
    if (exam && !editingId)
      updateForm("durationMinutes", exam.durationMinutes ?? "")
  }

  const save = async () => {
    if (saving) return
    const next: Record<string, string> = {}
    const name = String(form.name || "").trim()

    if (!name) next.name = "Paper set name is required."
    if (!form.examId) next.examId = "Select an examination."
    if (!Number(form.durationMinutes) || Number(form.durationMinutes) <= 0)
      next.durationMinutes = "Duration must be greater than zero."
    if (!Number(form.passingMarks) || Number(form.passingMarks) <= 0)
      next.passingMarks = "Passing marks must be greater than zero."
    const configuredMarks = Number(form.totalMarks || 0)
    if (Number(form.passingMarks) > configuredMarks)
      next.passingMarks = "Passing marks cannot exceed total marks."

    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      const response = await authFetch(
        `${API}/api/admin/paper-sets${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            name,
            totalMarks: configuredMarks,
            instructions: form.instructions ? [form.instructions] : [],
            questionIds: form.questionIds,
          }),
        },
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to save paper set.")
      setMessage({
        type: "success",
        text: editingId ? "Paper set updated." : "Paper set saved as draft.",
      })
      setOpen(false)
      await load()
    } catch (cause) {
      setMessage({
        type: "error",
        text:
          cause instanceof Error ? cause.message : "Unable to save paper set.",
      })
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    if (!publishTarget || publishing) return
    setPublishing(true)
    try {
      const validation = await authFetch(
        `${API}/api/admin/paper-sets/${publishTarget.id}/validate`,
        { method: "POST" },
        true,
      )
      const validationData = await validation.json()
      if (!validation.ok || validationData.valid === false)
        throw new Error(
          validationData.errors?.join(" ") ||
            validationData.error ||
            "Paper set validation failed.",
        )
      const response = await authFetch(
        `${API}/api/admin/paper-sets/${publishTarget.id}/publish`,
        { method: "POST" },
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to publish paper set.")
      setPublishTarget(null)
      setMessage({ type: "success", text: "Paper set published." })
      await load()
    } catch (cause) {
      setMessage({
        type: "error",
        text:
          cause instanceof Error
            ? cause.message
            : "Unable to publish paper set.",
      })
    } finally {
      setPublishing(false)
    }
  }

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
                  Paper Set Management
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
                Paper Sets
              </h1>
              <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed max-w-xl">
                Manage examination papers using active Question Bank records and automated validations.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2.5 h-11 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-lg shadow-[#176B58]/20 flex-shrink-0 border-none"
              onClick={openCreate}
            >
              <Icon name="plus" size={18} />
              Create Paper Set
            </button>
          </div>
        </div>

        {/* KPI Stats Grid matching Overview Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Paper Sets",
              value: stats.total || 0,
              icon: "file",
              badgeBg: "bg-[#176B58]/15 text-[#176B58]",
            },
            {
              label: "Draft Paper Sets",
              value: stats.draft || 0,
              icon: "review",
              badgeBg: "bg-[#E5A23B]/15 text-[#E5A23B]",
            },
            {
              label: "Published Paper Sets",
              value: stats.published || 0,
              icon: "check",
              badgeBg: "bg-[#00D084]/20 text-[#057A55]",
            },
            {
              label: "Total Questions",
              value: stats.questions || 0,
              icon: "book",
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

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm font-extrabold flex items-center gap-3 shadow-md backdrop-blur-xl ${
              message.type === "success"
                ? "text-emerald-900 bg-emerald-500/15 border-emerald-300"
                : message.type === "warning"
                  ? "text-amber-900 bg-amber-500/15 border-amber-300"
                  : "text-rose-900 bg-rose-500/15 border-rose-300"
            }`}
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black bg-white/80 shrink-0 shadow-xs">
              {message.type === "success" ? "✓" : "!"}
            </span>
            <span className="flex-1">{message.text}</span>
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="flex flex-wrap items-center gap-3 bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/80 shadow-[0_8px_30px_-5px_rgba(30,58,52,0.06)]">
          <div className="relative flex-1 min-w-[240px]">
            <input
              placeholder="Search paper set name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              className="w-full h-11 pl-4 pr-4 text-xs sm:text-sm font-medium bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] placeholder:text-slate-400 outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm"
            />
          </div>
          <select
            value={filters.examId}
            onChange={(e) => setFilters({ ...filters, examId: e.target.value })}
            className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
          >
            <option value="">All Examinations</option>
            {exams.map((exam) => (
              <option key={exam.id || exam._id} value={exam.id || exam._id}>
                {exam.title || exam.name}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="h-11 px-4 text-xs sm:text-sm font-extrabold bg-white/90 border border-slate-200/80 rounded-2xl text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <button
            className="h-11 px-6 text-xs sm:text-sm font-bold rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-md shadow-[#176B58]/20 border-none"
            onClick={() => void load()}
          >
            Search
          </button>
        </div>

        {/* Exam Error Alert */}
        {examError && (
          <div className="p-4 text-xs sm:text-sm font-extrabold rounded-2xl border border-rose-300 bg-rose-500/15 text-rose-900 flex items-center justify-between gap-3 shadow-md backdrop-blur-xl">
            <span>{examError}</span>
            <button
              className="h-8 px-4 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer border-none shadow-xs"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Container / Empty State */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)]">
          {loading ? (
            <div className="p-14 text-center text-xs sm:text-sm font-bold text-[#057A55]">
              Loading paper sets...
            </div>
          ) : sets.length === 0 ? (
            <div className="py-16 text-center text-xs sm:text-sm text-[#057A55] flex flex-col items-center gap-3">
              <h3 className="text-lg font-black text-[#1E3A34]">No paper sets created yet</h3>
              <p className="text-[#057A55] font-bold max-w-sm">Create a paper set to begin assigning active questions.</p>
              <button
                className="inline-flex items-center justify-center gap-2.5 h-11 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-lg shadow-[#176B58]/20 border-none mt-2"
                onClick={openCreate}
              >
                <Icon name="plus" size={18} />
                Create Paper Set
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Examination</th>
                    <th className="px-5 py-4">Questions</th>
                    <th className="px-5 py-4">Marks</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {sets.map((set) => (
                    <tr key={set.id} className="hover:bg-[#00D084]/5 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-slate-500">{set.code}</td>
                      <td className="px-5 py-4 font-bold text-[#1E3A34]">{set.name || set.code}</td>
                      <td className="px-5 py-4 font-semibold text-slate-600">{set.exam?.title || "—"}</td>
                      <td className="px-5 py-4 font-bold text-[#1E3A34]">{set.questionCount}</td>
                      <td className="px-5 py-4 font-black text-[#1E3A34]">{set.totalMarks}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            set.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                              : "bg-amber-100 text-amber-800 border border-amber-300/80"
                          }`}
                        >
                          {set.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-500">
                        {set.createdAt
                          ? new Date(set.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        <button
                          className="px-3.5 py-1.5 rounded-xl bg-[#176B58]/10 text-[#176B58] hover:bg-[#176B58] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none"
                          onClick={() =>
                            set.status === "DRAFT"
                              ? void openEdit(set.id)
                            : void openView(set.id)
                        }
                      >
                        {set.status === "DRAFT" ? "Edit" : "View"}
                      </button>
                      {set.status === "DRAFT" && (
                        <button
                          className="px-3.5 py-1.5 rounded-xl bg-[#00D084]/20 text-[#057A55] hover:bg-[#00D084] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none"
                          onClick={() => setPublishTarget(set)}
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Paper Set Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-[95%] sm:w-[90%] max-w-[1100px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            <div className="flex-none flex items-center justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit Paper Set" : "Create Paper Set"}
              </h2>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto min-h-0 flex-1 text-xs sm:text-sm space-y-6">
              <div className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                Paper Set Name
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
                {errors.name && (
                  <small className="text-xs font-medium text-red-600 mt-1 block">{errors.name}</small>
                )}
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                Examination
                <select
                  value={form.examId}
                  onChange={(e) => selectExam(e.target.value)}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                >
                  <option value="">
                    {examError
                      ? "Unable to load examinations"
                      : exams.length
                        ? "Select examination"
                        : "No examinations available. Create an examination first."}
                  </option>
                  {exams.map((exam) => (
                    <option
                      key={exam.id || exam._id}
                      value={exam.id || exam._id}
                    >
                      {exam.title || exam.name}
                    </option>
                  ))}
                </select>
                {errors.examId && (
                  <small className="text-xs font-medium text-red-600 mt-1 block">{errors.examId}</small>
                )}
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                Description
                <textarea
                  value={form.description}
                  rows={2}
                  onChange={(e) => updateForm("description", e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm resize-y"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
                <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                  Duration (minutes)
                  <input
                    type="number"
                    readOnly
                    min="1"
                    value={form.durationMinutes}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed shadow-sm"
                  />
                  {errors.durationMinutes && (
                    <small className="text-xs font-medium text-red-600 mt-1 block">
                      {errors.durationMinutes}
                    </small>
                  )}
                </label>
                <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                  Total Marks
                  <input
                    type="number"
                    min="1"
                    value={form.totalMarks}
                    onChange={(e) => updateForm("totalMarks", e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </label>
                <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                  Passing Marks
                  <input
                    type="number"
                    min="1"
                    value={form.passingMarks}
                    onChange={(e) => updateForm("passingMarks", e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                  />
                  {errors.passingMarks && (
                    <small className="text-xs font-medium text-red-600 mt-1 block">{errors.passingMarks}</small>
                  )}
                </label>
              </div>

              <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                Instructions
                <textarea
                  value={form.instructions}
                  rows={2}
                  onChange={(e) => updateForm("instructions", e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm resize-y"
                />
              </label>

                </div>

              {/* Question Selection & Marks Allocation Section */}
              <div className="flex flex-col gap-3.5 border-t border-[#F0EBE1] pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#1E3A34] m-0">Question Selection &amp; Marks Allocation</h3>
                    <p className="text-xs text-[#057A55] font-bold m-0 mt-0.5">
                      Select active coding/MCQ questions to include in this paper set.
                    </p>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#176B58]/15 text-[#176B58] text-xs font-black self-start sm:self-auto">
                    {form.questionIds.length} Questions Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/60 p-3.5 rounded-2xl border border-white">
                  <input
                    placeholder="Search question title or text..."
                    value={questionFilters.search}
                    onChange={(e) =>
                      setQuestionFilters({
                        ...questionFilters,
                        search: e.target.value,
                      })
                    }
                    className="h-10 px-3.5 text-xs bg-white border border-[#E2DBD0] rounded-xl text-[#1E3A34] outline-none focus:border-[#00D084]"
                  />
                  <select
                    value={questionFilters.category}
                    onChange={(e) =>
                      setQuestionFilters({
                        ...questionFilters,
                        category: e.target.value,
                      })
                    }
                    className="h-10 px-3.5 text-xs font-extrabold bg-white border border-[#E2DBD0] rounded-xl text-[#1E3A34] outline-none focus:border-[#00D084] cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                  <select
                    value={questionFilters.difficulty}
                    onChange={(e) =>
                      setQuestionFilters({
                        ...questionFilters,
                        difficulty: e.target.value,
                      })
                    }
                    className="h-10 px-3.5 text-xs font-extrabold bg-white border border-[#E2DBD0] rounded-xl text-[#1E3A34] outline-none focus:border-[#00D084] cursor-pointer"
                  >
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                {errors.questionIds && (
                  <small className="text-xs font-bold text-rose-600 block">{errors.questionIds}</small>
                )}

                <div className="min-h-[200px] max-h-[42vh] overflow-y-auto p-3 flex flex-col gap-2.5 rounded-2xl border border-[#E2DBD0] bg-white/60">
                  {visibleQuestions.map((q) => (
                    <label
                      key={q.id}
                      className={`group flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        form.questionIds.includes(q.id)
                          ? "bg-emerald-50/90 border-[#00D084]"
                          : "bg-white/90 border-slate-200/80 hover:border-[#00D084]/60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.questionIds.includes(q.id)}
                        onChange={(e) => {
                          const nextIds = e.target.checked
                            ? [...new Set([...form.questionIds, q.id])]
                            : form.questionIds.filter((id: string) => id !== q.id)
                          updateForm("questionIds", nextIds)
                        }}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#057A55] focus:ring-[#00D084] cursor-pointer shrink-0"
                      />
                      <span className="flex-1 min-w-0 flex flex-col gap-1 text-xs">
                        <span className="font-extrabold text-[#1E3A34] text-xs sm:text-sm">
                          {q.questionTitle || q.questionText}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-[#176B58]/15 text-[#176B58]">
                            {q.questionType || "MCQ"}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {q.sectionName || q.category || "General"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              q.difficulty === "EASY"
                                ? "bg-emerald-100 text-emerald-800"
                                : q.difficulty === "MEDIUM"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {q.difficulty || "EASY"}
                          </span>
                          <span className="font-black text-[#1E3A34]">
                            {q.marks || 10} Marks
                          </span>
                        </div>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-none flex flex-wrap items-center justify-between gap-3 p-4 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs font-semibold text-slate-600">Automatic allocation · {form.totalMarks || 0} total marks</span>
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-md shadow-[#176B58]/20 disabled:opacity-50 border-none"
                disabled={saving || !exams.length}
                onClick={() => void save()}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Paper Set Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div
            className="relative w-full max-w-[760px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paper-set-view-title"
          >
            <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 id="paper-set-view-title" className="text-xl font-bold text-slate-900">Paper Set Details</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Read-only published paper set information.</p>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
                onClick={() => !viewLoading && setViewTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm">
              {viewLoading ? (
                <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500">
                  Loading paper set details...
                </div>
              ) : viewError ? (
                <div className="p-3.5 px-4 text-xs sm:text-sm font-semibold rounded-xl border border-red-200/80 bg-red-50 text-red-800 flex items-center justify-between gap-2 shadow-sm">
                  <span>{viewError}</span>
                  <button
                    className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer bg-transparent border-none p-0"
                    onClick={() => void openView(viewTarget.id)}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="flex flex-col rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden bg-slate-50/50 text-xs sm:text-sm mb-2"
                    role="table"
                    aria-label="Paper set details"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Paper Set ID</div>
                      <div className="font-mono text-slate-900" role="cell">{viewTarget.code || viewTarget.id}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Paper Set Name</div>
                      <div className="font-semibold text-slate-900" role="cell">
                        {viewTarget.name || viewTarget.code || "—"}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Linked Examination</div>
                      <div className="font-medium text-slate-900" role="cell">{viewTarget.examId?.title || "—"}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Examination Code</div>
                      <div className="font-mono text-slate-900" role="cell">{viewTarget.examId?.code || "—"}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Description</div>
                      <div className="font-medium text-slate-900" role="cell">{viewTarget.description || "—"}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Duration</div>
                      <div className="font-medium text-slate-900" role="cell">
                        {viewTarget.durationMinutes ?? "—"} minutes
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Total Questions</div>
                      <div className="font-medium text-slate-900" role="cell">
                        {viewTarget.questionIds?.length ?? 0}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Total Marks</div>
                      <div className="font-medium text-slate-900" role="cell">
                        {viewTarget.totalMarks ??
                          viewTarget.blueprint?.maximumMarks ??
                          0}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Passing Marks</div>
                      <div className="font-medium text-slate-900" role="cell">{viewTarget.passingMarks ?? 0}</div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Instructions</div>
                      <div className="font-medium text-slate-900" role="cell">
                        {Array.isArray(viewTarget.instructions) &&
                        viewTarget.instructions.length
                          ? viewTarget.instructions.join(" ")
                          : "—"}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Current Status</div>
                      <div role="cell">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                          {viewTarget.status || "PUBLISHED"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                      <div className="font-semibold text-slate-500" role="cell">Created Date</div>
                      <div className="font-medium text-slate-900" role="cell">
                        {viewTarget.createdAt
                          ? new Date(viewTarget.createdAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2 mb-1">Questions</h3>
                  {viewTarget.questionIds?.length ? (
                    <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                      {viewTarget.questionIds.map(
                        (question: any, index: number) => (
                          <article
                            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-1.5 text-xs sm:text-sm"
                            key={String(question._id || question.id || index)}
                          >
                            <strong className="font-bold text-slate-900">Question {index + 1}</strong>
                            <p className="font-medium text-slate-800">
                              {question.questionText ||
                                "Question content unavailable."}
                            </p>
                            <small className="text-xs font-semibold text-slate-500">
                              {question.questionType || "MCQ"} ·{" "}
                              {question.sectionName ||
                                question.sectionId ||
                                "Uncategorized"}{" "}
                              · {question.difficulty || "Not configured"} ·{" "}
                              {Number(question.marks || 0)} marks
                            </small>
                            {question.options?.length ? (
                              <ul className="list-disc list-inside text-slate-600 pl-1 mt-1 space-y-0.5">
                                {question.options.map((option: any) => (
                                  <li key={option.id || option.text}>
                                    {option.text}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </article>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs sm:text-sm font-medium text-slate-500 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      No questions assigned to this paper set.
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
                onClick={() => setViewTarget(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Paper Set Modal */}
      {publishTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div
            className="relative w-full max-w-[560px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-title"
          >
            <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 id="publish-title" className="text-lg sm:text-xl font-bold text-slate-900">
                  Publish Paper Set?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Review the paper set before making it available for new examinations.
                </p>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
                onClick={() => !publishing && setPublishTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:px-7 sm:py-6 overflow-y-auto flex flex-col gap-3 text-xs sm:text-sm min-h-0 flex-1">
              <div
                className="flex flex-col rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden bg-slate-50/50 text-xs sm:text-sm"
                role="table"
                aria-label="Paper set publication summary"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                  <div className="font-semibold text-slate-500" role="cell">Paper Set Name</div>
                  <div className="font-semibold text-slate-900" role="cell">
                    {publishTarget.name || publishTarget.code}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                  <div className="font-semibold text-slate-500" role="cell">Linked Examination</div>
                  <div className="font-medium text-slate-900" role="cell">
                    {publishTarget.exam?.code ||
                      publishTarget.exam?.title ||
                      "—"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                  <div className="font-semibold text-slate-500" role="cell">Total Questions</div>
                  <div className="font-medium text-slate-900" role="cell">{publishTarget.questionCount ?? 0}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                  <div className="font-semibold text-slate-500" role="cell">Total Marks</div>
                  <div className="font-medium text-slate-900" role="cell">{publishTarget.totalMarks ?? 0}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                  <div className="font-semibold text-slate-500" role="cell">Current Status</div>
                  <div role="cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {publishTarget.status || "DRAFT"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white" role="row">
                  <div className="font-semibold text-slate-500" role="cell">New Status</div>
                  <div role="cell">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                      PUBLISHED
                    </span>
                  </div>
                </div>
              </div>
              <p className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-medium mt-1">
                Publishing will run the existing server-side validation before changing the status.
              </p>
            </div>

            <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer transition-all shadow-sm"
                disabled={publishing}
                onClick={() => setPublishTarget(null)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-md shadow-[#176B58]/20 disabled:opacity-50 border-none"
                disabled={publishing}
                onClick={() => void publish()}
              >
                {publishing ? "Publishing…" : "Publish Paper Set"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
