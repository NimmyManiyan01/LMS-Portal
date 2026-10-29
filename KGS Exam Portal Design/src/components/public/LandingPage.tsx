import { useEffect, useState, type ReactNode } from "react";
import heroStudentImg from "../../assets/hero-student.png";

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

/* Tune the hero photo crop here (x% y%). Higher x = shows more of the RIGHT side of the photo. */
const HERO_POSITION = "78% 28%";

/* ------------------------------------------------------------------ */
/* Theme tokens + keyframes (self-contained, no index.css needed)       */
/* ------------------------------------------------------------------ */
const themeCss = `
.kgs-landing {
  --page-bg: #F7FAFF;
  --glass: rgba(255,255,255,.78);
  --glass-border: rgba(255,255,255,.9);
  --nav-bg: rgba(255,255,255,.82);
  --card-bg: rgba(255,255,255,.78);
  --btn-bg: #FFFFFF;
  --bubble: #FFFFFF;
  --foot-bg: rgba(255,255,255,.6);
  --hairline: rgba(15,27,76,.08);
  --heading: #0F1B4C;
  --body: #5B6478;
  --sub: #4B5675;
  --brand: #315CF5;
  --glow-a: rgba(37,99,235,.12);
  --glow-b: rgba(124,58,237,.10);
  --photo-filter: none;
  color-scheme: light;
  color: var(--heading);
  background-color: var(--page-bg);
  background-image:
    radial-gradient(circle at 78% 8%, var(--glow-a) 0%, transparent 38%),
    radial-gradient(circle at 92% 30%, var(--glow-b) 0%, transparent 36%);
}
.kgs-grad-bg   { background-color: var(--brand); }
.kgs-grad-text { color: var(--brand); }
.landing-login-btn { position: relative; z-index: 1; overflow: hidden; }
.landing-login-btn::after {
  content: "";
  position: absolute;
  z-index: -1;
  left: -20%; right: -20%; top: 0; bottom: 0;
  background: #fff;
  transform: skewX(-45deg) scale(0, 1);
  transition: transform 0.35s ease;
}
.landing-login-btn:hover { color: #111d4e; }
.landing-login-btn:hover::after { transform: skewX(-45deg) scale(1, 1); }
.kgs-glass {
  background: rgba(255,255,255,.88);
  border: 1px solid rgba(255,255,255,.7);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  box-shadow: 0 12px 40px rgba(20,35,90,.10);
}
.kgs-photo {
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 35%), linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(to right, transparent 0%, #000 35%), linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%);
  mask-composite: intersect;
}
.kgs-landing * { box-sizing: border-box; }
.kgs-landing button, .kgs-landing a { -webkit-tap-highlight-color: transparent; }
.kgs-landing img { max-width: 100%; }
.kgs-photo img { filter: var(--photo-filter); }
@keyframes kgs-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.kgs-float { animation: kgs-float 6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .kgs-float { animation: none; } }
`;

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */
type IconName =
  | "arrow" | "bars" | "chart" | "check" | "clock" | "close" | "gear"
  | "graduate" | "lock" | "login" | "menu" | "shield"
  | "user" | "users";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: (<><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
  bars: (<><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19V3" /></>),
  chart: (<><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-7" /></>),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  close: (<><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 15a2 2 0 0 0 .4 2l-2.5 2.5a2 2 0 0 0-2-.4 2 2 0 0 0-1.3 1.7H10A2 2 0 0 0 8.6 19a2 2 0 0 0-2 .4L4 17a2 2 0 0 0 .4-2A2 2 0 0 0 3 13.6V10a2 2 0 0 0 1.4-1.4 2 2 0 0 0-.4-2L6.5 4a2 2 0 0 0 2 .4A2 2 0 0 0 10 3h3.6A2 2 0 0 0 15 4.4a2 2 0 0 0 2-.4l2.5 2.5a2 2 0 0 0-.4 2 2 2 0 0 0 1.7 1.4v3.6A2 2 0 0 0 19 15Z" />
    </>
  ),
  graduate: (<><path d="m2 10 10-5 10 5-10 5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>),
  lock: (<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  login: (<><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></>),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  shield: (<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function GradientIcon({ name, size = 32 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="url(#kgsIconGrad)"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {iconPaths[name]}
    </svg>
  );
}

function SvgGradients() {
  return (
    <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden="true">
      <defs>
        {/* userSpaceOnUse so purely vertical/horizontal strokes (e.g. the bars icon) still render */}
        <linearGradient id="kgsIconGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#315CF5" />
        </linearGradient>
        <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#315CF5" />
        </linearGradient>
        <linearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#315CF5" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Shared class strings                                                 */
/* ------------------------------------------------------------------ */
const container =
  "mx-auto w-[calc(100%-32px)] sm:w-[calc(100%-40px)] md:w-[calc(100%-64px)] max-w-[1400px]";

const btnSecondary =
  "flex cursor-pointer items-center justify-center gap-2 border border-[color:var(--hairline)] bg-[color:var(--btn-bg)] text-[color:var(--heading)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30";

const btnPrimary =
  "kgs-grad-bg flex cursor-pointer items-center justify-center gap-2 border-none text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:shadow-blue-600/30";

/* ------------------------------------------------------------------ */
/* Brand + Navbar                                                       */
/* ------------------------------------------------------------------ */
function Brand() {
  return (
    <a className="group flex shrink-0 items-center gap-3 no-underline" href="#home" aria-label="KGS Exam Portal home">
      <span className="kgs-grad-bg flex h-11 w-11 items-center justify-center rounded-xl text-2xl font-black text-white shadow-lg shadow-blue-600/30 transition-transform group-hover:scale-105">
        K
      </span>
      <span className="flex flex-col">
        <span className="text-xl font-black leading-none tracking-tight text-[color:var(--heading)]">KGS</span>
        <span className="mt-0.5 text-[9.5px] font-extrabold leading-none tracking-[0.16em] text-blue-600">
          EXAM PORTAL
        </span>
      </span>
    </a>
  );
}

function Navbar({ onLogin, onRegister }: LandingPageProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 min-h-[76px] border-b border-[color:var(--hairline)] bg-[color:var(--nav-bg)] backdrop-blur-xl transition-colors duration-300">
      <div className={`${container} flex min-h-[76px] items-center justify-between gap-4 px-1 sm:gap-6 sm:px-0`}>
        <Brand />

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <button className={`${btnPrimary} landing-login-btn h-11 rounded-xl px-5 text-sm font-semibold`} onClick={onLogin}>
            <Icon name="login" size={18} /> Login
          </button>
          <button className={`${btnSecondary} h-11 rounded-xl px-5 text-sm font-semibold`} onClick={onRegister}>
            Register
          </button>
        </div>

        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[color:var(--glass-border)] bg-[color:var(--glass)] text-[color:var(--heading)] lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <Icon name={open ? "close" : "menu"} size={22} />
        </button>
      </div>

      {open && (
        <div className="flex flex-col border-b border-[color:var(--hairline)] bg-[color:var(--bubble)] p-6 lg:hidden">
          <div className="flex flex-col gap-2.5">
            <button
              className={`${btnSecondary} h-11 w-full rounded-xl px-5 text-sm font-semibold`}
              onClick={() => { setOpen(false); onLogin(); }}
            >
              <Icon name="login" size={18} /> Login
            </button>
            <button
              className={`${btnSecondary} h-11 w-full rounded-xl px-5 text-sm font-semibold`}
              onClick={() => { setOpen(false); onRegister(); }}
            >
              Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero floating glass cards                                            */
/* ------------------------------------------------------------------ */
function CardTitle({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <GradientIcon name={icon} size={32} />
      <div className="text-base font-bold leading-snug text-[color:var(--heading)]">{children}</div>
    </div>
  );
}

function ProctorCard() {
  return (
    <div className="kgs-glass kgs-float pointer-events-auto absolute left-[-4%] top-[14%] z-10 w-[220px] rounded-2xl p-4 xl:left-[-2%] xl:top-[12%] xl:w-[240px] xl:p-5">
      <CardTitle icon="shield">Proctored<br />Environment</CardTitle>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {["Camera Monitoring", "Tab Switch Detection", "Fullscreen Enforcement"].map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-xs font-semibold text-[color:var(--body)]">
            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Icon name="check" size={12} />
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const barHeights = [14, 22, 34, 46, 30, 20, 36, 48, 40, 26, 16, 30, 44, 52, 42, 28, 18, 32, 48, 38, 22, 14, 30, 44, 50, 36, 20, 28, 42, 48, 34, 18, 26, 38, 44, 32, 20, 28, 36, 24];

function MonitorCard() {
  return (
    <div className="kgs-glass kgs-float pointer-events-auto absolute right-[-2%] top-[2%] z-10 w-[195px] rounded-2xl p-4 xl:right-0 xl:w-[220px] xl:p-5 [animation-delay:-2s]">
      <CardTitle icon="clock">Real-time<br />Monitoring</CardTitle>
      <div className="mt-3 flex h-9 items-end justify-between gap-1">
        {barHeights.filter((_, i) => i % 2 === 0).map((h, i) => (
          <div key={i} className="w-[3px] rounded-full bg-blue-600" style={{ height: `${Math.min(h, 40)}px` }} />
        ))}
      </div>
    </div>
  );
}

function EvaluationCard() {
  return (
    <div className="kgs-glass kgs-float pointer-events-auto absolute bottom-[4%] right-[-2%] z-10 w-[220px] rounded-2xl p-4 xl:right-0 xl:w-[240px] xl:p-5 [animation-delay:-4s]">
      <CardTitle icon="chart">Secure<br />Evaluation</CardTitle>
      <div className="mb-2 whitespace-nowrap text-[13px] font-medium text-[color:var(--sub)]">
        Automated • Accurate • Auditable
      </div>
      <svg className="h-[52px] w-full overflow-visible" viewBox="0 0 240 60" preserveAspectRatio="none" aria-label="Evaluation accuracy chart">
        <path d="M0,45 C30,48 50,22 80,32 C110,42 130,46 160,28 C190,10 215,14 240,6 L240,60 L0,60 Z" fill="url(#chartFillGrad)" />
        <path d="M0,45 C30,48 50,22 80,32 C110,42 130,46 160,28 C190,10 215,14 240,6" fill="none" stroke="url(#chartLineGrad)" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ResponsiveHeroCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
      <div className="relative min-h-[180px]"><ProctorCard /></div>
      <div className="relative min-h-[150px]"><MonitorCard /></div>
      <div className="relative min-h-[180px] sm:col-span-2"><EvaluationCard /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature strip                                                        */
/* ------------------------------------------------------------------ */
const featureItems: [IconName, string, string][] = [
  ["shield", "Secure & Reliable", "Protected assessment data."],
  ["users", "Fair Assessments", "Consistent, integrity-first testing."],
  ["bars", "Real-time Insights", "Live monitoring and analytics."],
  ["gear", "Easy Management", "Simple tools for every team."],
  ["graduate", "Built for Scale", "Ready for every candidate volume."],
];

function FeatureStrip() {
  return (
    <section className="relative z-10 bg-transparent pb-4 pt-6 sm:pb-6 sm:pt-8" id="features">
      <div className={`${container} grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-5 xl:grid-cols-5`}>
        {featureItems.map(([icon, title, copy]) => (
          <div
            key={title}
            className="relative flex min-h-[76px] items-center gap-4 rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--card-bg)] px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/20 hover:shadow-md xl:min-h-0 xl:rounded-none xl:border-0 xl:bg-transparent xl:px-0 xl:py-0 xl:shadow-none xl:hover:translate-y-0 xl:after:absolute xl:after:-right-3 xl:after:top-[15%] xl:after:block xl:after:h-[70%] xl:after:w-px xl:after:bg-[color:var(--hairline)] xl:after:content-[''] xl:last:after:hidden"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[color:var(--bubble)] shadow-lg shadow-blue-600/10">
              <GradientIcon name={icon} size={26} />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-1 text-lg font-bold text-[color:var(--heading)]">{title}</h3>
              <p className="m-0 max-w-[200px] text-[15px] leading-normal text-[color:var(--body)] [text-wrap:balance]">{copy}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-7 text-center text-sm font-medium tracking-wide text-[color:var(--body)] sm:mt-9 sm:text-base">
        Trusted by leading educational institutions and organizations
      </div>
    </section>
  );
}

function SecurityDemo() {
  const events = ["Camera permission verified", "Fullscreen mode enabled", "Tab switch detected · review queued", "Microphone signal healthy"];
  const [eventIndex, setEventIndex] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setEventIndex((current) => (current + 1) % events.length), 2600); return () => window.clearInterval(timer); }, []);
  return (
    <section id="security-demo" className="relative py-14 sm:py-20">
      <div className={`${container} grid items-center gap-8 lg:grid-cols-[.82fr_1.18fr] lg:gap-14`}>
        <div>
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.16em] text-blue-700">Security &amp; proctoring</span>
          <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-[color:var(--heading)] sm:text-4xl">Confidence at every checkpoint.</h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-[color:var(--body)]">Give every candidate a clear, consistent exam environment while your team gets the signals needed to protect assessment integrity.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm font-semibold text-slate-700">{[["Camera monitoring","shield"],["Tab-switch detection","bars"],["Fullscreen monitoring","lock"],["Incident reporting","chart"]].map(([label, icon]) => <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-3 py-3 shadow-sm"><GradientIcon name={icon as IconName} size={20} />{label}</div>)}</div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(20,35,90,.12)] sm:p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-white"><div><p className="m-0 text-[10px] font-bold uppercase tracking-[.16em] text-blue-300">Demonstration mode</p><p className="m-0 mt-1 text-sm font-bold">Secure assessment session</p></div><span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Simulated</span></div>
          <div className="grid gap-3 p-2 pt-4 sm:grid-cols-[1.2fr_.8fr]">
            <div className="relative flex min-h-[220px] items-end overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 via-slate-100 to-indigo-100 p-4"><div className="absolute left-4 top-4 rounded-lg bg-white/80 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm">Candidate preview · demo only</div><div className="mx-auto mb-2 flex h-36 w-28 items-end justify-center rounded-[3.5rem] bg-gradient-to-b from-slate-700 to-blue-800"><div className="mb-12 h-16 w-16 rounded-full bg-amber-200 shadow-inner" /></div><div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-lg bg-slate-950/85 px-3 py-2 text-[11px] font-semibold text-white"><span>EXAM-2026-0001</span><span className="text-emerald-300">In progress</span></div></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-800">Session controls</span><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">Healthy</span></div><div className="mt-4 flex items-center justify-between text-xs"><span className="text-slate-500">Time remaining</span><strong className="text-slate-900">42:18</strong></div><div className="mt-2 h-2 rounded-full bg-slate-200"><div className="h-full w-[68%] rounded-full bg-blue-600" /></div><div className="mt-5 space-y-2 text-[11px] font-semibold text-slate-600">{["Camera active","Microphone active","Fullscreen locked"].map((label) => <div key={label} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" />{label}</div>)}</div></div>
          </div>
          <div className="mx-2 mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white">!</span><span><span className="mr-1 text-[10px] uppercase tracking-wider text-amber-600">Example event</span>{events[eventIndex]}</span></div>
        </div>
      </div>
    </section>
  );
}

const journeySteps = [
  ["Registration", "Create your candidate profile", "user"],
  ["Email OTP", "Verify identity securely", "lock"],
  ["Exam readiness", "Check browser, camera, and microphone", "shield"],
  ["Examination", "Answer your assigned questions", "clock"],
  ["Monitoring", "Protect integrity with live signals", "bars"],
  ["Submission", "Finalize and securely record responses", "check"],
  ["Results", "Publish auditable marks", "chart"],
] as const;

function ExaminationJourney() {
  const [active, setActive] = useState(0);
  const step = journeySteps[active];
  return (
    <section id="how-it-works" className="border-y border-slate-200/70 bg-white/45 py-16 sm:py-24">
      <div className={`${container}`}>
        <div className="mx-auto max-w-2xl text-center"><span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-blue-700">One connected workflow</span><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[color:var(--heading)] sm:text-4xl">From registration to results.</h2><p className="mt-3 text-base leading-relaxed text-[color:var(--body)]">A calm, transparent journey for candidates and a complete operating picture for your team.</p></div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:gap-14">
          <div className="lg:sticky lg:top-28"><div className="flex gap-2 overflow-x-auto pb-3 lg:block lg:space-y-2 lg:overflow-visible">{journeySteps.map(([label, description, icon], index) => <button key={label} onClick={() => setActive(index)} className={`group flex min-w-[150px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all lg:w-full ${active === index ? "border-blue-200 bg-blue-50 shadow-sm" : "border-transparent hover:border-slate-200 hover:bg-white"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active === index ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}><Icon name={icon} size={18} /></span><span><strong className={`block text-xs ${active === index ? "text-blue-700" : "text-slate-700"}`}>{String(index + 1).padStart(2, "0")} · {label}</strong><small className="mt-0.5 block text-[11px] text-slate-500">{description}</small></span></button>)}</div></div>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(20,35,90,.12)] sm:p-5"><div className="rounded-xl bg-slate-950 px-4 py-3 text-white"><div className="flex items-center justify-between"><span className="text-xs font-bold">KGS secure workspace</span><span className="text-[10px] font-semibold text-blue-300">Stage {active + 1} of {journeySteps.length}</span></div><div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${((active + 1) / journeySteps.length) * 100}%` }} /></div></div><div className="relative mt-3 min-h-[300px] rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-5 sm:p-8"><div className="absolute right-5 top-5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">Secure by design</div><div className="flex h-full flex-col justify-center transition-all duration-500" key={step[0]}><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name={step[2]} size={28} /></div><p className="mb-0 mt-6 text-xs font-extrabold uppercase tracking-[.16em] text-blue-700">{step[0]}</p><h3 className="mb-0 mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{step[1]}</h3><p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">{active === 0 && "Candidates register once and keep their profile details in one trusted place."}{active === 1 && "A one-time code confirms the candidate before any assessment begins."}{active === 2 && "A guided system check confirms the environment is ready for a fair attempt."}{active === 3 && "Each candidate receives a randomized, category-balanced examination."}{active === 4 && "Camera, fullscreen, tab activity, and incidents are handled through configurable controls."}{active === 5 && "Responses are saved and the submission is recorded with an auditable timestamp."}{active === 6 && "Marks are calculated against the persisted answer key and released through the results workflow."}</p><div className="mt-7 flex items-center gap-2 text-xs font-bold text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Smooth transition to the next stage</div></div></div><div className="mt-3 flex justify-between"><button disabled={active === 0} onClick={() => setActive((value) => value - 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button disabled={active === journeySteps.length - 1} onClick={() => setActive((value) => value + 1)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Next stage →</button></div></div>
        </div>
      </div>
    </section>
  );
}

const workflowSteps = [["Create Exam", "gear"], ["Assign Students", "users"], ["Conduct Exam", "clock"], ["Monitor", "shield"], ["Evaluate", "chart"], ["Publish Marks", "check"]] as const;
function PlatformWorkflow() {
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive((value) => (value + 1) % workflowSteps.length), 3200); return () => window.clearInterval(timer); }, []);
  const descriptions = ["Configure the assessment once.", "Invite the right candidates.", "Deliver a calm, secure attempt.", "See integrity signals in real time.", "Review auditable submissions.", "Release results with confidence."];
  return <section className="py-14 sm:py-20"><div className={container}><div className="mx-auto max-w-2xl text-center"><span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-blue-700">Platform workflow</span><h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[color:var(--heading)] sm:text-4xl">Every operation, one connected workspace.</h2></div><div className="relative mt-10"><div className="absolute left-[8%] right-[8%] top-6 hidden h-1 rounded-full bg-slate-200 md:block"><div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${(active / (workflowSteps.length - 1)) * 100}%` }} /></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6 md:gap-2">{workflowSteps.map(([label, icon], index) => <button key={label} onClick={() => setActive(index)} className="group relative z-10 flex flex-col items-center text-center"><span className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-[color:var(--page-bg)] shadow-sm transition-all duration-300 ${index <= active ? "bg-blue-600 text-white shadow-blue-600/25" : "bg-white text-slate-400"}`}><Icon name={icon} size={20} /></span><strong className={`mt-3 text-xs ${index === active ? "text-blue-700" : "text-slate-700"}`}>{label}</strong><small className="mt-1 hidden text-[10px] leading-tight text-slate-500 sm:block">{descriptions[index]}</small></button>)}</div></div><div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(20,35,90,.09)] sm:p-5"><div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-xs font-bold text-slate-800">KGS operations preview</span><span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{workflowSteps[active][0]}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"><div><h3 className="m-0 text-lg font-extrabold text-slate-950">{descriptions[active]}</h3><p className="mb-0 mt-2 text-sm text-slate-500">The workspace updates as your team moves through the assessment lifecycle.</p></div><div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" /> Live workflow state</div></div></div></div></section>;
}

function FinalCta({ onLogin }: Pick<LandingPageProps, "onLogin">) {
  return <section className="px-4 py-14 sm:px-6 sm:py-20"><div className={`${container} relative isolate overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-12 shadow-[0_24px_80px_rgba(37,99,235,.12)] sm:px-12 lg:px-16`}><div className="pointer-events-none absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" /><div className="grid items-center gap-10 lg:grid-cols-[1fr_.7fr]"><div><span className="text-[11px] font-extrabold uppercase tracking-[.18em] text-blue-700">Ready when you are</span><h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-[color:var(--heading)] sm:text-4xl">Ready to Modernize Your Examination Process?</h2><p className="mt-4 max-w-xl text-base leading-relaxed text-[color:var(--body)]">Manage your complete examination workflow through one secure and connected platform.</p><div className="mt-7 flex flex-wrap gap-3"><button onClick={onLogin} className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">Get Started <span className="ml-2">→</span></button><a href="mailto:exams@kgs.edu" className="rounded-xl border border-blue-200 bg-white/80 px-6 py-3 text-sm font-bold text-slate-800 no-underline transition hover:-translate-y-0.5 hover:border-blue-400">Contact KGS</a></div></div><div className="relative mx-auto h-48 w-full max-w-[340px]" aria-hidden="true"><div className="absolute left-1/2 top-1/2 h-32 w-56 -translate-x-1/2 -translate-y-1/2 rotate-[-7deg] rounded-2xl border border-white/90 bg-white/80 shadow-[0_18px_40px_rgba(15,35,90,.14)] backdrop-blur-xl"><div className="m-4 h-2 w-20 rounded-full bg-blue-200" /><div className="m-4 mt-6 grid grid-cols-3 gap-2"><span className="h-12 rounded-lg bg-blue-50" /><span className="h-12 rounded-lg bg-indigo-50" /><span className="h-12 rounded-lg bg-emerald-50" /></div><div className="m-4 mt-4 h-2 w-32 rounded-full bg-slate-100" /></div><div className="absolute bottom-2 right-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-lg shadow-blue-600/25">✓</div></div></div></div></section>;
}

/* ------------------------------------------------------------------ */
/* Info sections                                                        */
/* ------------------------------------------------------------------ */
const infoSections: [string, string, string][] = [
  ["about", "Purpose-built for trusted assessments", "Give every candidate a calm, consistent experience while your team retains full control and visibility."],
  ["how-it-works", "From registration to results", "Create an examination, invite candidates, monitor sessions in real time, and publish auditable results from one workspace."],
  ["security", "Integrity at every layer", "Identity-aware access, configurable proctoring, activity signals, and defensible audit records protect every assessment."],
  ["contact", "Ready to modernize your examinations?", "Talk to the KGS team about your institution, candidate volume, and security requirements."],
];

function InfoSections() {
  return (
    <div className="mx-auto mt-4 mb-10 w-[calc(100%-32px)] max-w-[1120px] sm:mt-6 sm:mb-10 sm:w-[calc(100%-40px)] md:w-[calc(100%-64px)]">
      <div className="mb-8 max-w-[680px]">
        <h2 className="m-0 text-2xl font-extrabold tracking-tight text-[color:var(--heading)] sm:text-3xl">Everything You Need for Confident Assessments</h2>
        <p className="mt-2 mb-0 text-sm leading-relaxed text-[color:var(--body)] sm:text-base">A secure, auditable workflow for every stage of your examination program.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {infoSections.map(([id, title, copy], i) => (
          <section
            key={id}
            id={id}
            className={`group flex min-h-[260px] flex-col rounded-[18px] border p-6 shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${id === "contact" ? "border-blue-200 bg-blue-50/80 shadow-blue-600/[0.10] hover:border-blue-400" : "border-[#E6EBF5] bg-white shadow-blue-600/[0.07] hover:border-blue-300"}`}
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-[0.18em] text-blue-600">0{i + 1}</span>
              <span className="h-2 w-2 rounded-full bg-blue-600/20 transition-colors group-hover:bg-blue-600" aria-hidden="true" />
            </div>
            <h2 className="m-0 min-h-[3.5rem] text-xl font-bold leading-snug tracking-tight text-[color:var(--heading)]">{title}</h2>
            <p className="m-0 text-[15px] leading-relaxed text-[color:var(--body)]">{copy}</p>
            {id === "contact" && (
              <a
                href="mailto:exams@kgs.edu"
                className="mt-auto inline-flex cursor-pointer items-center gap-2 pt-5 text-sm font-bold text-blue-600 no-underline transition-all hover:translate-x-1 hover:text-blue-700"
              >
                exams@kgs.edu <Icon name="arrow" size={15} />
              </a>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export function LandingPage(props: LandingPageProps) {
  return (
    <div className="kgs-landing relative min-h-screen overflow-x-hidden font-sans">
      <style>{themeCss}</style>
      <SvgGradients />
      <Navbar {...props} />

      <main>
        {/* ---------------- HERO ---------------- */}
        <section id="home" className="relative isolate pb-14 pt-8 sm:pb-16 sm:pt-10 lg:min-h-[600px] lg:pb-20 lg:pt-12">
          {/* Photo layer: bleeds to the viewport's right edge, feathered on left + bottom */}
          <div className="kgs-photo pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-full opacity-30 sm:block lg:w-[58%] lg:opacity-100">
            <img
              src={heroStudentImg}
              alt="Student taking an online examination with headphones at a laptop"
              className="h-full w-full object-cover"
              style={{ objectPosition: HERO_POSITION }}
            />
          </div>

          <div className={`${container} relative z-10 grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[0.96fr_1.04fr]`}>
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-[18px] py-2 text-xs font-extrabold uppercase tracking-wider text-[color:var(--heading)] shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]" />
                SECURE • FAIR • AI-RESISTANT • ENTERPRISE GRADE
              </div>

              <h1 className="my-5 max-w-[720px] text-[clamp(2.125rem,4.4vw,4.25rem)] font-extrabold leading-[1.09] tracking-[-0.035em] sm:my-6">
                <span className="kgs-grad-text block">Next-Generation</span>
                <span className="block text-[color:var(--heading)]">Online Examination</span>
                <span className="block text-[color:var(--heading)]">Platform</span>
              </h1>

              <p className="mb-8 max-w-[600px] text-[15px] font-normal leading-[1.6] text-[color:var(--body)] sm:text-base lg:text-lg">
                A secure, proctored, and intelligent examination platform designed for educational
                institutions and organizations to conduct fair, scalable, and tamper-proof assessments.
              </p>

              <div className="flex w-full flex-wrap items-center gap-3.5 sm:w-auto sm:gap-4">
                <button
                  className={`${btnSecondary} h-[54px] w-full gap-2.5 rounded-2xl px-7 text-base font-semibold sm:w-auto`}
                  onClick={props.onRegister}
                >
                  <Icon name="user" size={19} />
                  Register as Student
                  <Icon name="arrow" size={19} />
                </button>
                <button
                  className={`${btnPrimary} landing-login-btn h-[54px] w-full gap-2.5 rounded-2xl px-7 text-base font-semibold sm:w-auto`}
                  onClick={props.onLogin}
                >
                  <Icon name="login" size={19} />
                  Login
                </button>
              </div>
            </div>

            <div className="pointer-events-none relative hidden min-h-[460px] w-full lg:block xl:min-h-[520px]">
              <ProctorCard />
              <MonitorCard />
              <EvaluationCard />
            </div>
          </div>

          <div className={`${container} relative z-10 mt-8 md:mt-10 lg:hidden`}>
            <ResponsiveHeroCards />
          </div>

          {/* Full-width wave, always the same color as the page background */}
          <svg
            className="pointer-events-none absolute inset-x-0 -bottom-px z-20 block h-8 w-full sm:h-10"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0,32 C360,80 720,0 1080,48 C1260,72 1380,56 1440,80 L1440,80 L0,80 Z"
              style={{ fill: "var(--page-bg)" }}
            />
          </svg>
        </section>

        <FeatureStrip />
        <ExaminationJourney />
        <PlatformWorkflow />
        <SecurityDemo />
        <FinalCta onLogin={props.onLogin} />
        <InfoSections />
      </main>

      <footer className="border-t border-[color:var(--hairline)] bg-[color:var(--foot-bg)] py-8 backdrop-blur-md sm:py-9">
        <div className={`${container} flex flex-col items-center justify-between gap-6 text-sm text-[color:var(--body)] sm:flex-row`}>
          <Brand />
          <p className="m-0 text-center sm:text-left">
            © {new Date().getFullYear()} KGS Institute. Secure examination infrastructure.
          </p>
          <a href="#home" className="text-[color:var(--body)] no-underline transition-colors hover:text-blue-600">
            Back to top ↑
          </a>
        </div>
      </footer>
    </div>
  );
}
