import { useEffect, useMemo, useState } from "react"
import { DateTimePicker } from "./DateTimePicker"
import { API_BASE_URL, authFetch } from "../../api"
import { AssignStudentsModal } from "./AssignStudentsModal"

const API = API_BASE_URL

const formatLocalDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  if (!Number.isFinite(date.getTime())) return ""
  const pad = (part: number) => String(part).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const localDateTimeToISOString = (value: string) => {
  if (!value) return value
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : value
}

const durationBetween = (start: string, end: string) => {
  if (!start || !end) return null
  const minutes = (new Date(end).getTime() - new Date(start).getTime()) / 60000
  return Number.isFinite(minutes) ? minutes : null
}

export function ExaminationsPage({
  Icon,
  PageHead,
}: {
  Icon: any
  PageHead: any
}) {
  const [exams, setExams] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [scheduleTarget, setScheduleTarget] = useState<any>(null)
  const [scheduleSet, setScheduleSet] = useState<any>(null)
  const [assignmentTarget, setAssignmentTarget] = useState<any>(null)
  const [assignmentStudents, setAssignmentStudents] = useState<any[]>([])
  const [assignmentColleges, setAssignmentColleges] = useState<any[]>([])
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [assignmentCollege, setAssignmentCollege] = useState("")
  const [assignmentSearch, setAssignmentSearch] = useState("")
  const [assignmentSaving, setAssignmentSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [message, setMessage] = useState("")

  // Paper Set Management Modal States
  const [paperModalTarget, setPaperModalTarget] = useState<any>(null)
  const [paperModalLoading, setPaperModalLoading] = useState(false)
  const [paperModalMessage, setPaperModalMessage] = useState("")
  const [paperModalSuccess, setPaperModalSuccess] = useState("")
  const [paperForm, setPaperForm] = useState({
    name: "",
    passingMarks: "35",
    totalMarks: "100",
    durationMinutes: "60",
    instructions: "Read all questions carefully before submitting.",
  })

  const [form, setForm] = useState<any>({
    name: "",
    code: "",
    description: "",
    examinationType: "MCQ",
    startAt: "",
    endAt: "",
    durationMinutes: "",
    maxAttempts: 1,
    instructions: "",
    readinessRequirements: {
      camera: false,
      microphone: false,
      fullscreen: false,
    },
    integrityProfile: "BASIC",
    integrityRules: { tabSwitchThreshold: 2 },
    resultReleasePolicy: "ADMIN_CONTROLLED",
  })

  const load = async () => {
    const r = await authFetch(`${API}/api/admin/exams`, {}, true)
    const d = await r.json()
    if (!r.ok) return setMessage(d.error || "Unable to load examinations.")
    const list = d.exams || []
    setExams(list)
    setStats({
      total: list.length,
      draft: list.filter((e: any) => e.status === "DRAFT").length,
      scheduled: list.filter((e: any) => e.status === "SCHEDULED").length,
      active: list.filter((e: any) => ["ACTIVE", "LIVE"].includes(e.status)).length,
      completed: list.filter((e: any) => ["COMPLETED", "CLOSED"].includes(e.status)).length,
    })
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = async () => {
    const r = await authFetch(`${API}/api/admin/exams/next-code`, {}, true)
    const d = await r.json()
    if (!r.ok) return setMessage(d.error || "Unable to generate code.")
    setEditing(null)
    setForm({
      name: "",
      code: d.code,
      description: "",
      examinationType: "MCQ",
      startAt: "",
      endAt: "",
      durationMinutes: "",
      maxAttempts: 1,
      instructions: "",
      readinessRequirements: {
        camera: false,
        microphone: false,
        fullscreen: false,
      },
      integrityProfile: "BASIC",
      integrityRules: { tabSwitchThreshold: 2 },
      resultReleasePolicy: "ADMIN_CONTROLLED",
    })
    setOpen(true)
  }

  const updateDate = (key: string, value: string) =>
    setForm((current: any) => {
      const next = { ...current, [key]: value }
      const duration = durationBetween(
        key === "startAt" ? value : next.startAt,
        key === "endAt" ? value : next.endAt,
      )
      return {
        ...next,
        durationMinutes: duration && duration > 0 ? duration : "",
      }
    })

  const duration = useMemo(
    () => durationBetween(form.startAt, form.endAt),
    [form.startAt, form.endAt],
  )

  const invalidRange = Boolean(
    form.startAt && form.endAt && duration !== null && duration <= 0,
  )

  const save = async () => {
    if (saving) return
    const start = new Date(form.startAt)
    const calculated = durationBetween(form.startAt, form.endAt)
    const errors: string[] = []

    if (!form.name.trim()) errors.push("Examination name is required.")
    if (!form.startAt) errors.push("Start date and time are required.")
    if (!form.endAt) errors.push("End date and time are required.")
    if (!editing && form.startAt && start <= new Date())
      errors.push("Start date must be in the future.")
    if (calculated === null || calculated <= 0)
      errors.push("End Date & Time must be later than Start Date & Time.")
    if (!Number.isInteger(Number(calculated)) || Number(calculated) <= 0)
      errors.push("Duration must be a positive number of minutes.")
    if (Number(form.maxAttempts) < 1)
      errors.push("Maximum attempts must be at least 1.")
    if (
      !Number.isInteger(Number(form.integrityRules?.tabSwitchThreshold)) ||
      Number(form.integrityRules?.tabSwitchThreshold) < 1
    )
      errors.push(
        "Tab-switch warning threshold must be a positive whole number.",
      )

    if (errors.length) return setMessage(errors.join(" "))

    setSaving(true)
    const r = await authFetch(
      `${API}/api/admin/exams${editing ? `/${editing.id}` : ""}`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startAt: localDateTimeToISOString(form.startAt),
          endAt: localDateTimeToISOString(form.endAt),
          durationMinutes: calculated,
          ...(editing ? {} : { status: "DRAFT" }),
        }),
      },
      true,
    )
    const d = await r.json()
    setSaving(false)

    if (!r.ok) return setMessage(d.error || "Unable to save examination.")

    setMessage(editing ? "Examination updated." : "Examination created.")
    setOpen(false)
    await load()
  }

  const edit = (e: any) => {
    setEditing(e)
    setForm({
      name: e.title || e.name || "",
      code: e.code || "",
      description: e.description || "",
      examinationType: e.examinationType || "MCQ",
      startAt: e.scheduledAt ? formatLocalDateTime(e.scheduledAt) : "",
      endAt: e.closesAt ? formatLocalDateTime(e.closesAt) : "",
      durationMinutes: e.durationMinutes || "",
      maxAttempts: e.maxAttempts || 1,
      instructions: Array.isArray(e.instructions)
        ? e.instructions.join("\n")
        : "",
      readinessRequirements: {
        camera: Boolean(e.readinessRequirements?.camera),
        microphone: Boolean(e.readinessRequirements?.microphone),
        fullscreen: Boolean(e.readinessRequirements?.fullscreen),
      },
      integrityProfile: e.integrityProfile || "BASIC",
      integrityRules: {
        tabSwitchThreshold: e.integrityRules?.tabSwitchThreshold ?? 2,
      },
      resultReleasePolicy: e.resultReleasePolicy || "ADMIN_CONTROLLED",
    })
    setOpen(true)
  }

  const openSchedule = async (exam: any) => {
    setMessage("")
    setSuccessMessage("")
    try {
      const response = await authFetch(
        `${API}/api/admin/paper-sets?examId=${encodeURIComponent(exam.id)}&status=PUBLISHED`,
        {},
        true,
      )
      const data = await response.json()
      if (!response.ok)
        return setMessage(data.error || "Unable to verify published paper sets.")

      const published = data.paperSets?.find(
        (paperSet: any) => paperSet.status === "PUBLISHED",
      )
      if (!published)
        return setMessage(
          "At least one published paper set is required before scheduling.",
        )

      setScheduleTarget(exam)
      setScheduleSet(published)
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to verify published paper sets.",
      )
    }
  }

  const openPaperModal = (exam: any) => {
    setMessage("")
    setSuccessMessage("")
    setPaperModalMessage("")
    setPaperModalSuccess("")
    setPaperModalTarget(exam)
    const existing = exam.paperSet || (exam.paperSets && exam.paperSets[0])
    setPaperForm({
      name: existing?.name || `Question Paper - ${exam.title || exam.name}`,
      passingMarks: String(existing?.passingMarks || 35),
      totalMarks: String(existing?.totalMarks || exam.totalMarks || 100),
      durationMinutes: String(exam.durationMinutes || 60),
      instructions: "Read all questions carefully before submitting.",
    })
  }

  const handleCreateAndPublishPaper = async (shouldPublish: boolean) => {
    if (!paperModalTarget || paperModalLoading) return
    setPaperModalLoading(true)
    setPaperModalMessage("")
    setPaperModalSuccess("")

    const passing = Number(paperForm.passingMarks || 35)
    const total = Number(paperForm.totalMarks || 100)
    const duration = Number(paperForm.durationMinutes || paperModalTarget.durationMinutes || 60)

    if (passing <= 0 || total <= 0 || passing > total) {
      setPaperModalLoading(false)
      return setPaperModalMessage("Passing marks must be > 0 and <= total marks.")
    }

    try {
      // 1. Create Paper Set for this specific exam
      const createRes = await authFetch(
        `${API}/api/admin/paper-sets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: paperForm.name.trim() || `Question Paper - ${paperModalTarget.title}`,
            examId: paperModalTarget.id,
            description: `Primary paper set for ${paperModalTarget.title}`,
            durationMinutes: duration,
            totalMarks: total,
            passingMarks: passing,
            instructions: [paperForm.instructions],
            automaticRandomization: true,
          }),
        },
        true,
      )
      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || "Unable to create paper set.")

      const paperSetId = createData.paperSet?.id || createData.paperSet?._id

      // 2. Publish Paper Set if requested
      if (shouldPublish && paperSetId) {
        const pubRes = await authFetch(
          `${API}/api/admin/paper-sets/${paperSetId}/publish`,
          { method: "POST" },
          true,
        )
        const pubData = await pubRes.json()
        if (!pubRes.ok) throw new Error(pubData.error || "Created paper set, but publishing failed.")
        setPaperModalSuccess("Paper set created and published successfully for this examination!")
      } else {
        setPaperModalSuccess("Draft paper set created successfully for this examination.")
      }

      await load()
      setTimeout(() => {
        setPaperModalTarget(null)
      }, 1200)
    } catch (cause) {
      setPaperModalMessage(
        cause instanceof Error ? cause.message : "Failed to set paper for this examination.",
      )
    } finally {
      setPaperModalLoading(false)
    }
  }

  const handlePublishExistingPaper = async (paperSetId: string) => {
    if (!paperSetId || paperModalLoading) return
    setPaperModalLoading(true)
    setPaperModalMessage("")
    setPaperModalSuccess("")
    try {
      const pubRes = await authFetch(
        `${API}/api/admin/paper-sets/${paperSetId}/publish`,
        { method: "POST" },
        true,
      )
      const pubData = await pubRes.json()
      if (!pubRes.ok) throw new Error(pubData.error || "Unable to publish paper set.")

      setPaperModalSuccess("Paper set published successfully for this examination!")
      await load()
      setTimeout(() => {
        setPaperModalTarget(null)
      }, 1200)
    } catch (cause) {
      setPaperModalMessage(
        cause instanceof Error ? cause.message : "Unable to publish paper set.",
      )
    } finally {
      setPaperModalLoading(false)
    }
  }

  const schedule = async () => {
    if (!scheduleTarget || scheduling) return
    setScheduling(true)
    try {
      const response = await authFetch(
        `${API}/api/admin/exams/${scheduleTarget.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SCHEDULED" }),
        },
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to schedule examination.")

      setScheduleTarget(null)
      setScheduleSet(null)
      setSuccessMessage("Examination scheduled successfully.")
      await load()
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to schedule examination.",
      )
    } finally {
      setScheduling(false)
    }
  }

  const openAssignment = async (exam: any) => {
    setMessage("")
    try {
      const response = await authFetch(
        `${API}/api/admin/exams/${exam.id}/assignments`,
        {},
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to load assignment data.")

      setAssignmentTarget({
        ...exam,
        assignmentExam: data.exam,
        assignmentAt: data.assignedAt,
      })
      setAssignmentStudents(data.students || [])
      setAssignmentColleges(data.colleges || [])

      setAssignmentCollege("")
      setAssignmentSearch("")
      setAssignedIds(data.assignedStudentIds || [])
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to load assignment data.",
      )
    }
  }

  const filterAssignmentCollege = async (college: string) => {
    if (!assignmentTarget) return
    setAssignmentCollege(college)
    const response = await authFetch(
      `${API}/api/admin/exams/${assignmentTarget.id}/assignments?college=${encodeURIComponent(college)}`,
      {},
      true,
    )
    const data = await response.json()
    if (response.ok) setAssignmentStudents(data.students || [])
    else setMessage(data.error || "Unable to filter students by college.")
  }

  const saveAssignments = async () => {
    if (!assignmentTarget || assignmentSaving || !assignedIds.length) return
    setAssignmentSaving(true)
    try {
      const response = await authFetch(
        `${API}/api/admin/exams/${assignmentTarget.id}/assignments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: assignedIds }),
        },
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to assign students.")

      setAssignmentTarget(null)
      setMessage(
        `${data.assignedStudentCount} student${
          data.assignedStudentCount === 1 ? "" : "s"
        } assigned successfully.`,
      )
      await load()
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Unable to assign students.",
      )
    } finally {
      setAssignmentSaving(false)
    }
  }

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium mb-3 px-1"
      >
        <span className="p-0.5 text-slate-600">
          <svg
            width="18"
            height="18"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16 7.609c.352 0 .69.122.96.343l.111.1 6.25 6.25v.001a1.5 1.5 0 0 1 .445 1.071v7.5a.89.89 0 0 1-.891.891H9.125a.89.89 0 0 1-.89-.89v-7.5l.006-.149a1.5 1.5 0 0 1 .337-.813l.1-.11 6.25-6.25c.285-.285.67-.444 1.072-.444Zm5.984 7.876L16 9.5l-5.984 5.985v6.499h11.968z"
              fill="#475569"
              stroke="#475569"
              strokeWidth=".094"
            />
          </svg>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-300 shrink-0"
        >
          <path
            d="m14.413 10.663-6.25 6.25a.939.939 0 1 1-1.328-1.328L12.42 10 6.836 4.413a.939.939 0 1 1 1.328-1.328l6.25 6.25a.94.94 0 0 1-.001 1.328"
            fill="#CBD5E1"
          />
        </svg>
        <span className="text-slate-600">Admin Dashboard</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-slate-300 shrink-0"
        >
          <path
            d="m14.413 10.663-6.25 6.25a.939.939 0 1 1-1.328-1.328L12.42 10 6.836 4.413a.939.939 0 1 1 1.328-1.328l6.25 6.25a.94.94 0 0 1-.001 1.328"
            fill="#CBD5E1"
          />
        </svg>
        <span className="text-blue-600 font-semibold">
          Examinations Management
        </span>
      </nav>

      <PageHead
        admin
        student={null}
        title="Examinations"
        description="Create, schedule, and manage examinations."
        showCreateAction={false}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Examinations</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Manage the examination lifecycle and scheduling.</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-sm shadow-blue-500/20 flex-shrink-0"
          onClick={() => void openCreate()}
        >
          <Icon name="plus" />
          Create Examination
        </button>
      </div>

      {/* KPI Stats Section */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[
          ["Total Examinations", "total"],
          ["Draft", "draft"],
          ["Scheduled", "scheduled"],
          ["Active", "active"],
          ["Completed", "completed"],
        ].map(([label, key]) => (
          <article
            className="flex flex-col p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all"
            key={key}
          >
            <small className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</small>
            <strong className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">{stats[key] || 0}</strong>
          </article>
        ))}
      </section>

      {/* Alert Notices */}
      {message && (
        <div className="p-3.5 px-4 mb-6 text-xs sm:text-sm font-semibold rounded-xl border flex items-center gap-2 text-red-800 bg-red-50 border-red-200/80">
          {message}
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 px-4 mb-6 text-xs sm:text-sm font-semibold rounded-xl border flex items-center gap-2 text-emerald-800 bg-emerald-50 border-emerald-200/80">
          {successMessage}
        </div>
      )}

      {/* Examinations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Code</th>
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Name</th>
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Type</th>
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Paper Set</th>
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Start</th>
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Duration</th>
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Status</th>
                <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((e) => {
                const activeSet = e.paperSet || (e.paperSets && e.paperSets[0])
                return (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600">{e.code}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{e.title || e.name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{e.examinationType || "MCQ"}</td>
                    <td className="px-4 py-3.5">
                      {activeSet ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                            activeSet.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          📄 {activeSet.name || activeSet.code} ({activeSet.status})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200">
                          ⚠️ No Paper Set
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {e.scheduledAt ? new Date(e.scheduledAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {e.durationMinutes ? `${e.durationMinutes} min` : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                          e.status === "DRAFT"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : e.status === "SCHEDULED"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : ["ACTIVE", "LIVE"].includes(e.status)
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0 mr-3.5"
                        onClick={() => edit(e)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors bg-transparent border-none p-0 mr-3.5"
                        onClick={() => openPaperModal(e)}
                      >
                        Set Paper
                      </button>
                      {e.status === "DRAFT" && (
                        <button
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0 mr-3.5"
                          onClick={() => void openSchedule(e)}
                        >
                          Schedule
                        </button>
                      )}
                      {["SCHEDULED", "ACTIVE", "LIVE"].includes(e.status) && (
                        <button
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0"
                          onClick={() => void openAssignment(e)}
                        >
                          Assign Students
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Examination Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[780px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none z-10"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col gap-4">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {editing ? "Edit Examination" : "Create Examination"}
              </h2>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                Examination Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                Examination Code
                <input
                  value={form.code}
                  readOnly
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed shadow-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                Examination Type
                <select
                  value={form.examinationType}
                  onChange={(e) => setForm({ ...form, examinationType: e.target.value })}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                >
                  <option>MCQ</option>
                  <option>Assessment</option>
                </select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
                <DateTimePicker
                  label="Start Date and Time"
                  value={form.startAt}
                  onChange={(value) => updateDate("startAt", value)}
                />
                <DateTimePicker
                  label="End Date and Time"
                  value={form.endAt}
                  onChange={(value) => updateDate("endAt", value)}
                />
                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                  Duration (minutes)
                  <input
                    readOnly
                    value={duration && duration > 0 ? duration : ""}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed shadow-sm"
                  />
                  {invalidRange && (
                    <small className="text-xs font-medium text-red-600 mt-1 block">
                      End Date &amp; Time must be later than Start Date &amp; Time.
                    </small>
                  )}
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                Maximum Attempts
                <input
                  type="number"
                  min="1"
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
                  className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                />
              </label>

              {/* Security Section */}
              <section className="p-4 sm:p-5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col gap-3.5 my-1">
                <h3 className="text-sm font-bold text-slate-900">Examination Security &amp; Proctoring</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
                  {([
                    ["camera", "Camera Required"],
                    ["microphone", "Microphone Required"],
                    ["fullscreen", "Fullscreen Required"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={Boolean(form.readinessRequirements?.[key])}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            readinessRequirements: {
                              ...form.readinessRequirements,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                    Integrity Profile
                    <select
                      value={form.integrityProfile}
                      onChange={(e) => setForm({ ...form, integrityProfile: e.target.value })}
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="STANDARD">Standard</option>
                      <option value="STRICT">Strict</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                    Tab-Switch Warning Threshold
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={form.integrityRules?.tabSwitchThreshold ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          integrityRules: {
                            ...form.integrityRules,
                            tabSwitchThreshold: e.target.value,
                          },
                        })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                  </label>
                </div>
                <small className="text-xs text-slate-500">
                  Tab-switch monitoring follows the selected backend integrity profile.
                </small>
              </section>

              <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.resultReleasePolicy === "IMMEDIATE"}
                  disabled={Boolean(editing)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      resultReleasePolicy: e.target.checked ? "IMMEDIATE" : "ADMIN_CONTROLLED",
                    })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer disabled:cursor-not-allowed"
                />
                <span>
                  Show Marks Immediately After Submission
                  {editing && <small className="text-slate-500 font-normal ml-1">Existing examination policy is preserved.</small>}
                </span>
              </label>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                Instructions
                <textarea
                  value={form.instructions}
                  rows={3}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  className="w-full p-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm resize-y"
                />
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer transition-all shadow-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm shadow-blue-500/20"
                disabled={saving || invalidRange}
                onClick={() => void save()}
              >
                {saving ? "Saving..." : "Save Examination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Students Modal */}
      {assignmentTarget && (
        <AssignStudentsModal
          examination={assignmentTarget}
          students={assignmentStudents}
          colleges={assignmentColleges}
          assignedIds={assignedIds}
          search={assignmentSearch}
          college={assignmentCollege}
          saving={assignmentSaving}
          onSearch={setAssignmentSearch}
          onCollege={(value) => void filterAssignmentCollege(value)}
          onToggle={(id, selected) =>
            setAssignedIds((current) =>
              selected
                ? [...new Set([...current, id])]
                : current.filter((value) => value !== id),
            )
          }
          onSelectEligible={(ids) =>
            setAssignedIds(
              ids.length ? [...new Set([...assignedIds, ...ids])] : [],
            )
          }
          onClose={() => !assignmentSaving && setAssignmentTarget(null)}
          onAssign={() => void saveAssignments()}
        />
      )}

      {/* Schedule Confirmation Modal */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div
            className="relative w-full max-w-[560px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-title"
          >
            <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 id="schedule-title" className="text-lg sm:text-xl font-bold text-slate-900">
                  Schedule Examination?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Review the schedule before changing its lifecycle status.
                </p>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none disabled:opacity-50"
                disabled={scheduling}
                onClick={() => setScheduleTarget(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:px-7 sm:py-6 overflow-y-auto flex flex-col gap-3 text-xs sm:text-sm">
              <div className="flex flex-col rounded-xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden bg-slate-50/50 text-xs sm:text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">Examination Name</div>
                  <div className="font-semibold text-slate-900">{scheduleTarget.title || scheduleTarget.name}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">Examination Code</div>
                  <div className="font-mono text-slate-900">{scheduleTarget.code}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">Start Date and Time</div>
                  <div className="font-medium text-slate-900">
                    {scheduleTarget.scheduledAt ? new Date(scheduleTarget.scheduledAt).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">End Date and Time</div>
                  <div className="font-medium text-slate-900">
                    {scheduleTarget.closesAt ? new Date(scheduleTarget.closesAt).toLocaleString() : "—"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">Duration</div>
                  <div className="font-medium text-slate-900">{scheduleTarget.durationMinutes ?? "—"} minutes</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">Linked Published Paper Set</div>
                  <div className="font-medium text-slate-900">{scheduleSet?.name || scheduleSet?.code || "—"}</div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">Current Status</div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      DRAFT
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 gap-1 sm:gap-4 bg-white">
                  <div className="font-semibold text-slate-500">New Status</div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      SCHEDULED
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer transition-all shadow-sm"
                disabled={scheduling}
                onClick={() => setScheduleTarget(null)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-sm shadow-blue-500/20"
                disabled={scheduling}
                onClick={() => void schedule()}
              >
                {scheduling ? "Scheduling..." : "Schedule Examination"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Paper Modal */}
      {paperModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[620px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Set Paper for Examination
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Configure and publish the question paper set for <strong className="text-slate-900">{paperModalTarget.title || paperModalTarget.name}</strong> ({paperModalTarget.code})
                </p>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none disabled:opacity-50"
                disabled={paperModalLoading}
                onClick={() => setPaperModalTarget(null)}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:px-7 sm:py-6 overflow-y-auto flex flex-col gap-4 text-xs sm:text-sm">
              {paperModalMessage && (
                <div className="p-3.5 px-4 text-xs sm:text-sm font-semibold rounded-xl border text-red-800 bg-red-50 border-red-200/80">
                  {paperModalMessage}
                </div>
              )}
              {paperModalSuccess && (
                <div className="p-3.5 px-4 text-xs sm:text-sm font-semibold rounded-xl border text-emerald-800 bg-emerald-50 border-emerald-200/80">
                  {paperModalSuccess}
                </div>
              )}

              {/* Active / Existing Paper Set Details */}
              {(paperModalTarget.paperSet || (paperModalTarget.paperSets && paperModalTarget.paperSets.length > 0)) ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Associated Question Paper</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        (paperModalTarget.paperSet?.status || paperModalTarget.paperSets?.[0]?.status) === "PUBLISHED"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {paperModalTarget.paperSet?.status || paperModalTarget.paperSets?.[0]?.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <small className="text-slate-500 font-medium block">Paper Name</small>
                      <b className="text-slate-900 font-bold">{paperModalTarget.paperSet?.name || paperModalTarget.paperSets?.[0]?.name}</b>
                    </div>
                    <div>
                      <small className="text-slate-500 font-medium block">Paper Code</small>
                      <b className="text-slate-900 font-mono font-bold">{paperModalTarget.paperSet?.code || paperModalTarget.paperSets?.[0]?.code}</b>
                    </div>
                    <div>
                      <small className="text-slate-500 font-medium block">Total Marks</small>
                      <b className="text-slate-900 font-bold">{paperModalTarget.paperSet?.totalMarks || paperModalTarget.paperSets?.[0]?.totalMarks || paperModalTarget.totalMarks || "100"} Marks</b>
                    </div>
                    <div>
                      <small className="text-slate-500 font-medium block">Passing Marks</small>
                      <b className="text-slate-900 font-bold">{paperModalTarget.paperSet?.passingMarks || paperModalTarget.paperSets?.[0]?.passingMarks || "35"} Marks</b>
                    </div>
                  </div>

                  {(paperModalTarget.paperSet?.status || paperModalTarget.paperSets?.[0]?.status) !== "PUBLISHED" && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-500 m-0 font-medium">This paper set is currently in DRAFT status. Publish it to enable examination scheduling.</p>
                      <button
                        className="h-9 px-4 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all cursor-pointer shadow-sm flex-shrink-0 border-none"
                        disabled={paperModalLoading}
                        onClick={() => handlePublishExistingPaper(paperModalTarget.paperSet?.id || paperModalTarget.paperSets?.[0]?.id)}
                      >
                        {paperModalLoading ? "Publishing..." : "Publish Paper Set"}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Form to Create/Configure Paper Set for this Examination */}
              <div className="flex flex-col gap-3.5 pt-2">
                <h3 className="text-sm font-bold text-slate-900 m-0">
                  {(paperModalTarget.paperSet || (paperModalTarget.paperSets && paperModalTarget.paperSets.length > 0))
                    ? "Or Configure New Paper Set for this Examination"
                    : "Configure Question Paper Set for this Examination"}
                </h3>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                  Paper Set Title / Name
                  <input
                    value={paperForm.name}
                    onChange={(e) => setPaperForm({ ...paperForm, name: e.target.value })}
                    className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    placeholder="e.g. Question Paper Set A"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                    Total Marks
                    <input
                      type="number"
                      min="1"
                      value={paperForm.totalMarks}
                      onChange={(e) => setPaperForm({ ...paperForm, totalMarks: e.target.value })}
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                    Passing Marks
                    <input
                      type="number"
                      min="1"
                      value={paperForm.passingMarks}
                      onChange={(e) => setPaperForm({ ...paperForm, passingMarks: e.target.value })}
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                  Candidate Instructions
                  <textarea
                    rows={2}
                    value={paperForm.instructions}
                    onChange={(e) => setPaperForm({ ...paperForm, instructions: e.target.value })}
                    className="w-full p-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm resize-y"
                  />
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex-none flex flex-col sm:flex-row items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
              <button
                className="w-full sm:w-auto h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50 cursor-pointer transition-all shadow-sm"
                disabled={paperModalLoading}
                onClick={() => setPaperModalTarget(null)}
              >
                Cancel
              </button>
              <button
                className="w-full sm:w-auto h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 border border-slate-300 hover:bg-slate-200 focus:outline-none disabled:opacity-50 cursor-pointer transition-all shadow-sm"
                disabled={paperModalLoading}
                onClick={() => handleCreateAndPublishPaper(false)}
              >
                {paperModalLoading ? "Saving..." : "Save Draft Paper"}
              </button>
              <button
                className="w-full sm:w-auto h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 cursor-pointer transition-all shadow-sm shadow-blue-500/20"
                disabled={paperModalLoading}
                onClick={() => handleCreateAndPublishPaper(true)}
              >
                {paperModalLoading ? "Setting Paper..." : "Create & Publish Paper Set"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
