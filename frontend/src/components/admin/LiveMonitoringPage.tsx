import { useCallback, useEffect, useRef, useState } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

export function LiveMonitoringPage({
  PageHead,
  active = "Live monitoring",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: {
  PageHead: any
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [attempts, setAttempts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [cameraModalTarget, setCameraModalTarget] = useState<any>(null)
  const [codeReviewTarget, setCodeReviewTarget] = useState<any>(null)
  const [codeAnswers, setCodeAnswers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [status, setStatus] = useState("IN_PROGRESS")
  const initialLoad = useRef(true)

  const load = useCallback(async () => {
    try {
      setError("")
      if (initialLoad.current) setLoading(true)
      const query = status ? `?status=${encodeURIComponent(status)}` : ""
      const response = await authFetch(
        `${API_BASE_URL}/api/admin/monitoring/attempts${query}`,
        {},
        true,
      )
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Unable to load live monitoring.")
      setAttempts(data.attempts || [])
      setUpdatedAt(new Date())
      initialLoad.current = false
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load live monitoring.",
      )
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(), 3000)
    return () => window.clearInterval(timer)
  }, [load])

  const viewEvents = async (attempt: any) => {
    setSelected(attempt)
    const response = await authFetch(
      `${API_BASE_URL}/api/admin/monitoring/attempts/${attempt.attemptId}/events`,
      {},
      true,
    )
    const data = await response.json()
    if (response.ok) setEvents(data.events || [])
  }

  const openCodeReview = async (attempt: any) => {
    setCodeReviewTarget(attempt)
    const res = await authFetch(
      `${API_BASE_URL}/api/admin/monitoring/attempts/${attempt.attemptId || attempt.id}/code-review`,
      {},
      true,
    )
    const data = await res.json()
    if (res.ok) setCodeAnswers(data.answers || [])
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

        {/* Hero Header Glass Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-6 sm:p-7">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                  Flux Suite
                </span>
                <span className="text-xs font-bold text-[#1E3A34]/80">
                  Real-time Proctoring
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
                Live Monitoring
              </h2>
              <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed">
                Automated live candidate attempt tracking, telemetry streams, and security breach flags.
              </p>
            </div>
            {updatedAt && (
              <span className="text-xs font-bold text-[#057A55] bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/80 shadow-xs self-start sm:self-auto">
                Updated {updatedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 text-xs sm:text-sm font-extrabold rounded-2xl border border-rose-300 bg-rose-500/15 text-rose-900 flex items-center justify-between gap-3 shadow-md backdrop-blur-xl">
            <span>{error}</span>
            <button
              className="h-8 px-4 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer border-none shadow-xs"
              onClick={() => void load()}
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 backdrop-blur-2xl p-4 sm:p-5 rounded-3xl border border-white/80 shadow-[0_8px_30px_-5px_rgba(30,58,52,0.06)]">
          <div className="flex items-center gap-2">
            {["IN_PROGRESS", "SUBMITTED", ""].map((st) => (
              <button
                key={st}
                onClick={() => setStatus(st)}
                className={`h-9 px-4 text-xs font-black rounded-2xl transition-all cursor-pointer border-none ${
                  status === st
                    ? "bg-[#176B58] text-white shadow-md shadow-[#176B58]/20"
                    : "bg-white/80 text-[#1E3A34] hover:bg-white border border-slate-200/80"
                }`}
              >
                {st === "IN_PROGRESS" ? "Active Candidates" : st === "SUBMITTED" ? "Completed" : "All Statuses"}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)]">
          {loading ? (
            <div className="p-14 text-center text-xs sm:text-sm font-bold text-[#057A55]">
              Connecting to live telemetry feed...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#1E3A34]/5 border-b border-[#1E3A34]/10 text-[#1E3A34] font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-4 align-middle whitespace-nowrap">Student</th>
                    <th className="px-5 py-4 align-middle whitespace-nowrap">College / Reg ID</th>
                    <th className="px-5 py-4 align-middle whitespace-nowrap">Exam Name</th>
                    <th className="px-5 py-4 align-middle whitespace-nowrap text-center">Started At</th>
                    <th className="px-5 py-4 align-middle whitespace-nowrap text-center">Status</th>
                    <th className="px-5 py-4 align-middle whitespace-nowrap">Question Progress</th>
                    <th className="px-5 py-4 align-middle whitespace-nowrap text-center">Flags</th>
                    <th className="px-5 py-4 align-middle whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {attempts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-xs sm:text-sm text-[#057A55] align-middle">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                          <h3 className="text-lg font-black text-[#1E3A34] m-0">
                            {status === "IN_PROGRESS"
                              ? "No active examination sessions"
                              : status === "SUBMITTED"
                                ? "No completed examination sessions"
                                : "No examination sessions found"}
                          </h3>
                          <p className="text-[#057A55] font-bold m-0 leading-relaxed">
                            {status === "IN_PROGRESS"
                              ? "Candidate sessions will appear here when examinations begin."
                              : status === "SUBMITTED"
                                ? "Completed candidate sessions will appear here once examinations are submitted."
                                : "Candidate sessions will appear here when examinations are started or submitted."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attempts.map((attempt) => {
                      const studentName = attempt.studentName || attempt.student?.fullName || "—"
                      const regId = attempt.registrationId || attempt.student?.studentId || attempt.student?.registrationId
                      const col = attempt.college || attempt.student?.college
                      let collegeRegDisplay = "—"
                      if (regId && col && regId !== "—" && col !== "—") {
                        collegeRegDisplay = `${regId} · ${col}`
                      } else if (regId && regId !== "—") {
                        collegeRegDisplay = regId
                      } else if (col && col !== "—") {
                        collegeRegDisplay = col
                      }
                      const examTitle = attempt.examTitle || attempt.exam?.title || attempt.exam?.code || "—"
                      const startedAtDisplay = attempt.startedAt ? new Date(attempt.startedAt).toLocaleTimeString() : "—"
                      const incidentCount = attempt.incidentCount ?? (attempt.integrityCounts ? Object.values(attempt.integrityCounts).reduce((a, b) => Number(a) + Number(b), 0) : 0)

                      return (
                        <tr key={attempt.attemptId || attempt.id} className="hover:bg-[#00D084]/5 transition-colors">
                          <td className="px-5 py-4 align-middle font-bold text-[#1E3A34] whitespace-nowrap">
                            {studentName}
                          </td>
                          <td className="px-5 py-4 align-middle text-slate-600 font-semibold max-w-[220px] truncate">
                            {collegeRegDisplay}
                          </td>
                          <td className="px-5 py-4 align-middle font-extrabold text-[#1E3A34] max-w-[240px] truncate">
                            {examTitle}
                            {attempt.exam?.code && <div className="text-xs font-medium text-slate-600">{attempt.exam.code}</div>}
                            <div className="text-[11px] font-mono text-slate-600">{attempt.attemptId || attempt.id}</div>
                          </td>
                          <td className="px-5 py-4 align-middle font-medium text-slate-500 text-center whitespace-nowrap">
                            {startedAtDisplay}
                          </td>
                          <td className="px-5 py-4 align-middle text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                attempt.status === "IN_PROGRESS"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                                  : "bg-blue-100 text-blue-800 border border-blue-300/80"
                              }`}
                            >
                              {attempt.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-middle whitespace-nowrap text-slate-700">
                            <div>{attempt.attemptedCount ?? 0} / {attempt.totalAssignedQuestions ?? 0} attempted</div>
                            <div>{attempt.submittedCount ?? 0} submitted</div>
                            {attempt.lastAutosaveAt && (
                              <div className="text-xs text-slate-500">
                                Last autosave: {new Date(attempt.lastAutosaveAt).toLocaleTimeString()}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 align-middle font-black text-amber-700 text-center whitespace-nowrap">
                            {incidentCount} incidents
                          </td>
                          <td className="px-5 py-4 align-middle text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {attempt.exam?.readinessRequirements?.camera === false && !attempt.hasLiveStream ? (
                                <span className="text-xs text-slate-600">Camera not required</span>
                              ) : (
                              <button
                                className="px-3 py-1.5 rounded-xl bg-[#00D084]/20 text-[#057A55] hover:bg-[#00D084] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none whitespace-nowrap"
                                onClick={() => setCameraModalTarget({ ...attempt, studentName, registrationId: collegeRegDisplay, examTitle, incidentCount })}
                              >
                                Direct Camera
                              </button>
                              )}
                              <button
                                className="px-3 py-1.5 rounded-xl bg-[#176B58]/10 text-[#176B58] hover:bg-[#176B58] hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none whitespace-nowrap"
                                onClick={() => void viewEvents(attempt)}
                              >
                                View Logs
                              </button>
                              <button
                                className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-800 hover:bg-purple-600 hover:text-white font-extrabold text-xs transition-all cursor-pointer border-none whitespace-nowrap"
                                onClick={() => void openCodeReview(attempt)}
                              >
                                Code Review
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Live Camera Viewer Modal */}
      {cameraModalTarget && (
        <LiveCameraViewer
          attempt={cameraModalTarget}
          onClose={() => setCameraModalTarget(null)}
        />
      )}

      {/* Incident Events Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-[650px] max-h-[85vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer border-none z-10"
              onClick={() => setSelected(null)}
            >
              ×
            </button>

            <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm pt-8">
              <h2 className="text-2xl font-black text-[#1E3A34] leading-tight m-0">
                Security Incident Logs
              </h2>

              {events.length === 0 ? (
                <p className="p-6 text-center text-xs font-bold text-[#057A55] bg-emerald-50/50 rounded-2xl border border-emerald-200/60 m-0">
                  No security or proctoring incidents recorded for this candidate attempt.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {events.map((ev, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 flex flex-col gap-1 text-xs"
                    >
                      <b className="font-extrabold text-[#1E3A34] text-sm">{ev.eventType || "Incident"}</b>
                      <span className="font-semibold text-slate-700">{ev.details || "Proctoring flag detected."}</span>
                      <small className="text-slate-500 font-medium mt-1">
                        {new Date(ev.timestamp).toLocaleString()} · Attempt ID:{" "}
                        <span className="font-mono text-slate-600">{selected.attemptId}</span>
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer border-none shadow-md"
                onClick={() => setSelected(null)}
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Review Modal */}
      {codeReviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto" onClick={() => setCodeReviewTarget(null)}>
          <div className="relative w-full max-w-[800px] max-h-[88vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
            <button
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer border-none z-10"
              onClick={() => setCodeReviewTarget(null)}
            >
              ×
            </button>

            <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm pt-8">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#057A55]">Round 2 Candidate Code Review</span>
                <h2 className="text-2xl font-black text-[#1E3A34] m-0 leading-tight">
                  {codeReviewTarget.studentName || codeReviewTarget.student?.fullName || "Candidate Solution"}
                </h2>
                <p className="text-xs text-slate-500 font-bold m-0 mt-0.5">
                  {codeReviewTarget.examTitle || codeReviewTarget.exam?.title || "Coding Assessment"}
                </p>
              </div>

              {codeAnswers.length === 0 ? (
                <div className="p-8 text-center font-bold text-[#057A55] bg-slate-50 rounded-2xl border border-slate-200">
                  No source code submitted by this candidate yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {codeAnswers.map((ans: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#1E3A34] text-white space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-extrabold text-xs text-[#00D084]">Language: {ans.language || "javascript"}</span>
                        <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30">
                          {ans.passCount} / {ans.totalTestCases} Test Cases Passed ({ans.score} Marks)
                        </span>
                      </div>
                      <pre className="font-mono text-xs text-emerald-300 bg-black/30 p-4 rounded-xl overflow-x-auto m-0 leading-relaxed whitespace-pre-wrap">
                        {ans.code || "// No code content"}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
              <button
                className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer border-none shadow-md"
                onClick={() => setCodeReviewTarget(null)}
              >
                Close Code Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LiveCameraViewer({
  attempt,
  onClose,
}: {
  attempt: any
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [streamState, setStreamState] = useState<
    "Connecting" | "LIVE" | "Connection Failed" | "Camera Disconnected" | "Stream Unavailable"
  >("Connecting")
  const [frame, setFrame] = useState<string | null>(attempt.liveFrame || null)
  const lastSignalTimeRef = useRef<number>(Date.now())
  const failureCountRef = useRef<number>(0)

  useEffect(() => {
    let pc: RTCPeerConnection | null = null
    let active = true
    const attemptId = attempt.attemptId || attempt.id

    const connectWebRTC = async () => {
      try {
        const PeerConnection = window.RTCPeerConnection || (window as any).webkitRTCPeerConnection
        if (!PeerConnection) return

        pc = new PeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19020" },
            { urls: "stun:stun1.l.google.com:19020" },
          ],
        })

        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0]
            setStreamState("LIVE")
          }
        }

        pc.oniceconnectionstatechange = () => {
          if (!pc) return
          if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
            if (!frame) setStreamState("Connection Failed")
          } else if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            setStreamState("LIVE")
          }
        }

        pc.onicecandidate = (event) => {
          if (event.candidate && active) {
            void authFetch(
              `${API_BASE_URL}/api/admin/monitoring/attempts/${attemptId}/webrtc-signal`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidate: event.candidate }),
              },
              true,
            ).catch(() => undefined)
          }
        }

        const res = await authFetch(
          `${API_BASE_URL}/api/admin/monitoring/attempts/${attemptId}/webrtc-signal`,
          { method: "POST", headers: { "Content-Type": "application/json" } },
          true,
        )
        const data = await res.json().catch(() => ({}))

        if (data.frame) {
          setFrame(data.frame)
          setStreamState("LIVE")
          lastSignalTimeRef.current = Date.now()
        }

        if (data.offer && pc && pc.signalingState !== "closed") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer)).catch(() => undefined)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          await authFetch(
            `${API_BASE_URL}/api/admin/monitoring/attempts/${attemptId}/webrtc-signal`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answer: pc.localDescription }),
            },
            true,
          ).catch(() => undefined)

          if (data.studentCandidates && Array.isArray(data.studentCandidates)) {
            for (const cand of data.studentCandidates) {
              if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => undefined)
              }
            }
          }
        }
      } catch {
        // Fallback to frame polling
      }
    }

    void connectWebRTC()

    const pollTimer = window.setInterval(async () => {
      if (!active) return
      try {
        const res = await authFetch(
          `${API_BASE_URL}/api/admin/monitoring/attempts/${attemptId}/webrtc-signal`,
          { method: "POST", headers: { "Content-Type": "application/json" } },
          true,
        )
        const data = await res.json().catch(() => ({}))
        failureCountRef.current = 0

        if (data.frame) {
          setFrame(data.frame)
          setStreamState("LIVE")
          lastSignalTimeRef.current = Date.now()
        } else if (data.offer) {
          lastSignalTimeRef.current = Date.now()
        } else if (Date.now() - lastSignalTimeRef.current > 7000) {
          setStreamState("Camera Disconnected")
        }
      } catch {
        failureCountRef.current += 1
        if (failureCountRef.current > 3) {
          setStreamState("Stream Unavailable")
        }
      }
    }, 1200)

    return () => {
      active = false
      window.clearInterval(pollTimer)
      if (pc) {
        pc.close()
        pc = null
      }
    }
  }, [attempt])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A34]/40 backdrop-blur-md p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[660px] max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden text-[#1E3A34]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] to-[#FF7A59]" />
        <button
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer border-none z-10"
          onClick={onClose}
        >
          ×
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto min-h-0 flex-1 flex flex-col gap-4 text-xs sm:text-sm pt-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  streamState === "LIVE"
                    ? "bg-[#00D084] animate-ping"
                    : streamState === "Connecting"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-rose-500"
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider text-[#057A55]">
                {streamState === "LIVE"
                  ? "LIVE WebRTC Proctoring Feed"
                  : streamState}
              </span>
            </div>
            <h2 className="text-2xl font-black text-[#1E3A34] leading-tight m-0">
              {attempt.studentName || "Candidate Camera Feed"}
            </h2>
            <p className="text-xs text-slate-500 font-bold m-0 mt-0.5">
              {attempt.examTitle || "Examination Session"}
            </p>
          </div>

          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F6F2E6]/80 rounded-2xl border border-[#E2DBD0]">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-[#057A55]">Session Status</span>
              <span className="font-extrabold text-xs text-[#1E3A34] mt-0.5">{attempt.status || "IN_PROGRESS"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-[#057A55]">Incidents</span>
              <span className="font-extrabold text-xs text-amber-700 mt-0.5">{attempt.incidentCount || 0} Flags</span>
            </div>
            <div className="flex flex-col sm:col-span-2">
              <span className="text-[10px] font-black uppercase text-[#057A55]">Registration / College</span>
              <span className="font-bold text-xs text-[#1E3A34] truncate mt-0.5">{attempt.registrationId || "—"}</span>
            </div>
          </div>

          {/* Live Video Player Screen */}
          <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-[#00D084]/40 shadow-inner bg-slate-950 flex items-center justify-center">
            {frame ? (
              <img
                src={frame}
                alt="Candidate Live Feed"
                className="w-full h-full object-contain bg-black"
                onLoad={() => setStreamState("LIVE")}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain bg-black"
                onLoadedMetadata={() => setStreamState("LIVE")}
              />
            )}

            <div
              className={`absolute top-3 left-3 flex items-center gap-2 px-3.5 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${
                streamState === "LIVE"
                  ? "bg-emerald-600/90"
                  : streamState === "Connecting"
                    ? "bg-amber-600/90"
                    : "bg-rose-600/90"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full bg-white ${
                  streamState === "LIVE" ? "animate-ping" : ""
                }`}
              />
              <span>{streamState === "LIVE" ? "LIVE" : streamState}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 sm:px-8 sm:py-5 border-t border-slate-100 bg-slate-50/50 flex-none">
          <button
            className="h-10 px-6 text-xs sm:text-sm font-black rounded-2xl text-white bg-[#176B58] hover:bg-[#125445] transition-all cursor-pointer border-none shadow-md"
            onClick={onClose}
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  )
}
