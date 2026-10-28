import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../api";

interface LandingPageProps {
  onStudentLogin: () => void;
  onRegister: () => void;
  onAdminLogin: () => void;
}

export function LandingPage({
  onStudentLogin,
  onRegister,
  onAdminLogin,
}: LandingPageProps) {
  const [health, setHealth] = useState<
    "checking" | "operational" | "unavailable"
  >("checking");

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

  const statusText =
    health === "operational"
      ? "All systems operational"
      : health === "checking"
        ? "Checking service status..."
        : "Service currently unavailable";

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 font-['Poppins',sans-serif] text-slate-800 antialiased">
      {/* Animated Ambient Light Orbs */}
      <div className="pointer-events-none absolute -top-32 right-0 size-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-cyan-300/15 to-transparent blur-3xl animate-pulse duration-[8000ms]" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 size-[550px] rounded-full bg-gradient-to-tr from-emerald-400/15 via-blue-300/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 size-[400px] -translate-y-1/2 rounded-full bg-indigo-300/10 blur-3xl" />

      {/* Floating Glassmorphism Navigation */}
      <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-white/80 bg-white/70 px-6 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] sm:px-10">
        <button
          className="flex items-center gap-3 text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
          onClick={onStudentLogin}
          aria-label="KGS Exam Portal"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-500/25">
            K
          </span>
          <span>
            <strong className="block font-['Poppins',sans-serif] text-base font-bold tracking-tight text-slate-900">
              KGS
            </strong>
            <small className="block font-['Poppins',sans-serif] text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
              Exam Portal
            </small>
          </span>
        </button>

        <nav className="flex items-center gap-3">
          <button
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100/80 hover:text-blue-600"
            onClick={onStudentLogin}
          >
            Student Login
          </button>
          <button
            className="rounded-xl border border-slate-300/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 backdrop-blur-md shadow-sm transition hover:bg-white hover:border-slate-400 hover:shadow-md"
            onClick={onRegister}
          >
            Register
          </button>
          <button
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0"
            onClick={onAdminLogin}
          >
            Admin Portal
          </button>
        </nav>
      </header>

      {/* Main Hero Grid */}
      <main className="relative z-10 mx-auto my-auto grid w-full max-w-7xl items-center gap-12 px-6 py-10 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:py-16">
        <section className="flex flex-col items-start lg:col-span-7">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-4 py-2 text-xs font-semibold tracking-wide text-blue-700 backdrop-blur-md shadow-sm shadow-blue-500/10">
            <span className="text-sm">✨</span> SECURE ONLINE EXAMINATION PLATFORM
          </span>

          <h1 className="font-['Poppins',sans-serif] text-4xl font-extrabold leading-[1.12] tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-6xl">
            Welcome to <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
              KGS Exam Portal
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 font-normal sm:text-lg">
            An enterprise-grade, proctored examination platform designed for seamless registration, real-time response recovery, and tamper-proof evaluation.
          </p>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3.5 sm:flex-row">
            <button
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
              onClick={onRegister}
            >
              <span>Register as Student</span>
              <span className="text-base">→</span>
            </button>
            <button
              className="rounded-xl border border-slate-300/80 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-800 backdrop-blur-md shadow-sm transition-all duration-300 hover:bg-white hover:border-slate-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              onClick={onStudentLogin}
            >
              Student Login
            </button>
          </div>

          <button
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:text-blue-600"
            onClick={onAdminLogin}
          >
            <span>Administrator Portal</span>
            <span>→</span>
          </button>
        </section>

        {/* Glassmorphic Interactive Hero Card */}
        <section className="relative lg:col-span-5">
          <div className="group relative overflow-hidden rounded-3xl border border-white/90 bg-white/60 p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(15,23,42,0.08)] transition-all duration-500 hover:shadow-[0_30px_70px_rgba(37,99,235,0.12)]">
            {/* Top Shine Accent */}
            <div className="pointer-events-none absolute -top-20 -right-20 size-60 rounded-full bg-gradient-to-br from-blue-400/15 via-cyan-300/10 to-transparent blur-2xl" />

            {/* Health Status Pill */}
            <div className="relative inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <span
                className={`size-2 rounded-full ${
                  health === "operational"
                    ? "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                    : health === "checking"
                      ? "animate-pulse bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              <span
                className={
                  health === "operational"
                    ? "text-emerald-700"
                    : health === "unavailable"
                      ? "text-red-700"
                      : "text-slate-600"
                }
              >
                {statusText}
              </span>
            </div>

            {/* Floating Shield Illustration */}
            <div className="relative mt-8 text-center">
              <div className="mx-auto grid size-24 place-items-center rounded-3xl border border-emerald-300/60 bg-gradient-to-br from-emerald-100/90 via-emerald-50/60 to-blue-50/40 text-4xl shadow-lg shadow-emerald-500/15 transition-transform duration-500 group-hover:scale-105">
                🛡️
              </div>
              <h2 className="mt-6 font-['Poppins',sans-serif] text-2xl font-bold text-slate-900">
                Protected Exam Environment
              </h2>
              <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-slate-600 font-normal">
                Encrypted authentication, autosaved responses, and real-time server timing integrity.
              </p>
            </div>

            {/* Inner Glass Stats Grid */}
            <div className="relative mt-8 grid grid-cols-3 gap-3">
              {[
                ["OTP Auth", "Passwordless"],
                ["Auto-Sync", "Response Recovery"],
                ["Proctored", "Policy Audit"],
              ].map(([title, copy]) => (
                <div
                  className="rounded-2xl border border-slate-200/60 bg-white/80 p-3.5 text-center backdrop-blur-md shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                  key={title}
                >
                  <b className="block font-['Poppins',sans-serif] text-sm font-bold text-blue-600">
                    {title}
                  </b>
                  <small className="mt-1 block text-[10px] font-semibold text-slate-500">
                    {copy}
                  </small>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Glassmorphic Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/50 px-6 py-5 text-center text-xs font-semibold text-slate-500 backdrop-blur-md mt-auto">
        © 2025 KGS Institute · Secure examination and assessment infrastructure
      </footer>
    </div>
  );
}
