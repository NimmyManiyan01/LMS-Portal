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

interface Props {
  initialEmail?: string;
  onBackToLanding: () => void;
  onRegister: () => void;
  onAuthenticated: (user: any) => void;
}

/* ------------------------------------------------------------------ */
/* Theme tokens (same values as the landing page)                       */
/* ------------------------------------------------------------------ */
const themeCss = `
.kgs-auth {
  --page-bg: #F7FAFF;
  --glass: rgba(255,255,255,.82);
  --glass-border: rgba(255,255,255,.9);
  --nav-bg: rgba(255,255,255,.82);
  --field-bg: #FFFFFF;
  --btn-bg: #FFFFFF;
  --hairline: rgba(15,27,76,.10);
  --heading: #0F1B4C;
  --body: #5B6478;
  --muted: #8A93A8;
  --grad: linear-gradient(135deg, #2563EB, #7C3AED);
  --glow-a: rgba(37,99,235,.14);
  --glow-b: rgba(124,58,237,.12);
  color-scheme: light;
  color: var(--heading);
  background-color: var(--page-bg);
  background-image:
    radial-gradient(circle at 85% 10%, var(--glow-a) 0%, transparent 40%),
    radial-gradient(circle at 10% 90%, var(--glow-b) 0%, transparent 38%);
}
.kgs-auth[data-theme="dark"] {
  --page-bg: #0B1020;
  --glass: rgba(20,28,56,.78);
  --glass-border: rgba(128,146,203,.25);
  --nav-bg: rgba(11,16,32,.82);
  --field-bg: rgba(11,16,32,.6);
  --btn-bg: rgba(20,28,56,.72);
  --hairline: rgba(182,196,235,.16);
  --heading: #F3F6FF;
  --body: #B4BDD4;
  --muted: #8791AD;
  --glow-a: rgba(37,99,235,.22);
  --glow-b: rgba(124,58,237,.18);
  color-scheme: dark;
}
.kgs-grad-bg   { background-image: var(--grad); }
.kgs-grad-text { background-image: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.kgs-glass {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  box-shadow: 0 20px 50px rgba(37,99,235,.14);
}
`;

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
  "kgs-grad-bg flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 hover:shadow-indigo-600/40 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50";

const btnSecondary =
  "flex cursor-pointer items-center justify-center gap-2 border border-[color:var(--hairline)] bg-[color:var(--btn-bg)] text-[color:var(--heading)] shadow-sm transition-all hover:-translate-y-0.5";

const alertBox = "rounded-xl border px-4 py-3 text-sm font-semibold";

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
export function StudentLoginPage({
  initialEmail = "",
  onBackToLanding,
  onRegister,
  onAuthenticated,
}: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [authMode, setAuthMode] = useState<"STUDENT" | "ADMIN">("STUDENT");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());
  const api = API_BASE_URL;

  /* Existing session check */
  useEffect(() => {
    let cancelled = false;
    fetch(`${api}/api/auth/me`, {
      credentials: "include",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kgs_student_token") || localStorage.getItem("kgs_token") || ""}`,
      },
    })
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (data.user?.role === "STUDENT") onAuthenticated(data.user);
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
      const authEndpoint = authMode === "ADMIN" ? "admin/request-otp" : endpoint;
      const response = await fetch(`${api}/api/auth/${authEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (data.adminLogin) {
        const adminResponse = await fetch(`${api}/api/auth/admin/request-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ email: email.trim().toLowerCase() }) });
        const adminData = await adminResponse.json();
        if (!adminResponse.ok) throw new Error(adminData.error || "Unable to send verification code.");
        setAuthMode("ADMIN");
        setExpiresAt(adminData.expiresAt || null);
        setResendAvailableAt(adminData.resendAvailableAt || null);
        setOtp(["", "", "", "", "", ""]);
        setMessage("Verification instructions have been sent.");
        setStep("OTP");
        return;
      }
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
      const response = await fetch(`${api}/api/auth/${authMode === "ADMIN" ? "admin/verify-otp" : "verify-otp"}`, {
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
      if (data.token) setAuthToken(data.token, authMode === "ADMIN");
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
    "w-full rounded-xl border border-[color:var(--hairline)] bg-[color:var(--field-bg)] text-[color:var(--heading)] placeholder:text-[color:var(--muted)] shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/15";

  return (
    <div
      className="kgs-auth relative flex min-h-screen flex-col overflow-x-hidden font-sans transition-colors duration-300"
      data-theme="light"
    >
      <style>{themeCss}</style>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[color:var(--hairline)] bg-[color:var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] w-[calc(100%-32px)] max-w-[1200px] items-center justify-between gap-4 sm:w-[calc(100%-48px)]">
          <button
            className="group flex cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left focus:outline-none"
            onClick={onBackToLanding}
            aria-label="Back to KGS Exam Portal home"
          >
            <span className="kgs-grad-bg flex h-11 w-11 items-center justify-center rounded-xl text-2xl font-black text-white shadow-lg shadow-blue-600/30 transition-transform group-hover:scale-105">
              K
            </span>
            <span className="flex flex-col">
              <strong className="text-xl font-black leading-none tracking-tight text-[color:var(--heading)]">
                KGS
              </strong>
              <small className="mt-0.5 text-[9.5px] font-extrabold leading-none tracking-[0.16em] text-blue-600">
                EXAM PORTAL
              </small>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className={`${btnSecondary} h-10 rounded-xl px-4 text-sm font-semibold`}
              onClick={onRegister}
            >
              <span className="hidden sm:inline">New student?&nbsp;</span>
              <span className="text-blue-600">Create account</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto grid w-[calc(100%-32px)] max-w-[1200px] flex-1 grid-cols-1 items-center gap-10 py-10 sm:w-[calc(100%-48px)] sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Intro column */}
        <section className="flex flex-col items-start">
          <button
            className="mb-6 inline-flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-sm font-semibold text-[color:var(--body)] transition-colors hover:text-blue-600"
            onClick={onBackToLanding}
          >
            <Icon name="back" size={16} /> Back to home
          </button>

          <div className="inline-flex items-center gap-2.5 rounded-full border border-[color:var(--glass-border)] bg-[color:var(--glass)] px-[18px] py-2 text-xs font-extrabold uppercase tracking-wider text-[color:var(--heading)] shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]" />
            Student Authentication
          </div>

          <h1 className="my-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[64px]">
            <span className="kgs-grad-text block">Welcome</span>
            <span className="block text-[color:var(--heading)]">back</span>
          </h1>

          <p className="mb-8 max-w-[520px] text-base leading-relaxed text-[color:var(--body)] sm:text-lg">
            Sign in securely with your registered email address and a one-time
            verification code.
          </p>

          <div className="glass-note kgs-glass flex w-full max-w-[520px] items-start gap-4 rounded-2xl p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[color:var(--field-bg)] text-blue-600 shadow-md shadow-blue-600/10">
              <Icon name="shield" size={22} />
            </span>
            <div className="flex flex-col gap-1">
              <strong className="text-base font-bold text-[color:var(--heading)]">
                Passwordless access
              </strong>
              <span className="text-sm leading-relaxed text-[color:var(--body)]">
                Your verification code is single-use and expires after a short
                period.
              </span>
            </div>
          </div>

          <ul className="m-0 mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-sm font-semibold text-[color:var(--body)]">
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
        <section className="kgs-glass flex w-full flex-col gap-6 rounded-3xl p-6 sm:p-10 lg:ml-auto lg:max-w-[520px]">
          {step === "EMAIL" ? (
            <form
              onSubmit={requestOtp}
              noValidate
              className="flex flex-col gap-5"
            >
              <div>
                <h2 className="m-0 text-2xl font-bold tracking-tight text-[color:var(--heading)]">
                  Student Login
                </h2>
                <p className="mt-1.5 text-sm text-[color:var(--body)]">
                  Enter your email address to receive a verification code.
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

              <label className="flex flex-col gap-2 text-sm font-semibold text-[color:var(--heading)]">
                <span>
                  Email Address <b className="text-red-500">*</b>
                </span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--muted)]">
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

              <p className="m-0 text-center text-sm text-[color:var(--body)]">
                New here?{" "}
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 font-bold text-blue-600 hover:text-violet-600"
                  onClick={onRegister}
                >
                  Register as Student
                </button>
              </p>
            </form>
          ) : (
            <form
              onSubmit={verifyOtp}
              noValidate
              className="flex flex-col gap-5"
            >
              <div>
                <h2 className="m-0 text-2xl font-bold tracking-tight text-[color:var(--heading)]">
                  Enter Verification Code
                </h2>
                <p className="mt-1.5 text-sm text-[color:var(--body)]">
                  Enter the six-digit code sent to{" "}
                  <strong className="break-all text-[color:var(--heading)]">
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
                className="m-0 text-center text-xs font-medium text-[color:var(--body)]"
                aria-live="polite"
              >
                {expiresAt ? (
                  expirySeconds > 0 ? (
                    <>
                      Code expires in{" "}
                      <b className="text-[color:var(--heading)]">
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

              <div className="flex items-center justify-between gap-3 border-t border-[color:var(--hairline)] pt-4">
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0 text-sm font-semibold text-[color:var(--body)] transition-colors hover:text-[color:var(--heading)]"
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

      <footer className="border-t border-[color:var(--hairline)] py-6 text-center text-xs text-[color:var(--body)]">
        © {new Date().getFullYear()} KGS Institute. Secure examination
        infrastructure.
      </footer>
    </div>
  );
}
