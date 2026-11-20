import { useCallback, useEffect, useRef, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"

type CodingExamPlayerProps = {
  exam: any
  attemptId: string
  questions: any[]
  initialRemainingSeconds: number
  onSubmitSuccess: () => void
}

export function CodingExamPlayer({
  exam,
  attemptId,
  questions = [],
  initialRemainingSeconds,
  onSubmitSuccess,
}: CodingExamPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds)
  const [language, setLanguage] = useState("javascript")
  const [code, setCode] = useState("")
  const [customInput, setCustomInput] = useState("")
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [evalResult, setEvalResult] = useState<any>(null)
  const [savedAnswers, setSavedAnswers] = useState<Record<string, any>>({})
  const [cameraStatus, setCameraStatus] = useState<"active" | "starting" | "denied" | "interrupted">("starting")

  // Editor & Panel Customization States
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [panelCollapsed, setPanelCollapsed] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "error">("saved")

  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const currentQuestion = questions[currentIndex] || null

  // Admin-approved languages for this examination
  const allowedLangs: string[] = (exam?.allowedLanguages && exam.allowedLanguages.length)
    ? exam.allowedLanguages
    : ["javascript", "python", "cpp", "java", "c"]

  // Starter code templates per language
  const starterTemplates: Record<string, string> = {
    javascript: `function solve(input) {\n  // Write your solution here\n  return input;\n}`,
    python: `def solve(input):\n    # Write your solution here\n    return input\n`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    java: `public class Solution {\n    public static Object solve(Object input) {\n        // Write your solution here\n        return input;\n    }\n}`,
    c: `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    csharp: `using System;\n\npublic class Program {\n    public static void Main() {\n        // Write your solution here\n    }\n}`,
  }

  const languageVersions: Record<string, string> = {
    python: "Python 3.11.4",
    javascript: "Node.js 20.10.0",
    cpp: "GCC 13.2.0 (C++17)",
    c: "GCC 13.2.0 (C11)",
    java: "OpenJDK 17.0.8",
  }

  // Preserve code & state when navigating between questions or switching languages
  useEffect(() => {
    if (!currentQuestion) return
    const qId = currentQuestion._id || currentQuestion.id
    const existing = savedAnswers[qId]

    if (existing?.code) {
      setCode(existing.code)
      if (existing.language) setLanguage(existing.language)
    } else {
      const qStarterMap = currentQuestion.starterCode || {}
      const activeLang = allowedLangs.includes(language) ? language : allowedLangs[0] || "javascript"
      const template = qStarterMap[activeLang] || starterTemplates[activeLang] || starterTemplates.javascript
      setCode(template)
      setLanguage(activeLang)
    }
    setEvalResult(existing?.evalResult || null)
  }, [currentIndex, currentQuestion])

  // Sync language template if student changes language manually
  const handleLanguageChange = (nextLang: string) => {
    setLanguage(nextLang)
    const qId = currentQuestion?._id || currentQuestion?.id
    const existing = savedAnswers[qId]
    if (existing?.language === nextLang && existing?.code) {
      setCode(existing.code)
    } else {
      const qStarterMap = currentQuestion?.starterCode || {}
      const template = qStarterMap[nextLang] || starterTemplates[nextLang] || starterTemplates.javascript
      setCode(template)
    }
  }

  // Timer Countdown
  useEffect(() => {
    if (remainingSeconds <= 0) return
    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [remainingSeconds])

  // Camera Proctoring Setup
  const startCamera = useCallback(async () => {
    if (!exam?.readinessRequirements?.camera) return
    try {
      setCameraStatus("starting")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      cameraStreamRef.current = stream
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream
        await cameraVideoRef.current.play()
      }
      setCameraStatus("active")
    } catch {
      setCameraStatus("denied")
    }
  }, [exam?.readinessRequirements?.camera])

  useEffect(() => {
    if (exam?.readinessRequirements?.camera) {
      void startCamera()
    }
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
  }, [startCamera, exam?.readinessRequirements?.camera])

  // System Autosave Worker: Periodically saves student code every 30 seconds
  useEffect(() => {
    if (!currentQuestion || !code.trim()) return
    const qId = currentQuestion._id || currentQuestion.id

    setAutosaveStatus("saving")
    const autosaveTimer = window.setInterval(() => {
      setAutosaveStatus("saving")
      void authFetch(`${API_BASE_URL}/api/attempts/${attemptId}/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: qId,
          code,
          language,
        }),
      }).then(async (res) => {
        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          setAutosaveStatus("saved")
          if (data.evalResult) {
            setSavedAnswers((prev) => ({
              ...prev,
              [qId]: { code, language, evalResult: data.evalResult, score: data.score },
            }))
          }
        } else {
          setAutosaveStatus("error")
        }
      }).catch(() => setAutosaveStatus("error"))
    }, 30000)

    return () => window.clearInterval(autosaveTimer)
  }, [attemptId, currentQuestion, code, language])

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600)
    const mins = Math.floor((totalSec % 3600) / 60)
    const secs = totalSec % 60
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Handle Tab key indentation inside editor
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newCode = code.substring(0, start) + "  " + code.substring(end)
      setCode(newCode)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
  }

  const runCode = async () => {
    if (!currentQuestion || running) return
    const qId = currentQuestion._id || currentQuestion.id
    setRunning(true)
    setEvalResult(null)

    try {
      const res = await authFetch(`${API_BASE_URL}/api/attempts/${attemptId}/run-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: qId,
          code,
          language,
          input: customInput.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setEvalResult(data)
      }
    } catch {
      // Ignore run errors
    } finally {
      setRunning(false)
    }
  }

  const submitQuestionCode = async () => {
    if (!currentQuestion || submitting) return
    const qId = currentQuestion._id || currentQuestion.id
    setSubmitting(true)
    setAutosaveStatus("saving")

    try {
      const res = await authFetch(`${API_BASE_URL}/api/attempts/${attemptId}/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: qId,
          code,
          language,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAutosaveStatus("saved")
        setEvalResult(data.evalResult)
        setSavedAnswers((prev) => ({
          ...prev,
          [qId]: { code, language, evalResult: data.evalResult, score: data.score },
        }))
      } else {
        setAutosaveStatus("error")
      }
    } catch {
      setAutosaveStatus("error")
    } finally {
      setSubmitting(false)
    }
  }

  const confirmResetStarterCode = () => {
    const qStarterMap = currentQuestion?.starterCode || {}
    const template = qStarterMap[language] || starterTemplates[language] || starterTemplates.javascript
    setCode(template)
    setResetModalOpen(false)
  }

  const finishAssessment = async () => {
    const res = await authFetch(`${API_BASE_URL}/api/attempts/${attemptId}/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
    if (res.ok) {
      onSubmitSuccess()
    }
  }

  const lineCount = code.split("\n").length

  return (
    <div className="relative min-h-screen w-full bg-[#F6F2E6] text-[#1E3A34] font-sans flex flex-col">
      {/* Top Header Bar */}
      <header className="h-16 px-6 bg-white/80 backdrop-blur-2xl border-b border-[#E2DBD0] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-3 py-1 rounded-full bg-[#00D084]/20 text-[#057A55] text-xs font-black uppercase tracking-wider border border-[#00D084]/30 shrink-0">
            Technical Coding Assessment
          </span>
          <h1 className="text-sm sm:text-base font-black text-[#1E3A34] m-0 truncate">
            Question {currentIndex + 1} of {questions.length} · {currentQuestion?.questionTitle || currentQuestion?.questionText || "Coding Task"}
          </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Question Selector Pills Q1, Q2, Q3, Q4 */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            {questions.map((q, idx) => {
              const qId = q._id || q.id
              const isAnswered = Boolean(savedAnswers[qId])
              return (
                <button
                  key={qId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-7 px-3 rounded-xl text-xs font-black transition-all border-none cursor-pointer ${
                    currentIndex === idx
                      ? "bg-[#1E3A34] text-white shadow-xs"
                      : isAnswered
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-slate-600 hover:text-[#1E3A34]"
                  }`}
                >
                  Q{idx + 1} {isAnswered && "✓"}
                </button>
              )
            })}
          </div>

          {/* Live Camera Monitor Indicator */}
          {exam?.readinessRequirements?.camera && (
            <div className="relative h-9 px-3 rounded-2xl bg-slate-900 text-white text-xs font-extrabold flex items-center gap-2 border border-[#00D084]/40 shadow-xs">
              <div className="w-5 h-4 rounded overflow-hidden bg-black shrink-0 relative">
                <video ref={cameraVideoRef} muted playsInline className="w-full h-full object-cover" />
              </div>
              <span className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className={`w-2 h-2 rounded-full ${cameraStatus === "active" ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
                {cameraStatus === "active" ? "Camera On" : "Connecting..."}
              </span>
            </div>
          )}

          {/* Countdown Timer Badge */}
          <div className="px-4 py-1.5 rounded-2xl bg-[#1E3A34] text-white text-xs font-black flex items-center gap-2 shadow-xs">
            <span className="text-[#00D084]">⏱</span>
            <span className="font-mono font-bold text-xs sm:text-sm">{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={finishAssessment}
            className="h-10 px-5 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer shadow-md border-none"
          >
            Finish Assessment
          </button>
        </div>
      </header>

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3 sm:p-5 gap-4 min-h-0">
        {/* Left Pane: Problem Statement & Test Case Console */}
        {!panelCollapsed && (
          <div className="w-full lg:w-1/2 flex flex-col bg-white/70 backdrop-blur-2xl rounded-3xl border border-white shadow-xl overflow-hidden transition-all">
            {/* Question Selector Tabs for Mobile/Tablet */}
            <div className="p-3 border-b border-[#F0EBE1] flex items-center justify-between gap-2 overflow-x-auto bg-white/40 shrink-0">
              <div className="flex items-center gap-1.5">
                {questions.map((q, idx) => {
                  const qId = q._id || q.id
                  const answered = Boolean(savedAnswers[qId])
                  return (
                    <button
                      key={qId}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-8 px-3 rounded-xl text-xs font-black transition-all border-none cursor-pointer whitespace-nowrap ${
                        currentIndex === idx
                          ? "bg-[#1E3A34] text-white shadow-md"
                          : answered
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-white/80 text-[#1E3A34] hover:bg-white"
                      }`}
                    >
                      Problem {idx + 1} {answered && "✓"}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setPanelCollapsed(true)}
                className="text-xs font-bold text-[#057A55] hover:bg-white px-2 py-1 rounded-lg transition-colors border-none bg-transparent cursor-pointer shrink-0"
                title="Collapse Problem Description Panel"
              >
                ◀ Minimize
              </button>
            </div>

            {/* Problem Statement Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
              {currentQuestion ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg sm:text-xl font-black text-[#1E3A34] m-0">
                      {currentQuestion.questionTitle || currentQuestion.questionText}
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        currentQuestion.difficulty === "EASY"
                          ? "bg-emerald-100 text-emerald-800"
                          : currentQuestion.difficulty === "MEDIUM"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                      }`}>
                        {currentQuestion.difficulty || "Easy"}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#176B58]/15 text-[#176B58] font-black text-xs">
                        {currentQuestion.marks || 10} Marks
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F6F2E6] border border-[#E2DBD0] text-[#1E3A34] font-medium leading-relaxed">
                    <b className="block font-black text-xs uppercase tracking-wider text-[#057A55] mb-1">Problem Statement</b>
                    {currentQuestion.explanation || currentQuestion.problemDescription || currentQuestion.questionText}
                  </div>

                  {/* Input / Output Formats */}
                  {(currentQuestion.inputFormat || currentQuestion.outputFormat) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentQuestion.inputFormat && (
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                          <b className="block font-black text-[#057A55] text-[10px] uppercase">Input Format</b>
                          <p className="font-medium text-slate-700 m-0 text-xs">{currentQuestion.inputFormat}</p>
                        </div>
                      )}
                      {currentQuestion.outputFormat && (
                        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-1">
                          <b className="block font-black text-[#057A55] text-[10px] uppercase">Output Format</b>
                          <p className="font-medium text-slate-700 m-0 text-xs">{currentQuestion.outputFormat}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Constraints */}
                  {currentQuestion.constraints && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-950 space-y-1">
                      <b className="block font-black text-amber-800 text-[10px] uppercase">Constraints</b>
                      <code className="font-mono text-xs font-bold text-amber-900">{currentQuestion.constraints}</code>
                    </div>
                  )}

                  {/* Sample Test Cases */}
                  <div className="space-y-3 pt-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#057A55] m-0">
                      Sample Test Cases
                    </h3>
                    {(currentQuestion.testCases || [])
                      .filter((tc: any) => !tc.isHidden)
                      .map((tc: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">Sample Input:</span>
                            <code className="text-[#1E3A34] font-extrabold">{tc.input || "(empty)"}</code>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block mb-0.5">Expected Output:</span>
                            <code className="text-[#057A55] font-extrabold">{tc.expectedOutput}</code>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Custom Input Box */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-black uppercase tracking-wider text-[#057A55] block">
                      Custom Test Input (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter custom arguments for Run Code..."
                      className="w-full p-3 bg-white/90 border border-[#E2DBD0] rounded-2xl text-xs font-mono text-[#1E3A34] outline-none focus:border-[#00D084]"
                    />
                  </div>

                  {/* Test Execution Console Output */}
                  {evalResult && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#057A55] m-0">
                          {evalResult.isPractice ? "Execution Console (Run Code Output)" : "Evaluation Summary"}
                        </h3>
                        <div className="flex items-center gap-2">
                          {evalResult.executionTimeMs !== undefined && (
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              Runtime: {evalResult.executionTimeMs}ms
                            </span>
                          )}
                          {evalResult.passed !== undefined && (
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${evalResult.passed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                              {evalResult.passed ? "Passed All Test Cases" : `${evalResult.passCount} / ${evalResult.totalTestCases} Test Cases Passed`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Standard Output stdout */}
                      {evalResult.stdout !== undefined && (
                        <div className="p-3.5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-400 font-sans block">Standard Output (stdout)</span>
                          <pre className="m-0 whitespace-pre-wrap">{evalResult.stdout || "(no output)"}</pre>
                        </div>
                      )}

                      {/* Standard Error stderr */}
                      {evalResult.stderr && (
                        <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500/40 text-rose-300 font-mono text-xs space-y-1">
                          <span className="text-[10px] font-black uppercase text-rose-400 font-sans block">Standard Error (stderr)</span>
                          <pre className="m-0 whitespace-pre-wrap">{evalResult.stderr}</pre>
                        </div>
                      )}

                      {/* Test Case Execution Table */}
                      {(evalResult.evalResult?.testResults || evalResult.testResults) && (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
                          <table className="w-full text-left text-xs font-mono border-collapse">
                            <thead>
                              <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-sans font-black text-[10px] uppercase">
                                <th className="px-4 py-2.5">Test Case</th>
                                <th className="px-4 py-2.5">Result</th>
                                <th className="px-4 py-2.5">Input</th>
                                <th className="px-4 py-2.5">Expected Output</th>
                                <th className="px-4 py-2.5">Actual Output</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(evalResult.evalResult?.testResults || evalResult.testResults).map((tr: any, idx: number) => {
                                const status = tr.status || (tr.passed ? "ACCEPTED" : "WRONG_ANSWER")
                                const statusClass =
                                  status === "ACCEPTED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : status === "WRONG_ANSWER"
                                      ? "bg-rose-100 text-rose-800"
                                      : status === "TIME_LIMIT_EXCEEDED"
                                        ? "bg-purple-100 text-purple-800"
                                        : status === "COMPILATION_ERROR"
                                          ? "bg-amber-100 text-amber-800"
                                          : status === "RUNTIME_ERROR"
                                            ? "bg-rose-200 text-rose-900"
                                            : "bg-slate-200 text-slate-800"
                                return (
                                <tr key={idx} className={tr.passed ? "bg-emerald-50/40" : "bg-rose-50/40"}>
                                  <td className="px-4 py-2.5 font-bold text-[#1E3A34] font-sans">
                                    Sample Test {idx + 1} {tr.isHidden && "(Hidden)"}
                                    {tr.languageVersion && <small className="block text-[9px] opacity-70 font-mono">{tr.languageVersion}</small>}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${statusClass}`}>
                                      {status.replace(/_/g, " ")}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-600">
                                    {tr.isHidden ? "—" : (tr.input || "(empty)")}
                                  </td>
                                  <td className="px-4 py-2.5 text-emerald-800 font-bold">
                                    {tr.isHidden ? "—" : (tr.expectedOutput || "(empty)")}
                                  </td>
                                  <td className="px-4 py-2.5 text-slate-800 font-bold">
                                    {tr.isHidden ? (tr.passed ? "Match" : "Mismatch") : (tr.actualOutput || "(empty)")}
                                  </td>
                                </tr>
                              )})}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center font-bold text-slate-500">No questions loaded.</div>
              )}
            </div>
          </div>
        )}

        {/* Right Pane: Interactive Code Editor */}
        <div className={`${panelCollapsed ? "w-full" : "w-full lg:w-1/2"} flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === "dark" ? "bg-[#1E3A34] text-white border-white/20" : "bg-white text-slate-900 border-slate-200"
        }`}>
          {/* Editor Header Bar */}
          <div className={`p-3.5 px-5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            theme === "dark" ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"
          }`}>
            <div className="flex items-center gap-3">
              {panelCollapsed && (
                <button
                  onClick={() => setPanelCollapsed(false)}
                  className="text-xs font-black text-[#00D084] hover:underline border-none bg-transparent cursor-pointer"
                >
                  ▶ Expand Problem
                </button>
              )}

              <span className={`text-xs font-black uppercase tracking-wider ${theme === "dark" ? "text-[#00D084]" : "text-[#176B58]"}`}>
                Language:
              </span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className={`h-9 px-3 text-xs font-black rounded-xl outline-none cursor-pointer border ${
                  theme === "dark"
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white border-slate-300 text-slate-900"
                }`}
              >
                {allowedLangs.map((langKey) => (
                  <option key={langKey} value={langKey} className="bg-[#1E3A34] text-white">
                    {langKey === "javascript"
                      ? "JavaScript (Node.js)"
                      : langKey === "python"
                        ? "Python 3"
                        : langKey === "cpp"
                          ? "C++ 17"
                          : langKey === "java"
                            ? "Java 11"
                            : langKey === "c"
                              ? "C 11"
                              : "C#"}
                  </option>
                ))}
              </select>

              <span className={`text-[10px] font-mono px-2 py-1 rounded-lg ${theme === "dark" ? "bg-white/10 text-emerald-300 border border-white/10" : "bg-slate-200 text-slate-700 border border-slate-300"}`}>
                {languageVersions[language] || "Pinned Version"}
              </span>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`h-8 px-3 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    : "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-800"
                }`}
              >
                {theme === "dark" ? "☀️ Light Theme" : "🌙 Dark Theme"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Visible Autosave Status Indicator */}
              <span className="flex items-center gap-1.5 text-xs font-extrabold">
                <span className={`w-2 h-2 rounded-full ${
                  autosaveStatus === "saved"
                    ? "bg-emerald-400"
                    : autosaveStatus === "saving"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-rose-400"
                }`} />
                <span className={theme === "dark" ? "text-slate-300" : "text-slate-600"}>
                  {autosaveStatus === "saved" ? "Saved" : autosaveStatus === "saving" ? "Saving..." : "Autosave Error"}
                </span>
              </span>

              <button
                onClick={() => setResetModalOpen(true)}
                className={`text-xs font-bold transition-colors border-none bg-transparent cursor-pointer ${
                  theme === "dark" ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Reset Code
              </button>
            </div>
          </div>

          {/* Source Code Textarea with Line Numbers */}
          <div className="flex-1 relative flex min-h-[350px]">
            {/* Line Number Column */}
            <div className={`w-12 py-5 text-right pr-3 select-none font-mono text-xs leading-relaxed opacity-40 shrink-0 ${
              theme === "dark" ? "bg-black/20 border-r border-white/10 text-emerald-200" : "bg-slate-100 border-r border-slate-200 text-slate-600"
            }`}>
              {Array.from({ length: lineCount }, (_, i) => i + 1).map((lineNum) => (
                <div key={lineNum}>{lineNum}</div>
              ))}
            </div>

            {/* Interactive Code Editor Textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleEditorKeyDown}
              placeholder="// Write code solution here..."
              spellCheck={false}
              className={`w-full h-full p-5 bg-transparent font-mono text-xs sm:text-sm outline-none resize-none leading-relaxed ${
                theme === "dark" ? "text-emerald-300" : "text-slate-900 font-medium"
              }`}
            />
          </div>

          {/* Action Footer Bar */}
          <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
            theme === "dark" ? "border-white/10 bg-black/20" : "border-slate-200 bg-slate-50"
          }`}>
            <span className={`text-xs font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-500"}`}>
              Use <kbd className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px]">Tab</kbd> for 2-space indentation
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={runCode}
                disabled={running}
                className={`h-11 px-6 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer border disabled:opacity-50 ${
                  theme === "dark"
                    ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                    : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs"
                }`}
              >
                {running ? "Running Tests..." : "Run Tests"}
              </button>
              <button
                onClick={submitQuestionCode}
                disabled={submitting}
                className="h-11 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#00D084] hover:bg-[#00B070] text-[#1E3A34] transition-all cursor-pointer border-none shadow-md shadow-[#00D084]/20 disabled:opacity-50"
              >
                {submitting ? "Evaluating Code..." : "Submit Code"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Code */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-[480px] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-[#1E3A34] space-y-4">
            <h3 className="text-xl font-black text-[#1E3A34] m-0">Reset to Starter Code?</h3>
            <p className="text-xs text-slate-600 font-medium m-0 leading-relaxed">
              Are you sure you want to reset your source code for this problem? Your current edits will be replaced with the default starter template.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setResetModalOpen(false)}
                className="h-10 px-5 text-xs font-bold rounded-2xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetStarterCode}
                className="h-10 px-6 text-xs font-black rounded-2xl text-white bg-rose-600 hover:bg-rose-700 transition-colors border-none shadow-md cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
