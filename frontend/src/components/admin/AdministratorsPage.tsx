import { useCallback, useEffect, useState, type ComponentType, type FormEvent } from "react"
import { API_BASE_URL, authFetch } from "../../api"
import { AdminFloatingSidebar } from "../../App"

type Props = {
  PageHead: ComponentType<any>
  active?: string
  onNav?: (v: string) => void
  adminUser?: { email: string; role: string } | null
  onLogout?: () => void
}

export function AdministratorsPage({
  PageHead,
  active = "Administrators",
  onNav = () => {},
  adminUser = null,
  onLogout = () => {},
}: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [administrators, setAdministrators] = useState<any[]>([])
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/administrators`, {}, true)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Unable to load administrators.")
      setAdministrators(payload.administrators || [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load administrators.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const addAdministrator = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim() || saving) return
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/administrators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }, true)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || "Unable to add administrator.")
      setEmail("")
      setNotice(`${payload.administrator.email} now has administrator access and can sign in using an email OTP.`)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to add administrator.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full max-w-full bg-[#F6F2E6] text-[#1E3A34] font-sans overflow-x-hidden p-4 sm:p-6 lg:p-8">
      {/* Continuous Full-Page Atmospheric Background Ambient Lighting Blobs */}
      <div className="fixed -top-32 -left-32 w-[700px] h-[700px] rounded-full bg-[#00C4DF]/30 blur-[150px] pointer-events-none z-0" />
      <div className="fixed top-1/4 -right-24 w-[650px] h-[650px] rounded-full bg-[#00D084]/30 blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/3 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#FFB800]/28 blur-[150px] pointer-events-none z-0" />
      <div className="fixed -bottom-40 right-10 w-[700px] h-[700px] rounded-full bg-[#FF7A59]/28 blur-[160px] pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/20 pointer-events-none z-0" />

      {/* Floating Vertical Glass Sidebar */}
      <AdminFloatingSidebar
        active={active}
        onNav={onNav}
        adminUser={adminUser}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Page Content Wrapper */}
      <div
        className={`relative z-10 w-full max-w-[1550px] mx-auto space-y-6 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:pl-24" : "lg:pl-68"
        }`}
      >

        {/* Hero Header Glass Card matching Admin Overview */}
        <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)] p-6 sm:p-7">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00C4DF] via-[#00D084] via-[#FFB800] to-[#FF7A59]" />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#00D084]/20 text-[#057A55] text-[10px] font-black uppercase tracking-widest border border-[#00D084]/30">
                Flux Suite
              </span>
              <span className="text-xs font-bold text-[#1E3A34]/80">
                Access Control
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A34] tracking-tight leading-tight m-0">
              Administrators
            </h2>
            <p className="text-xs sm:text-sm text-[#057A55] font-bold m-0 leading-relaxed max-w-xl">
              Grant trusted personnel administrator portal access and manage operational permissions.
            </p>
          </div>
        </div>

        {/* Add Administrator Form Glass Card */}
        <form onSubmit={addAdministrator} className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/80 p-6 shadow-[0_10px_30px_-5px_rgba(30,58,52,0.08)]">
          <label htmlFor="new-admin-email" className="text-sm font-black text-[#1E3A34]">
            New Administrator Email
          </label>
          <p className="mt-1 text-xs font-bold text-[#057A55]">
            The new administrator can request an OTP from the Admin Login page immediately after being added.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              id="new-admin-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="e.g. admin@kaizentrix.local"
              className="h-11 flex-1 rounded-2xl border border-slate-200/80 bg-white/90 px-4 text-xs sm:text-sm text-[#1E3A34] outline-none focus:border-[#00D084] focus:ring-4 focus:ring-[#00D084]/20 shadow-sm"
            />
            <button
              disabled={saving}
              className="h-11 px-6 rounded-2xl border-0 bg-[#176B58] text-xs sm:text-sm font-black text-white shadow-md shadow-[#176B58]/20 hover:bg-[#125445] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              {saving ? "Adding…" : "Add Administrator"}
            </button>
          </div>
          {notice && <p className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-500/15 p-3.5 text-xs font-extrabold text-emerald-900 shadow-sm">{notice}</p>}
          {error && <p className="mt-4 rounded-2xl border border-rose-300 bg-rose-500/15 p-3.5 text-xs font-extrabold text-rose-900 shadow-sm" role="alert">{error}</p>}
        </form>

        {/* Authorized Administrators Glass Table */}
        <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/90 shadow-[0_12px_40px_-10px_rgba(30,58,52,0.12)]">
          <div className="border-b border-slate-100 bg-[#1E3A34]/5 px-6 py-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#1E3A34] m-0">Authorized Administrators</h3>
          </div>
          {loading ? (
            <p className="p-10 text-center text-xs sm:text-sm font-bold text-[#057A55]">Loading administrators…</p>
          ) : (
            <div className="divide-y divide-slate-100/80">
              {administrators.map((administrator) => (
                <div key={administrator.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#00D084]/5 transition-colors">
                  <div>
                    <strong className="block text-sm font-bold text-[#1E3A34]">{administrator.email}</strong>
                    <span className="text-xs font-medium text-slate-500">Added {new Date(administrator.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${administrator.active ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                    {administrator.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
