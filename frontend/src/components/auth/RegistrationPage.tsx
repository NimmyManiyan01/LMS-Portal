import { useState } from "react"
import { API_BASE_URL } from "../../api"
import logoRevealVideo from "../../assets/KGS_logo_reveal_animation_3b0e3d6c_1080p.mp4"
import { TransparentLogoVideo } from "../public/TransparentLogoVideo"

interface Props {
  onBackToLogin: () => void
  onRegistered: (email: string) => void
}
type Form = {
  fullName: string
  email: string
  phone: string
  college: string
  branch: string
  passOutYear: string
  privacyAccepted: boolean
  monitoringAccepted: boolean
}
type Errors = Partial<Record<keyof Form, string>>

export function RegistrationPage({ onBackToLogin, onRegistered }: Props) {
  const [form, setForm] = useState<Form>({
    fullName: "",
    email: "",
    phone: "",
    college: "",
    branch: "",
    passOutYear: "",
    privacyAccepted: false,
    monitoringAccepted: false,
  })
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const update = (key: keyof Form, value: string | boolean) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const validate = () => {
    const next: Errors = {}
    const year = Number(form.passOutYear)
    const current = new Date().getFullYear()
    if (form.fullName.trim().length < 2 || form.fullName.trim().length > 100)
      next.fullName = "Enter a name between 2 and 100 characters."
    if (
      !/^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/.test(form.email.trim())
    )
      next.email = "Enter a valid email address."
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone))
      next.phone = "Enter a valid 10-digit Indian mobile number."
    if (form.college && (form.college.trim().length < 2 || form.college.trim().length > 150))
      next.college = "Enter a college name between 2 and 150 characters."
    if (form.passOutYear && (!Number.isInteger(year) || year < current - 10 || year > current + 10))
      next.passOutYear = "Select a valid pass-out year."
    if (!form.privacyAccepted)
      next.privacyAccepted = "Privacy acknowledgement is required."
    if (!form.monitoringAccepted)
      next.monitoringAccepted = "Monitoring acknowledgement is required."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setServerError("")
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          passOutYear: form.passOutYear ? Number(form.passOutYear) : undefined,
        }),
      })
      const data = await response.json()
      if (!response.ok)
        throw new Error(data.error || "Registration could not be completed.")
      const otpResponse = await fetch(`${API_BASE_URL}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
      })
      if (!otpResponse.ok) {
        const otpData = await otpResponse.json().catch(() => null)
        throw new Error(otpData?.error || "Account created, but the verification code could not be sent. Try signing in again.")
      }
      onRegistered(form.email.trim().toLowerCase())
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Registration could not be completed.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="fixed left-0 right-0 top-0 z-50 bg-[#faf8ff]/90 shadow-[0_1px_8px_rgba(0,0,0,.04)] backdrop-blur-xl">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
        <button
          className="group flex items-center gap-2 border-none bg-transparent cursor-pointer text-left focus:outline-none sm:gap-3"
          onClick={onBackToLogin}
        >
          <TransparentLogoVideo src={logoRevealVideo} loop className="h-9 w-24 object-contain transition-transform group-hover:scale-105" />
          <span className="hidden text-sm font-bold tracking-tight text-blue-700 sm:inline sm:text-base">Kaizentrix Global Solutions</span>
        </button>
        <nav className="hidden items-center gap-6 xl:flex">
          {[['About Us', '/'], ['Batches', '/#batches'], ['Placement Track', '/#lms-preview'], ['Achievers', '/#achievers'], ['LMS Gateway', '/#lms-preview']].map(([name, href]) => <a key={name} href={href} className="text-sm font-semibold text-slate-600 no-underline transition-colors hover:text-blue-600">{name}</a>)}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button" onClick={onBackToLogin} className="hero-login-button portal-login-button hidden rounded-xl px-4 py-2 text-sm font-semibold shadow-sm md:inline-flex">Portal Login</button>
          <button className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-600 shadow-sm" onClick={onBackToLogin}>Already registered? <span className="hidden sm:inline">Sign in</span></button>
          <button className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm xl:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation"><span className="text-[22px]">{mobileMenuOpen ? "×" : "☰"}</span></button>
        </div>
        </div>
        {mobileMenuOpen && <div className="border-t border-slate-100 bg-white px-5 py-4 shadow-xl xl:hidden"><nav className="flex flex-col gap-1">{[['About Us', '/'], ['Batches', '/#batches'], ['Placement Track', '/#lms-preview'], ['Achievers', '/#achievers'], ['LMS Gateway', '/#lms-preview']].map(([name, href]) => <a key={name} href={href} onClick={() => setMobileMenuOpen(false)} className="border-b border-slate-100 py-3 text-sm font-semibold text-slate-600 no-underline">{name}</a>)}</nav></div>}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-8 pt-28 sm:pb-12 sm:pt-32 grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 lg:gap-12 items-start">
        {/* Left Section: Intro */}
        <section className="flex flex-col gap-3 lg:pt-4">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-600">
            STUDENT REGISTRATION
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Create Student Account
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
            Register independently to access eligible KGS examinations and your
            published marks.
          </p>
          <div className="mt-4 p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 flex flex-col gap-1 text-xs sm:text-sm">
            <strong className="font-bold text-blue-950">What happens next?</strong>
            <span className="text-blue-800 font-medium leading-relaxed">
              We’ll generate your permanent Student ID and continue to secure
              email OTP verification.
            </span>
          </div>
        </section>

        {/* Right Section: Form Card */}
        <form
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 sm:p-8 flex flex-col gap-6"
          onSubmit={submit}
          noValidate
        >
          <div>
            <h2 className="text-xl font-bold text-slate-900">Your details</h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Fields marked <b className="text-red-500">*</b> are required.
            </p>
          </div>

          {serverError && (
            <div
              className="p-3.5 px-4 text-xs sm:text-sm font-semibold rounded-xl border border-red-200/80 bg-red-50 text-red-800"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Full Name <b className="text-red-500">*</b>
              <input
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="e.g. Rahul Kumar"
                autoComplete="name"
                aria-invalid={Boolean(errors.fullName)}
                className={`h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                  errors.fullName
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {errors.fullName && (
                <small className="text-xs font-medium text-red-600 mt-0.5">
                  {errors.fullName}
                </small>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Email Address <b className="text-red-500">*</b>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="e.g. rahul@gmail.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                className={`h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {errors.email && (
                <small className="text-xs font-medium text-red-600 mt-0.5">
                  {errors.email}
                </small>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Phone Number <span className="font-normal text-slate-400">(optional)</span>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) =>
                  update(
                    "phone",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                placeholder="10-digit mobile number"
                autoComplete="tel"
                aria-invalid={Boolean(errors.phone)}
                className={`h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                  errors.phone
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {errors.phone && (
                <small className="text-xs font-medium text-red-600 mt-0.5">
                  {errors.phone}
                </small>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Institution <span className="font-normal text-slate-400">(optional)</span>
              <input
                value={form.college}
                onChange={(e) => update("college", e.target.value)}
                placeholder="e.g. ABC Engineering College"
                autoComplete="organization"
                aria-invalid={Boolean(errors.college)}
                className={`h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                  errors.college
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {errors.college && (
                <small className="text-xs font-medium text-red-600 mt-0.5">
                  {errors.college}
                </small>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Branch <span className="font-normal text-slate-400">(optional)</span>
              <input
                value={form.branch}
                onChange={(e) => update("branch", e.target.value)}
                placeholder="e.g. Computer Science"
                aria-invalid={Boolean(errors.branch)}
                className={`h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${
                  errors.branch
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              />
              {errors.branch && (
                <small className="text-xs font-medium text-red-600 mt-0.5">
                  {errors.branch}
                </small>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
              Pass-out Year <span className="font-normal text-slate-400">(optional)</span>
              <select
                value={form.passOutYear}
                onChange={(e) => update("passOutYear", e.target.value)}
                aria-invalid={Boolean(errors.passOutYear)}
                className={`h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 focus:outline-none focus:ring-2 transition-all shadow-sm cursor-pointer ${
                  errors.passOutYear
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                }`}
              >
                <option value="">Select year</option>
                {Array.from(
                  { length: 21 },
                  (_, i) => new Date().getFullYear() - 10 + i,
                ).map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
              {errors.passOutYear && (
                <small className="text-xs font-medium text-red-600 mt-0.5">
                  {errors.passOutYear}
                </small>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-700 font-medium">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.privacyAccepted}
                onChange={(e) => update("privacyAccepted", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer flex-shrink-0"
              />
              <span className="flex-1">
                I acknowledge the{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Privacy Policy
                </a>
                . <b className="text-red-500">*</b>
                {errors.privacyAccepted && (
                  <small className="block text-xs font-medium text-red-600 mt-0.5">
                    {errors.privacyAccepted}
                  </small>
                )}
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.monitoringAccepted}
                onChange={(e) =>
                  update("monitoringAccepted", e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer flex-shrink-0"
              />
              <span className="flex-1">
                I acknowledge the{" "}
                <a
                  href="/monitoring-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Examination Monitoring Policy
                </a>
                . <b className="text-red-500">*</b>
                {errors.monitoringAccepted && (
                  <small className="block text-xs font-medium text-red-600 mt-0.5">
                    {errors.monitoringAccepted}
                  </small>
                )}
              </span>
            </label>
          </div>

          <button
            className="h-11 w-full px-5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-blue-500/20 border-none"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating account..." : "Create Student Account"}
          </button>

          <p className="text-xs text-center text-slate-500 font-medium">
            Your information is used to create and secure your examination
            account.
          </p>
        </form>
      </main>
    </div>
  )
}
