import { useState, type ReactNode } from "react";
import heroStudentImg from "../../assets/hero-student.png";

interface LandingPageProps {
  onStudentLogin: () => void;
  onRegister: () => void;
  onAdminLogin: () => void;
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
  --grad: linear-gradient(135deg, #2563EB, #7C3AED);
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
.kgs-grad-bg   { background-image: var(--grad); }
.kgs-grad-text { background-image: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.kgs-glass {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  box-shadow: 0 16px 40px rgba(37,99,235,.14);
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
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="chartFillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
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
  "flex cursor-pointer items-center justify-center gap-2 border border-[color:var(--hairline)] bg-[color:var(--btn-bg)] text-[color:var(--heading)] shadow-sm transition-all hover:-translate-y-0.5";

const btnPrimary =
  "kgs-grad-bg flex cursor-pointer items-center justify-center gap-2 border-none text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:shadow-indigo-600/40";

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

function Navbar({ onStudentLogin, onRegister, onAdminLogin }: LandingPageProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 min-h-[72px] border-b border-[color:var(--hairline)] bg-[color:var(--nav-bg)] backdrop-blur-xl transition-colors duration-300">
      <div className={`${container} flex min-h-[72px] items-center justify-between gap-4 sm:gap-6`}>
        <Brand />

        <div className="hidden shrink-0 items-center gap-2 xl:gap-3 lg:flex">
          <button className={`${btnSecondary} h-11 rounded-xl px-5 text-sm font-semibold`} onClick={onStudentLogin}>
            <Icon name="user" size={18} /> Student Login
          </button>
          <button className={`${btnSecondary} h-11 rounded-xl px-5 text-sm font-semibold`} onClick={onRegister}>
            Register
          </button>
          <button className={`${btnPrimary} h-11 rounded-xl px-5 text-sm font-semibold`} onClick={onAdminLogin}>
            <Icon name="lock" size={17} /> Admin Portal
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
              onClick={() => { setOpen(false); onStudentLogin(); }}
            >
              <Icon name="user" size={18} /> Student Login
            </button>
            <button
              className={`${btnSecondary} h-11 w-full rounded-xl px-5 text-sm font-semibold`}
              onClick={() => { setOpen(false); onRegister(); }}
            >
              Register
            </button>
            <button
              className={`${btnPrimary} h-11 w-full rounded-xl px-5 text-sm font-semibold`}
              onClick={() => { setOpen(false); onAdminLogin(); }}
            >
              <Icon name="lock" size={17} /> Admin Portal
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
      <div className="mt-3 flex h-10 items-end justify-between gap-0.5">
        {barHeights.map((h, i) => (
          <div key={i} className="w-[3px] rounded-full bg-gradient-to-t from-blue-600 to-violet-600" style={{ height: `${Math.min(h, 40)}px` }} />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:hidden">
      <div className="relative min-h-[180px]"><ProctorCard /></div>
      <div className="relative min-h-[150px]"><MonitorCard /></div>
      <div className="relative min-h-[180px]"><EvaluationCard /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature strip                                                        */
/* ------------------------------------------------------------------ */
const featureItems: [IconName, string, string][] = [
  ["shield", "Secure & Reliable", "Enterprise-grade security and data protection."],
  ["users", "Fair Assessments", "AI-resistant proctoring and integrity controls."],
  ["bars", "Real-time Insights", "Live monitoring and instant analytics."],
  ["gear", "Easy Management", "Simple tools for admins and institutions."],
  ["graduate", "Built for Scale", "From hundreds to millions of candidates."],
];

function FeatureStrip() {
  return (
    <section className="relative z-10 bg-transparent pb-8 pt-10" id="features">
      <div className={`${container} grid grid-cols-1 items-center gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6`}>
        {featureItems.map(([icon, title, copy]) => (
          <div
            key={title}
            className="relative flex items-center gap-4 lg:after:absolute lg:after:-right-3 lg:after:top-[15%] lg:after:block lg:after:h-[70%] lg:after:w-px lg:after:bg-[color:var(--hairline)] lg:after:content-[''] lg:last:after:hidden"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[color:var(--bubble)] shadow-lg shadow-blue-600/10">
              <GradientIcon name={icon} size={26} />
            </div>
            <div className="flex flex-col">
              <h3 className="m-0 mb-1 text-lg font-bold text-[color:var(--heading)]">{title}</h3>
              <p className="m-0 max-w-[200px] text-[15px] leading-normal text-[color:var(--body)] [text-wrap:balance]">{copy}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center text-sm font-medium tracking-wide text-[color:var(--body)] sm:text-base">
        Trusted by leading educational institutions and organizations
      </div>
    </section>
  );
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
    <div className="mx-auto my-12 mb-20 grid w-[calc(100%-32px)] max-w-[1120px] grid-cols-1 gap-4 sm:w-[calc(100%-40px)] sm:grid-cols-2 md:w-[calc(100%-64px)] lg:grid-cols-4">
      {infoSections.map(([id, title, copy], i) => (
        <section
          key={id}
          id={id}
          className="group flex min-h-[260px] flex-col rounded-2xl border border-[color:var(--glass-border)] bg-[color:var(--card-bg)] p-5 shadow-lg shadow-blue-600/[0.07] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-600/10 sm:p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-extrabold tracking-[0.18em] text-blue-600">0{i + 1}</span>
            <span className="h-2 w-2 rounded-full bg-blue-600/20 transition-colors group-hover:bg-blue-600" aria-hidden="true" />
          </div>
          <h2 className="m-0 mb-3 text-xl font-bold leading-snug tracking-tight text-[color:var(--heading)]">{title}</h2>
          <p className="m-0 text-sm leading-relaxed text-[color:var(--body)]">{copy}</p>
          {id === "contact" && (
            <a
              href="mailto:exams@kgs.edu"
              className="mt-auto inline-flex cursor-pointer items-center gap-2 pt-5 text-sm font-bold text-blue-600 no-underline transition-all hover:translate-x-1 hover:text-violet-600"
            >
              exams@kgs.edu <Icon name="arrow" size={15} />
            </a>
          )}
        </section>
      ))}
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

          <div className={`${container} relative z-10 grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[1.08fr_0.92fr]`}>
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-[18px] py-2 text-xs font-extrabold uppercase tracking-wider text-[color:var(--heading)] shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]" />
                SECURE • FAIR • AI-RESISTANT • ENTERPRISE GRADE
              </div>

              <h1 className="my-5 max-w-[760px] text-[clamp(2.25rem,5.2vw,4.5rem)] font-extrabold leading-[1.04] tracking-tight sm:my-6">
                <span className="kgs-grad-text block">Next-Generation</span>
                <span className="block text-[color:var(--heading)]">Online Examination</span>
                <span className="block text-[color:var(--heading)]">Platform</span>
              </h1>

              <p className="mb-8 max-w-[640px] text-base font-normal leading-relaxed text-[color:var(--body)] sm:text-lg lg:text-xl">
                A secure, proctored, and intelligent examination platform designed for educational
                institutions and organizations to conduct fair, scalable, and tamper-proof assessments.
              </p>

              <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto">
                <button
                  className={`${btnPrimary} h-[54px] w-full gap-2.5 rounded-2xl px-7 text-base font-semibold sm:w-auto`}
                  onClick={props.onRegister}
                >
                  <Icon name="user" size={19} />
                  Register as Student
                  <Icon name="arrow" size={19} />
                </button>
                <button
                  className={`${btnSecondary} h-[54px] w-full gap-2.5 rounded-2xl px-7 text-base font-semibold sm:w-auto`}
                  onClick={props.onStudentLogin}
                >
                  <Icon name="login" size={19} />
                  Student Login
                </button>
              </div>

              <div className="mt-4">
                <button
                  className="inline-flex cursor-pointer items-center gap-2 border-none bg-transparent p-1 text-sm font-bold text-blue-600 transition-all hover:translate-x-1 hover:text-violet-600"
                  onClick={props.onAdminLogin}
                >
                  <Icon name="shield" size={18} />
                  Administrator Portal →
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
