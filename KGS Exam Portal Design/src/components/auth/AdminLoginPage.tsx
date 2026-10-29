import { useState } from "react"
import { API_BASE_URL, setAuthToken } from "../../api"

interface Props {
  onBackToLanding: () => void
  onAuthenticated: (user: { email: string role: string }) => void
}

export function AdminLoginPage({ onBackToLanding, onAuthenticated }: Props) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok)
        throw new Error(
          (await response.json().catch(() => null))?.error ||
            "Administrator authentication failed.",
        )
      const data = await response.json()
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
          <label
            className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-slate-600"
            htmlFor="admin-password"
          >
            PASSWORD
            <div className="relative">
              <input
                id="admin-password"
                className="h-10 w-full rounded-md border border-slate-300 px-3 pr-14 text-sm font-normal tracking-normal text-slate-900 outline-none transition focus:border-[#1f4f8f] focus:ring-4 focus:ring-blue-100"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[10px] font-bold text-[#1f4f8f] hover:bg-blue-50" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
          </label>
          <button
            className="mt-2 h-11 rounded-md bg-[#1f4f8f] px-4 text-sm font-semibold text-white transition hover:bg-[#174275] disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Administrator Login"}
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
