import { useState } from "react"
import { API_BASE_URL, setAuthToken } from "../../api"

interface Props {
  onBackToLanding: () => void
  onAuthenticated: (user: { email: string role: string }) => void
}

export function AdminLoginPage({ onBackToLanding, onAuthenticated }: Props) {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/${step === "EMAIL" ? "request-otp" : "verify-otp"}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step === "EMAIL" ? { email } : { email, otp }),
      })
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => null))?.error ||
            "Administrator authentication failed.",
        )
      const data = await response.json()
      if (step === "EMAIL") { setStep("OTP"); return }
      if (data.token) setAuthToken(data.token, true)
      onAuthenticated(data.user)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Administrator authentication failed.",
      )
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
        <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-[#0d2442] font-bold italic text-white">
              K
            </span>
            <span>
              <strong className="block text-sm tracking-wide text-[#0d2442]">
                KGS EXAM PORTAL
              </strong>
              <small className="mt-0.5 block text-[9px] tracking-[0.16em] text-slate-500">
                ADMINISTRATOR LOGIN
              </small>
            </span>
          </div>
          <button
            className="text-2xl leading-none text-slate-400 transition hover:text-slate-800"
            onClick={onBackToLanding}
            aria-label="Back to landing"
          >
            ×
          </button>
        </header>
        <form className="grid gap-4 px-6 py-6" onSubmit={submit}>
          <div>
            <h1 className="text-xl font-semibold text-[#0d2442]">
              Administrator Authentication
            </h1>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Sign in with an authorized KGS administrator account.
            </p>
          </div>
          {error && (
            <div
              className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
          <label
            className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-slate-600"
            htmlFor="admin-email"
          >
            EMAIL ADDRESS
            <input
              id="admin-email"
              className="h-10 rounded-md border border-slate-300 px-3 text-sm font-normal tracking-normal text-slate-900 outline-none transition focus:border-[#1f4f8f] focus:ring-4 focus:ring-blue-100"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
            />
          </label>
          {step === "OTP" && (<label
            className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-slate-600"
            htmlFor="admin-otp"
          >
            ONE-TIME PASSWORD
            <div className="relative">
              <input
                id="admin-otp"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-normal tracking-[0.3em] text-slate-900 outline-none transition focus:border-[#1f4f8f] focus:ring-4 focus:ring-blue-100"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                required
                autoComplete="one-time-code"
              />
            </div>
          </label>)}
          <button
            className="mt-2 h-11 rounded-md bg-[#1f4f8f] px-4 text-sm font-semibold text-white transition hover:bg-[#174275] disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={loading}
          >
            {loading ? "Sending..." : step === "EMAIL" ? "Send OTP" : "Verify OTP"}
          </button>
          <button
            type="button"
            className="text-center text-xs text-[#1f4f8f] underline underline-offset-4 hover:text-[#174275]"
            onClick={onBackToLanding}
          >
            Back to landing page
          </button>
        </form>
      </div>
    </div>
  )
}
