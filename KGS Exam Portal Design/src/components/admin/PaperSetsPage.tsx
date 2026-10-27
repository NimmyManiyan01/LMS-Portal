import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"

const API = API_BASE_URL
type Notice = { type: "success" | "error" | "warning"; text: string }
const emptyForm = {
  name: "",
  examId: "",
  description: "",
  durationMinutes: "",
  passingMarks: "",
  instructions: "",
  questionIds: [] as string[],
}

export function PaperSetsPage({ Icon, PageHead }: { Icon: any; PageHead: any }) {
  const [sets, setSets] = useState<any[]>([]),
    [stats, setStats] = useState<any>({}),
    [exams, setExams] = useState<any[]>([]),
    [questions, setQuestions] = useState<any[]>([])
  const [filters, setFilters] = useState({
      search: "",
      examId: "",
      status: "",
    }),
    [questionFilters, setQuestionFilters] = useState({
      search: "",
      category: "",
      difficulty: "",
    })
  const [form, setForm] = useState<any>(emptyForm),
    [editingId, setEditingId] = useState<string | null>(null),
    [publishTarget, setPublishTarget] = useState<any>(null),
    [viewTarget, setViewTarget] = useState<any>(null),
    [viewLoading, setViewLoading] = useState(false),
    [viewError, setViewError] = useState("")
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<Notice | null>(null),
    [examError, setExamError] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({})
  const load = async () => {
    setLoading(true)
    try {
      const [p, e, q] = await Promise.all([
        authFetch(`${API}/api/admin/paper-sets?${new URLSearchParams(filters)}`, {}, true),
        authFetch(`${API}/api/admin/exams`, {}, true),
        authFetch(`${API}/api/admin/paper-sets/questions/eligible`, {}, true),
      ])
      const pd = await p.json(),
        ed = await e.json(),
        qd = await q.json()
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
      const response = await authFetch(`${API}/api/admin/paper-sets/${id}`, {}, true)
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to load paper set details.")
      setViewTarget(data.paperSet)
    } catch (cause) {
      setViewError(
        cause instanceof Error ? cause.message : "Unable to load paper set details.",
      )
    } finally {
      setViewLoading(false)
    }
  }
  const openEdit = async (id: string) => {
    try {
      const response = await authFetch(`${API}/api/admin/paper-sets/${id}`, {}, true)
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
    const next: Record<string, string> = {},
      name = String(form.name || "").trim()
    if (!name) next.name = "Paper set name is required."
    if (!form.examId) next.examId = "Select an examination."
    if (!Number(form.durationMinutes) || Number(form.durationMinutes) <= 0)
      next.durationMinutes = "Duration must be greater than zero."
    if (!Number(form.passingMarks) || Number(form.passingMarks) <= 0)
      next.passingMarks = "Passing marks must be greater than zero."
    if (Number(form.passingMarks) > calculatedMarks)
      next.passingMarks = "Passing marks cannot exceed total selected marks."
    if (!form.questionIds.length)
      next.questionIds = "Select at least one active question."
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
            totalMarks: calculatedMarks,
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
    <>
      <PageHead
        admin
        student={null}
        title="Paper Sets"
        description="Build, validate, and publish examination paper sets."
        showCreateAction={false}
      />
      <div className="student-management-head">
        <div>
          <h2>Paper Sets</h2>
          <p>Manage examination papers using active Question Bank records.</p>
        </div>
        <button className="primary" onClick={openCreate}>
          <Icon name="plus" />
          Create Paper Set
        </button>
      </div>
      <section className="kpi-grid">
        <article className="kpi">
          <small>Total Paper Sets</small>
          <strong>{stats.total || 0}</strong>
        </article>
        <article className="kpi">
          <small>Draft Paper Sets</small>
          <strong>{stats.draft || 0}</strong>
        </article>
        <article className="kpi">
          <small>Published Paper Sets</small>
          <strong>{stats.published || 0}</strong>
        </article>
        <article className="kpi">
          <small>Total Questions Assigned</small>
          <strong>{stats.questions || 0}</strong>
        </article>
      </section>
      {message && (
        <div className={`import-notice ${message.type}`}>{message.text}</div>
      )}
      <div className="student-filters">
        <input
          placeholder="Search paper set name"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <select
          value={filters.examId}
          onChange={(e) => setFilters({ ...filters, examId: e.target.value })}
        >
          <option value="">All examinations</option>
          {exams.map((exam) => (
            <option key={exam.id || exam._id} value={exam.id || exam._id}>
              {exam.title || exam.name}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <button className="secondary" onClick={() => void load()}>
          Search
        </button>
      </div>
      {examError && (
        <div className="import-notice error">
          {examError}{" "}
          <button className="text-button" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}
      <div className="panel student-table-panel">
        {loading ? (
          <div className="dashboard-empty">Loading paper sets...</div>
        ) : sets.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No paper sets created yet</h3>
            <p>Create a paper set to begin assigning active questions.</p>
            <button className="primary" onClick={openCreate}>
              <Icon name="plus" />
              Create Paper Set
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="student-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Examination</th>
                  <th>Questions</th>
                  <th>Marks</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sets.map((set) => (
                  <tr key={set.id}>
                    <td>{set.code}</td>
                    <td>{set.name || set.code}</td>
                    <td>{set.exam?.title || "—"}</td>
                    <td>{set.questionCount}</td>
                    <td>{set.totalMarks}</td>
                    <td>{set.status}</td>
                    <td>
                      {set.createdAt
                        ? new Date(set.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="text-button"
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
                          className="text-button"
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
      {open && (
        <div className="modal-backdrop">
          <div className="modal-card paper-set-modal">
            <div className="modal-header">
              <h2>{editingId ? "Edit Paper Set" : "Create Paper Set"}</h2>
              <button
                className="modal-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="paper-set-body">
              <label>
                Paper Set Name
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
                {errors.name && (
                  <small className="field-error">{errors.name}</small>
                )}
              </label>
              <label>
                Examination
                <select
                  value={form.examId}
                  onChange={(e) => selectExam(e.target.value)}
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
                  <small className="field-error">{errors.examId}</small>
                )}
              </label>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                />
              </label>
              <div className="form-grid">
                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    readOnly
                    min="1"
                    value={form.durationMinutes}
                  />
                  {errors.durationMinutes && (
                    <small className="field-error">
                      {errors.durationMinutes}
                    </small>
                  )}
                </label>
                <label>
                  Total Marks
                  <input readOnly value={calculatedMarks} />
                </label>
                <label>
                  Passing Marks
                  <input
                    type="number"
                    min="1"
                    value={form.passingMarks}
                    onChange={(e) => updateForm("passingMarks", e.target.value)}
                  />
                  {errors.passingMarks && (
                    <small className="field-error">{errors.passingMarks}</small>
                  )}
                </label>
              </div>
              <label>
                Instructions
                <textarea
                  value={form.instructions}
                  onChange={(e) => updateForm("instructions", e.target.value)}
                />
              </label>
              <div className="paper-question-heading">
                <h3>Select Active Questions</h3>
                <span>
                  {selectedQuestions.length} selected · {calculatedMarks} marks
                </span>
              </div>
              <div className="student-filters paper-question-filters">
                <input
                  placeholder="Search question ID or text"
                  value={questionFilters.search}
                  onChange={(e) =>
                    setQuestionFilters({
                      ...questionFilters,
                      search: e.target.value,
                    })
                  }
                />
                <select
                  value={questionFilters.category}
                  onChange={(e) =>
                    setQuestionFilters({
                      ...questionFilters,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="">All categories</option>
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
                >
                  <option value="">All difficulty</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              {errors.questionIds && (
                <small className="field-error">{errors.questionIds}</small>
              )}
              <div className="paper-question-list">
                {visibleQuestions.map((q) => (
                  <label key={q.id}>
                    <input
                      type="checkbox"
                      checked={form.questionIds.includes(q.id)}
                      onChange={(e) =>
                        updateForm(
                          "questionIds",
                          e.target.checked
                            ? [...new Set([...form.questionIds, q.id])]
                            : form.questionIds.filter(
                                (id: string) => id !== q.id,
                              ),
                        )
                      }
                    />
                    <span>
                      {q.questionText}
                      <small>
                        {q.category} · {q.difficulty} · {q.marks} marks
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="primary"
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
      {viewTarget && (
        <div className="modal-backdrop">
          <div className="modal-card paper-set-modal paper-set-view-modal" role="dialog" aria-modal="true" aria-labelledby="paper-set-view-title">
            <div className="modal-header">
              <div><h2 id="paper-set-view-title">Paper Set Details</h2><p>Read-only published paper set information.</p></div>
              <button className="modal-close" onClick={() => !viewLoading && setViewTarget(null)} aria-label="Close">×</button>
            </div>
            <div className="paper-set-body">
              {viewLoading ? <div className="dashboard-empty">Loading paper set details...</div> : viewError ? <div className="import-notice error">{viewError} <button className="text-button" onClick={() => void openView(viewTarget.id)}>Retry</button></div> : <>
                <div className="publish-summary" role="table" aria-label="Paper set details">
                  <div className="publish-summary-row" role="row"><div role="cell">Paper Set ID</div><div role="cell">{viewTarget.code || viewTarget.id}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Paper Set Name</div><div role="cell">{viewTarget.name || viewTarget.code || "—"}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Linked Examination</div><div role="cell">{viewTarget.examId?.title || "—"}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Examination Code</div><div role="cell">{viewTarget.examId?.code || "—"}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Description</div><div role="cell">{viewTarget.description || "—"}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Duration</div><div role="cell">{viewTarget.durationMinutes ?? "—"} minutes</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Total Questions</div><div role="cell">{viewTarget.questionIds?.length ?? 0}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Total Marks</div><div role="cell">{viewTarget.totalMarks ?? viewTarget.blueprint?.maximumMarks ?? 0}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Passing Marks</div><div role="cell">{viewTarget.passingMarks ?? 0}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Instructions</div><div role="cell">{Array.isArray(viewTarget.instructions) && viewTarget.instructions.length ? viewTarget.instructions.join(" ") : "—"}</div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Current Status</div><div role="cell"><span className="publish-status-badge published">{viewTarget.status || "PUBLISHED"}</span></div></div>
                  <div className="publish-summary-row" role="row"><div role="cell">Created Date</div><div role="cell">{viewTarget.createdAt ? new Date(viewTarget.createdAt).toLocaleString() : "—"}</div></div>
                </div>
                <h3 className="paper-view-section-title">Questions</h3>
                {viewTarget.questionIds?.length ? <div className="paper-view-questions">{viewTarget.questionIds.map((question: any, index: number) => <article className="paper-view-question" key={String(question._id || question.id || index)}><strong>Question {index + 1}</strong><p>{question.questionText || "Question content unavailable."}</p><small>{question.questionType || "MCQ"} · {question.sectionName || question.sectionId || "Uncategorized"} · {question.difficulty || "Not configured"} · {Number(question.marks || 0)} marks</small>{question.options?.length ? <ul>{question.options.map((option: any) => <li key={option.id || option.text}>{option.text}</li>)}</ul> : null}</article>)}</div> : <div className="dashboard-empty">No questions assigned to this paper set.</div>}
              </>}
            </div>
            <div className="modal-actions"><button className="secondary" onClick={() => setViewTarget(null)}>Close</button></div>
          </div>
        </div>
      )}
      {publishTarget && (
        <div className="modal-backdrop">
          <div
            className="modal-card publish-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="publish-title">Publish Paper Set?</h2>
                <p>
                  Review the paper set before making it available for new
                  examinations.
                </p>
              </div>
              <button
                className="modal-close"
                onClick={() => !publishing && setPublishTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body publish-confirm-body">
              <div className="publish-summary" role="table" aria-label="Paper set publication summary">
                <div className="publish-summary-row" role="row"><div role="cell">Paper Set Name</div><div role="cell">{publishTarget.name || publishTarget.code}</div></div>
                <div className="publish-summary-row" role="row"><div role="cell">Linked Examination</div><div role="cell">{publishTarget.exam?.code || publishTarget.exam?.title || "—"}</div></div>
                <div className="publish-summary-row" role="row"><div role="cell">Total Questions</div><div role="cell">{publishTarget.questionCount ?? 0}</div></div>
                <div className="publish-summary-row" role="row"><div role="cell">Total Marks</div><div role="cell">{publishTarget.totalMarks ?? 0}</div></div>
                <div className="publish-summary-row" role="row"><div role="cell">Current Status</div><div role="cell"><span className="publish-status-badge draft">{publishTarget.status || "DRAFT"}</span></div></div>
                <div className="publish-summary-row" role="row"><div role="cell">New Status</div><div role="cell"><span className="publish-status-badge published">PUBLISHED</span></div></div>
              </div>
              <p className="publish-warning">
                Publishing will run the existing server-side validation before
                changing the status.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="secondary"
                disabled={publishing}
                onClick={() => setPublishTarget(null)}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={publishing}
                onClick={() => void publish()}
              >
                {publishing ? "Publishing…" : "Publish Paper Set"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
