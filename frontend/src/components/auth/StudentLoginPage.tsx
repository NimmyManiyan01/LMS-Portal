import {
  useEffect,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { StudentProfile } from "../../types";
import { API_BASE_URL, setAuthToken } from "../../api";
import logoRevealVideo from "../../assets/KGS_logo_reveal_animation_3b0e3d6c_1080p.mp4";
import { TransparentLogoVideo } from "../public/TransparentLogoVideo";

interface Props {
  initialEmail?: string;
  allowRegistration?: boolean;
  onBackToLanding: () => void;
  onRegister: () => void;
  onAuthenticated: (user: any) => void;
}

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */
type IconName =
  | "arrow"
  | "check"
  | "lock"
  | "mail"
  | "moon"
  | "shield"
  | "sun"
  | "user"
  | "back";

const iconPaths: Record<IconName, ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
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
      className="shrink-0"
    >
      {iconPaths[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
const EMAIL_RE = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;

const secondsUntil = (iso: string | null, now: number) =>
  iso ? Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000)) : 0;

const formatClock = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

const btnPrimary =
  "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-gradient-to-br from-blue-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:shadow-indigo-600/40 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

const btnSecondary =
  "flex cursor-pointer items-center justify-center gap-2 border border-slate-900/10 bg-white text-[#0F1B4C] shadow-sm transition-all hover:-translate-y-0.5";

const alertBox = "rounded-xl border px-4 py-3 text-sm font-semibold";

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export function StudentLoginPage({
  initialEmail = "",
  allowRegistration = true,
  onBackToLanding,
  onRegister,
  onAuthenticated,
}: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const api = API_BASE_URL;

  /* Existing session check */
  useEffect(() => {
    const token = localStorage.getItem("kgs_token");
    if (!token) return;

    let cancelled = false;
    fetch(`${api}/api/auth/me`, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (data.user?.role) onAuthenticated(data.user);
      })
      .catch(() => {
        /* No active session: show the OTP form. */
      });
    return () => {
      cancelled = true;
    };
  }, [api, onAuthenticated]);

  /* 1s ticker while on the OTP step */
  useEffect(() => {
    if (step !== "OTP") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  /* Focus the first OTP box when entering the OTP step */
  useEffect(() => {
    if (step === "OTP") document.getElementById("student-login-otp-0")?.focus();
  }, [step]);

  const resendSeconds = secondsUntil(resendAvailableAt, now);
  const expirySeconds = secondsUntil(expiresAt, now);

  const requestOtp = async (
    event?: { preventDefault: () => void },
    endpoint = "request-otp",
  ) => {
    event?.preventDefault();
    setError("");
    setMessage("");
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${api}/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to send verification code.");
      setExpiresAt(data.expiresAt || null);
      setResendAvailableAt(data.resendAvailableAt || null);
      setNow(Date.now());
      setOtp(["", "", "", "", "", ""]);
      setMessage(
        "If this email can be used, verification instructions have been sent.",
      );
      setStep("OTP");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to send verification code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (otp.join("").length !== 6) {
      setError("Enter the six-digit verification code.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${api}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.join(""),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to verify code.");
      if (data.token) setAuthToken(data.token, data.user?.role === "ADMIN");
      onAuthenticated(data.user);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to verify code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateOtp = (index: number, value: string) => {
    const next = [...otp];
    next[index] = value.replace(/\D/g, "").slice(-1);
    setOtp(next);
    if (next[index] && index < 5)
      document.getElementById(`student-login-otp-${index + 1}`)?.focus();
  };

  const onOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`student-login-otp-${index - 1}`)?.focus();
    }
  };

  const onOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    const next = ["", "", "", "", "", ""];
    digits.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    document
      .getElementById(`student-login-otp-${Math.min(digits.length, 5)}`)
      ?.focus();
  };

  const inputBase =
    "w-full rounded-xl border border-slate-900/10 bg-white text-[#0F1B4C] placeholder:text-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#faf8ff] bg-[radial-gradient(circle_at_82%_8%,rgba(124,58,237,.16)_0%,transparent_34%),radial-gradient(circle_at_8%_82%,rgba(37,99,235,.13)_0%,transparent_36%)] font-sans text-[#172044] transition-colors duration-300"
    >
      {/* Header */}
      <header className="cinematic-navbar fixed left-0 right-0 top-0 z-50 bg-[#faf8ff]/90 shadow-[0_1px_8px_rgba(0,0,0,.04)] backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
          <button
            className="group flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left focus:outline-none sm:gap-3"
            onClick={onBackToLanding}
            aria-label="Back to the Kaizentrix Global Solutions landing page"
          >
            <TransparentLogoVideo src={logoRevealVideo} loop className="h-9 w-24 object-contain transition-transform group-hover:scale-105" />
            <span className="hidden font-headline-sm text-sm font-bold tracking-tight text-primary sm:inline sm:text-base">Kaizentrix Global Solutions</span>
          </button>

          <nav className="hidden items-center gap-6 xl:flex">
            {[["About Us", "/"], ["Batches", "/batches"], ["Placement Track", "/#lms-preview"], ["Achievers", "/#achievers"], ["LMS Gateway", "/#lms-preview"]].map(([name, href]) => <a key={name} href={href} className="text-sm font-semibold text-slate-600 no-underline transition-colors hover:text-blue-600">{name}</a>)}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="hero-login-button portal-login-button hidden rounded-xl px-4 py-2 text-sm font-semibold shadow-sm md:inline-flex"><span>Portal Login</span></button>
            {allowRegistration && <>
            <button
              className={`${btnSecondary} h-10 rounded-xl px-4 text-sm font-semibold`}
              onClick={onRegister}
            >
              <span className="hidden sm:inline">New student?&nbsp;</span>
              <span className="text-blue-600">Create account</span>
            </button>
            </>}
            <button className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm xl:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation"><span className="text-[22px]">{mobileMenuOpen ? "×" : "☰"}</span></button>
          </div>
        </div>
        {mobileMenuOpen && <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-xl xl:hidden"><nav className="flex flex-col gap-1">{[["About Us", "/"], ["Batches", "/batches"], ["Placement Track", "/#lms-preview"], ["Achievers", "/#achievers"], ["LMS Gateway", "/#lms-preview"]].map(([name, href]) => <a key={name} href={href} onClick={() => setMobileMenuOpen(false)} className="border-b border-slate-100 py-3 text-sm font-semibold text-slate-600 no-underline">{name}</a>)}</nav></div>}
      </header>

      {/* Main */}
      <main className="mx-auto grid w-[calc(100%-32px)] max-w-[1200px] flex-1 grid-cols-1 items-center gap-10 pb-10 pt-28 sm:w-[calc(100%-48px)] sm:pb-14 sm:pt-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Intro column */}
        <section className="flex flex-col items-start">
          <button
            className="mb-6 inline-flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-sm font-semibold text-slate-600 transition-colors hover:text-blue-600"
            onClick={onBackToLanding}
          >
            <Icon name="back" size={16} /> Back to home
          </button>

          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/90 bg-white/80 px-[18px] py-2 text-xs font-extrabold uppercase tracking-wider text-[#0F1B4C] shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]" />
            Student &amp; Administrator Authentication
          </div>

          <h1 className="my-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
            <span className="block bg-gradient-to-br from-blue-600 to-violet-600 bg-clip-text text-transparent">Welcome</span>
            <span className="block text-[#0F1B4C]">back</span>
          </h1>

          <p className="mb-8 max-w-[520px] text-base leading-relaxed text-slate-600 sm:text-lg">
            Sign in securely with your authorised email address and a one-time
            verification code.
          </p>

          <div className="flex w-full max-w-[520px] items-start gap-4 rounded-2xl border border-white/90 bg-white/80 p-5 shadow-[0_20px_50px_rgba(37,99,235,.14)] backdrop-blur-2xl">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white text-blue-600 shadow-md shadow-blue-600/10">
              <Icon name="shield" size={22} />
            </span>
            <div className="flex flex-col gap-1">
              <strong className="text-base font-bold text-[#0F1B4C]">
                Passwordless access
              </strong>
              <span className="text-sm leading-relaxed text-slate-600">
                Your verification code is single-use and expires after a short
                period.
              </span>
            </div>
          </div>

          <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm font-semibold text-slate-600">
            {[
              "Secure & Reliable",
              "AI-resistant proctoring",
              "Enterprise grade",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Icon name="check" size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Form card */}
        <section className="relative flex w-full flex-col gap-6 overflow-hidden rounded-[28px] border border-white bg-white/90 p-6 shadow-[0_24px_70px_rgba(79,70,229,.16)] backdrop-blur-2xl sm:p-10 lg:ml-auto lg:max-w-[520px]">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500" />
          {step === "EMAIL" ? (
            <form
              onSubmit={requestOtp}
              noValidate
              className="flex flex-col gap-5"
            >
              <div>
                <h2 className="m-0 text-2xl font-bold tracking-tight text-[#0F1B4C]">
                  Portal Login
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Enter your email address to receive a verification code.
                </p>
              </div>

              {error && (
                <div
                  className={`${alertBox} border-red-300/70 bg-red-500/10 text-red-600 flex flex-col gap-1.5`}
                  role="alert"
                >
                  <div>{error}</div>
                  {error.toLowerCase().includes("register") && allowRegistration && (
                    <button
                      type="button"
                      className="text-xs font-bold text-blue-600 underline hover:text-blue-700 cursor-pointer text-left border-none bg-transparent p-0"
                      onClick={onRegister}
                    >
                      Click here to Register ➔
                    </button>
                  )}
                </div>
              )}

              <label className="flex flex-col gap-2 text-sm font-semibold text-[#0F1B4C]">
                <span>
                  Email Address <b className="text-red-500">*</b>
                </span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="mail" size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="e.g. rahul@gmail.com"
                    autoComplete="email"
                    required
                    className={`${inputBase} h-12 pl-11 pr-4 text-sm`}
                  />
                </span>
              </label>

              <button className={btnPrimary} type="submit" disabled={loading}>
                {loading ? (
                  "Sending verification code..."
                ) : (
                  <>
                    Send Verification OTP <Icon name="arrow" size={18} />
                  </>
                )}
              </button>

              {message && (
                <p className="m-0 rounded-xl border border-emerald-300/60 bg-emerald-500/10 p-3 text-center text-xs font-medium text-emerald-600">
                  {message}
                </p>
              )}

              {allowRegistration && <p className="m-0 text-center text-sm text-slate-600">
                New here?{" "}
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 font-bold text-blue-600 hover:text-violet-600"
                  onClick={onRegister}
                >
                  Register as Student
                </button>
              </p>}
            </form>
          ) : (
            <form
              onSubmit={verifyOtp}
              noValidate
              className="flex flex-col gap-5"
            >
              <div>
                <h2 className="m-0 text-2xl font-bold tracking-tight text-[#0F1B4C]">
                  Enter Verification Code
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">
                  Enter the six-digit code sent to{" "}
                  <strong className="break-all text-[#0F1B4C]">
                    {email}
                  </strong>
                  .
                </p>
              </div>

              {error && (
                <div
                  className={`${alertBox} border-red-300/70 bg-red-500/10 text-red-600`}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="my-1 grid grid-cols-6 gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`student-login-otp-${index}`}
                    aria-label={`OTP digit ${index + 1}`}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => updateOtp(index, event.target.value)}
                    onKeyDown={(event) => onOtpKeyDown(index, event)}
                    onPaste={onOtpPaste}
                    className={`${inputBase} h-14 text-center text-xl font-bold`}
                  />
                ))}
              </div>

              <p
                className="m-0 text-center text-xs font-medium text-slate-600"
                aria-live="polite"
              >
                {expiresAt ? (
                  expirySeconds > 0 ? (
                    <>
                      Code expires in{" "}
                      <b className="text-[#0F1B4C]">
                        {formatClock(expirySeconds)}
                      </b>
                    </>
                  ) : (
                    <span className="text-red-500">
                      Code expired. Request a new one.
                    </span>
                  )
                ) : (
                  "Check your inbox for the code."
                )}
              </p>

              <button className={btnPrimary} type="submit" disabled={loading}>
                {loading ? (
                  "Verifying code..."
                ) : (
                  <>
                    Verify OTP &amp; Continue <Icon name="arrow" size={18} />
                  </>
                )}
              </button>

              {message && (
                <p className="m-0 rounded-xl border border-emerald-300/60 bg-emerald-500/10 p-3 text-center text-xs font-medium text-emerald-600">
                  {message}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-slate-900/10 pt-4">
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-slate-600 transition-colors hover:text-[#0F1B4C]"
                  onClick={() => {
                    setStep("EMAIL");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                    setMessage("");
                  }}
                >
                  Change email
                </button>
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-blue-600 transition-colors hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading || resendSeconds > 0}
                  onClick={() => {
                    void requestOtp();
                  }}
                >
                  {resendSeconds > 0
                    ? `Resend code in ${resendSeconds}s`
                    : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-900/10 py-6 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Kaizentrix Global Solutions. Secure examination
        infrastructure.
      </footer>
    </div>
  );
}
