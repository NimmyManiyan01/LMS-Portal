import { useEffect, useMemo, useState } from "react"
import { DateTimePicker } from "./DateTimePicker"
import { API_BASE_URL, authFetch } from "../../api"
import { AssignStudentsModal } from "./AssignStudentsModal"
import { AdminFloatingSidebar } from "../../App"

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
  active = "Examinations",
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
    passingMarks: "50",
    totalMarks: "50",
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
      roundNumber: 1,
      allowedLanguages: ["python", "java", "cpp", "javascript"],
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

    if (!form.name.trim()) errors.push("Assessment name is mandatory.")
    if (!form.startAt) errors.push("Start date and time are required.")
    if (!form.endAt) errors.push("End date and time are required.")
    if (!editing && form.startAt && start <= new Date())
      errors.push("Start date must be in the future.")
    if (calculated === null || calculated <= 0)
      errors.push("Duration must be a positive number of minutes.")
    if (Number(form.maxAttempts) < 1)
      errors.push("Maximum attempts must be at least 1.")
    if (
      (form.examinationType === "CODING" || form.examinationType === "MIXED") &&
      (!form.allowedLanguages || !form.allowedLanguages.length)
    )
      errors.push("At least one supported programming language must be selected.")
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
      roundNumber: e.roundNumber || (e.examinationType === "CODING" ? 2 : 1),
      allowedLanguages: e.allowedLanguages || ["python", "java", "cpp", "javascript"],
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
    <div className="relative min-h-screen w-full max-w-full bg-[#F6F2E6] text-[#1E3A34] font-sans overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* Continuous Full-Page Atmospheric Background Vibrant Lighting Blobs */}
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
                Examination Management
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
              Examinations
            </h1>

            <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed">
              Create, schedule, and manage examination lifecycles across all candidate portals.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-full text-white bg-[#1E3A34] hover:bg-[#057A55] active:bg-[#035E41] transition-all duration-200 cursor-pointer shadow-md shadow-emerald-900/20 shrink-0"
              onClick={() => void openCreate()}
            >
              <Icon name="plus" />
              Create Examination
            </button>
          </div>
        </header>

        {/* Refined Flux Glassmorphism KPI Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Total Examinations",
              key: "total",
              icon: "book",
              badgeBg: "bg-[#00D084]/20 text-[#057A55]",
              labelColor: "text-[#057A55]",
              pillText: "All",
            },
            {
              label: "Draft",
              key: "draft",
              icon: "copy",
              badgeBg: "bg-[#FF7A59]/20 text-[#FF7A59]",
              labelColor: "text-[#FF7A59]",
              pillText: "Pending",
            },
            {
              label: "Scheduled",
              key: "scheduled",
              icon: "pulse",
              badgeBg: "bg-[#00C4DF]/20 text-[#008DA1]",
              labelColor: "text-[#008DA1]",
              pillText: "Upcoming",
            },
            {
              label: "Active",
              key: "active",
              icon: "pulse",
              badgeBg: "bg-[#00D084]/20 text-[#057A55]",
              labelColor: "text-[#057A55]",
              pillText: "Live",
              isLive: true,
            },
            {
              label: "Completed",
              key: "completed",
              icon: "result",
              badgeBg: "bg-[#FFB800]/20 text-[#D99B00]",
              labelColor: "text-[#D99B00]",
              pillText: "Closed",
            },
          ].map((kpi) => (
            <article
              key={kpi.key}
              className="group relative overflow-hidden bg-white/50 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between min-h-[145px]"
            >
              {/* Specular Highlight */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <span className={`w-9 h-9 rounded-2xl ${kpi.badgeBg} flex items-center justify-center text-base font-bold shadow-inner border border-white/70 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon name={kpi.icon} />
                </span>
                {kpi.isLive ? (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-[#057A55] bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] animate-pulse" /> {kpi.pillText}
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-[#1E3A34]/60 bg-slate-100/80 px-2 py-0.5 rounded-full border border-white">
                    {kpi.pillText}
                  </span>
                )}
              </div>

              <div className="relative z-10">
                <small className={`block text-[10px] font-black uppercase tracking-wider mb-1 ${kpi.labelColor}`}>
                  {kpi.label}
                </small>
                <strong className="block text-3xl sm:text-4xl font-black text-[#1E3A34] leading-none tracking-tight">
                  {stats[kpi.key] || 0}
                </strong>
              </div>
            </article>
          ))}
        </section>

        {/* Alert Notices */}
        {message && (
          <div className="p-4 text-xs sm:text-sm font-bold rounded-2xl border flex items-center gap-2 text-rose-900 bg-rose-50/90 border-rose-200 shadow-sm">
            <span>⚠️</span> {message}
          </div>
        )}
        {successMessage && (
          <div className="p-4 text-xs sm:text-sm font-bold rounded-2xl border flex items-center gap-2 text-emerald-900 bg-emerald-50/90 border-emerald-200 shadow-sm">
            <span>✅</span> {successMessage}
          </div>
        )}

        {/* Examinations Table Container */}
        <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-5 sm:p-6 overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/30 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[780px] max-h-[90vh] flex flex-col bg-white/85 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_0_rgba(30,58,52,0.2)] border border-white overflow-hidden text-[#1E3A34]">
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59] z-20" />

            {/* Modal Refined Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE1] bg-white/50 backdrop-blur-xl shrink-0 pt-5">
              <div>
                <h2 className="text-xl font-black text-[#1E3A34] tracking-tight m-0">
                  {editing ? "Edit Examination" : "Create Examination"}
                </h2>
                <span className="text-xs font-bold text-[#057A55]">
                  {editing ? "Modify examination parameters and schedule" : "Configure new examination specifications"}
                </span>
              </div>
              <button
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#1E3A34] hover:text-[#D9532F] transition-all text-lg font-bold border border-white shadow-sm cursor-pointer"
                onClick={() => setOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col gap-4.5 scrollbar-thin">

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34]">
                Examination Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. End Semester Computer Science Examination 2025"
                  className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white/80 border border-[#E2DBD0] rounded-xl text-[#1E3A34] placeholder:text-slate-400 focus:outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 transition-all shadow-sm"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34]">
                Examination Code
                <input
                  value={form.code}
                  readOnly
                  className="w-full h-10 px-3.5 text-xs sm:text-sm bg-[#F6F2E6]/90 border border-[#E2DBD0] rounded-xl text-[#1E3A34]/70 font-mono font-bold cursor-not-allowed shadow-inner"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34]">
                Examination Type
                <select
                  value={form.examinationType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      examinationType: e.target.value,
                      roundNumber: e.target.value === "CODING" ? 2 : 1,
                    })
                  }
                  className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white/80 border border-[#E2DBD0] rounded-xl text-[#1E3A34] focus:outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 transition-all shadow-sm cursor-pointer"
                >
                  <option value="MCQ">Round 1 — MCQ Assessment</option>
                  <option value="CODING">Round 2 — Coding Assessment</option>
                  <option value="MIXED">Mixed Assessment (MCQ + Coding)</option>
                  <option value="Assessment">Standard Assessment</option>
                </select>
              </label>

              {/* Allowed Programming Languages Section */}
              {(form.examinationType === "CODING" || form.examinationType === "MIXED") && (
                <section className="p-4 sm:p-5 rounded-2xl border border-white bg-white/60 backdrop-blur-md flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
                    <h3 className="text-sm font-black text-[#1E3A34] m-0">Allowed Programming Languages</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      ["python", "Python"],
                      ["java", "Java"],
                      ["cpp", "C++"],
                      ["javascript", "JavaScript"],
                      ["c", "C"],
                      ["csharp", "C#"],
                    ].map(([langKey, langLabel]) => {
                      const checked = (form.allowedLanguages || []).includes(langKey)
                      return (
                        <label key={langKey} className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-[#1E3A34] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(form.allowedLanguages || []), langKey]
                                : (form.allowedLanguages || []).filter((l: string) => l !== langKey)
                              setForm({ ...form, allowedLanguages: next })
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#057A55] focus:ring-[#00D084] focus:ring-2 cursor-pointer"
                          />
                          <span>{langLabel}</span>
                        </label>
                      )
                    })}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
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
                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34]">
                  Duration (minutes)
                  <input
                    readOnly
                    value={duration && duration > 0 ? duration : ""}
                    placeholder="Auto-calculated"
                    className="w-full h-10 px-3.5 text-xs sm:text-sm bg-[#F6F2E6]/90 border border-[#E2DBD0] rounded-xl text-[#1E3A34]/70 font-bold cursor-not-allowed shadow-inner"
                  />
                  {invalidRange && (
                    <small className="text-xs font-bold text-rose-600 mt-1 block">
                      End Date &amp; Time must be later than Start Date &amp; Time.
                    </small>
                  )}
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34]">
                Maximum Attempts
                <input
                  type="number"
                  min="1"
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white/80 border border-[#E2DBD0] rounded-xl text-[#1E3A34] focus:outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 transition-all shadow-sm"
                />
              </label>

              {/* Security & Proctoring Section */}
              <section className="p-4 sm:p-5 rounded-2xl border border-white bg-white/60 backdrop-blur-md flex flex-col gap-3.5 my-1 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
                  <h3 className="text-sm font-black text-[#1E3A34] m-0">Examination Security &amp; Proctoring</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-start">
                  {([
                    ["camera", "Camera Required"],
                    ["microphone", "Microphone Required"],
                    ["fullscreen", "Fullscreen Required"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-[#1E3A34] cursor-pointer select-none">
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
                        className="h-4 w-4 rounded border-slate-300 text-[#057A55] focus:ring-[#00D084] focus:ring-2 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34]">
                    Integrity Profile
                    <select
                      value={form.integrityProfile}
                      onChange={(e) => setForm({ ...form, integrityProfile: e.target.value })}
                      className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white/80 border border-[#E2DBD0] rounded-xl text-[#1E3A34] focus:outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 transition-all shadow-sm"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="STANDARD">Standard</option>
                      <option value="STRICT">Strict</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-extrabold text-[#1E3A34]">
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
                      className="w-full h-10 px-3.5 text-xs sm:text-sm bg-white/80 border border-[#E2DBD0] rounded-xl text-[#1E3A34] focus:outline-none focus:border-[#00D084] focus:ring-2 focus:ring-[#00D084]/20 transition-all shadow-sm"
                    />
                  </label>
                </div>
                <small className="text-xs font-semibold text-[#057A55]">
                  Tab-switch monitoring follows the selected backend integrity profile.
                </small>
              </section>
            </div>

            {/* Fixed Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F0EBE1] bg-white/60 backdrop-blur-xl shrink-0">
              <button
                className="h-10 px-5 py-2 text-xs sm:text-sm font-extrabold rounded-full text-[#1E3A34] bg-white/80 hover:bg-white border border-[#E2DBD0] transition-all cursor-pointer shadow-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="h-10 px-6 py-2 text-xs sm:text-sm font-black rounded-full text-white bg-[#057A55] hover:bg-[#035E41] active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-400/30"
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
      </div>
    </div>
  )
}
