import { useEffect, useMemo, useState } from "react"
import { API_BASE_URL } from "../../api"

interface Props {
  onClose: () => void
  onProceedToExam: () => void
  examTitle: string
  examId?: string
  scheduledAt?: string
  closesAt?: string
  requirements?: {
    camera?: boolean
    microphone?: boolean
    fullscreen?: boolean
  }
}
type State = "PENDING" | "CHECKING" | "PASSED" | "FAILED" | "NOT_REQUIRED"
type Key = "browser" | "network" | "camera" | "microphone" | "fullscreen"
const api = API_BASE_URL
const name = () =>
  /Edg\//.test(navigator.userAgent)
    ? "Microsoft Edge"
    : /Chrome\//.test(navigator.userAgent)
      ? "Google Chrome"
      : /Firefox\//.test(navigator.userAgent)
        ? "Mozilla Firefox"
        : /Safari\//.test(navigator.userAgent)
          ? "Safari"
          : "Unknown browser"

export function SystemCheckModal({
  onClose,
  onProceedToExam,
  examTitle,
  examId,
  scheduledAt,
  closesAt,
  requirements = {},
}: Props) {
  const req = useMemo(
    () => ({
      camera: !!requirements.camera,
      microphone: !!requirements.microphone,
      fullscreen: !!requirements.fullscreen,
    }),
    [requirements],
  )
  const initial = (): Record<Key, State> => ({
    browser: "PENDING",
    network: "PENDING",
    camera: req.camera ? "PENDING" : "NOT_REQUIRED",
    microphone: req.microphone ? "PENDING" : "NOT_REQUIRED",
    fullscreen: req.fullscreen ? "PENDING" : "NOT_REQUIRED",
  })
  const [checks, setChecks] = useState(initial)
  const [active, setActive] = useState<Key>("browser")
  const [error, setError] = useState("")
  const [browser, setBrowser] = useState("")

  useEffect(() => {
    setChecks(initial())
    setActive("browser")
    setError("")
  }, [req])

  const set = (key: Key, value: State) =>
    setChecks((current) => ({ ...current, [key]: value }))

  const runBrowser = () => {
    set("browser", "CHECKING")
    setError("")
    const ok = !!(
      window.fetch &&
      window.localStorage &&
      document.documentElement.requestFullscreen &&
      document.fullscreenEnabled !== false
    )
    setBrowser(name())
    set("browser", ok ? "PASSED" : "FAILED")
    if (!ok)
      setError("This browser does not provide all required capabilities.")
  }

  const runNetwork = async () => {
    set("network", "CHECKING")
    setError("")
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetch(`${api}/api/health`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })
      if (!response.ok) throw new Error()
      set("network", "PASSED")
    } catch {
      set("network", "FAILED")
      setError(
        "The examination service could not be reached. Check your connection and retry.",
      )
    } finally {
      window.clearTimeout(timer)
    }
  }

  const runMedia = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      if (req.camera) set("camera", "FAILED")
      if (req.microphone) set("microphone", "FAILED")
      setError("Media permissions are not supported by this browser.")
      return
    }
    set("camera", req.camera ? "CHECKING" : "NOT_REQUIRED")
    set("microphone", req.microphone ? "CHECKING" : "NOT_REQUIRED")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: req.camera,
        audio: req.microphone,
      })
      stream.getTracks().forEach((track) => track.stop())
      if (req.camera) set("camera", "PASSED")
      if (req.microphone) set("microphone", "PASSED")
    } catch {
      if (req.camera) set("camera", "FAILED")
      if (req.microphone) set("microphone", "FAILED")
      setError("Required camera or microphone permission was not granted.")
    }
  }

  const runFullscreen = async () => {
    set("fullscreen", "CHECKING")
    setError("")
    try {
      if (!document.fullscreenElement)
        await document.documentElement.requestFullscreen()
      set("fullscreen", "PASSED")
    } catch {
      set("fullscreen", "FAILED")
      setError("Fullscreen permission was not granted.")
    }
  }

  const allPassed = (Object.keys(checks) as Key[]).every(
    (key) => checks[key] === "PASSED" || checks[key] === "NOT_REQUIRED",
  )

  const items: { key: Key; label: string }[] = [
    { key: "browser", label: "Browser" },
    { key: "network", label: "Network" },
    { key: "camera", label: "Camera" },
    { key: "microphone", label: "Microphone" },
    { key: "fullscreen", label: "Fullscreen" },
  ]

  const text = (value: State) => value.replace("_", " ")

  const accessOpen =
    !scheduledAt || new Date(scheduledAt).getTime() <= Date.now()

  const launch = () => {
    if (!allPassed) {
      setError("Complete all required checks before launching the exam.")
      return
    }
    if (!accessOpen) {
      setError(
        `Your examination is scheduled for ${new Date(scheduledAt as string).toLocaleString()}. You can enter the examination when the permitted access window opens.`,
      )
      return
    }
    if (closesAt && new Date(closesAt).getTime() <= Date.now()) {
      setError("The examination access window has ended.")
      return
    }
    if (examId) {
      localStorage.setItem(`kgs_readiness_${examId}`, "PASSED")
    }
    onClose()
    onProceedToExam()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[700px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden text-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex-none flex items-start justify-between gap-4 p-5 sm:px-7 sm:py-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-1">
              PRE-EXAM DIAGNOSTICS
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              System Readiness Verification
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              {examTitle}
            </p>
          </div>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors text-xl font-medium leading-none cursor-pointer focus:outline-none"
            onClick={onClose}
            aria-label="Close readiness check"
          >
            ×
          </button>
        </div>

        {/* Stepper Bar */}
        <div
          className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 sm:px-7 bg-slate-100/70 border-b border-slate-200/80"
          aria-label="Readiness checks"
        >
          {items.map((item) => (
            <button
              key={item.key}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                active === item.key
                  ? "bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                  : "bg-white/60 border-slate-200 hover:bg-white text-slate-600"
              }`}
              onClick={() => setActive(item.key)}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold mb-1 ${
                  checks[item.key] === "PASSED"
                    ? "bg-emerald-500 text-white"
                    : active === item.key
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 text-slate-600"
                }`}
              >
                {checks[item.key] === "PASSED" ? "✓" : item.label[0]}
              </span>
              <b className="text-xs font-bold text-slate-900">{item.label}</b>
              <small
                className={`text-[10px] font-semibold mt-0.5 capitalize ${
                  checks[item.key] === "PASSED"
                    ? "text-emerald-700"
                    : checks[item.key] === "FAILED"
                      ? "text-red-600"
                      : "text-slate-500"
                }`}
              >
                {text(checks[item.key])}
              </small>
            </button>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-5 sm:p-7 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm">
          {active === "browser" && (
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <h4 className="text-base font-bold text-slate-900 m-0">Browser compatibility</h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium m-0">
                We verify the browser capabilities required by this examination.
              </p>
              <div
                className={`p-3 border rounded-xl text-xs sm:text-sm font-semibold shadow-sm ${
                  checks.browser === "PASSED"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {checks.browser === "PASSED"
                  ? `✓ ${browser} supports the required capabilities.`
                  : "Browser check not passed."}
              </div>
              <button
                className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none self-start mt-1"
                onClick={() => {
                  runBrowser()
                  setActive("network")
                }}
              >
                Run Browser Check →
              </button>
            </div>
          )}

          {active === "network" && (
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <h4 className="text-base font-bold text-slate-900 m-0">Network connectivity</h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium m-0">
                We verify connectivity to the KGS examination service.
              </p>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 shadow-sm">
                {checks.network === "CHECKING"
                  ? "Checking service connectivity..."
                  : checks.network === "PASSED"
                    ? "✓ Backend service is reachable."
                    : checks.network === "FAILED"
                      ? "Network check failed."
                      : "Check not completed."}
              </div>
              <button
                className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none self-start mt-1"
                onClick={() => {
                  void runNetwork()
                }}
              >
                {checks.network === "FAILED"
                  ? "Retry Network Check"
                  : "Run Network Check"}{" "}
                →
              </button>
            </div>
          )}

          {(active === "camera" || active === "microphone") && (
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <h4 className="text-base font-bold text-slate-900 m-0">Camera and microphone</h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium m-0">
                {req.camera || req.microphone
                  ? "This examination requires the configured permissions."
                  : "Camera and microphone are not required."}
              </p>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 shadow-sm">
                {req.camera || req.microphone
                  ? "Permission check required."
                  : "Not required for this examination."}
              </div>
              {(req.camera || req.microphone) && (
                <button
                  className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none self-start mt-1"
                  onClick={() => {
                    void runMedia()
                  }}
                >
                  Check Required Permissions →
                </button>
              )}
            </div>
          )}

          {active === "fullscreen" && (
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <h4 className="text-base font-bold text-slate-900 m-0">Fullscreen</h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium m-0">
                {req.fullscreen
                  ? "Fullscreen is required for this examination."
                  : "Fullscreen is not required for this examination."}
              </p>
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 shadow-sm">
                {checks.fullscreen === "PASSED"
                  ? "✓ Fullscreen verified."
                  : checks.fullscreen === "FAILED"
                    ? "Fullscreen check failed."
                    : checks.fullscreen === "NOT_REQUIRED"
                      ? "Not required for this examination."
                      : "Check not completed."}
              </div>
              {req.fullscreen && (
                <button
                  className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none self-start mt-1"
                  onClick={() => {
                    void runFullscreen()
                  }}
                >
                  Test Fullscreen Mode
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="p-3.5 px-4 text-xs sm:text-sm font-semibold rounded-xl border border-red-200/80 bg-red-50 text-red-800 m-0" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex-none flex items-center justify-end gap-3 p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            className="h-10 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all cursor-pointer shadow-sm"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="h-10 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm shadow-blue-500/20 border-none"
            disabled={!allPassed}
            onClick={launch}
          >
            Launch Exam Environment →
          </button>
        </div>
      </div>
    </div>
  )
}
