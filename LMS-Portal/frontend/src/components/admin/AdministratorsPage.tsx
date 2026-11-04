import { useCallback, useEffect, useState, type ComponentType, type FormEvent } from "react"
import { API_BASE_URL, authFetch } from "../../api"

type Props = { PageHead: ComponentType<any> }

export function AdministratorsPage({ PageHead }: Props) {
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
    <div className="space-y-6">
      <PageHead title="Administrators" subtitle="Grant trusted users the same administrator portal access" />
      <form onSubmit={addAdministrator} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <label htmlFor="new-admin-email" className="text-sm font-bold text-slate-900">New administrator email</label>
        <p className="mt-1 text-xs font-medium text-slate-500">The new administrator can request an OTP from the Admin Login page immediately after being added.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input id="new-admin-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" className="h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <button disabled={saving} className="h-11 cursor-pointer rounded-xl border-0 bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Adding…" : "Add Administrator"}</button>
        </div>
        {notice && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{notice}</p>}
        {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h3 className="font-bold text-slate-900">Authorized administrators</h3></div>
        {loading ? <p className="p-8 text-center text-sm font-semibold text-slate-500">Loading administrators…</p> : (
          <div className="divide-y divide-slate-100">
            {administrators.map((administrator) => (
              <div key={administrator.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div><strong className="block text-sm text-slate-900">{administrator.email}</strong><span className="text-xs text-slate-500">Added {new Date(administrator.createdAt).toLocaleDateString()}</span></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${administrator.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{administrator.active ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
