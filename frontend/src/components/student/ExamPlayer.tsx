import { useState, useEffect, useRef } from "react"
import { Exam, Question, AnswerState } from "../../types"
import { API_BASE_URL, authFetch } from "../../api"

interface ExamPlayerProps {
  exam: Exam
  questions: Question[]
  attemptId: string
  candidateName?: string
  onSubmitExam: (
    answers: Record<string, AnswerState>,
    tabSwitches: number,
    automatic?: boolean,
  ) => void
  onIntegrityAutoSubmit?: () => void
}

interface PersistedAttempt {
  answers: Record<string, AnswerState>
  currentIdx: number
  tabSwitches: number
  expiresAt: number
}

export function ExamPlayer({
  exam,
  questions,
  attemptId,
  candidateName = "Student",
  onSubmitExam,
  onIntegrityAutoSubmit,
}: ExamPlayerProps) {
  const storageKey = `kgs-exam-attempt:${exam.id}`
  const [currentIdx, setCurrentIdx] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) || "null",
      ) as PersistedAttempt | null
      return saved?.currentIdx ?? 0
    } catch {
      return 0
    }
  })
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) || "null",
      ) as PersistedAttempt | null
      return saved?.answers ?? {}
    } catch {
      return {}
    }
  })
  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) || "null",
      ) as PersistedAttempt | null
      return saved?.expiresAt
        ? Math.max(0, Math.ceil((saved.expiresAt - Date.now()) / 1000))
        : exam.durationMinutes * 60
    } catch {
      return exam.durationMinutes * 60
    }
  })
  const [tabSwitches, setTabSwitches] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey) || "null",
      ) as PersistedAttempt | null
      return saved?.tabSwitches ?? 0
    } catch {
      return 0
    }
  })
  const [fullscreenIncidents, setFullscreenIncidents] = useState(0)
  const [fullscreenThreshold, setFullscreenThreshold] = useState<number | null>(
    null,
  )
  const [lastIntegrityType, setLastIntegrityType] =
    useState<"TAB_HIDDEN" | "FULLSCREEN_EXIT" | "COPY" | "PASTE" | "SCREENSHOT" | "MULTIPLE_PERSON">("TAB_HIDDEN")
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [contentObscured, setContentObscured] = useState(false)
  const [multiplePeopleDetected, setMultiplePeopleDetected] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(true)
  const [saveState, setSaveState] =
    useState<"saved" | "saving" | "failed" | "retrying">("saved")
  const [answerVersions, setAnswerVersions] = useState<Record<string, number>>(
    {},
  )
  const [connectionOnline, setConnectionOnline] = useState(
    () => navigator.onLine,
  )
  const [cameraStatus, setCameraStatus] =
    useState<"not-required" | "starting" | "active" | "interrupted" | "denied">(
      "not-required",
    )
  const [fullscreenActive, setFullscreenActive] = useState(
    () =>
      !exam.readinessRequirements?.fullscreen || !!document.fullscreenElement,
  )
  const [fullscreenNotice, setFullscreenNotice] = useState(false)
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const lastVisibilityIncident = useRef(0)
  const pendingIntegrityEvents = useRef(new Map<string, number>())
  const finalizingRef = useRef(false)
  const consecutiveMultipleFacesRef = useRef(0)
  const lastMultiplePersonIncidentRef = useRef(0)

  useEffect(() => {
    window.kgsDesktop?.setExamMode(true)
    return () => window.kgsDesktop?.setExamMode(false)
  }, [])

  const recordIntegrityEvent = async (
    eventId: string,
    eventType: "TAB_HIDDEN" | "FULLSCREEN_EXIT" | "COPY" | "PASTE" | "SCREENSHOT" | "MULTIPLE_PERSON",
    attempt = 0,
  ): Promise<void> => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/attempts/${attemptId}/integrity-events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            eventType,
            clientTimestamp: new Date().toISOString(),
          }),
        },
      )
      if (!response.ok) throw new Error("integrity event rejected")
      const result = await response.json()
      pendingIntegrityEvents.current.delete(eventId)
      setLastIntegrityType(eventType)
      if (eventType === "FULLSCREEN_EXIT") {
        if (typeof result.confirmedCount === "number")
          setFullscreenIncidents(result.confirmedCount)
        if (typeof result.count === "number")
          setFullscreenIncidents(result.count)
        if (typeof result.threshold === "number")
          setFullscreenThreshold(result.threshold)
      } else if (typeof result.confirmedCount === "number")
        setTabSwitches(result.confirmedCount)
      if (result.action === "WARNING") setShowWarningModal(true)
      if (result.action === "AUTO_SUBMIT") {
        finalizingRef.current = true
        stopCamera()
        onIntegrityAutoSubmit?.()
      }
    } catch {
      if (attempt < 2 && navigator.onLine) {
        pendingIntegrityEvents.current.set(
          eventId,
          window.setTimeout(
            () => {
              void recordIntegrityEvent(eventId, eventType, attempt + 1)
            },
            1000 * (attempt + 1),
          ),
        )
      } else {
        pendingIntegrityEvents.current.delete(eventId)
      }
    }
  }

  const currentQ = questions[currentIdx] || questions[0]

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => {
      track.onended = null
      track.stop()
    })
    cameraStreamRef.current = null
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null
  }

  const requestExamFullscreen = async () => {
    if (!exam.readinessRequirements?.fullscreen || document.fullscreenElement)
      return true
    try {
      await document.documentElement.requestFullscreen()
      setFullscreenActive(true)
      setFullscreenNotice(false)
      return true
    } catch {
      setFullscreenActive(false)
      setFullscreenNotice(true)
      return false
    }
  }

  const startCamera = async () => {
    if (!exam.readinessRequirements?.camera) return
    stopCamera()
    setCameraStatus("starting")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })
      cameraStreamRef.current = stream
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          cameraStreamRef.current = null
          setCameraStatus("interrupted")
          const eventId = `camera-${attemptId}-${Date.now()}-${crypto.randomUUID()}`
          void authFetch(
            `${API_BASE_URL}/api/attempts/${attemptId}/integrity-events`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                eventId,
                eventType: "CAMERA_INTERRUPTED",
                clientTimestamp: new Date().toISOString(),
              }),
            },
          ).catch(() => undefined)
        }
      })
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream
        await cameraVideoRef.current.play()
        if (
          cameraVideoRef.current.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA ||
          !cameraVideoRef.current.videoWidth ||
          !cameraVideoRef.current.videoHeight
        ) {
          stopCamera()
          setCameraStatus("interrupted")
          return
        }
      }
      setCameraStatus("active")
    } catch {
      setCameraStatus("denied")
    }
  }

  useEffect(() => {
    if (!exam.readinessRequirements?.camera) return
    void startCamera()
    return stopCamera
  }, [exam.readinessRequirements?.camera])

  useEffect(() => {
    if (!exam.readinessRequirements?.camera) return
    const timer = window.setInterval(() => {
      const video = cameraVideoRef.current
      const track = cameraStreamRef.current?.getVideoTracks()[0]
      const healthy =
        !!video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        track?.readyState === "live"
      if (cameraStatus === "active" && !healthy) setCameraStatus("interrupted")
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cameraStatus, exam.readinessRequirements?.camera])

  useEffect(() => {
    if (!exam.readinessRequirements?.camera || cameraStatus !== "active") return
    const FaceDetectorConstructor = (window as any).FaceDetector
    if (!FaceDetectorConstructor) return

    const detector = new FaceDetectorConstructor({ fastMode: true, maxDetectedFaces: 3 })
    let detectionRunning = false
    const detectFaces = async () => {
      const video = cameraVideoRef.current
      if (detectionRunning || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
      detectionRunning = true
      try {
        const faces = await detector.detect(video)
        if (faces.length > 1) {
          consecutiveMultipleFacesRef.current += 1
          const now = Date.now()
          if (consecutiveMultipleFacesRef.current >= 2 && now - lastMultiplePersonIncidentRef.current > 10000) {
            lastMultiplePersonIncidentRef.current = now
            consecutiveMultipleFacesRef.current = 0
            setMultiplePeopleDetected(true)
            setLastIntegrityType("MULTIPLE_PERSON")
            setShowWarningModal(true)
            const eventId = `multiple-person-${attemptId}-${now}-${crypto.randomUUID()}`
            pendingIntegrityEvents.current.set(eventId, 0)
            void recordIntegrityEvent(eventId, "MULTIPLE_PERSON")
          }
        } else {
          consecutiveMultipleFacesRef.current = 0
        }
      } catch {
        // Face detection can temporarily fail while the camera frame changes.
      } finally {
        detectionRunning = false
      }
    }

    const timer = window.setInterval(() => void detectFaces(), 1800)
    void detectFaces()
    return () => window.clearInterval(timer)
  }, [attemptId, cameraStatus, exam.readinessRequirements?.camera])

  useEffect(() => {
    if (!exam.readinessRequirements?.fullscreen) return
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement
      setFullscreenActive(active)
      if (active) {
        setFullscreenNotice(false)
        return
      }
      if (finalizingRef.current) return
      setFullscreenNotice(true)
      const eventId = `fullscreen-${attemptId}-${Date.now()}-${crypto.randomUUID()}`
      setShowWarningModal(true)
      void recordIntegrityEvent(eventId, "FULLSCREEN_EXIT")
    }
    void requestExamFullscreen()
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [attemptId, exam.readinessRequirements?.fullscreen])

  useEffect(() => {
    void authFetch(`${API_BASE_URL}/api/attempts/${attemptId}/integrity-status`)
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (typeof result?.counts?.tabSwitch === "number")
          setTabSwitches(result.counts.tabSwitch)
        if (typeof result?.counts?.fullscreenExit === "number")
          setFullscreenIncidents(result.counts.fullscreenExit)
        if (typeof result?.rules?.fullscreenExitThreshold === "number")
          setFullscreenThreshold(result.rules.fullscreenExitThreshold)
      })
      .catch(() => undefined)
  }, [attemptId])

  useEffect(() => {
    const protectContent = (eventType: "COPY" | "PASTE" | "SCREENSHOT") => {
      const now = Date.now()
      const eventId = `${eventType.toLowerCase()}-${attemptId}-${now}-${crypto.randomUUID()}`
      setContentObscured(true)
      setLastIntegrityType(eventType)
      setShowWarningModal(true)
      pendingIntegrityEvents.current.set(eventId, 0)
      void recordIntegrityEvent(eventId, eventType)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      const captureShortcut =
        event.key === "PrintScreen" ||
        (event.shiftKey && event.metaKey && key === "s") ||
        (event.shiftKey && event.ctrlKey && key === "s")
      if (!captureShortcut) return
      event.preventDefault()
      event.stopImmediatePropagation()
      protectContent("SCREENSHOT")
      void navigator.clipboard?.writeText("").catch(() => undefined)
    }
    const handleCopy = (event: ClipboardEvent) => {
      event.preventDefault()
      protectContent("COPY")
    }
    const handleCut = (event: ClipboardEvent) => {
      event.preventDefault()
      protectContent("COPY")
    }
    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault()
      protectContent("PASTE")
    }
    const handleContextMenu = (event: MouseEvent) => event.preventDefault()

    window.addEventListener("keydown", handleKeyDown, true)
    document.addEventListener("copy", handleCopy, true)
    document.addEventListener("cut", handleCut, true)
    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("contextmenu", handleContextMenu, true)
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
      document.removeEventListener("copy", handleCopy, true)
      document.removeEventListener("cut", handleCut, true)
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("contextmenu", handleContextMenu, true)
    }
  }, [attemptId])

  useEffect(() => {
    const online = () => setConnectionOnline(true)
    const offline = () => setConnectionOnline(false)
    window.addEventListener("online", online)
    window.addEventListener("offline", offline)
    return () => {
      window.removeEventListener("online", online)
      window.removeEventListener("offline", offline)
    }
  }, [])

  // Initialize answer states
  useEffect(() => {
    const initial: Record<string, AnswerState> = {}
    questions.forEach((q) => {
      initial[q.id] = {
        questionId: q.id,
        isMarkedForReview: false,
        visited: false,
        timeSpentSeconds: 0,
      }
    })
    if (questions[0]) {
      initial[questions[0].id].visited = true
    }
    setAnswers((existing) =>
      Object.keys(existing).length ? existing : initial,
    )
  }, [questions])

  useEffect(() => {
    const existing = JSON.parse(
      localStorage.getItem(storageKey) || "null",
    ) as PersistedAttempt | null
    const expiresAt =
      existing?.expiresAt || Date.now() + exam.durationMinutes * 60 * 1000
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        answers,
        currentIdx,
        tabSwitches,
        expiresAt,
      } satisfies PersistedAttempt),
    )
  }, [answers, currentIdx, tabSwitches, exam.durationMinutes, storageKey])

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          finalizingRef.current = true
          stopCamera()
          onSubmitExam(answers, tabSwitches, true)
          localStorage.removeItem(storageKey)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [answers, tabSwitches, onSubmitExam])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setContentObscured(true)
        setLastIntegrityType("TAB_HIDDEN")
        const now = Date.now()
        if (now - lastVisibilityIncident.current < 1500) return
        lastVisibilityIncident.current = now
        const eventId = `visibility-${attemptId}-${now}-${crypto.randomUUID()}`
        setShowWarningModal(true)
        pendingIntegrityEvents.current.set(eventId, 0)
        void recordIntegrityEvent(eventId, "TAB_HIDDEN")
      }
    }

    const handleWindowBlur = () => {
      // A window blur is not necessarily a tab switch. Browsers can emit it
      // during ordinary focus changes, so only record it when the document is
      // actually hidden. The visibilitychange handler records real switches.
      if (document.visibilityState !== "hidden") return
      setContentObscured(true)
      setLastIntegrityType("TAB_HIDDEN")
      const now = Date.now()
      if (now - lastVisibilityIncident.current < 1500) return
      lastVisibilityIncident.current = now
      const eventId = `blur-${attemptId}-${now}-${crypto.randomUUID()}`
      setShowWarningModal(true)
      pendingIntegrityEvents.current.set(eventId, 0)
      void recordIntegrityEvent(eventId, "TAB_HIDDEN")
    }

    document.addEventListener("visibilitychange", handleVisibilityChange, true)
    window.addEventListener("blur", handleWindowBlur, true)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange, true)
      window.removeEventListener("blur", handleWindowBlur, true)
      pendingIntegrityEvents.current.forEach((timer) => {
        if (timer) window.clearTimeout(timer)
      })
      pendingIntegrityEvents.current.clear()
    }
  }, [attemptId])

  const persistAnswer = async (answer: AnswerState, retry = false) => {
    if (!answer?.questionId) return false
    const version = (answerVersions[answer.questionId] || 0) + 1
    setSaveState(retry ? "retrying" : "saving")
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/attempts/${attemptId}/answers/${answer.questionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...answer, version }),
        },
      )
      if (!response.ok) throw new Error("save failed")
      setAnswerVersions((prev) => ({ ...prev, [answer.questionId]: version }))
      setSaveState("saved")
      return true
    } catch {
      setSaveState("failed")
      return false
    }
  }

  const saveAndNext = async () => {
    const saved = await persistAnswer(currentAns)
    if (!saved) return
    if (currentIdx >= questions.length - 1) {
      finalizingRef.current = true
      stopCamera()
      onSubmitExam({ ...answers, [currentAns.questionId]: currentAns }, tabSwitches)
      return
    }
    goToQuestion(currentIdx + 1)
  }

  const selectOption = (optId: string) => {
    const previous = answers[currentQ.id]
    const updated: AnswerState = {
      questionId: currentQ.id,
      selectedOptionId: optId,
      isMarkedForReview: previous?.isMarkedForReview ?? false,
      visited: true,
      timeSpentSeconds: previous?.timeSpentSeconds ?? 0,
    }
    setAnswers((current) => ({ ...current, [currentQ.id]: updated }))
    void persistAnswer(updated)
  }

  const clearResponse = () => {
    const previous = answers[currentQ.id]
    const updated: AnswerState = {
      questionId: currentQ.id,
      selectedOptionId: undefined,
      isMarkedForReview: previous?.isMarkedForReview ?? false,
      visited: true,
      timeSpentSeconds: previous?.timeSpentSeconds ?? 0,
    }
    setAnswers((current) => ({ ...current, [currentQ.id]: updated }))
    void persistAnswer(updated)
  }

  const toggleMarkForReview = () => {
    const previous = answers[currentQ.id]
    const updated: AnswerState = {
      questionId: currentQ.id,
      selectedOptionId: previous?.selectedOptionId,
      isMarkedForReview: !previous?.isMarkedForReview,
      visited: true,
      timeSpentSeconds: previous?.timeSpentSeconds ?? 0,
    }
    setAnswers((current) => ({ ...current, [currentQ.id]: updated }))
    void persistAnswer(updated)
  }

  const goToQuestion = (idx: number) => {
    if (idx >= 0 && idx < questions.length) {
      const targetQ = questions[idx]
      setAnswers((prev) => ({
        ...prev,
        [targetQ.id]: {
          ...prev[targetQ.id],
          visited: true,
        },
      }))
      setCurrentIdx(idx)
    }
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    const h = Math.floor(m / 60)
    const remM = m % 60
    return `${
      h > 0 ? String(h).padStart(2, "0") + ":" : ""
    }${String(remM).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const currentAns = answers[currentQ.id] || {}

  let answeredCount = 0
  let markedCount = 0
  let unvisitedCount = 0
  let unansweredCount = 0

  questions.forEach((q) => {
    const st = answers[q.id]
    if (!st || !st.visited) {
      unvisitedCount++
    } else if (st.selectedOptionId) {
      answeredCount++
    } else {
      unansweredCount++
    }
    if (st?.isMarkedForReview) {
      markedCount++
    }
  })

  const isLowTime = timeLeft <= 600
  const isCriticalTime = timeLeft <= 120

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-sans">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-slate-200/80 shadow-xl text-center flex flex-col gap-4">
          <h2 className="text-xl font-bold text-slate-900">Questions are not available</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            The assigned examination questions could not be loaded. Your attempt
            has not been reset.
          </p>
          <button
            className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none"
            onClick={() => window.location.reload()}
          >
            Retry loading questions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen select-none bg-slate-50 p-3 sm:p-6 font-sans text-slate-900 flex flex-col gap-4 print:hidden">
      <div
        className="pointer-events-none fixed inset-0 z-[35] overflow-hidden opacity-[0.075]"
        aria-hidden="true"
      >
        <div className="absolute inset-[-30%] grid rotate-[-24deg] grid-cols-3 content-around gap-x-12 gap-y-20 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-950">
          {Array.from({ length: 36 }, (_, index) => (
            <span key={index} className="whitespace-nowrap">
              {candidateName} · {attemptId.slice(-8)}
            </span>
          ))}
        </div>
      </div>
      {contentObscured && (
        <div className="fixed inset-0 z-[45] flex items-center justify-center bg-slate-950 p-6 text-center text-white" aria-live="assertive">
          <div className="max-w-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-2xl">🔒</div>
            <h2 className="text-xl font-bold">Exam content protected</h2>
            <p className="mt-2 text-sm font-medium text-slate-300">
              A capture or clipboard action was detected. Question content is hidden until the security warning is acknowledged.
            </p>
          </div>
        </div>
      )}
      {/* Offline Banner */}
      {!connectionOnline && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 px-5 bg-amber-500 text-slate-950 font-medium rounded-xl shadow-md z-30" role="alert">
          <div>
            <strong className="block font-bold text-slate-950 text-sm">Connection Lost</strong>
            <span className="text-xs text-slate-900/90 font-medium">
              Your examination timer is still running. We are attempting to
              reconnect.
            </span>
          </div>
          <button
            className="h-8 px-3 text-xs font-bold rounded-lg text-slate-900 bg-white hover:bg-slate-100 transition-colors border-none cursor-pointer shrink-0 shadow-sm"
            onClick={() => {
              setConnectionOnline(navigator.onLine)
              window.dispatchEvent(new Event("online"))
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Fullscreen Notice Banner */}
      {exam.readinessRequirements?.fullscreen && fullscreenNotice && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 px-5 bg-red-600 text-white font-medium rounded-xl shadow-md z-30" role="alert">
          <span className="text-xs sm:text-sm font-semibold">
            Fullscreen has been exited. Return to fullscreen to continue the
            examination.
          </span>
          <button
            className="h-8 px-3 text-xs font-bold rounded-lg text-slate-900 bg-white hover:bg-slate-100 transition-colors border-none cursor-pointer shrink-0 shadow-sm"
            onClick={() => {
              void requestExamFullscreen()
            }}
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      {/* Proctoring Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 flex flex-col items-center text-center gap-4 text-slate-900">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-3xl font-bold shrink-0">
              ⚠️
            </div>
            <h3 className="text-xl font-bold text-slate-900">Proctoring Security Warning</h3>
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              A{" "}
              {lastIntegrityType === "FULLSCREEN_EXIT"
                ? "fullscreen exit"
                : lastIntegrityType === "MULTIPLE_PERSON"
                  ? "multiple-person camera detection"
                : lastIntegrityType === "SCREENSHOT"
                  ? "screenshot attempt"
                  : lastIntegrityType === "COPY" || lastIntegrityType === "PASTE"
                    ? "clipboard action"
                    : "tab-switch or window-visibility"}{" "}
              incident has been recorded.{" "}
              <strong className="text-slate-900 font-bold">
                Recorded incidents:{" "}
                {lastIntegrityType === "FULLSCREEN_EXIT"
                  ? fullscreenIncidents
                  : tabSwitches}
              </strong>
              {lastIntegrityType === "FULLSCREEN_EXIT" && fullscreenThreshold
                ? ` of ${fullscreenThreshold}`
                : ""}
              . Review the examination monitoring policy before continuing. The
              backend evaluates incidents according to the configured rules.
            </p>
            <button
              className="mt-2 h-11 w-full px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none"
              onClick={() => {
                setShowWarningModal(false)
                setContentObscured(false)
                setMultiplePeopleDetected(false)
              }}
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}

      {/* Floating Camera Monitor Overlay */}
      {false && exam.readinessRequirements?.camera && (
        <div
          className="fixed bottom-4 left-4 z-40 w-44 sm:w-48 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-2xl p-2.5 flex flex-col gap-2 text-white"
          role="status"
          aria-live="polite"
        >
          <div className="relative w-full h-28 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center text-center">
            <video
              ref={cameraVideoRef}
              muted
              playsInline
              aria-label="Live camera preview"
              className="w-full h-full object-cover"
            />
            {cameraStatus !== "active" && (
              <span className="absolute inset-0 p-2 flex items-center justify-center text-[11px] font-semibold text-slate-300 bg-slate-950/80 leading-snug">
                {cameraStatus === "starting"
                  ? "Starting camera…"
                  : cameraStatus === "denied"
                    ? "Camera permission required"
                    : "Camera interrupted"}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs font-semibold px-0.5">
            <strong className="flex items-center gap-1.5 text-[11px] text-slate-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  cameraStatus === "active"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                    : cameraStatus === "starting"
                      ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                }`}
              />{" "}
              {cameraStatus === "active"
                ? "Camera Active"
                : cameraStatus === "starting"
                  ? "Reconnecting…"
                  : "Unavailable"}
            </strong>
            {cameraStatus !== "active" && (
              <button
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer border-none bg-transparent p-0"
                onClick={() => void startCamera()}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exam Header Toolbar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:px-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{exam.title}</h2>
          <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">{exam.examCode}</span>
          {exam.readinessRequirements?.fullscreen && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${
                fullscreenActive
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {fullscreenActive ? "Fullscreen active" : "Fullscreen required"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-semibold">
            {saveState === "saved" ? (
              <span className="text-emerald-700">✓ All changes saved</span>
            ) : saveState === "saving" ? (
              <span className="text-slate-500">Saving answer...</span>
            ) : saveState === "retrying" ? (
              <span className="text-amber-600">Reconnecting and retrying...</span>
            ) : (
              <button
                className="text-red-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                onClick={() => persistAnswer(currentAns, true)}
              >
                Unable to save answer · Retry
              </button>
            )}
          </div>

          <div
            className={`flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl border text-center transition-colors ${
              isCriticalTime
                ? "bg-red-50 border-red-300 text-red-700 animate-pulse"
                : isLowTime
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <small className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">TIME REMAINING</small>
            <b className="font-mono text-sm sm:text-base font-extrabold leading-none mt-1">{formatTimer(timeLeft)}</b>
          </div>

          <button
            className="h-10 px-3.5 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            onClick={() => setPaletteOpen(!paletteOpen)}
          >
            {paletteOpen ? "Hide Palette" : "Question Palette"}
          </button>

          <button
            className="h-10 px-5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-all cursor-pointer shadow-sm shadow-red-500/20 border-none"
            onClick={() => {
              finalizingRef.current = true
              stopCamera()
              onSubmitExam(answers, tabSwitches)
            }}
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Main Examination Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <main className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Section Info Bar */}
          <div className="flex items-center justify-between p-3.5 px-5 bg-slate-50/80 border-b border-slate-200/80 text-xs sm:text-sm font-semibold text-slate-700">
            <span>
              SECTION: <strong className="text-slate-900 font-bold">{currentQ.sectionName}</strong>
            </span>
            <div className="flex items-center gap-3">
              <span>Marks: <strong className="text-emerald-700 font-bold">+{currentQ.marks}</strong></span>
              <span>Neg: <strong className="text-red-600 font-bold">-{currentQ.negativeMarks}</strong></span>
            </div>
          </div>

          {/* Question Card */}
          <div className="p-5 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-500 uppercase tracking-wider">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <button
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  currentAns.isMarkedForReview
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
                onClick={toggleMarkForReview}
              >
                🚩{" "}
                {currentAns.isMarkedForReview
                  ? "Marked for Review"
                  : "Mark for Review"}
              </button>
            </div>

            <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">{currentQ.questionText}</div>

            {currentQ.codeSnippet && (
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs sm:text-sm font-mono overflow-x-auto">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            )}

            {/* Options List */}
            <div className="flex flex-col gap-3 mt-1">
              {currentQ.options.map((opt) => {
                const isSelected = currentAns.selectedOptionId === opt.id
                const optKey = (opt.id || "").includes("-")
                  ? (opt.id.split("-").pop() || opt.id).toUpperCase()
                  : String(opt.id || "").toUpperCase()
                return (
                  <label
                    key={opt.id}
                    className={`group flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                        : "bg-white border-slate-200/90 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                    onClick={() => selectOption(opt.id)}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQ.id}`}
                      checked={isSelected}
                      onChange={() => selectOption(opt.id)}
                      className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 transition-colors ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"}`}>
                      {optKey}
                    </span>
                    <span className="flex-1 font-medium">{opt.text}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Viewport Footer Navigation Actions */}
          <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:px-6 bg-slate-50/60 border-t border-slate-200/80">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm flex-1 sm:flex-initial"
                disabled={currentIdx === 0}
                onClick={() => goToQuestion(currentIdx - 1)}
              >
                ← Previous
              </button>
              <button
                className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-sm flex-1 sm:flex-initial"
                onClick={clearResponse}
              >
                Clear Response
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                className="h-10 px-4 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-sm flex-1 sm:flex-initial"
                onClick={() => {
                  toggleMarkForReview()
                  if (currentIdx < questions.length - 1)
                    goToQuestion(currentIdx + 1)
                }}
              >
                Mark for Review & Next
              </button>
              <button
                className={`h-10 px-5 text-xs sm:text-sm font-semibold rounded-lg text-white transition-all cursor-pointer shadow-sm border-none flex-1 sm:flex-initial ${currentIdx >= questions.length - 1 ? "bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-red-500/20" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/20"}`}
                onClick={() => void saveAndNext()}
              >
                {currentIdx >= questions.length - 1 ? "Submit Exam" : "Save & Next →"}
              </button>
            </div>
          </footer>
        </main>

        {/* Question Palette Sidebar */}
        {paletteOpen && (
          <aside className="flex flex-col gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Question Palette</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Candidate: <strong className="text-slate-800 font-semibold">{candidateName}</strong>
              </p>
            </div>

            {exam.readinessRequirements?.camera && (
              <div className={`rounded-xl border bg-slate-900 p-2.5 text-white shadow-sm ${multiplePeopleDetected ? "border-red-500 ring-2 ring-red-500/40" : "border-slate-700"}`} role="status" aria-live="polite">
                <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-center">
                  <video ref={cameraVideoRef} muted playsInline aria-label="Live camera preview" className="h-full w-full object-cover" />
                  {cameraStatus !== "active" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/85 p-3 text-xs font-semibold text-slate-300">
                      {cameraStatus === "starting" ? "Starting camera…" : cameraStatus === "denied" ? "Camera permission required" : "Camera interrupted"}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-semibold">
                  <strong className="flex items-center gap-1.5 text-[11px] text-slate-200">
                    <span className={`h-2 w-2 rounded-full ${cameraStatus === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : cameraStatus === "starting" ? "bg-amber-500" : "bg-red-500"}`} />
                    {cameraStatus === "active" ? "Camera Active" : cameraStatus === "starting" ? "Connecting…" : "Unavailable"}
                  </strong>
                  {cameraStatus !== "active" && <button className="cursor-pointer border-none bg-transparent p-0 text-[10px] font-bold text-blue-400 underline" onClick={() => void startCamera()}>Retry</button>}
                </div>
                {multiplePeopleDetected && (
                  <div className="mt-2 rounded-lg bg-red-600 px-2.5 py-2 text-center text-[11px] font-bold text-white">
                    Multiple people detected — only the candidate may remain visible
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Question progress</span>
                <span>{answeredCount} / {questions.length} answered</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Answered question progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount}>
                <span className="block h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] font-semibold text-slate-500">
                <span>{questions.length - unvisitedCount} visited</span>
                <span>{Math.round(questions.length ? (answeredCount / questions.length) * 100 : 0)}% complete</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-600 shrink-0" /> Answered ({answeredCount})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-red-100 border border-red-200 shrink-0" /> Not Answered ({unansweredCount})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-amber-500 shrink-0" /> Marked ({markedCount})
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-200 shrink-0" /> Not Visited ({unvisitedCount})
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 my-1 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id]
                let statusClass = "unvisited"
                if (ans?.selectedOptionId && ans?.isMarkedForReview) {
                  statusClass = "ans-marked"
                } else if (ans?.selectedOptionId) {
                  statusClass = "answered"
                } else if (ans?.isMarkedForReview) {
                  statusClass = "marked"
                } else if (ans?.visited) {
                  statusClass = "unanswered"
                }

                return (
                  <button
                    key={q.id}
                    className={`h-9 w-full rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer border ${
                      currentIdx === idx
                        ? "ring-2 ring-blue-600 ring-offset-2 z-10"
                        : ""
                    } ${
                      statusClass === "ans-marked"
                        ? "bg-purple-600 text-white border-purple-700"
                        : statusClass === "answered"
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : statusClass === "marked"
                            ? "bg-amber-500 text-white border-amber-600"
                            : statusClass === "unanswered"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                    onClick={() => goToQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            {/* Proctoring Box */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl flex flex-col gap-1 text-xs text-blue-900 font-medium">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">🛡️ Automated Proctoring Active</div>
              <small className="text-xs text-blue-800 font-medium">
                Tab-switch incidents: <strong className="font-bold text-blue-950">{tabSwitches}</strong>
              </small>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
