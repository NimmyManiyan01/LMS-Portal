import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../api";

interface LandingPageProps {
  onStudentLogin: () => void;
  onRegister: () => void;
  onAdminLogin: () => void;
}

interface TimelineStage {
  id: number;
  tag: string;
  shortName: string;
  title: string;
  description: string;
  icon: string;
  highlight: string;
  badge: string;
}

const STAGES: TimelineStage[] = [
  {
    id: 1,
    tag: "STAGE 01 / 08",
    shortName: "1. Registration",
    title: "Candidate Registration",
    description: "Students set up verified candidate profiles with instant automated student ID issuance (KGS-STU-xxxxxx) and credential authorization.",
    icon: "👤",
    highlight: "Student ID Issuance",
    badge: "Verification Ready",
  },
  {
    id: 2,
    tag: "STAGE 02 / 08",
    shortName: "2. Student Login",
    title: "Passwordless OTP Login",
    description: "Cryptographically verified single-use OTP delivery directly to registered student credentials with dual HttpOnly session tokens.",
    icon: "🔑",
    highlight: "Single-Use OTP",
    badge: "Session Secured",
  },
  {
    id: 3,
    tag: "STAGE 03 / 08",
    shortName: "3. Exam Assigned",
    title: "Target Exam Schedule",
    description: "Targeted examinations automatically assigned to student sets with schedule windows, paper sets, and readiness diagnostics.",
    icon: "📅",
    highlight: "Automated Set Match",
    badge: "Exam Scheduled",
  },
  {
    id: 4,
    tag: "STAGE 04 / 08",
    shortName: "4. System Check",
    title: "Environment Diagnostic",
    description: "Pre-exam system check validating browser lockdown, webcam readiness, network latency, and proctoring policy compliance.",
    icon: "⚙️",
    highlight: "Hardware & SLA Audit",
    badge: "Diagnostic 100%",
  },
  {
    id: 5,
    tag: "STAGE 05 / 08",
    shortName: "5. Start Examination",
    title: "Paper Decryption & Launch",
    description: "Server-synchronized countdown timer launch with randomized paper set allocation and explicit instruction acknowledgment.",
    icon: "🚀",
    highlight: "Server Sync Clock",
    badge: "Paper Set Ready",
  },
  {
    id: 6,
    tag: "STAGE 06 / 08",
    shortName: "6. Answer Questions",
    title: "Real-Time Response Auto-Save",
    description: "Continuous response autosaving to local storage and remote MongoDB storage guaranteeing 100% answer recovery during network disruptions.",
    icon: "✍️",
    highlight: "Sub-Second Autosave",
    badge: "Auto-Sync Active",
  },
  {
    id: 7,
    tag: "STAGE 07 / 08",
    shortName: "7. Submit Examination",
    title: "Cryptographic Submission",
    description: "Final answer snapshot compiled with digital signature checksum and audit record generation upon candidate submit or time expiration.",
    icon: "📥",
    highlight: "Tamper-Proof Audit",
    badge: "Checksum Verified",
  },
  {
    id: 8,
    tag: "STAGE 08 / 08",
    shortName: "8. View Results",
    title: "Automated Scoring & Analytics",
    description: "Automated scoring engine calculates accurate grades, subject breakdowns, and downloadable verified scorecards according to policy.",
    icon: "📊",
    highlight: "Instant Scorecard",
    badge: "Grade Published",
  },
];

export function LandingPage({
  onStudentLogin,
  onRegister,
  onAdminLogin,
}: LandingPageProps) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [health, setHealth] = useState<"checking" | "operational" | "unavailable">("checking");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setHealth(d?.ok === true ? "operational" : "unavailable"))
      .catch(() => setHealth("unavailable"))
      .finally(() => window.clearTimeout(timeout));
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = window.setInterval(() => {
      setActiveStageIndex((prev) => (prev + 1) % STAGES.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [isAutoPlaying]);

  const currentStage = STAGES[activeStageIndex];

  const handleSelectStage = (index: number) => {
    setActiveStageIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#F8FAFF] font-['Poppins',sans-serif] text-slate-800 antialiased selection:bg-[#3563F6]/20">
      {/* Background Lighting Elements */}
      <div className="pointer-events-none absolute -top-40 right-0 size-[650px] rounded-full bg-gradient-to-br from-[#3563F6]/15 via-[#38BDF8]/10 to-transparent blur-3xl animate-pulse duration-[7000ms]" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 size-[600px] rounded-full bg-gradient-to-tr from-[#7468F7]/12 via-[#10B981]/10 to-transparent blur-3xl" />

      {/* Floating White Navbar */}
      <header className="sticky top-0 z-40 flex min-h-20 items-center justify-between border-b border-slate-200/70 bg-white/80 px-6 backdrop-blur-2xl shadow-sm sm:px-10">
        <button
          className="flex items-center gap-3 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          onClick={onStudentLogin}
          aria-label="KGS Exam Portal Home"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#3563F6] to-[#7468F7] font-bold text-white shadow-md shadow-[#3563F6]/25">
            K
          </span>
          <span>
            <strong className="block text-base font-extrabold tracking-tight text-slate-900">
              KGS
            </strong>
            <small className="block text-[10px] font-bold uppercase tracking-[0.14em] text-[#3563F6]">
              Exam Portal
            </small>
          </span>
        </button>

        <nav className="flex items-center gap-3">
          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100/80 hover:text-[#3563F6]"
            onClick={onStudentLogin}
          >
            Student Login
          </button>
          <button
            className="rounded-xl border border-slate-300/80 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
            onClick={onRegister}
          >
            Register
          </button>
          <button
            className="rounded-xl bg-gradient-to-r from-[#3563F6] to-[#7468F7] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#3563F6]/25 transition hover:shadow-lg hover:shadow-[#3563F6]/35 hover:-translate-y-0.5 active:translate-y-0"
            onClick={onAdminLogin}
          >
            Admin Portal
          </button>
        </nav>
      </header>

      {/* Main Hero & Story Content */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:py-12">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Left Hero Story Content */}
          <section className="flex flex-col items-start lg:col-span-6">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#3563F6]/25 bg-[#3563F6]/10 px-4 py-1.5 text-xs font-semibold text-[#3563F6] shadow-sm">
              <span className="size-2 rounded-full bg-[#10B981] animate-ping" />
              KGS EXAMINATION JOURNEY
            </span>

            <h1 className="text-4xl font-extrabold leading-[1.12] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-6xl">
              Your Knowledge. <br />
              <span className="bg-gradient-to-r from-[#3563F6] via-[#7468F7] to-[#38BDF8] bg-clip-text text-transparent">
                Your Journey. <br />
                Your Future.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Experience an integrated, proctored examination workflow—from instant profile registration and OTP login to real-time answer recovery and automated scorecard generation.
            </p>

            <div className="mt-8 flex w-full max-w-md flex-col gap-3.5 sm:flex-row">
              <button
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#3563F6] to-[#7468F7] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#3563F6]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#3563F6]/40 hover:-translate-y-0.5 active:translate-y-0"
                onClick={onRegister}
              >
                <span>Register as Student</span>
                <span className="text-base">→</span>
              </button>
              <button
                className="rounded-xl border border-slate-300/80 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:border-slate-400 hover:-translate-y-0.5 active:translate-y-0"
                onClick={onStudentLogin}
              >
                Student Login
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs font-semibold text-slate-500">
              <button
                className="inline-flex items-center gap-1.5 text-slate-600 transition-colors hover:text-[#3563F6]"
                onClick={onAdminLogin}
              >
                <span>Administrator Portal</span>
                <span>→</span>
              </button>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 text-[#10B981]">
                <span className="size-2 rounded-full bg-[#10B981]" />
                {health === "operational" ? "Service Operational" : "System Ready"}
              </span>
            </div>
          </section>

          {/* Right Hero Interactive Animated Scene Card */}
          <section className="relative lg:col-span-6">
            <div className="group relative min-h-[420px] overflow-hidden rounded-3xl border border-white/90 bg-white/80 p-7 backdrop-blur-2xl shadow-[0_20px_60px_rgba(53,99,246,0.08)] transition-all duration-500 hover:shadow-[0_25px_70px_rgba(53,99,246,0.15)] flex flex-col justify-between">
              {/* Scene Top Badge Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#3563F6]/20 bg-[#3563F6]/5 px-3 py-1 text-xs font-bold text-[#3563F6]">
                  <span>{currentStage.icon}</span>
                  {currentStage.tag}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#10B981]">
                  <span className="size-1.5 rounded-full bg-[#10B981]" />
                  {currentStage.badge}
                </span>
              </div>

              {/* Dynamic Animated Scene Graphic Content */}
              <div className="my-6 flex flex-col items-center text-center transition-all duration-500">
                <StageVisualScene stageId={currentStage.id} />

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  {currentStage.title}
                </h2>

                <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-slate-600 font-normal">
                  {currentStage.description}
                </p>
              </div>

              {/* Scene Footer Stage Highlight Bar */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                <span className="text-[#3563F6]">✦ {currentStage.highlight}</span>
                <span className="text-slate-400">Step {activeStageIndex + 1} of 8</span>
              </div>
            </div>
          </section>
        </div>

        {/* Interactive Examination Journey Timeline Bar */}
        <section className="mt-12 rounded-2xl border border-white/90 bg-white/80 p-4 backdrop-blur-2xl shadow-sm">
          <div className="mb-3 flex items-center justify-between px-2 text-xs font-bold text-slate-600">
            <span className="uppercase tracking-wider text-[#3563F6]">Candidate Examination Journey</span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                onClick={() => {
                  setActiveStageIndex((prev) => (prev === 0 ? STAGES.length - 1 : prev - 1));
                  setIsAutoPlaying(false);
                }}
                aria-label="Previous stage"
              >
                ‹ Prev
              </button>
              <button
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                onClick={() => {
                  setActiveStageIndex((prev) => (prev + 1) % STAGES.length);
                  setIsAutoPlaying(false);
                }}
                aria-label="Next stage"
              >
                Next ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {STAGES.map((stage, idx) => {
              const isActive = idx === activeStageIndex;
              return (
                <button
                  key={stage.id}
                  onClick={() => handleSelectStage(idx)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl p-2.5 text-center transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#3563F6] to-[#7468F7] text-white shadow-md shadow-[#3563F6]/25 scale-[1.02]"
                      : "bg-slate-50/80 text-slate-700 border border-slate-200/60 hover:bg-white hover:border-[#3563F6]/40"
                  }`}
                >
                  <span className="text-base">{stage.icon}</span>
                  <span className="text-[11px] font-bold leading-tight line-clamp-1">{stage.shortName}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Minimal Professional Footer */}
      <footer className="relative z-10 border-t border-slate-200/70 bg-white/70 px-6 py-5 text-center text-xs font-medium text-slate-500 backdrop-blur-md">
        © 2025 KGS Institute · Secure Examination & Assessment Infrastructure
      </footer>
    </div>
  );
}

{/* Render vector-animated graphics scenes for the 8 timeline stages */}
function StageVisualScene({ stageId }: { stageId: number }) {
  switch (stageId) {
    case 1:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative w-64 rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/50 p-4 shadow-lg shadow-blue-500/10 transition-transform duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-bold uppercase text-[#3563F6]">KGS ID CARD</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-[#10B981]">ACTIVE</span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-left">
              <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#3563F6] to-[#7468F7] text-xl text-white font-bold shadow-md">
                👤
              </div>
              <div>
                <b className="block text-sm text-slate-900 font-bold">Candidate Profile</b>
                <span className="block font-mono text-xs font-semibold text-[#3563F6]">KGS-STU-008492</span>
              </div>
            </div>
          </div>
        </div>
      );

    case 2:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-64 rounded-2xl border border-blue-200 bg-white p-4 shadow-lg shadow-blue-500/10">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>SINGLE-USE OTP</span>
              <span className="text-emerald-600 font-bold">🔒 SECURED</span>
            </div>
            <div className="flex justify-center gap-1.5 my-2">
              {["4", "8", "2", "9", "1", "0"].map((digit, i) => (
                <span
                  key={i}
                  className="grid size-8 place-items-center rounded-lg border border-blue-200 bg-blue-50/60 font-mono text-sm font-bold text-[#3563F6] shadow-sm animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  {digit}
                </span>
              ))}
            </div>
            <small className="block text-center text-[10px] text-slate-400 font-medium">HttpOnly Session Token Verified</small>
          </div>
        </div>
      );

    case 3:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-64 rounded-2xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 p-4 shadow-lg shadow-indigo-500/10 text-left">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900">Advanced Mathematics</span>
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-[#3563F6]">PAPER SET A</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-white p-2 border border-slate-100">
                <small className="block text-[9px] text-slate-400 font-semibold">READINESS</small>
                <b className="text-[#10B981] font-bold">96%</b>
              </div>
              <div className="rounded-lg bg-white p-2 border border-slate-100">
                <small className="block text-[9px] text-slate-400 font-semibold">WINDOW</small>
                <b className="text-[#3563F6] font-bold">ACTIVE</b>
              </div>
            </div>
          </div>
        </div>
      );

    case 4:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-left text-xs space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2 text-emerald-800 font-semibold border border-emerald-200">
              <span>🌐 Network Latency</span>
              <b className="text-[#10B981]">8ms ✓</b>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2 text-emerald-800 font-semibold border border-emerald-200">
              <span>📷 Camera Stream</span>
              <b className="text-[#10B981]">Ready ✓</b>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-2 text-emerald-800 font-semibold border border-emerald-200">
              <span>🔒 Browser Lock</span>
              <b className="text-[#10B981]">Enforced ✓</b>
            </div>
          </div>
        </div>
      );

    case 5:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-64 rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 p-4 shadow-lg text-center">
            <small className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">SERVER-SYNCED CLOCK</small>
            <b className="block mt-1 font-mono text-2xl font-extrabold text-[#3563F6]">01 : 59 : 59</b>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#3563F6] to-[#7468F7] px-4 py-1.5 text-xs font-bold text-white shadow-md">
              <span>🚀 Begin Test</span>
            </div>
          </div>
        </div>
      );

    case 6:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg text-left">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900">Question 18 / 50</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-[#10B981]">
                ⚡ SAVED
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="rounded-lg border border-blue-500 bg-blue-50/80 p-2 font-semibold text-[#3563F6]">
                ● Option B: Matrix determinant equals non-zero
              </div>
              <div className="rounded-lg border border-slate-100 p-2 text-slate-500">
                ○ Option C: Scalar product evaluates to zero
              </div>
            </div>
          </div>
        </div>
      );

    case 7:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-64 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-lg text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
              <span className="font-bold text-slate-900">CRYPTOGRAPHIC SNAPSHOT</span>
              <span className="font-mono text-[9px] font-bold text-[#3563F6]">#AUDIT-99201</span>
            </div>
            <div className="mt-3 text-center">
              <span className="inline-block rounded-full bg-emerald-100 p-3 text-2xl text-[#10B981] shadow-inner">
                📥
              </span>
              <p className="mt-1 text-xs font-bold text-slate-800">Submission Recorded</p>
              <small className="text-[10px] text-slate-400 font-medium">Digital Signature Generated</small>
            </div>
          </div>
        </div>
      );

    case 8:
      return (
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-64 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-lg text-center">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-bold text-slate-900">FINAL SCORECARD</span>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-[#10B981]">GRADE A+</span>
            </div>
            <div className="my-2">
              <span className="font-mono text-3xl font-extrabold text-[#10B981]">88%</span>
            </div>
            <span className="inline-block rounded-lg border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
              📄 Download Scorecard
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
