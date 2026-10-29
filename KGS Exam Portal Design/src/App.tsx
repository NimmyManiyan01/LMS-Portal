import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Exam, AnswerState, StudentProfile } from "./types"
import { API_BASE_URL, authFetch, clearAuthToken } from "./api"
import { SystemCheckModal } from "./components/student/SystemCheckModal"
import { ExamInstructionsModal } from "./components/student/ExamInstructionsModal"
import { ExamPlayer } from "./components/student/ExamPlayer"
import { SubmissionModal } from "./components/student/SubmissionModal"
import { ResultsView } from "./components/student/ResultsView"
const SubmissionConfirmation = lazy(() =>
  import("./components/student/SubmissionConfirmation").then((module) => ({
    default: module.SubmissionConfirmation,
  })),
)
import { LandingPage } from "./components/public/LandingPage"
import {
  PolicyPage,
  monitoringSections,
  privacySections,
} from "./components/public/PolicyPage"
import { RegistrationPage } from "./components/auth/RegistrationPage"
import { StudentLoginPage } from "./components/auth/StudentLoginPage"
import { AdminLoginPage } from "./components/auth/AdminLoginPage"
import { StudentExaminations } from "./components/student/StudentExaminations"
import { QuestionBankPage } from "./components/admin/QuestionBankPage"
import { PaperSetsPage } from "./components/admin/PaperSetsPage"
import { ExaminationsPage } from "./components/admin/ExaminationsPage"
import { LiveMonitoringPage } from "./components/admin/LiveMonitoringPage"
import { ResultsPage } from "./components/admin/ResultsPage"

type IconName =
  | "grid"
  | "book"
  | "result"
  | "shield"
  | "help"
  | "bell"
  | "chevron"
  | "clock"
  | "calendar"
  | "file"
  | "check"
  | "arrow"
  | "users"
  | "pulse"
  | "review"
  | "download"
  | "settings"
  | "search"
  | "plus"
  | "more"
  | "menu"

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    result: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" />
        <path d="M12 18h.01" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    pulse: (
      <>
        <path d="M3 12h4l2-6 4 12 2-6h6" />
      </>
    ),
    review: (
      <>
        <path d="M8 6h13M8 12h13M8 18h13" />
        <path d="M3 6h.01M3 12h.01M3 18h.01" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4H3a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.36.37.7.6 1 .27.3.63.44 1 .4h.1v4H21a1.7 1.7 0 0 0-1.6.6Z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const studentNav = [
  ["grid", "Overview"],
  ["book", "My examinations"],
  ["result", "Results"],
  ["shield", "System check"],
  ["help", "Help & support"],
] as const

const adminNav = [
  ["grid", "Overview"],
  ["book", "Examinations"],
  ["review", "Question bank"],
  ["file", "Paper sets"],
  ["users", "Students"],
  ["pulse", "Live monitoring"],
  ["result", "Results"],
  ["download", "Reports"],
  ["shield", "Security & audit"],
] as const

async function readApiJson(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  const body = await response.text()
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `API returned ${response.status} ${response.statusText || "an invalid response"} instead of JSON.`,
    )
  }
  try {
    return JSON.parse(body)
  } catch {
    throw new Error("The administrator API returned malformed JSON.")
  }
}

function Brand({ admin = false }: { admin?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black italic shadow-md shadow-blue-500/20">
        <span>K</span>
      </div>
      <div>
        <strong className={`block text-sm font-extrabold tracking-tight ${admin ? "text-white" : "text-slate-900"}`}>
          KGS
        </strong>
        <small className="block text-[9px] font-extrabold tracking-[0.16em] text-blue-600 leading-none">
          EXAM PORTAL
        </small>
      </div>
    </div>
  )
}

function Sidebar({
  admin,
  active,
  onNav,
}: {
  admin: boolean
  active: string
  onNav: (v: string) => void
}) {
  const nav = admin ? adminNav : studentNav
  const [activeAttempts, setActiveAttempts] = useState<number | null>(null)
  useEffect(() => {
    if (!admin) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/admin/dashboard?range=month`,
          {},
          true,
        )
        if (!response.ok) return
        const payload = await response.json()
        if (!cancelled)
          setActiveAttempts(Number(payload?.stats?.activeAttempts || 0))
      } catch {
        /* The dashboard remains usable when the count cannot be refreshed. */
      }
    }
    void load()
    const timer = window.setInterval(load, 30000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [admin])

  return (
    <aside
      className={`w-[260px] h-screen sticky top-0 shrink-0 flex flex-col justify-between p-5 border-r transition-colors z-30 ${
        admin
          ? "bg-slate-900 text-white border-slate-800"
          : "bg-white text-slate-900 border-slate-200/80"
      }`}
    >
      <div>
        <Brand admin={admin} />
        <div
          className={`text-[10px] font-extrabold uppercase tracking-widest my-4 px-2.5 py-1 rounded-md ${
            admin ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
          }`}
        >
          {admin ? "ADMIN PORTAL" : "STUDENT PORTAL"}
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(([icon, label]) => (
            <button
              key={label}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border-none ${
                active === label
                  ? admin
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold"
                    : "bg-blue-50 text-blue-600 font-bold"
                  : admin
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              onClick={() => onNav(label)}
            >
              <div className="flex items-center gap-2.5">
                <Icon name={icon} />
                <span>{label}</span>
              </div>
              {label === "Live monitoring" &&
                activeAttempts !== null &&
                activeAttempts > 0 && (
                  <i className="not-italic px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {activeAttempts}
                  </i>
                )}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <div
          className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium ${
            admin ? "bg-slate-800/80 text-slate-300" : "bg-slate-50 text-slate-600"
          }`}
        >
          <Icon name="shield" size={16} />
          <div>
            <b className="block font-bold text-xs mb-0.5">Examination security</b>
            <span className="text-[11px] opacity-80">Monitoring follows policy</span>
          </div>
        </div>
        <small className="text-[11px] font-medium text-slate-400 text-center">
          © {new Date().getFullYear()} KGS Institute
        </small>
      </div>
    </aside>
  )
}

function Topbar({
  admin,
  setAdmin,
  student,
  adminUser,
  onOpenLogin,
  openMenu,
  onLogout,
}: {
  admin: boolean
  setAdmin: (v: boolean) => void
  student: StudentProfile | null
  adminUser: { email: string; role: string } | null
  onOpenLogin: () => void
  openMenu: () => void
  onLogout: () => void
}) {
  return (
    <header className="h-16 px-4 sm:px-8 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between gap-4">
      <button
        className="lg:hidden flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer border-none bg-transparent"
        onClick={openMenu}
        aria-label="Open menu"
      >
        <Icon name="menu" />
      </button>

      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>All systems operational</span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer bg-white"
          aria-label="Notifications"
        >
          <Icon name="bell" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600"></span>
        </button>

        {admin && adminUser ? (
          <button
            className="flex items-center gap-3 p-1.5 pl-2 pr-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer bg-white text-left group"
            onClick={onLogout}
            aria-label="Log out administrator"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              AD
            </div>
            <div className="hidden sm:flex flex-col">
              <b className="text-xs font-semibold text-slate-900 leading-tight">
                {adminUser.email}
              </b>
              <small className="text-[11px] font-medium text-slate-500">
                Administrator
              </small>
            </div>
            <Icon name="chevron" size={14} />
            <span className="hidden group-hover:inline text-xs font-bold text-red-600 ml-1">
              Log out
            </span>
          </button>
        ) : student ? (
          <button
            className="flex items-center gap-3 p-1.5 pl-2 pr-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer bg-white text-left group"
            onClick={onLogout}
            aria-label="Log out"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {admin ? "AM" : "AK"}
            </div>
            <div className="hidden sm:flex flex-col">
              <b className="text-xs font-semibold text-slate-900 leading-tight">
                {admin ? adminUser?.email || "Administrator" : student.fullName}
              </b>
              <small className="text-[11px] font-medium text-slate-500">
                {admin ? "Administrator" : student.registrationId}
              </small>
            </div>
            <Icon name="chevron" size={14} />
            <span className="hidden group-hover:inline text-xs font-bold text-red-600 ml-1">
              Log out
            </span>
          </button>
        ) : (
          <button
            className="h-9 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer border-none"
            onClick={onOpenLogin}
          >
            Sign In (OTP)
          </button>
        )}
      </div>
    </header>
  )
}

function StudentExportAction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const exportRegister = async () => {
    if (loading) return
    setLoading(true)
    setError("")
    try {
      const created = await authFetch(
        `${API_BASE_URL}/api/admin/reports/exports`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
        true,
      )
      const data = await created.json().catch(() => ({}))
      if (!created.ok || !data.exportId)
        throw new Error(data.error || "Unable to generate student register.")
      const download = await authFetch(
        `${API_BASE_URL}/api/admin/reports/exports/${data.exportId}/download`,
        {},
        true,
      )
      if (!download.ok)
        throw new Error("Unable to download the generated workbook.")
      const blob = await download.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = data.fileName || "kgs-student-register.xlsx"
      link.click()
      URL.revokeObjectURL(url)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to export student register.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
        disabled={loading}
        onClick={() => void exportRegister()}
      >
        {loading ? "Exporting..." : "Export Student Register"}
      </button>
      {error && <small className="text-xs font-medium text-red-600">{error}</small>}
    </div>
  )
}

function PageHead({
  admin,
  student,
  title,
  description,
  showCreateAction = true,
}: {
  admin: boolean
  student: StudentProfile | null
  title?: string
  description?: string
  showCreateAction?: boolean
}) {
  const current = new Date()
  const greeting =
    current.getHours() < 12
      ? "Good morning"
      : current.getHours() < 18
        ? "Good afternoon"
        : "Good evening"
  const localDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(current)
    .toUpperCase()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-6">
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
          {admin ? "ADMINISTRATION" : localDate}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {title ||
            (admin
              ? "Examination overview"
              : `${greeting}, ${student?.fullName || "Student"}`)}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {admin
            ? "Monitor operations and manage the examination lifecycle."
            : "Here’s what’s happening with your examinations."}
        </p>
      </div>
      {admin && title === "Student Management" ? (
        <StudentExportAction />
      ) : admin && showCreateAction ? (
        <button className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/20 flex-shrink-0 border-none">
          <Icon name="plus" />
          Create examination
        </button>
      ) : admin ? null : (
        <div className="flex items-center gap-3 p-3 px-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <small className="font-bold text-slate-400 uppercase tracking-wider">STUDENT ID</small>
          <b className="font-mono font-bold text-slate-900 text-sm">{student?.registrationId || "—"}</b>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
            <Icon name="check" size={12} /> Verified
          </span>
        </div>
      )}
    </div>
  )
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: IconName
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70">
      <div className="text-blue-600 shrink-0">
        <Icon name={icon} />
      </div>
      <div className="flex flex-col">
        <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</small>
        <b className="text-xs font-semibold text-slate-900 mt-0.5">{value}</b>
      </div>
    </div>
  )
}

export default function App() {
  const publicPath = window.location.pathname
  const [entryRoute, setEntryRoute] = useState(publicPath)
  const [admin, setAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<{
    email: string
    role: string
  } | null>(null)
  const [active, setActive] = useState("Overview")
  const [menu, setMenu] = useState(false)
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [dashboardExams, setDashboardExams] = useState<Exam[]>([])
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState("")
  const [examActionError, setExamActionError] = useState("")
  const [dashboardSummary, setDashboardSummary] = useState({
    available: 0,
    upcoming: 0,
    inProgress: 0,
    completed: 0,
    resultsPending: 0,
  })
  const [loginEmail, setLoginEmail] = useState("")

  const [viewState, setViewState] =
    useState<"DASHBOARD" | "INSTRUCTIONS" | "SYSTEM_CHECK" | "EXAM_PLAYER" | "SUBMISSION_CONFIRM" | "SUBMISSION_SUCCESS" | "RESULTS">(
      "DASHBOARD",
    )
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [activeAttemptId, setActiveAttemptId] = useState("")
  const [tab, setTab] = useState("Eligible")
  const initialStatusTabApplied = useRef(false)
  const [lastAnswers, setLastAnswers] = useState<Record<string, AnswerState>>(
    {},
  )
  const [examQuestions, setExamQuestions] =
    useState<import("./types").Question[]>([])
  const [submissionLoading, setSubmissionLoading] = useState(false)
  const [submissionError, setSubmissionError] = useState("")
  const [submittedResult, setSubmittedResult] = useState<{
    marksScored?: number
    maximumMarks?: number
    released?: boolean
  } | null>(null)

  useEffect(() => {
    if (entryRoute === "/admin/dashboard" && !admin) {
      authFetch(`${API_BASE_URL}/api/auth/admin/me`, {}, true)
        .then(async (response) => {
          if (!response.ok) throw new Error()
          const data = await response.json()
          setAdminUser(data.user)
          setAdmin(true)
        })
        .catch(() => navigateEntry("/admin"))
      return
    }
    if (entryRoute !== "/dashboard") return
    const loadDashboard = async () => {
      setDashboardLoading(true)
      setDashboardError("")
      try {
        const api = API_BASE_URL
        const [meResponse, dashboardResponse] = await Promise.all([
          authFetch(`${api}/api/auth/me`, { cache: "no-store" }),
          authFetch(`${api}/api/student/dashboard`, { cache: "no-store" }),
        ])
        if (meResponse.status === 401 || dashboardResponse.status === 401) {
          clearAuthToken()
          navigateEntry("/login")
          return
        }
        if (!meResponse.ok || !dashboardResponse.ok)
          throw new Error("Unable to load your dashboard.")
        const me = await meResponse.json()
        const dashboard = await dashboardResponse.json()
        setStudent(me.user)
        setDashboardSummary(
          dashboard.summary || {
            available: 0,
            upcoming: 0,
            inProgress: 0,
            completed: 0,
            resultsPending: 0,
          },
        )
        const mappedExams = (dashboard.exams || []).map((exam: any) => ({
          ...exam,
          id: String(exam.id || exam._id),
          examCode: exam.code || exam.examCode || String(exam.id || exam._id),
          subtitle: exam.subtitle || "KGS examination",
          scheduledDate: exam.scheduledAt
            ? new Date(exam.scheduledAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "Date to be announced",
          totalQuestions:
            exam.totalQuestions ??
            exam.questionCount ??
            exam.questionsCount ??
            0,
          totalMarks: exam.totalMarks ?? exam.maximumMarks ?? 0,
          durationMinutes: exam.durationMinutes ?? 0,
          negativeMarking: exam.negativeMarking ?? 0,
          markingScheme: exam.markingScheme,
          maxAttempts: exam.maxAttempts ?? 1,
          activeAttempt: exam.activeAttempt || null,
          integrityProfile: exam.integrityProfile,
          integrityRules: exam.integrityRules,
          instructions: exam.instructions || [],
          sections: exam.sections || [],
        }))
        setDashboardExams(mappedExams)
        if (
          !initialStatusTabApplied.current &&
          mappedExams.some((exam: any) => exam.status === "IN_PROGRESS")
        ) {
          setTab("In Progress")
          initialStatusTabApplied.current = true
        }
      } catch (error) {
        setDashboardError(
          error instanceof Error
            ? error.message
            : "Unable to load your dashboard.",
        )
      } finally {
        setDashboardLoading(false)
      }
    }
    void loadDashboard()
  }, [entryRoute])

  const switchPortal = (v: boolean) => {
    setAdmin(v)
    setActive("Overview")
    setViewState("DASHBOARD")
  }

  const navigateEntry = (path: string) => {
    window.history.pushState({}, "", path)
    setEntryRoute(path)
  }

  const handleLogout = async () => {
    try {
      await authFetch(
        `${API_BASE_URL}${
          admin ? "/api/auth/admin/logout" : "/api/auth/logout"
        }`,
        { method: "POST" },
        admin,
      )
    } finally {
      clearAuthToken()
      setStudent(null)
      setAdmin(false)
      setAdminUser(null)
      setViewState("DASHBOARD")
      navigateEntry("/")
    }
  }

  if (entryRoute === "/") {
    return (
      <LandingPage
        onStudentLogin={() => navigateEntry("/login")}
        onRegister={() => navigateEntry("/register")}
        onAdminLogin={() => navigateEntry("/admin")}
      />
    )
  }

  if (entryRoute === "/privacy")
    return (
      <PolicyPage
        eyebrow="YOUR DATA"
        title="Privacy Policy"
        summary="This policy explains what information the KGS Exam Portal processes, why it is needed, how it is protected, and the choices available to candidates."
        sections={privacySections}
        onBack={() => navigateEntry("/register")}
      />
    )

  if (entryRoute === "/monitoring-policy")
    return (
      <PolicyPage
        eyebrow="ASSESSMENT INTEGRITY"
        title="Examination Monitoring Policy"
        summary="This policy explains the monitoring signals that may be used during an assessment, candidate responsibilities, and how potential integrity events are reviewed."
        sections={monitoringSections}
        onBack={() => navigateEntry("/register")}
      />
    )

  if (
    entryRoute === "/login" ||
    entryRoute === "/register" ||
    entryRoute === "/admin"
  ) {
    if (entryRoute === "/register")
      return (
        <RegistrationPage
          onBackToLogin={() => navigateEntry("/login")}
          onRegistered={(email) => {
            setLoginEmail(email)
            navigateEntry("/login")
          }}
        />
      )
    if (entryRoute === "/login")
      return (
        <StudentLoginPage
          initialEmail={loginEmail}
          onBackToLanding={() => navigateEntry("/")}
          onRegister={() => navigateEntry("/register")}
          onAuthenticated={(stu) => {
            setStudent(stu)
            navigateEntry("/dashboard")
          }}
        />
      )
    if (entryRoute === "/admin")
      return (
        <AdminLoginPage
          onBackToLanding={() => navigateEntry("/")}
          onAuthenticated={(user) => {
            setAdminUser(user)
            setAdmin(true)
            navigateEntry("/admin/dashboard")
          }}
        />
      )
  }

  if (entryRoute === "/admin/dashboard" && !admin)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
        <h2 className="text-xl font-bold">Checking administrator session...</h2>
      </div>
    )
  if (entryRoute === "/dashboard" && dashboardLoading)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900 font-sans gap-2">
        <h2 className="text-xl font-bold">Loading your dashboard...</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">Fetching your eligible examinations.</p>
      </div>
    )
  if (entryRoute === "/dashboard" && dashboardError)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900 font-sans gap-3">
        <h2 className="text-xl font-bold text-red-600">Unable to load dashboard</h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">{dashboardError}</p>
        <button
          className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer border-none"
          onClick={() => setEntryRoute("/dashboard")}
        >
          Retry
        </button>
      </div>
    )

  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam)
    if ((exam as Exam & { status?: string }).status === "IN_PROGRESS") {
      void handleProceedToExam(exam)
      return
    }
    setViewState("INSTRUCTIONS")
  }

  const handleProceedToExam = async (examOverride?: Exam) => {
    const exam = examOverride || selectedExam
    if (!exam) return
    setExamActionError("")
    const base = API_BASE_URL
    const activeAttempt = (exam as Exam & {
      activeAttempt?: { attemptId?: string }
    }).activeAttempt
    let attemptId = activeAttempt?.attemptId
    try {
      if (!attemptId) {
        if (!exam.id)
          throw new Error("This examination has no valid identifier.")
        const start = await authFetch(`${base}/api/exams/${exam.id}/start`, {
          method: "POST",
        })
        if (!start.ok)
          throw new Error(
            (await start.json().catch(() => null))?.error ||
              "Unable to resume this examination.",
          )
        const attempt = await start.json()
        attemptId = attempt.attemptId
      }
      if (!attemptId)
        throw new Error(
          "The active examination attempt could not be identified.",
        )
      setActiveAttemptId(attemptId)
      const response = await authFetch(
        `${base}/api/attempts/${attemptId}/questions`,
      )
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => null))?.error ||
            "Unable to load the examination questions.",
        )
      const data = await response.json()
      const normalizedQuestions = (data.questions || []).map(
        (question: any, index: number) => ({
          ...question,
          id: String(question.id || question._id),
          questionText:
            question.questionText || question.text || question.question || "",
          sectionName:
            question.sectionName ||
            question.sectionTitle ||
            question.section ||
            "General",
          questionNumber: question.questionNumber || index + 1,
          options: (question.options || question.choices || []).map(
            (option: any, optionIndex: number) =>
              typeof option === "string"
                ? { id: String.fromCharCode(65 + optionIndex), text: option }
                : {
                    id: String(
                      option.id ||
                        option.value ||
                        String.fromCharCode(65 + optionIndex),
                    ),
                    text: option.text || option.label || option.value || "",
                  },
          ),
        }),
      )
      if (
        !normalizedQuestions.length ||
        normalizedQuestions.some(
          (question: any) =>
            !question.questionText.trim() ||
            !question.options.length ||
            question.options.some((option: any) => !option.text.trim()),
        )
      )
        throw new Error(
          "The assigned examination questions are incomplete. Please retry or contact support.",
        )
      setExamQuestions(normalizedQuestions)
      setViewState("EXAM_PLAYER")
    } catch (error) {
      setExamActionError(
        error instanceof Error
          ? error.message
          : "Unable to open the examination.",
      )
    }
  }

  const submitAttempt = async (answers: Record<string, AnswerState>) => {
    if (submissionLoading || !activeAttemptId) return
    setSubmissionLoading(true)
    setSubmissionError("")
    try {
      const payloadAnswers = Object.fromEntries(
        Object.entries(answers).map(([questionId, answer]) => [
          questionId,
          answer.selectedOptionId || null,
        ]),
      )
      const response = await authFetch(
        `${API_BASE_URL}/api/attempts/${activeAttemptId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: payloadAnswers }),
        },
      )
      const payload = await response.json().catch(() => ({}))
      if (!response.ok && response.status !== 409)
        throw new Error(payload.error || "Unable to submit the examination.")
      const resultResponse = await authFetch(
        `${API_BASE_URL}/api/student/results/${activeAttemptId}`,
        { cache: "no-store" },
      )
      const result = await resultResponse.json().catch(() => ({}))
      const fallbackMaximumMarks =
        selectedExam.totalMarks ||
        examQuestions.reduce((sum, question) => sum + Number(question.marks || 0), 0)
      const immediateResult = resultResponse.ok && result.released !== false
        ? {
            ...result,
            maximumMarks: result.maximumMarks ?? result.maxMarks ?? fallbackMaximumMarks,
          }
        : {
            ...payload,
            released: true,
            marksScored: payload.marksScored ?? payload.score,
            maximumMarks:
              payload.maximumMarks ??
              payload.maxMarks ??
              selectedExam.totalMarks ??
              examQuestions.reduce((sum, question) => sum + Number(question.marks || 0), 0),
          }
      setSubmittedResult(immediateResult)
      setViewState("SUBMISSION_SUCCESS")
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Unable to submit the examination.",
      )
    } finally {
      setSubmissionLoading(false)
    }
  }

  const handleSubmitExamClick = (
    answers: Record<string, AnswerState>,
    _tabSwitches: number,
    automatic = false,
  ) => {
    setLastAnswers(answers)
    if (automatic) void submitAttempt(answers)
    else setViewState("SUBMISSION_CONFIRM")
  }

  const handleConfirmFinalSubmit = async () => {
    await submitAttempt(lastAnswers)
  }

  if (viewState === "EXAM_PLAYER" && selectedExam) {
    return (
      <ExamPlayer
        exam={selectedExam}
        questions={examQuestions}
        attemptId={activeAttemptId}
        candidateName={student?.fullName}
        onSubmitExam={handleSubmitExamClick}
        onIntegrityAutoSubmit={() => void submitAttempt(lastAnswers)}
      />
    )
  }

  if (viewState === "RESULTS" && selectedExam) {
    return <ResultsView onBackToDashboard={() => setViewState("DASHBOARD")} />
  }

  if (viewState === "SUBMISSION_SUCCESS" && selectedExam) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
            <h2 className="text-xl font-bold">Loading submission confirmation...</h2>
          </div>
        }
      >
        <SubmissionConfirmation
          examTitle={selectedExam.title}
          submittedAt={new Date()}
          marksScored={
            submittedResult?.released ? submittedResult.marksScored : undefined
          }
          maximumMarks={
            submittedResult?.released ? submittedResult.maximumMarks : undefined
          }
          resultsReleased={Boolean(submittedResult?.released)}
          onBackToDashboard={() => setViewState("DASHBOARD")}
        />
      </Suspense>
    )
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 font-sans">
      {viewState === "SYSTEM_CHECK" && selectedExam && (
        <SystemCheckModal
          examTitle={selectedExam.title}
          examId={selectedExam.id}
          scheduledAt={
            (selectedExam as Exam & { scheduledAt?: string }).scheduledAt
          }
          closesAt={(selectedExam as Exam & { closesAt?: string }).closesAt}
          requirements={selectedExam.readinessRequirements}
          onClose={() => setViewState("DASHBOARD")}
          onProceedToExam={handleProceedToExam}
        />
      )}

      {viewState === "INSTRUCTIONS" && (
        <ExamInstructionsModal
          exam={selectedExam}
          onClose={() => setViewState("DASHBOARD")}
          onContinue={() => setViewState("SYSTEM_CHECK")}
        />
      )}

      {viewState === "SUBMISSION_CONFIRM" && (
        <SubmissionModal
          examTitle={selectedExam.title}
          questions={examQuestions}
          answers={lastAnswers}
          onClose={() => setViewState("EXAM_PLAYER")}
          onConfirmSubmit={handleConfirmFinalSubmit}
          submitting={submissionLoading}
          error={submissionError}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`shrink-0 ${menu ? "block" : "hidden lg:block"}`}>
        <Sidebar
          admin={admin}
          active={active}
          onNav={(v) => {
            setActive(v)
            setMenu(false)
            setViewState("DASHBOARD")
          }}
        />
      </div>

      {/* Mobile Backdrop Scrim */}
      {menu && (
        <button
          className="fixed inset-0 z-20 bg-slate-900/60 backdrop-blur-sm lg:hidden border-none"
          onClick={() => setMenu(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar
          admin={admin}
          setAdmin={switchPortal}
          student={student}
          adminUser={adminUser}
          onOpenLogin={() => navigateEntry("/login")}
          openMenu={() => setMenu(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:px-9">
          {!admin && (active === "My examinations" || active === "Examinations") && viewState === "DASHBOARD" ? (
            <StudentExaminations
              onStartExam={handleStartExam}
              onViewMarks={(exam) => {
                setSelectedExam(exam)
                setViewState("RESULTS")
              }}
            />
          ) : !admin && active === "Results" && viewState === "DASHBOARD" ? (
            <ResultsView onBackToDashboard={() => setActive("Overview")} />
          ) : admin && active === "Students" && viewState === "DASHBOARD" ? (
            <AdminStudents />
          ) : admin &&
            active === "Examinations" &&
            viewState === "DASHBOARD" ? (
            <ExaminationsPage Icon={Icon} PageHead={PageHead} />
          ) : admin &&
            active === "Question bank" &&
            viewState === "DASHBOARD" ? (
            <QuestionBankPage Icon={Icon} PageHead={PageHead} />
          ) : admin && active === "Paper sets" && viewState === "DASHBOARD" ? (
            <PaperSetsPage Icon={Icon} PageHead={PageHead} />
          ) : admin &&
            active === "Live monitoring" &&
            viewState === "DASHBOARD" ? (
            <LiveMonitoringPage PageHead={PageHead} />
          ) : admin && active === "Results" && viewState === "DASHBOARD" ? (
            <ResultsPage PageHead={PageHead} />
          ) : active === "Overview" && viewState === "DASHBOARD" ? (
            admin ? (
              <AdminDashboard />
            ) : (
              <StudentDashboard
                student={student}
                exams={dashboardExams}
                summary={dashboardSummary}
                activeTab={tab}
                setTab={setTab}
                examActionError={examActionError}
                onStartExam={handleStartExam}
                onViewResults={() => {
                  setSelectedExam(dashboardExams[0])
                  setViewState("RESULTS")
                }}
              />
            )
          ) : !admin && viewState === "DASHBOARD" ? (
            <StudentDashboard
              student={student}
              exams={dashboardExams}
              summary={dashboardSummary}
              activeTab={tab}
              setTab={setTab}
              examActionError={examActionError}
              onStartExam={handleStartExam}
              onViewResults={() => {
                setSelectedExam(dashboardExams[0])
                setViewState("RESULTS")
              }}
            />
          ) : (
            <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-3">
              <Icon name={admin ? "settings" : "book"} size={36} />
              <h2 className="text-xl font-bold text-slate-900 m-0">{active}</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md m-0">
                This module is fully configured in the KGS portal prototype.
                Return to Overview to explore the primary student flow.
              </p>
              <button
                className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none mt-2"
                onClick={() => setActive("Overview")}
              >
                Back to overview
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function AdminStudents() {
  const importPreviewDuplicates = useRef({ count: 0, invalid: 0 })
  const api = API_BASE_URL
  const [students, setStudents] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({
    page: 1,
    pages: 1,
    total: 0,
  })
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [college, setCollege] = useState("")
  const [colleges, setColleges] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modal, setModal] = useState<"add" | "edit" | "import" | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    branch: "",
    passOutYear: String(new Date().getFullYear()),
  })
  const [message, setMessage] = useState("")
  const [importRows, setImportRows] = useState<any[]>([])
  const [importInvalid, setImportInvalid] = useState<any[]>([])
  const [importFileName, setImportFileName] = useState("")

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await authFetch(
        `${api}/api/admin/students?page=${page}&search=${encodeURIComponent(search)}&status=${status}&college=${encodeURIComponent(college)}`,
        {},
        true,
      )
      if (!response.ok) throw new Error("Unable to load students.")
      const data = await response.json()
      setStudents(data.students || [])
      setColleges(data.colleges || [])
      setPagination(data.pagination || {})
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load students.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [page, status, college])

  const submit = async (event: any) => {
    event.preventDefault()
    setMessage("")
    const endpoint = selected
      ? `${api}/api/admin/students/${selected.id}`
      : `${api}/api/admin/students`
    const response = await authFetch(
      endpoint,
      {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selected ? { ...form, accountStatus: selected.accountStatus } : form,
        ),
      },
      true,
    )
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(data.error || "Unable to save student.")
    setModal(null)
    setSelected(null)
    setMessage("Student saved successfully.")
    void load()
  }

  const parseFile = async (event: any) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportFileName(file.name)
    const reader = new FileReader()
    reader.onload = async () => {
      const response = await authFetch(
        `${api}/api/admin/students/import-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileBase64: reader.result,
          }),
        },
        true,
      )
      const data = await response.json().catch(() => ({}))
      if (!response.ok)
        return setMessage(data.error || "Unable to read import file.")
      const validation = await authFetch(
        `${api}/api/admin/students/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: data.rows || [], confirm: false }),
        },
        true,
      )
      const checked = await validation.json().catch(() => ({}))
      setImportRows(checked.rows || [])
      setImportInvalid([
        ...(checked.invalid || []),
        ...(checked.duplicates || []),
      ])
    }
    reader.readAsDataURL(file)
  }

  const confirmImport = async () => {
    const response = await authFetch(
      `${api}/api/admin/students/import`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: importRows, confirm: true }),
      },
      true,
    )
    const data = await response.json().catch(() => ({}))
    setMessage(
      response.ok
        ? `${data.imported || 0} imported · ${(data.duplicates || []).length} duplicates skipped · ${(data.invalid || []).length} invalid records.`
        : data.error || "Import failed.",
    )
    if (response.ok) {
      setModal(null)
      setImportRows([])
      setImportInvalid([])
      void load()
    }
  }

  return (
    <>
      <PageHead
        admin
        student={null}
        title="Student Management"
        description="Manage registered students and account activation."
        showCreateAction={false}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Student Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Manage registered students and account activation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            onClick={() => {
              setModal("import")
              setMessage("")
            }}
          >
            Import CSV/XLSX
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-sm shadow-blue-500/20 border-none"
            onClick={() => {
              setSelected(null)
              setForm({
                fullName: "",
                email: "",
                phone: "",
                college: "",
                branch: "",
                passOutYear: String(new Date().getFullYear()),
              })
              setModal("add")
              setMessage("")
            }}
          >
            <Icon name="plus" />
            Add student
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3.5 px-4 mb-6 text-xs sm:text-sm font-semibold rounded-xl border border-blue-200/80 bg-blue-50 text-blue-800 shadow-sm">
          {message}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) =>
            event.key === "Enter" && (setPage(1), void load())
          }
          placeholder="Search ID, name, or email"
          className="flex-1 min-w-[200px] h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        />
        <select
          value={college}
          onChange={(event) => {
            setCollege(event.target.value)
            setPage(1)
          }}
          className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
        >
          <option value="">All colleges</option>
          {colleges.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name} ({item.count})
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
          className="h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Inactive</option>
        </select>
        <button
          className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          onClick={() => {
            setPage(1)
            void load()
          }}
        >
          Search
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-100 bg-slate-50/50 text-xs sm:text-sm">
          <strong className="font-bold text-slate-900">{pagination.total || 0} registered students</strong>
          <span className="font-semibold text-slate-500">{colleges.length} colleges</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500">
            Loading students...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-red-600 flex flex-col items-center gap-2">
            <p>{error}</p>
            <button
              className="h-9 px-4 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500">
            No students match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Student ID</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Name</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Email</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">College</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Branch</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Status</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Registered</th>
                  <th className="px-4 py-3.5 font-bold text-slate-600 border-b border-slate-200/80">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600">{student.studentId}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{student.fullName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{student.email}</td>
                    <td className="px-4 py-3.5 text-slate-600">{student.college || "—"}</td>
                    <td className="px-4 py-3.5 text-slate-600">{student.branch || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          student.accountStatus === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {student.accountStatus === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors bg-transparent border-none p-0"
                        onClick={() => {
                          setSelected(student)
                          setForm({
                            fullName: student.fullName,
                            email: student.email,
                            phone: student.phone || "",
                            college: student.college || "",
                            branch: student.branch || "",
                            passOutYear: String(
                              student.passOutYear || new Date().getFullYear(),
                            ),
                          })
                          setModal("edit")
                        }}
                      >
                        View / Edit
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
          <span>{pagination.total || 0} students</span>
          <div className="flex items-center gap-3">
            <button
              className="h-8 px-3 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>
              Page {page} of {pagination.pages || 1}
            </span>
            <button
              className="h-8 px-3 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              disabled={page >= (pagination.pages || 1)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit / Import Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-[620px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900">
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none z-10"
              onClick={() => setModal(null)}
            >
              ×
            </button>

            {modal === "import" ? (
              <div className="p-5 sm:p-7 flex flex-col gap-4 overflow-y-auto min-h-0 flex-1 text-xs sm:text-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Import students</h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Upload a CSV or XLSX with Full Name, Email Address, Phone,
                    College Name, Branch, and Pass-out Year columns.
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={parseFile}
                  className="p-3 border border-slate-200 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-700 cursor-pointer"
                />
                {importRows.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                    <span>{importRows.length} rows ready for confirmation.</span>
                    <button
                      className="h-9 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer border-none"
                      onClick={() => void confirmImport()}
                    >
                      Confirm import
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col min-h-0 flex-1">
                <div className="p-5 sm:p-7 overflow-y-auto flex flex-col gap-4 text-xs sm:text-sm flex-1">
                  <h2 className="text-xl font-bold text-slate-900">
                    {selected ? "Edit student" : "Add student"}
                  </h2>

                  {selected && (
                    <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                      Student ID
                      <input
                        readOnly
                        value={selected.studentId || ""}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed shadow-sm"
                      />
                    </label>
                  )}

                  <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                    Full Name
                    <input
                      required
                      minLength={2}
                      value={form.fullName}
                      onChange={(event) =>
                        setForm({ ...form, fullName: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                    Email Address
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                    Phone Number
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(event) =>
                        setForm({ ...form, phone: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                    College Name
                    <input
                      required
                      value={form.college}
                      onChange={(event) =>
                        setForm({ ...form, college: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                    Branch
                    <input
                      required
                      value={form.branch}
                      onChange={(event) =>
                        setForm({ ...form, branch: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                    Pass-out Year
                    <select
                      required
                      value={form.passOutYear}
                      onChange={(event) =>
                        setForm({ ...form, passOutYear: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                    >
                      {Array.from(
                        { length: 21 },
                        (_, i) => new Date().getFullYear() - 10 + i,
                      ).map((year) => (
                        <option key={year}>{year}</option>
                      ))}
                    </select>
                  </label>

                  {selected && (
                    <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                      Status
                      <select
                        value={selected.accountStatus}
                        onChange={(event) =>
                          setSelected({
                            ...selected,
                            accountStatus: event.target.value,
                          })
                        }
                        className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Inactive</option>
                      </select>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50 flex-none">
                  <button
                    type="button"
                    className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
                    onClick={() => {
                      setModal(null)
                      setSelected(null)
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-sm shadow-blue-500/20 border-none"
                    type="submit"
                  >
                    {selected ? "Save Changes" : "Save student"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function StudentDashboard({
  student,
  exams,
  summary,
  activeTab,
  setTab,
  examActionError,
  onStartExam,
  onViewResults,
}: {
  student: StudentProfile | null
  exams: Exam[]
  summary: {
    available: number
    upcoming: number
    completed: number
    resultsPending: number
  }
  activeTab: string
  setTab: (t: string) => void
  examActionError: string
  onStartExam: (exam: Exam) => void
  onViewResults: () => void
}) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const heroExam = exams[0]
  if (!heroExam)
    return (
      <div className="p-12 text-center text-xs sm:text-sm text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-1.5">
        <h2 className="text-xl font-bold text-slate-900 m-0">No eligible examinations</h2>
        <p className="font-medium text-slate-500 m-0">There are no examinations available for your account right now.</p>
      </div>
    )

  const serverExam = heroExam as Exam & {
    scheduledAt?: string
    closesAt?: string
    status?: string
    activeAttempt?: { deadline?: string } | null
  }
  const secondsToStart = Math.max(
    0,
    serverExam.scheduledAt
      ? Math.ceil((new Date(serverExam.scheduledAt).getTime() - now) / 1000)
      : 0,
  )
  const readinessWindowOpen =
    !serverExam.scheduledAt || secondsToStart <= 15 * 60
  const status = serverExam.status || "UPCOMING"
  const secondsRemaining = Math.max(
    0,
    serverExam.activeAttempt?.deadline
      ? Math.ceil(
          (new Date(serverExam.activeAttempt.deadline).getTime() - now) / 1000,
        )
      : 0,
  )
  const requirements = serverExam.readinessRequirements || {}

  const systemCheckPassed =
    typeof window !== "undefined" &&
    Boolean(
      heroExam.id &&
        localStorage.getItem(`kgs_readiness_${heroExam.id}`) === "PASSED",
    )
  const profileDone = Boolean(student?.profileVerified)
  const browserDone =
    typeof window !== "undefined" &&
    Boolean(
      window.fetch &&
        window.localStorage &&
        document.documentElement?.requestFullscreen,
    )
  const networkDone =
    typeof navigator !== "undefined" ? navigator.onLine !== false : true
  const cameraDone = !requirements.camera || systemCheckPassed

  const readiness = {
    profile: profileDone,
    browser: browserDone,
    network: networkDone,
    camera: cameraDone,
  }

  const checksList = [profileDone, browserDone, networkDone, cameraDone]
  const completedCount = checksList.filter(Boolean).length
  const readinessScore = Math.round((completedCount / checksList.length) * 100)

  const days = Math.floor(secondsToStart / 86400)
  const hours =
    days > 0
      ? Math.floor((secondsToStart % 86400) / 3600)
      : Math.floor(secondsToStart / 3600)
  const mins = Math.floor((secondsToStart % 3600) / 60)
  const secs = secondsToStart % 60

  const statusForTab: Record<string, string[]> = {
    Eligible: ["AVAILABLE"],
    Upcoming: ["UPCOMING"],
    "In Progress": ["IN_PROGRESS"],
    Completed: ["SUBMITTED", "COMPLETED"],
    "Results pending": ["RESULTS_PENDING"],
  }
  const visibleExams = exams.filter((exam) =>
    (statusForTab[activeTab] || []).includes(String(exam.status)),
  )

  return (
    <>
      <PageHead admin={false} student={student} />

      {examActionError && (
        <div className="p-3.5 px-4 mb-6 text-xs sm:text-sm font-semibold rounded-xl border flex items-center justify-between gap-3 text-red-800 bg-red-50 border-red-200/80 shadow-sm" role="alert">
          <div>
            <strong className="block font-bold">
              {status === "EXPIRED" || status === "CLOSED"
                ? "Examination ended"
                : "Examination unavailable"}
            </strong>
            <span className="text-xs font-normal">{examActionError}</span>
          </div>
          {status !== "EXPIRED" && status !== "CLOSED" && (
            <button
              className="h-8 px-3 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => onStartExam(heroExam)}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Hero Exam Card */}
      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6 grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        <div className="p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {status}
            </span>
            <small className="font-mono text-xs text-slate-500">
              Registration ID: {heroExam.examCode}
            </small>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight m-0">{heroExam.title}</h2>
          <p className="text-sm text-slate-600 font-medium m-0">{heroExam.subtitle}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
            <Meta icon="calendar" label="EXAM DATE" value={heroExam.scheduledDate} />
            <Meta icon="clock" label="DURATION" value={`${heroExam.durationMinutes} minutes`} />
            <Meta icon="file" label="QUESTIONS" value={`${heroExam.totalQuestions} questions`} />
            <Meta icon="result" label="MAX. MARKS" value={`${heroExam.totalMarks} marks`} />
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-slate-50/80 border-t lg:border-t-0 lg:border-l border-slate-200/80 flex flex-col justify-between gap-6 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <small className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {status === "IN_PROGRESS"
                ? "TIME REMAINING"
                : status === "AVAILABLE"
                  ? "EXAMINATION STATUS"
                  : status === "EXPIRED" || status === "CLOSED"
                    ? "EXAMINATION STATUS"
                    : "STARTS IN"}
            </small>
            {status === "IN_PROGRESS" ? (
              <div className="text-2xl font-extrabold font-mono text-slate-900">
                {String(Math.floor(secondsRemaining / 3600)).padStart(2, "0")}:
                {String(Math.floor((secondsRemaining % 3600) / 60)).padStart(2, "0")}:
                {String(secondsRemaining % 60).padStart(2, "0")}
              </div>
            ) : status === "AVAILABLE" ? (
              <div className="text-xl font-extrabold text-emerald-700">Available Now</div>
            ) : status === "RESULTS_PENDING" ? (
              <div className="text-sm font-bold text-amber-700" role="status">
                Results Awaiting Release
              </div>
            ) : [
                "SUBMITTED",
                "COMPLETED",
                "RESULTS_RELEASED",
                "EXPIRED",
                "CLOSED",
              ].includes(status) ? (
              <div className="text-sm font-bold text-slate-700" role="status">
                Examination Completed
              </div>
            ) : status === "CLOSED" ? (
              <div className="text-sm font-bold text-slate-700">This examination has ended.</div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <div className="text-xl font-extrabold font-mono text-slate-900">
                  <b>{String(days > 0 ? days : hours).padStart(2, "0")}</b>:
                  <b>{String(days > 0 ? hours : mins).padStart(2, "0")}</b>:
                  <b>{String(days > 0 ? mins : secs).padStart(2, "0")}</b>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {days > 0
                    ? "DAYS : HOURS : MINS"
                    : "HOURS : MINS : SECS"}
                </span>
              </div>
            )}
          </div>

          {status !== "EXPIRED" && (
            <button
              className="h-11 w-full px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 border-none"
              disabled={
                status === "CLOSED" ||
                status === "SUBMITTED" ||
                status === "RESULTS_PENDING"
              }
              onClick={() =>
                status === "RESULTS_RELEASED"
                  ? onViewResults()
                  : onStartExam(heroExam)
              }
            >
              {status === "IN_PROGRESS"
                ? "Resume Examination"
                : status === "RESULTS_RELEASED"
                  ? "View Marks"
                  : status === "CLOSED"
                    ? "This examination has ended."
                    : status === "SUBMITTED" || status === "RESULTS_PENDING"
                      ? "Results Awaiting Release"
                      : "Launch Exam Check"}{" "}
              {!["CLOSED", "SUBMITTED", "RESULTS_PENDING"].includes(
                status,
              ) && <Icon name="arrow" />}
            </button>
          )}

          {status === "UPCOMING" && (
            <small className="text-xs text-slate-500 font-medium">
              {readinessWindowOpen
                ? "System check available now"
                : "Available 15 minutes before start"}
            </small>
          )}
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">My examinations</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 m-0">Track your registered assessments</p>
            </div>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer border-none bg-transparent flex items-center gap-1">
              View all <Icon name="arrow" size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60 scrollbar-thin">
            {[
              "Eligible",
              "Upcoming",
              "In Progress",
              "Completed",
              "Results pending",
            ].map((x, i) => (
              <button
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none whitespace-nowrap ${
                  activeTab === x
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
                onClick={() => setTab(x)}
                key={x}
              >
                {x}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === x ? "bg-blue-100 text-blue-700" : "bg-slate-200/80 text-slate-600"}`}>
                  {
                    [
                      summary.available,
                      summary.upcoming,
                      summary.inProgress,
                      summary.completed,
                      summary.resultsPending,
                    ][i]
                  }
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {visibleExams.length === 0 ? (
              <div className="py-12 text-center text-xs sm:text-sm text-slate-500 flex flex-col items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900">No {activeTab.toLowerCase()} examinations</h3>
                <p className="font-medium text-slate-500 m-0">
                  Examinations in this category will appear here when available.
                </p>
              </div>
            ) : (
              visibleExams.map((ex) => (
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm" key={ex.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 flex flex-col items-center justify-center font-bold shrink-0">
                      <b className="text-sm leading-none">
                        {ex.scheduledAt
                          ? new Date(ex.scheduledAt).toLocaleDateString(
                              undefined,
                              { day: "2-digit" },
                            )
                          : "—"}
                      </b>
                      <span className="text-[9px] uppercase tracking-wider text-blue-600">
                        {ex.scheduledAt
                          ? new Date(ex.scheduledAt)
                              .toLocaleDateString(undefined, { month: "short" })
                              .toUpperCase()
                          : "TBD"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base m-0">{ex.title}</h4>
                      <p className="text-xs text-slate-500 font-medium m-0 flex items-center gap-1.5">
                        <Icon name="clock" size={13} />
                        {ex.durationMinutes} minutes · {ex.totalQuestions} questions · {ex.totalMarks} marks
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {ex.status}
                    </span>
                    {ex.status === "COMPLETED" ? (
                      <button className="h-9 px-3.5 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm" onClick={onViewResults}>
                        View Scorecard
                      </button>
                    ) : (
                      <button
                        className="h-9 px-3.5 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
                        onClick={() => onStartExam(ex)}
                      >
                        Review details
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Readiness Sidebar */}
        <aside className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 m-0">Exam readiness</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 m-0">Complete before exam day</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs flex items-center justify-center">
              {readinessScore}%
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              ["Profile verified", readiness.profile, readiness.profile ? "Identity details confirmed" : "Profile unavailable"],
              ["Browser compatible", readiness.browser, readiness.browser ? "Browser capabilities confirmed" : "Incompatible browser"],
              ["Network stable", readiness.network, readiness.network ? "Online connection verified" : "Network offline"],
              [
                requirements.camera ? "Camera permission required" : "Camera not required",
                readiness.camera,
                requirements.camera ? (systemCheckPassed ? "Camera permission confirmed" : "Complete during system check") : "Not configured for this exam",
              ],
            ].map(([label, isDone, desc]) => (
              <div className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${isDone ? "bg-emerald-50/60 border-emerald-200/80 text-emerald-900" : "bg-amber-50/60 border-amber-200/80 text-amber-900"}`} key={String(label)}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isDone ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"}`}>
                  {isDone ? <Icon name="check" size={12} /> : "!"}
                </span>
                <div className="flex flex-col">
                  <b className="font-bold text-xs">{label}</b>
                  <small className="text-[11px] opacity-80 mt-0.5 font-medium">{desc}</small>
                </div>
              </div>
            ))}
          </div>

          <button
            className="h-10 w-full px-4 text-xs font-semibold rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer mt-1"
            onClick={() => onStartExam(heroExam)}
          >
            {readinessScore === 100
              ? "Re-run system check"
              : "Run system check"}
          </button>
        </aside>
      </section>

      {/* Security Banner Notice */}
      <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-700">
        <div className="flex items-center gap-3">
          <div className="text-blue-600 shrink-0"><Icon name="shield" size={20} /></div>
          <div>
            <b className="font-bold text-slate-900 block">Your exam environment is protected</b>
            <p className="text-slate-500 font-medium text-xs m-0 mt-0.5">
              Activity may be monitored according to exam policy. Your data is
              encrypted and handled securely.
            </p>
          </div>
        </div>
        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer border-none bg-transparent p-0 shrink-0">
          Learn policy
        </button>
      </div>
    </>
  )
}

function AdminDashboard() {
  const [range, setRange] = useState<"week" | "month" | "quarter">("month")
  const [dashboard, setDashboard] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/admin/dashboard?range=${range}`,
        {},
        true,
      )
      if (!response.ok)
        throw new Error("Unable to load administrator dashboard.")
      setDashboard(await readApiJson(response))
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load administrator dashboard.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [range])

  if (loading)
    return (
      <div className="p-12 text-center text-xs sm:text-sm font-medium text-slate-500 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 m-0">Loading administrator dashboard...</h2>
      </div>
    )
  if (error)
    return (
      <div className="p-12 text-center text-xs sm:text-sm font-medium text-red-600 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900 m-0">Unable to load administrator dashboard</h2>
        <p className="m-0">{error}</p>
        <button className="h-9 px-4 text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer border-none" onClick={() => void load()}>
          Retry
        </button>
      </div>
    )

  const stats = dashboard?.stats || {}
  const chart = dashboard?.chart || { registrations: [], completed: [] }
  const activity = dashboard?.activity || []
  const registrationMap = new Map(
    (chart.registrations || []).map((item: any) => [item._id, item.count]),
  )
  const completedMap = new Map(
    (chart.completed || []).map((item: any) => [item._id, item.count]),
  )
  const dates = [
    ...new Set([...registrationMap.keys(), ...completedMap.keys()]),
  ].sort()
  const max = Math.max(
    1,
    ...dates.map((date) =>
      Math.max(
        Number(registrationMap.get(date) || 0),
        Number(completedMap.get(date) || 0),
      ),
    ),
  )
  const dashboardKpis = [
    ["users", "Registrations", stats.registrations],
    ["book", "Active exams", stats.activeExams],
    ["pulse", "Active attempts", stats.activeAttempts],
    ["result", "Completed attempts", stats.completedAttempts],
    ["review", "Pending reviews", stats.pendingReviews],
    [
      "download",
      "Latest export",
      stats.latestExport
        ? new Date(stats.latestExport).toLocaleString()
        : "None",
    ],
  ] as const

  return (
    <>
      <PageHead admin student={null} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Icon name="pulse" />
          </span>
          <div>
            <b className="block text-sm font-bold text-slate-900">{stats.activeExams || 0} examinations currently live</b>
            <small className="text-xs text-slate-500 font-medium">
              {stats.activeAttempts || 0} active attempts · Database-backed status
            </small>
          </div>
        </div>
        <select
          className="h-9 px-3 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
          value={range}
          onChange={(event) => setRange(event.target.value as typeof range)}
          aria-label="Dashboard date range"
        >
          <option value="week">This week</option>
          <option value="month">Last 30 days</option>
          <option value="quarter">Last 90 days</option>
        </select>
      </div>

      {/* KPI Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {dashboardKpis.map(([icon, label, value]) => (
          <article className="flex flex-col p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all" key={label}>
            <div className="text-blue-600 mb-2">
              <Icon name={icon} />
            </div>
            <small className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</small>
            <strong className="text-lg sm:text-xl font-extrabold text-slate-900 leading-none">{value ?? 0}</strong>
          </article>
        ))}
      </section>

      {/* Grid: Chart & Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 m-0">Participation overview</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 m-0">Registrations and completed attempts in the selected period</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0" /> Registered</span>
              <span className="flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" /> Completed</span>
            </div>
          </div>
          {dates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium">
              No registration or completed-attempt history for this period.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 text-xs">
              {dates.map((date) => (
                <div className="grid grid-cols-[80px_1fr] items-center gap-3" key={date}>
                  <span className="text-slate-500 font-medium">
                    {new Intl.DateTimeFormat(undefined, {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(`${date}T00:00:00`))}
                  </span>
                  <div className="flex flex-col gap-1">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${(Number(registrationMap.get(date) || 0) / max) * 100}%`,
                      }}
                      title={`Registered: ${registrationMap.get(date) || 0}`}
                    />
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${(Number(completedMap.get(date) || 0) / max) * 100}%`,
                      }}
                      title={`Completed: ${completedMap.get(date) || 0}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 m-0">Recent activity</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5 m-0">Latest recorded audit events</p>
          </div>
          {activity.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 font-medium">
              No audit activity recorded for this period.
            </div>
          ) : (
            activity.map((item: any) => (
              <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-none text-xs" key={item.id}>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                  {String(item.actorRole || "AD").slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <b className="font-semibold text-slate-900 truncate">{item.action || "Administrative action"}</b>
                  <span className="text-slate-500 text-[11px]">{item.entityType || "System event"}</span>
                </div>
                <small className="text-slate-400 font-medium text-[11px] shrink-0">
                  {item.recordedAt
                    ? new Date(item.recordedAt).toLocaleString()
                    : "—"}
                </small>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  )
}
