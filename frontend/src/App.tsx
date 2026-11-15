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
import { AboutPage } from "./components/public/AboutPage"
import {
  PolicyPage,
  monitoringSections,
  placementPolicySections,
  privacySections,
} from "./components/public/PolicyPage"
import { RegistrationPage } from "./components/auth/RegistrationPage"
import { StudentLoginPage } from "./components/auth/StudentLoginPage"
import { StudentExaminations } from "./components/student/StudentExaminations"
import { QuestionBankPage } from "./components/admin/QuestionBankPage"
import { PaperSetsPage } from "./components/admin/PaperSetsPage"
import { ExaminationsPage } from "./components/admin/ExaminationsPage"
import { LiveMonitoringPage } from "./components/admin/LiveMonitoringPage"
import { ResultsPage } from "./components/admin/ResultsPage"
import { FeedbackPage } from "./components/admin/FeedbackPage"
import { AdministratorsPage } from "./components/admin/AdministratorsPage"

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
  ["book", "My examinations", "all"],
] as const

const adminNav = [
  ["grid", "Overview"],
  ["book", "Examinations"],
  ["review", "Question bank"],
  ["file", "Paper sets"],
  ["users", "Students"],
  ["users", "Administrators"],
  ["pulse", "Live monitoring"],
  ["result", "Results"],
  ["help", "Feedback"],
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
  studentVerified = false,
}: {
  admin: boolean
  active: string
  onNav: (v: string) => void
  studentVerified?: boolean
}) {
  const nav = admin
    ? adminNav.map(([icon, label]) => [icon, label, "all"] as const)
    : studentNav.filter(([, , access]) => access === "all" || studentVerified)
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
          © {new Date().getFullYear()} Kaizentrix Global Solutions
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
  const studentInitials = student?.fullName
    ?.split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-16 px-4 sm:px-8 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between gap-4">
      {admin && (
        <button
          className="lg:hidden flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer border-none bg-transparent"
          onClick={openMenu}
          aria-label="Open menu"
        >
          <Icon name="menu" />
        </button>
      )}

      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>All systems operational</span>
      </div>

      <div className="flex items-center gap-3 ml-auto">
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
            className="flex items-center gap-3 p-1.5 pl-2 pr-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer bg-white text-left group shadow-sm"
            onClick={onLogout}
            aria-label="Log out"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {admin ? "AM" : studentInitials || "ST"}
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

function StudentExportAction({
  college = [],
  search = "",
  status = "",
}: {
  college?: string[]
  search?: string
  status?: string
}) {
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
          body: JSON.stringify({
            ...(college.length ? { college } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
            ...(status ? { status } : {}),
          }),
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
  selectedCollege = [],
  selectedSearch = "",
  selectedStatus = "",
}: {
  admin: boolean
  student: StudentProfile | null
  title?: string
  description?: string
  showCreateAction?: boolean
  selectedCollege?: string[]
  selectedSearch?: string
  selectedStatus?: string
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
        <StudentExportAction
          college={selectedCollege}
          search={selectedSearch}
          status={selectedStatus}
        />
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
  const [active, setActive] = useState("My examinations")
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
  const [dashboardRefresh, setDashboardRefresh] = useState(0)

  const [viewState, setViewState] =
    useState<"DASHBOARD" | "INSTRUCTIONS" | "SYSTEM_CHECK" | "EXAM_LOADING" | "EXAM_PLAYER" | "SUBMISSION_CONFIRM" | "SUBMISSION_SUCCESS" | "RESULTS">(
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
          setActive("Overview")
        })
        .catch(() => navigateEntry("/login"))
      return
    }
    if (entryRoute !== "/dashboard") return
    const loadDashboard = async () => {
      setDashboardLoading(true)
      setDashboardError("")
      try {
        const meResponse = await authFetch(`${API_BASE_URL}/api/auth/me`, {
          cache: "no-store",
        })
        if (meResponse.status === 401) {
          clearAuthToken()
          navigateEntry("/login")
          return
        }
        if (!meResponse.ok) throw new Error("Unable to load your session.")
        const me = await meResponse.json()
        setStudent(me.user)
      } catch (error) {
        setDashboardError(
          error instanceof Error
            ? error.message
            : "Unable to load your session.",
        )
      } finally {
        setDashboardLoading(false)
      }
    }
    void loadDashboard()
  }, [entryRoute, dashboardRefresh])

  const switchPortal = (v: boolean) => {
    setAdmin(v)
    setActive(v ? "Overview" : "My examinations")
    setViewState("DASHBOARD")
  }

  const navigateEntry = (path: string) => {
    window.history.pushState({}, "", path)
    setEntryRoute(path)
  }

  const handleLogout = async () => {
    const logoutUrl = `${API_BASE_URL}${admin ? "/api/auth/admin/logout" : "/api/auth/logout"}`
    void authFetch(logoutUrl, { method: "POST" }, admin).catch(() => undefined)
    clearAuthToken()
    setStudent(null)
    setAdmin(false)
    setAdminUser(null)
    setViewState("DASHBOARD")
    navigateEntry("/")
  }

  if (entryRoute === "/") {
    return (
      <LandingPage
        onLogin={() => navigateEntry("/login")}
        onAdminLogin={() => navigateEntry("/login")}
        onRegister={() => navigateEntry("/register")}
      />
    )
  }

  if (entryRoute === "/about")
    return (
      <AboutPage
        onBackToLanding={() => navigateEntry("/")}
        onLogin={() => navigateEntry("/login")}
      />
    )

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

  if (entryRoute === "/placement-policy")
    return (
      <PolicyPage
        eyebrow="PLACEMENT SUPPORT"
        title="Placement Policy"
        summary="Learn how placement support works, what students are responsible for, and how employers make final selection decisions."
        sections={placementPolicySections}
        onBack={() => navigateEntry("/")}
        backLabel="Back to home"
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
    if (entryRoute === "/login" || entryRoute === "/admin")
      return (
        <StudentLoginPage
          initialEmail={loginEmail}
          onBackToLanding={() => navigateEntry("/")}
          onRegister={() => navigateEntry("/register")}
          onAuthenticated={(user) => {
            if (user.role === "ADMIN") {
              setAdminUser(user)
              setAdmin(true)
              setActive("Overview")
              navigateEntry("/admin/dashboard")
            } else {
              setStudent(user)
              setActive("My examinations")
              navigateEntry("/dashboard")
            }
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
    setViewState("EXAM_LOADING")
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
      setViewState("DASHBOARD")
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
      setDashboardRefresh((value) => value + 1)
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

  if (viewState === "EXAM_LOADING" && selectedExam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-950 p-6 text-center font-sans text-white">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-4 border-blue-400/20" />
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-400" />
          <span className="text-sm font-black tracking-tight text-blue-300">KGS</span>
        </div>
        <div>
          <h2 className="text-xl font-bold">Opening exam environment</h2>
          <p className="mt-2 text-sm font-medium text-slate-400">
            Loading your secure questions and active attempt…
          </p>
        </div>
      </div>
    )
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
          attemptId={activeAttemptId}
          submittedAt={new Date()}
          marksScored={
            submittedResult?.released ? submittedResult.marksScored : undefined
          }
          maximumMarks={
            submittedResult?.released ? submittedResult.maximumMarks : undefined
          }
          resultsReleased={Boolean(submittedResult?.released)}
          onBackToDashboard={() => setViewState("DASHBOARD")}
          onFeedbackSubmitted={() => void handleLogout()}
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
      {admin && active !== "Overview" && (
        <div className={`shrink-0 ${menu ? "block" : "hidden lg:block"}`}>
          <Sidebar
            admin
            active={active}
            onNav={(v) => {
              setActive(v)
              setMenu(false)
              setViewState("DASHBOARD")
            }}
          />
        </div>
      )}

      {/* Mobile Backdrop Scrim */}
      {menu && active !== "Overview" && (
        <button
          className="fixed inset-0 z-20 bg-slate-900/60 backdrop-blur-sm lg:hidden border-none"
          onClick={() => setMenu(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="min-w-0 flex-1 flex flex-col">
        {(!admin || active !== "Overview") && (
          <Topbar
            admin={admin}
            setAdmin={switchPortal}
            student={student}
            adminUser={adminUser}
            onOpenLogin={() => navigateEntry("/login")}
            openMenu={() => setMenu(true)}
            onLogout={handleLogout}
          />
        )}

        <main className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:px-9">
          {!admin && viewState === "DASHBOARD" ? (
            <StudentExaminations
              onStartExam={handleStartExam}
              onViewMarks={(exam) => {
                setSelectedExam(exam)
                setViewState("RESULTS")
              }}
            />
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
          ) : admin && active === "Feedback" && viewState === "DASHBOARD" ? (
            <FeedbackPage PageHead={PageHead} />
          ) : admin && active === "Administrators" && viewState === "DASHBOARD" ? (
            <AdministratorsPage PageHead={PageHead} />
          ) : active === "Overview" && viewState === "DASHBOARD" ? (
            admin ? (
              <AdminDashboard
                active={active}
                onNav={setActive}
                adminUser={adminUser}
                onLogout={handleLogout}
              />
            ) : (
              <StudentExaminations
                onStartExam={handleStartExam}
                onViewMarks={(exam) => {
                  setSelectedExam(exam)
                  setViewState("RESULTS")
                }}
              />
            )
          ) : !admin && viewState === "DASHBOARD" ? (
            <StudentExaminations
              onStartExam={handleStartExam}
              onViewMarks={(exam) => {
                setSelectedExam(exam)
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

const ADMIN_BRANCH_OPTIONS = [
  "Computer Science",
  "Information Science",
  "Information Technology",
  "Electronics and Communication",
  "Electrical and Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence and Machine Learning",
  "Data Science",
  "Master of Computer Applications",
  "Other",
]

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
  const [college, setCollege] = useState<string[]>([])
  const [collegeMenuOpen, setCollegeMenuOpen] = useState(false)
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
        `${api}/api/admin/students?page=${page}&search=${encodeURIComponent(search)}&status=${status}&college=${encodeURIComponent(JSON.stringify(college))}`,
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
        selectedCollege={college}
        selectedSearch={search}
        selectedStatus={status}
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setCollegeMenuOpen((open) => !open)}
            className="flex h-10 min-w-[250px] max-w-xs items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-xs text-slate-900 shadow-sm transition hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <span className="truncate">
              {college.length ? `${college.length} colleges selected` : "All colleges"}
            </span>
            <span className="text-slate-400">⌄</span>
          </button>
          {collegeMenuOpen && (
            <div className="absolute left-0 top-11 z-30 max-h-72 w-[320px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setCollege([])
                  setPage(1)
                }}
                className="mb-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50"
              >
                Clear selection / All colleges
              </button>
              {colleges.map((item) => {
                const checked = college.includes(item.name)
                return (
                  <label key={item.name} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setCollege((current) =>
                          checked
                            ? current.filter((value) => value !== item.name)
                            : [...current, item.name],
                        )
                        setPage(1)
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-slate-400">{item.count}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
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
                    <select
                      required
                      value={form.college}
                      onChange={(event) =>
                        setForm({ ...form, college: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                    >
                      <option value="">Select college</option>
                      {form.college && !colleges.some((item) => item.name === form.college) && (
                        <option value={form.college}>{form.college}</option>
                      )}
                      {colleges.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 font-semibold text-slate-700">
                    Branch
                    <select
                      required
                      value={form.branch}
                      onChange={(event) =>
                        setForm({ ...form, branch: event.target.value })
                      }
                      className="w-full h-10 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
                    >
                      <option value="">Select branch</option>
                      {form.branch && !ADMIN_BRANCH_OPTIONS.includes(form.branch) && (
                        <option value={form.branch}>{form.branch}</option>
                      )}
                      {ADMIN_BRANCH_OPTIONS.map((branch) => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
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

function AdminFloatingSidebar({
  active,
  onNav,
  adminUser,
  onLogout,
  isCollapsed,
  setIsCollapsed,
}: {
  active: string
  onNav: (v: string) => void
  adminUser: { email: string; role: string } | null
  onLogout: () => void
  isCollapsed: boolean
  setIsCollapsed: (v: boolean) => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Drawer Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50 flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3 rounded-full bg-white/70 backdrop-blur-2xl border border-white shadow-lg text-[#1E3A34] hover:bg-white transition-all cursor-pointer"
          aria-label="Toggle Navigation Sidebar"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
        <span className="text-xs font-black text-[#1E3A34] tracking-tight bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-sm">
          {active}
        </span>
      </div>

      {/* Mobile Slide-Out Glass Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#1E3A34]/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 h-full bg-white/95 backdrop-blur-2xl border-r border-white/80 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D084] via-[#057A55] to-[#1E3A34] flex items-center justify-center text-white font-black italic text-sm shadow-md">
                    K
                  </div>
                  <div>
                    <strong className="block text-xs font-black tracking-tight text-[#1E3A34]">
                      KGS EXAM PORTAL
                    </strong>
                    <small className="block text-[8px] font-extrabold tracking-widest text-[#057A55] leading-none">
                      FLUX ENTERPRISE SUITE
                    </small>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-full text-[#1E3A34] hover:bg-slate-100 cursor-pointer border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Modules */}
              <nav className="space-y-1">
                {adminNav.map(([iconName, label]) => (
                  <button
                    key={label}
                    onClick={() => {
                      onNav(label)
                      setMobileOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      active === label
                        ? "bg-[#1E3A34] text-white shadow-md border border-white/20 font-extrabold"
                        : "text-[#1E3A34] hover:bg-white/80 hover:text-[#057A55]"
                    }`}
                  >
                    <span className="text-base shrink-0">
                      <Icon name={iconName} />
                    </span>
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Profile & Logout */}
            <div className="pt-4 border-t border-[#F0EBE1] space-y-3">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/70 border border-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00D084] animate-pulse" />
                <div className="min-w-0 flex-1">
                  <small className="block text-[9px] font-extrabold text-[#057A55] uppercase">
                    Admin Session
                  </small>
                  <span className="block text-xs font-black text-[#1E3A34] truncate">
                    {adminUser?.email || "Administrator"}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#D9532F]/15 text-[#D9532F] hover:bg-[#D9532F] hover:text-white text-xs font-bold transition-all border border-[#D9532F]/30 shadow-sm cursor-pointer"
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Floating Vertical Glass Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-4 bottom-4 left-4 z-50 flex-col justify-between bg-white/50 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] rounded-3xl p-3.5 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Specular Glass Highlight */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

        <div className="space-y-5">
          {/* Header & Brand */}
          <div className="flex items-center justify-between px-1">
            <div
              className="flex items-center gap-3 cursor-pointer overflow-hidden min-w-0"
              onClick={() => onNav("Overview")}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00D084] via-[#057A55] to-[#1E3A34] flex items-center justify-center text-white font-black italic text-xs shadow-md shadow-emerald-600/20 shrink-0">
                K
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <strong className="block text-xs font-black tracking-tight text-[#1E3A34] truncate">
                    KGS EXAM PORTAL
                  </strong>
                  <small className="block text-[8px] font-extrabold tracking-widest text-[#057A55] leading-none truncate">
                    FLUX SUITE
                  </small>
                </div>
              )}
            </div>

            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-md border border-white flex items-center justify-center text-[10px] text-[#1E3A34] shadow-sm hover:scale-110 transition-transform cursor-pointer shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? "➔" : "⬅"}
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-230px)] pr-0.5 scrollbar-thin">
            {adminNav.map(([iconName, label]) => {
              const isActive = active === label
              return (
                <button
                  key={label}
                  onClick={() => onNav(label)}
                  title={isCollapsed ? label : undefined}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "bg-[#1E3A34] text-white shadow-md border-white/20 font-extrabold"
                      : "text-[#1E3A34] hover:bg-white/80 hover:text-[#057A55] border-transparent"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                >
                  <span className="text-base shrink-0">
                    <Icon name={iconName} />
                  </span>
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom Profile & Logout Footer */}
        <div className="pt-3 border-t border-[#F0EBE1] space-y-2.5">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/60 backdrop-blur-md border border-white">
                <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse shadow-[0_0_6px_#00D084] shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block text-[11px] font-extrabold text-[#1E3A34] truncate">
                    {adminUser?.email || "Administrator"}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-[#D9532F]/15 text-[#D9532F] hover:bg-[#D9532F] hover:text-white text-xs font-bold transition-all duration-200 border border-[#D9532F]/30 shadow-sm cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onLogout}
              title="Logout"
              className="w-full h-10 rounded-2xl bg-[#D9532F]/15 text-[#D9532F] hover:bg-[#D9532F] hover:text-white flex items-center justify-center font-bold text-xs transition-all border border-[#D9532F]/30 shadow-sm cursor-pointer"
            >
              🚪
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

function AdminDashboard({
  active = "Overview",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: {
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}) {
  const [range, setRange] = useState<"week" | "month" | "quarter">("month")
  const [dashboard, setDashboard] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
      <div className="p-12 text-center text-xs sm:text-sm font-medium bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_10px_35px_-5px_rgba(32,61,57,0.08)]">
        <h2 className="text-xl font-bold text-[#203D39] m-0">Loading administrator dashboard...</h2>
      </div>
    )
  if (error)
    return (
      <div className="p-12 text-center text-xs sm:text-sm font-medium text-[#D96C50] bg-white/60 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-[0_10px_35px_-5px_rgba(32,61,57,0.08)] flex flex-col items-center gap-3">
        <h2 className="text-xl font-bold text-[#203D39] m-0">Unable to load administrator dashboard</h2>
        <p className="m-0 text-[#203D39]/80">{error}</p>
        <button className="h-9 px-5 text-xs font-bold rounded-full text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer border-none shadow-md" onClick={() => void load()}>
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

  // Chart coordinate calculations
  const chartWidth = 500
  const chartHeight = 220
  const padLeft = 35
  const padRight = 15
  const padTop = 20
  const padBottom = 30
  const innerW = chartWidth - padLeft - padRight
  const innerH = chartHeight - padTop - padBottom
  const bottomY = padTop + innerH

  const regPoints = dates.map((date, i) => {
    const val = Number(registrationMap.get(date) || 0)
    const x = dates.length === 1 ? padLeft + innerW / 2 : padLeft + (i / (dates.length - 1)) * innerW
    const y = bottomY - (val / max) * innerH
    return { x, y, val, date }
  })

  const compPoints = dates.map((date, i) => {
    const val = Number(completedMap.get(date) || 0)
    const x = dates.length === 1 ? padLeft + innerW / 2 : padLeft + (i / (dates.length - 1)) * innerW
    const y = bottomY - (val / max) * innerH
    return { x, y, val, date }
  })

  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return ""
    let path = `M ${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cpX = (p0.x + p1.x) / 2
      path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`
    }
    return path
  }

  const buildAreaPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return ""
    const linePath = buildSmoothPath(pts)
    const firstX = pts[0].x
    const lastX = pts[pts.length - 1].x
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  const regLineD = buildSmoothPath(regPoints)
  const regAreaD = buildAreaPath(regPoints)

  const compLineD = buildSmoothPath(compPoints)
  const compAreaD = buildAreaPath(compPoints)

  const kpiCardConfig = [
    {
      icon: "users",
      label: "Registrations",
      value: stats.registrations ?? 0,
      badgeBg: "bg-[#176B58]/15 text-[#176B58]",
      labelColor: "text-[#D96C50]",
      accentGlow: "from-white/80 via-white/60 to-[#176B58]/15",
      isFeatured: true,
    },
    {
      icon: "book",
      label: "Active Exams",
      value: stats.activeExams ?? 0,
      badgeBg: "bg-[#203D39]/15 text-[#203D39]",
      labelColor: "text-[#176B58]",
      accentGlow: "from-white/60 to-transparent",
    },
    {
      icon: "pulse",
      label: "Active Attempts",
      value: stats.activeAttempts ?? 0,
      badgeBg: "bg-[#D96C50]/15 text-[#D96C50]",
      labelColor: "text-[#D96C50]",
      accentGlow: "from-white/60 to-transparent",
    },
    {
      icon: "result",
      label: "Completed Attempts",
      value: stats.completedAttempts ?? 0,
      badgeBg: "bg-[#E5A23B]/15 text-[#E5A23B]",
      labelColor: "text-[#E5A23B]",
      accentGlow: "from-white/60 to-transparent",
    },
    {
      icon: "review",
      label: "Pending Reviews",
      value: stats.pendingReviews ?? 0,
      badgeBg: "bg-[#176B58]/15 text-[#176B58]",
      labelColor: "text-[#176B58]",
      accentGlow: "from-white/60 to-transparent",
    },
    {
      icon: "download",
      label: "Latest Export",
      value: stats.latestExport
        ? new Date(stats.latestExport).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "None",
      fullDate: stats.latestExport ? new Date(stats.latestExport).toLocaleString() : "",
      badgeBg: "bg-[#203D39]/15 text-[#203D39]",
      labelColor: "text-[#203D39]",
      accentGlow: "from-white/60 to-transparent",
      isTextValue: true,
    },
  ] as const

  return (
    <div className="relative min-h-screen bg-[#F6F2E6] text-[#1E3A34] font-sans overflow-x-hidden p-4 sm:p-8 -m-4 sm:-m-8">
      {/* Continuous Full-Page Atmospheric Background Vibrant Lighting Blobs */}
      <div className="fixed -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-[#00C4DF]/30 blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-1/4 -right-24 w-[650px] h-[650px] rounded-full bg-[#00D084]/30 blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/3 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#FFB800]/28 blur-[150px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-10 w-[700px] h-[700px] rounded-full bg-[#FF7A59]/28 blur-[160px] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20 pointer-events-none z-0" />

      {/* Floating Vertical Glass Sidebar (Desktop + Mobile Slide Drawer) */}
      <AdminFloatingSidebar
        active={active}
        onNav={onNav}
        adminUser={adminUser}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Dashboard Content Wrapper - Optimized spacing and screen width utilization */}
      <div
        className={`relative z-10 max-w-[1550px] mx-auto space-y-6 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-68"
        }`}
      >
        {/* Floating Glass Hero Welcome Header */}
        <header className="relative overflow-hidden rounded-3xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-4 sm:p-5">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                  Flux Suite
                </span>
                <span className="text-xs font-bold text-[#1E3A34]/80">
                  Welcome back, Administrator
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
                Examination Overview
              </h1>

              <p className="text-xs text-[#057A55] font-bold m-0 leading-relaxed">
                Real-time operational metrics, live candidate attempts, and system status across all active examination portals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* System Operational Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white text-[#1E3A34] text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse shadow-[0_0_8px_#00D084]" />
                <span>System Operational</span>
                <span className="text-[#1E3A34]/30">|</span>
                <span className="text-[#FFB800] font-extrabold">{stats.activeExams || 0} Live Exams</span>
              </div>

              {/* Date Range Selector */}
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white rounded-xl p-1 shadow-sm">
                <span className="text-[11px] font-bold text-[#057A55] pl-2">Period:</span>
                <select
                  className="h-8 px-3 text-xs font-black bg-[#1E3A34] text-white border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFB800] cursor-pointer shadow-sm"
                  value={range}
                  onChange={(event) => setRange(event.target.value as typeof range)}
                  aria-label="Dashboard date range"
                >
                  <option value="week">This Week</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Asymmetric Editorial Dashboard Composition */}
        <main className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* Primary Column (7 Columns on XL, 8 Columns on 2XL) */}
          <div className="xl:col-span-7 2xl:col-span-8 space-y-6">

            {/* Perfectly Balanced Asymmetric Glass Analytics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">

              {/* Featured Primary Card: Registrations + Real Mini Sparkline (4 Cols) */}
              <article className="sm:col-span-2 lg:col-span-4 relative overflow-hidden bg-gradient-to-br from-white/95 via-white/80 to-[#00D084]/15 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between min-h-[175px]">
                <div className="flex items-start justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-[#00D084]/20 text-[#057A55] flex items-center justify-center text-lg font-bold shadow-inner border border-white/60">
                      <Icon name="users" />
                    </span>
                    <div>
                      <small className="block text-[11px] font-black uppercase tracking-wider text-[#FF7A59]">
                        Registrations
                      </small>
                      <span className="text-xs font-bold text-[#057A55]/90">Total Candidate Enrolments</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#00D084]/15 text-[#057A55] text-[10px] font-extrabold uppercase tracking-wider border border-[#00D084]/30">
                    Featured Metric
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-3 relative z-10">
                  <div>
                    <strong className="block text-4xl sm:text-5xl lg:text-6xl font-black text-[#1E3A34] leading-none tracking-tight">
                      {stats.registrations ?? 0}
                    </strong>
                    <small className="text-[11px] font-bold text-[#1E3A34]/60 mt-1 block">
                      Active candidate database records
                    </small>
                  </div>

                  {/* Real Historical Registration Sparkline (if available) */}
                  {regPoints.length > 1 && (
                    <div className="w-36 h-11 shrink-0 flex flex-col items-end justify-end">
                      <svg viewBox="0 0 150 45" className="w-full h-9 overflow-visible">
                        <defs>
                          <linearGradient id="sparkReg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00D084" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#00D084" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {regAreaD && (
                          <path
                            d={buildAreaPath(regPoints.map((p, i) => ({
                              x: (i / (regPoints.length - 1)) * 140 + 5,
                              y: 40 - (p.val / max) * 32,
                            })))}
                            fill="url(#sparkReg)"
                          />
                        )}
                        <path
                          d={buildSmoothPath(regPoints.map((p, i) => ({
                            x: (i / (regPoints.length - 1)) * 140 + 5,
                            y: 40 - (p.val / max) * 32,
                          })))}
                          fill="none"
                          stroke="#057A55"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="text-[9px] font-extrabold text-[#057A55] uppercase tracking-wider">Historical Trend</span>
                    </div>
                  )}
                </div>
              </article>

              {/* Tile 2: Active Exams (2 Cols) */}
              <article className="sm:col-span-1 lg:col-span-2 group relative overflow-hidden bg-white/50 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between min-h-[175px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-2xl bg-[#00C4DF]/20 text-[#008DA1] flex items-center justify-center text-base font-bold shadow-inner border border-white/70 group-hover:scale-110 transition-transform duration-200">
                    <Icon name="book" />
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Live</span>
                </div>
                <div>
                  <small className="block text-[10px] font-black uppercase tracking-wider text-[#057A55] mb-1">
                    Active Exams
                  </small>
                  <strong className="block text-3xl sm:text-4xl font-black text-[#1E3A34] leading-tight">
                    {stats.activeExams ?? 0}
                  </strong>
                  <span className="text-[11px] font-semibold text-[#1E3A34]/70 mt-1 block">Scheduled & published</span>
                </div>
              </article>

              {/* Tile 3: Active Attempts (2 Cols) */}
              <article className="sm:col-span-1 lg:col-span-2 group relative overflow-hidden bg-white/50 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between min-h-[175px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-2xl bg-[#FF7A59]/20 text-[#FF7A59] flex items-center justify-center text-base font-bold shadow-inner border border-white/70 group-hover:scale-110 transition-transform duration-200">
                    <Icon name="pulse" />
                  </span>
                  {stats.activeAttempts > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800] animate-ping" /> In Progress
                    </span>
                  )}
                </div>
                <div>
                  <small className="block text-[10px] font-black uppercase tracking-wider text-[#FF7A59] mb-1">
                    Active Attempts
                  </small>
                  <strong className="block text-3xl sm:text-4xl font-black text-[#1E3A34] leading-tight">
                    {stats.activeAttempts ?? 0}
                  </strong>
                  <span className="text-[11px] font-semibold text-[#1E3A34]/70 mt-1 block">Live candidate sessions</span>
                </div>
              </article>

              {/* Tile 4: Completed Attempts + Real Sparkline (2 Cols) */}
              <article className="sm:col-span-1 lg:col-span-2 group relative overflow-hidden bg-white/50 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between min-h-[175px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-2xl bg-[#FFB800]/20 text-[#D99B00] flex items-center justify-center text-base font-bold shadow-inner border border-white/70 group-hover:scale-110 transition-transform duration-200">
                    <Icon name="result" />
                  </span>
                  <span className="text-[10px] font-bold text-[#D99B00] bg-amber-50 px-2 py-0.5 rounded-full">Completed</span>
                </div>
                <div>
                  <small className="block text-[10px] font-black uppercase tracking-wider text-[#D99B00] mb-1">
                    Completed Attempts
                  </small>
                  <div className="flex items-end justify-between gap-2">
                    <strong className="block text-3xl sm:text-4xl font-black text-[#1E3A34] leading-tight">
                      {stats.completedAttempts ?? 0}
                    </strong>
                    {compPoints.length > 1 && (
                      <div className="w-24 h-8 shrink-0">
                        <svg viewBox="0 0 100 35" className="w-full h-8 overflow-visible">
                          <path
                            d={buildSmoothPath(compPoints.map((p, i) => ({
                              x: (i / (compPoints.length - 1)) * 90 + 5,
                              y: 30 - (p.val / max) * 25,
                            })))}
                            fill="none"
                            stroke="#FFB800"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[#1E3A34]/70 mt-1 block">Submissions processed</span>
                </div>
              </article>

              {/* Tile 5: Pending Reviews (2 Cols) */}
              <article className="sm:col-span-1 lg:col-span-2 group relative overflow-hidden bg-white/50 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between min-h-[175px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-2xl bg-[#00D084]/20 text-[#057A55] flex items-center justify-center text-base font-bold shadow-inner border border-white/70 group-hover:scale-110 transition-transform duration-200">
                    <Icon name="review" />
                  </span>
                  <span className="text-[10px] font-bold text-[#057A55] bg-emerald-50 px-2 py-0.5 rounded-full">Audit</span>
                </div>
                <div>
                  <small className="block text-[10px] font-black uppercase tracking-wider text-[#057A55] mb-1">
                    Pending Reviews
                  </small>
                  <strong className="block text-3xl sm:text-4xl font-black text-[#1E3A34] leading-tight">
                    {stats.pendingReviews ?? 0}
                  </strong>
                  <span className="text-[11px] font-semibold text-[#1E3A34]/70 mt-1 block">Evaluations awaiting action</span>
                </div>
              </article>

              {/* Tile 6: Latest Export (Full-Width Row 3 Glass Status Banner - 6 Cols) */}
              <article className="col-span-full lg:col-span-6 group relative overflow-hidden bg-white/50 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 border border-white/80 shadow-[0_8px_30px_0_rgba(30,58,52,0.08)] hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="w-10 h-10 rounded-2xl bg-[#1E3A34]/15 text-[#1E3A34] flex items-center justify-center text-lg font-bold shadow-inner border border-white/70 shrink-0">
                    <Icon name="download" />
                  </span>
                  <div>
                    <small className="block text-[10px] font-black uppercase tracking-wider text-[#1E3A34]">
                      Latest Export Activity
                    </small>
                    <b className="text-xs font-bold text-[#057A55]">System Register & Audit Export Workbook</b>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <strong className="block text-sm sm:text-base font-black text-[#1E3A34] leading-snug" title={stats.latestExport ? new Date(stats.latestExport).toLocaleString() : "None"}>
                      {stats.latestExport ? new Date(stats.latestExport).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "No export recorded"}
                    </strong>
                    <span className="text-[10px] font-extrabold text-[#1E3A34]/60">
                      {stats.latestExport ? new Date(stats.latestExport).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "System ready"}
                    </span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-100/80 text-[#1E3A34] text-[10px] font-extrabold uppercase tracking-wider border border-white shrink-0">
                    Report Sync
                  </span>
                </div>
              </article>

            </div>

            {/* Participation Overview Translucent Light Glass Card */}
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-5 sm:p-6 flex flex-col justify-between gap-5 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE1]">
                <div>
                  <h3 className="text-xl font-black text-[#1E3A34] m-0">Participation Overview</h3>
                  <p className="text-xs text-[#057A55] font-bold mt-0.5 m-0">Daily candidate registrations vs completed attempts in selected period</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-[#1E3A34]">
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#00D084]/20 text-[#057A55] border border-[#00D084]/30">
                    <i className="w-2.5 h-2.5 rounded-full bg-[#00D084] inline-block shrink-0 shadow-sm" /> Registered
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/20 text-[#D99B00] border border-[#FFB800]/30">
                    <i className="w-2.5 h-2.5 rounded-full bg-[#FFB800] inline-block shrink-0 shadow-sm" /> Completed
                  </span>
                </div>
              </div>

              {dates.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center gap-2 text-xs text-[#1E3A34]/70 font-semibold bg-[#F6F2E6]/50 rounded-2xl border border-dashed border-[#E2DBD0]">
                  <span className="text-3xl text-[#057A55]">📊</span>
                  <span className="font-bold text-[#1E3A34]">No activity recorded for this period</span>
                  <p className="text-[11px] text-[#057A55] font-medium m-0">Try selecting a different date range in the top toolbar filter.</p>
                </div>
              ) : (
                <div
                  className="relative w-full overflow-hidden"
                  onMouseLeave={() => setHoveredChartIndex(null)}
                >
                  {/* Interactive Tooltip Overlay */}
                  {hoveredChartIndex !== null && regPoints[hoveredChartIndex] && (
                    <div
                      className="absolute bg-[#1E3A34] text-white backdrop-blur-md px-4 py-3 rounded-2xl border border-[#00D084]/40 shadow-2xl text-xs space-y-1.5 pointer-events-none transition-all duration-150 z-30"
                      style={{
                        left: `${Math.min(Math.max((regPoints[hoveredChartIndex].x / chartWidth) * 85, 5), 72)}%`,
                        top: "10px",
                      }}
                    >
                      <div className="font-black text-[#FFB800] border-b border-white/10 pb-1 text-[11px] tracking-wide">
                        {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${dates[hoveredChartIndex]}T00:00:00`))}
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-[#00D084]" /> Registered:
                        </span>
                        <span className="font-black text-white">{registrationMap.get(dates[hoveredChartIndex]) || 0}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="flex items-center gap-1.5 font-bold text-amber-300">
                          <span className="w-2 h-2 rounded-full bg-[#FFB800]" /> Completed:
                        </span>
                        <span className="font-black text-white">{completedMap.get(dates[hoveredChartIndex]) || 0}</span>
                      </div>
                    </div>
                  )}

                  {/* SVG Area / Line Chart */}
                  <svg
                    className="w-full h-52 sm:h-60 overflow-visible"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00D084" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#00D084" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FFB800" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#FFB800" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Gridlines & Labels */}
                    {[0, 0.5, 1].map((ratio) => {
                      const gridY = padTop + innerH * (1 - ratio)
                      const labelVal = Math.round(max * ratio)
                      return (
                        <g key={ratio}>
                          <line
                            x1={padLeft}
                            y1={gridY}
                            x2={chartWidth - padRight}
                            y2={gridY}
                            stroke="#F0EBE1"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={padLeft - 6}
                            y={gridY + 4}
                            textAnchor="end"
                            fill="#1E3A34"
                            opacity="0.6"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {labelVal}
                          </text>
                        </g>
                      )
                    })}

                    {/* X-Axis Date Labels */}
                    {dates.map((date, i) => {
                      if (dates.length > 10 && i % Math.ceil(dates.length / 8) !== 0 && i !== dates.length - 1) return null
                      const x = dates.length === 1 ? padLeft + innerW / 2 : padLeft + (i / (dates.length - 1)) * innerW
                      return (
                        <text
                          key={date}
                          x={x}
                          y={chartHeight - 8}
                          textAnchor="middle"
                          fill="#1E3A34"
                          opacity="0.7"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`))}
                        </text>
                      )
                    })}

                    {/* Registered Students Gradient Fill & Line (rendered only when >= 2 dates) */}
                    {dates.length >= 2 && regAreaD && <path d={regAreaD} fill="url(#emeraldGrad)" />}
                    {dates.length >= 2 && regLineD && (
                      <path
                        d={regLineD}
                        fill="none"
                        stroke="#057A55"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Completed Attempts Gradient Fill & Line (rendered only when >= 2 dates) */}
                    {dates.length >= 2 && compAreaD && <path d={compAreaD} fill="url(#amberGrad)" />}
                    {dates.length >= 2 && compLineD && (
                      <path
                        d={compLineD}
                        fill="none"
                        stroke="#FFB800"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Single Date Bar Chart View (rendered when dates.length === 1) */}
                    {dates.length === 1 && (() => {
                      const date = dates[0]
                      const regVal = Number(registrationMap.get(date) || 0)
                      const compVal = Number(completedMap.get(date) || 0)
                      const centerX = padLeft + innerW / 2
                      const barWidth = 32
                      const barGap = 18

                      const regHeight = max > 0 ? (regVal / max) * (innerH - 20) : 0
                      const compHeight = max > 0 ? (compVal / max) * (innerH - 20) : 0

                      const regX = centerX - barWidth - barGap / 2
                      const compX = centerX + barGap / 2

                      const regY = bottomY - regHeight
                      const compY = bottomY - compHeight

                      return (
                        <g key="single-date-bars">
                          {/* Registered Bar */}
                          <rect
                            x={regX}
                            y={regY}
                            width={barWidth}
                            height={Math.max(4, regHeight)}
                            rx="6"
                            fill="url(#emeraldGrad)"
                            stroke="#057A55"
                            strokeWidth="2"
                            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                          />
                          <text
                            x={regX + barWidth / 2}
                            y={regY - 6}
                            textAnchor="middle"
                            fill="#057A55"
                            fontSize="11"
                            fontWeight="800"
                          >
                            {regVal}
                          </text>

                          {/* Completed Bar */}
                          <rect
                            x={compX}
                            y={compY}
                            width={barWidth}
                            height={Math.max(4, compHeight)}
                            rx="6"
                            fill="url(#amberGrad)"
                            stroke="#FFB800"
                            strokeWidth="2"
                            className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                          />
                          <text
                            x={compX + barWidth / 2}
                            y={compY - 6}
                            textAnchor="middle"
                            fill="#D99B00"
                            fontSize="11"
                            fontWeight="800"
                          >
                            {compVal}
                          </text>
                        </g>
                      )
                    })()}

                    {/* Interactive Points & Vertical Hover Line */}
                    {dates.map((date, i) => {
                      const ptReg = regPoints[i]
                      const ptComp = compPoints[i]
                      const isHovered = hoveredChartIndex === i

                      return (
                        <g
                          key={date}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredChartIndex(i)}
                        >
                          <rect
                            x={ptReg.x - (innerW / Math.max(1, dates.length)) / 2}
                            y={padTop}
                            width={innerW / Math.max(1, dates.length)}
                            height={innerH}
                            fill="transparent"
                          />

                          {isHovered && (
                            <line
                              x1={ptReg.x}
                              y1={padTop}
                              x2={ptReg.x}
                              y2={bottomY}
                              stroke="#1E3A34"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                              opacity="0.5"
                            />
                          )}

                          <circle
                            cx={ptReg.x}
                            cy={ptReg.y}
                            r={isHovered ? "6" : "3.5"}
                            fill="#057A55"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="transition-all duration-200"
                          />

                          <circle
                            cx={ptComp.x}
                            cy={ptComp.y}
                            r={isHovered ? "6" : "3.5"}
                            fill="#FFB800"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            className="transition-all duration-200"
                          />
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </div>

          </div>

          {/* Secondary Column (5 Columns on XL, 4 Columns on 2XL - Recent Activity Glass Panel) */}
          <div className="xl:col-span-5 2xl:col-span-4 sticky top-8">
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-5 sm:p-6 flex flex-col justify-between gap-4 max-h-[520px]">
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1]">
                <div>
                  <h3 className="text-xl font-black text-[#203D39] m-0">Recent Activity</h3>
                  <p className="text-xs text-[#176B58] font-bold mt-0.5 m-0">Live audit timeline and security log</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#176B58]/10 text-[#176B58] text-[10px] font-black uppercase tracking-wider border border-[#176B58]/20">
                  {activity.length} Events
                </span>
              </div>

              {activity.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2 text-xs text-[#203D39]/70 font-semibold bg-[#F7F4EC]/50 rounded-2xl border border-dashed border-[#E2DBD0]">
                  <span className="text-3xl text-[#176B58]">📋</span>
                  <span className="font-bold text-[#203D39]">No audit activity recorded</span>
                  <p className="text-[11px] text-[#176B58] font-medium m-0">Audit logs will automatically appear here as users interact with exams.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative scrollbar-thin">
                  <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-[#E2DBD0] z-0" />

                  {activity.map((item: any) => {
                    const cat = (() => {
                      const action = String(item.action || "").toLowerCase()
                      const entity = String(item.entityType || "").toLowerCase()

                      if (action.includes("security") || action.includes("delete") || action.includes("failed") || action.includes("alert")) {
                        return {
                          icon: "review",
                          badgeBg: "bg-[#D96C50]/15 text-[#D96C50]",
                          tagText: "Security / Alert",
                          tagColor: "text-[#D96C50]",
                        }
                      }
                      if (action.includes("submit") || action.includes("attempt") || action.includes("review")) {
                        return {
                          icon: "pulse",
                          badgeBg: "bg-[#E5A23B]/15 text-[#E5A23B]",
                          tagText: "Submission",
                          tagColor: "text-[#E5A23B]",
                        }
                      }
                      if (action.includes("result") || action.includes("export") || action.includes("download")) {
                        return {
                          icon: "download",
                          badgeBg: "bg-[#176B58]/15 text-[#176B58]",
                          tagText: "Report / Data",
                          tagColor: "text-[#176B58]",
                        }
                      }
                      if (entity.includes("exam") || action.includes("exam")) {
                        return {
                          icon: "book",
                          badgeBg: "bg-[#176B58]/15 text-[#176B58]",
                          tagText: "Examination",
                          tagColor: "text-[#176B58]",
                        }
                      }
                      return {
                        icon: "users",
                        badgeBg: "bg-[#203D39]/15 text-[#203D39]",
                        tagText: "System Operation",
                        tagColor: "text-[#176B58]",
                      }
                    })()

                    return (
                      <div
                        key={item.id}
                        className="group relative z-10 flex items-start gap-3.5 p-3 rounded-2xl hover:bg-white/80 transition-all duration-200 border border-transparent hover:border-white"
                      >
                        <div className={`w-8 h-8 rounded-full ${cat.badgeBg} flex items-center justify-center text-xs shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                          <Icon name={cat.icon} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <b className="font-black text-[#203D39] text-xs sm:text-sm truncate">
                              {item.action || "Administrative action"}
                            </b>
                            <small className="text-[#203D39]/60 font-bold text-[10px] shrink-0">
                              {item.recordedAt ? new Date(item.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </small>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                            <span className={`font-bold ${cat.tagColor}`}>
                              {item.entityType || cat.tagText}
                            </span>
                            <span className="text-[#203D39]/30">•</span>
                            <span className="text-[#203D39]/70 font-semibold truncate">
                              User: <strong className="text-[#203D39] font-bold">{item.actorRole || "System"}</strong>
                            </span>
                          </div>

                          <div className="text-[10px] text-[#203D39]/50 font-medium mt-1">
                            {item.recordedAt ? new Date(item.recordedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : ""}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
