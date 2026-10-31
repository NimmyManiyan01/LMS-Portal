import { useEffect, useState, type ComponentType } from "react"
import { API_BASE_URL, authFetch } from "../../api"

type Props = { PageHead: ComponentType<any> }

export function FeedbackPage({ PageHead }: Props) {
  const [data, setData] = useState<any>({ rows: [], summary: { total: 0, average: 0 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/admin/feedback?limit=100`, {}, true)
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.error || "Unable to load feedback.")
        setData(payload)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load feedback.")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return (
    <div className="space-y-6">
      <PageHead title="Student Feedback" subtitle="Ratings and comments submitted after completed examinations" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Average rating</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{data.summary.average || "—"} <span className="text-amber-400">★</span></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total responses</span>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{data.summary.total}</div>
        </div>
      </div>
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">Loading feedback…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>
      ) : !data.rows.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">No feedback has been submitted yet.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Examination</th><th className="px-5 py-3">Rating</th><th className="px-5 py-3">Comment</th><th className="px-5 py-3">Submitted</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((row: any) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4"><strong className="block text-slate-900">{row.student?.fullName || "Student"}</strong><span className="text-xs text-slate-500">{row.student?.email || "—"}</span></td>
                    <td className="px-5 py-4"><strong className="block text-slate-900">{row.exam?.title || "Examination"}</strong><span className="text-xs text-slate-500">{row.exam?.code || "—"}</span></td>
                    <td className="px-5 py-4 font-bold text-amber-500">{"★".repeat(row.rating)}<span className="text-slate-200">{"★".repeat(5 - row.rating)}</span></td>
                    <td className="max-w-sm px-5 py-4 text-slate-600">{row.comment || <span className="text-slate-400">No comment</span>}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
