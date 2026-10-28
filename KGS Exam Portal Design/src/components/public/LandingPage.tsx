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

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-gradient-to-br from-[#f8fafc] via-[#eff6ff]/50 to-[#f1f5f9] font-['Poppins',sans-serif] text-slate-800 antialiased">
      {/* Background Glow Lighting Accents */}
      <div className="pointer-events-none absolute -top-40 right-0 size-[700px] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-300/15 to-purple-300/10 blur-3xl animate-pulse duration-[8000ms]" />
      <div className="pointer-events-none absolute top-1/3 -left-32 size-[600px] rounded-full bg-gradient-to-tr from-cyan-400/15 via-blue-300/10 to-transparent blur-3xl" />

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 flex min-h-20 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-2xl shadow-sm sm:px-10 lg:px-16">
        {/* Brand Logo */}
        <button
          className="flex items-center gap-3 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
          onClick={onStudentLogin}
          aria-label="KGS Exam Portal Home"
        >
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-extrabold text-white text-xl shadow-lg shadow-blue-500/25">
            K
          </div>
          <div>
            <strong className="block text-slate-900 font-extrabold text-base tracking-tight leading-none">
              KGS
            </strong>
            <small className="block text-[#3563F6] font-bold text-[10px] uppercase tracking-wider mt-1">
              EXAM PORTAL
            </small>
          </div>
        </button>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button className="font-bold text-blue-600 flex flex-col items-center gap-1">
            <span>Home</span>
            <span className="w-5 h-1 bg-blue-600 rounded-full" />
          </button>
          <a href="#showcase" className="hover:text-blue-600 transition-colors">Showcase</a>
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
          <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            className="grid size-10 place-items-center rounded-full bg-slate-100/80 border border-slate-200/80 text-slate-600 hover:bg-slate-200/70 transition"
            aria-label="Toggle Theme"
          >
            ☀️
          </button>

          <button
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
            onClick={onStudentLogin}
          >
            <span>👤</span>
            <span>Student Login</span>
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400"
            onClick={onRegister}
          >
            <span>Register</span>
          </button>

          <button
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
            onClick={onAdminLogin}
          >
            <span>🔒</span>
            <span>Admin Portal</span>
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Hero Copy Column */}
          <section className="flex flex-col items-start lg:col-span-6">
            {/* Kicker Pill Badge */}
            <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-blue-200/80 bg-blue-50/90 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SECURE · FAIR · AI-RESISTANT · ENTERPRISE GRADE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Next-Generation
              </span>{" "}
              <br />
              <span className="text-slate-900">Online Examination</span> <br />
              <span className="text-slate-900">Platform</span>
            </h1>

            {/* Sub-paragraph */}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 font-normal sm:text-lg">
              A secure, proctored, and intelligent examination platform designed for educational institutions and organizations to conduct fair, scalable, and tamper-proof assessments.
            </p>

            {/* CTA Button Row */}
            <div className="mt-8 flex w-full max-w-md flex-col gap-4 sm:flex-row items-center">
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
                onClick={onRegister}
              >
                <span>👤</span>
                <span>Register as Student</span>
                <span className="text-base">→</span>
              </button>

              <button
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300/80 bg-white/90 backdrop-blur-md px-8 py-4 text-sm font-bold text-slate-800 shadow-md transition-all duration-300 hover:bg-white hover:border-slate-400 hover:-translate-y-0.5 active:translate-y-0"
                onClick={onStudentLogin}
              >
                <span>➔]</span>
                <span>Student Login</span>
              </button>
            </div>

            {/* Admin Secondary Link */}
            <button
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition-colors hover:underline"
              onClick={onAdminLogin}
            >
              <span>🛡️</span>
              <span>Administrator Portal</span>
              <span>→</span>
            </button>
          </section>

          {/* Right Hero Cinematic Graphic & Glass Cards Column */}
          <section className="relative lg:col-span-6">
            <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
              {/* Background Visual Container (Student at Laptop) */}
              <div className="relative overflow-hidden rounded-3xl border border-white/90 bg-gradient-to-br from-blue-100/60 via-purple-100/40 to-cyan-100/50 p-2 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop"
                  alt="Student taking online exam"
                  className="w-full h-[480px] object-cover rounded-2xl"
                />

                {/* Neon Glow Arcs Overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent rounded-2xl" />
              </div>

              {/* Glass Card 1 (Top Left): Proctored Environment */}
              <div className="absolute -top-6 -left-6 z-20 w-64 rounded-2xl border border-white/90 bg-white/90 p-5 backdrop-blur-2xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/30">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">
                      Proctored Environment
                    </h3>
                  </div>
                </div>

                <ul className="mt-4 space-y-2.5 text-xs font-semibold text-slate-700">
                  <li className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-extrabold">✓</span>
                    <span>Camera Monitoring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-extrabold">✓</span>
                    <span>Tab Switch Detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-extrabold">✓</span>
                    <span>Fullscreen Enforcement</span>
                  </li>
                </ul>
              </div>

              {/* Glass Card 2 (Top Right): Real-time Monitoring */}
              <div className="absolute top-4 -right-6 z-20 w-52 rounded-2xl border border-white/90 bg-white/90 p-4 backdrop-blur-2xl shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">⏱️</span>
                  <span className="font-bold text-slate-900 text-xs">Real-time Monitoring</span>
                </div>

                {/* Equalizer Bar Chart Graphic */}
                <div className="mt-3 flex items-end justify-between gap-1 h-10 px-2">
                  {[40, 75, 55, 90, 65, 80, 45, 95, 70, 85, 60, 90, 50].map((h, i) => (
                    <span
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 via-indigo-500 to-purple-500 animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>

              {/* Glass Card 3 (Middle Right): Secure Evaluation */}
              <div className="absolute bottom-6 -right-6 z-20 w-56 rounded-2xl border border-white/90 bg-white/90 p-4 backdrop-blur-2xl shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-purple-100 text-purple-600 text-sm font-bold">📊</span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Secure Evaluation</h4>
                    <small className="text-[9px] text-slate-500 font-semibold block">Automated · Accurate · Auditable</small>
                  </div>
                </div>

                {/* Spline Wave Curve */}
                <div className="mt-3 h-9 w-full">
                  <svg viewBox="0 0 200 50" fill="none" className="w-full h-full">
                    <path
                      d="M0 35 Q 40 10, 80 30 T 160 15 T 200 25"
                      stroke="url(#splineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="splineGradient" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3563F6" />
                        <stop offset="0.5" stopColor="#7468F7" />
                        <stop offset="1" stopColor="#C084FC" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. SHOWCASE CAROUSEL SLIDER */}
      <div id="showcase">
        <ShowcaseCarousel />
      </div>

      {/* 4. BOTTOM FEATURE STRIP & WAVY SECTION */}
      <section id="features" className="relative z-10 w-full mt-8">
        {/* Wave SVG Separator */}
        <div className="w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-12 text-[#f8fafc] fill-current">
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>

        {/* Feature Cards Grid */}
        <div className="bg-[#f8fafc] py-10 px-6 sm:px-10 lg:px-12 border-t border-slate-200/60">
          <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Feature 1 */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 text-xl font-bold">
                🛡️
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Secure & Reliable</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                  Enterprise-grade security and data protection.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-indigo-300">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 text-xl font-bold">
                👥
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Fair Assessments</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                  AI-resistant proctoring and integrity controls.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-cyan-300">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-600 text-xl font-bold">
                📊
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Real-time Insights</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                  Live monitoring and instant analytics.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#eff6ff] text-blue-600 text-xl font-bold">
                ⚙️
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Easy Management</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                  Simple tools for admins and institutions.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md hover:border-purple-300">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-purple-50 text-purple-600 text-xl font-bold">
                🎓
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Built for Scale</h4>
                <p className="text-xs text-slate-500 font-normal mt-0.5 leading-snug">
                  From hundreds to millions of candidates.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Label */}
          <div className="mt-10 text-center text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Trusted by leading educational institutions and organizations
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white px-6 py-6 text-center text-xs font-semibold text-slate-500">
        © 2025 KGS Institute · Secure examination and assessment infrastructure
      </footer>
    </div>
  );
}

function ShowcaseCarousel() {
  const showcaseItems = [
    {
      img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop",
      title: "Enterprise Examination Infrastructure",
      desc: "High-concurrency proctored testing environments built for universities and certified test centers.",
    },
    {
      img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop",
      title: "AI-Resistant Integrity Monitoring",
      desc: "Real-time webcam diagnostic, tab-switch detection, and candidate identity verification.",
    },
    {
      img: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800&h=500&fit=crop",
      title: "Instant Results & Scorecard Publishing",
      desc: "Zero-delay automated grading with subject-wise analytics and cryptographic audit records.",
    },
    {
      img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=500&fit=crop",
      title: "Seamless Student Experience",
      desc: "Passwordless OTP sign-in, sub-second answer autosave, and continuous network recovery.",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(
    typeof window !== "undefined" && window.innerWidth >= 768 ? 2 : 1
  );

  useEffect(() => {
    const onResize = () =>
      setVisibleCount(window.innerWidth >= 768 ? 2 : 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const GAP = 16;
  const maxIdx = Math.max(showcaseItems.length - visibleCount, 0);
  const safeIdx = Math.min(current, maxIdx);

  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 lg:px-12 my-4">
      <div className="text-center mb-8">
        <span className="text-xs uppercase font-bold tracking-widest text-blue-600">
          Platform Showcase
        </span>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">
          Designed for Excellence at Every Step
        </h3>
      </div>

      <div className="flex items-center gap-4 md:gap-6 w-full">
        <button
          onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
          disabled={safeIdx === 0}
          className="size-11 bg-white border border-slate-200/80 shadow-md rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-100 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous Slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="m15 18-6-6 6-6" stroke="#0f172b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="overflow-hidden flex-1 min-w-0">
          <div
            className="flex gap-4 transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(calc(-${(safeIdx * 100) / visibleCount}% - ${(safeIdx * GAP) / visibleCount}px))`,
            }}
          >
            {showcaseItems.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 bg-white shadow-md hover:shadow-lg transition-shadow"
                style={{
                  width: `calc(${100 / visibleCount}% - ${(GAP * (visibleCount - 1)) / visibleCount}px)`,
                }}
              >
                <div className="h-56 overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setCurrent((c) => Math.min(c + 1, maxIdx))}
          disabled={safeIdx >= maxIdx}
          className="size-11 bg-white border border-slate-200/80 shadow-md rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-100 transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next Slide"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="m9 18 6-6-6-6" stroke="#0f172b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
