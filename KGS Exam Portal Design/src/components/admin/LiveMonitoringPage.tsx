import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, authFetch } from "../../api";

export function LiveMonitoringPage({ PageHead }: { PageHead: any }) {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [status, setStatus] = useState("IN_PROGRESS");
  const load = useCallback(async () => {
    try { setError(""); setLoading(true); const query = status ? `?status=${encodeURIComponent(status)}` : ""; const response = await authFetch(`${API_BASE_URL}/api/admin/monitoring/attempts${query}`, {}, true); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to load live monitoring."); setAttempts(data.attempts || []); setUpdatedAt(new Date()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load live monitoring."); } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [load]);
  const viewEvents = async (attempt: any) => { setSelected(attempt); const response = await authFetch(`${API_BASE_URL}/api/admin/monitoring/attempts/${attempt.attemptId}/events`, {}, true); const data = await response.json(); if (response.ok) setEvents(data.events || []); };
  return <div className="admin-monitoring-page"><PageHead eyebrow="ADMINISTRATION" title="Live monitoring" subtitle="Review active examination attempts and recorded integrity incidents." />
    {error && <div className="alert-inline error"><span>{error}</span><button className="secondary" onClick={() => void load()}>Retry</button></div>}
    <div className="panel monitoring-toolbar"><div><strong>{attempts.length} {status === "IN_PROGRESS" ? "active" : status.toLowerCase().replace("_", " ")} attempts</strong><span>{updatedAt ? `Last updated ${updatedAt.toLocaleTimeString()}` : "Updating…"}</span></div><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="IN_PROGRESS">Active</option><option value="AUTO_SUBMITTED">Auto-submitted</option><option value="SUBMITTED">Submitted</option><option value="TERMINATED">Terminated</option></select></label></div>
    {loading ? <div className="panel dashboard-empty">Loading attempts…</div> : attempts.length === 0 ? <div className="panel dashboard-empty">No {status === "IN_PROGRESS" ? "active" : status.toLowerCase().replace("_", " ")} attempts.</div> : <div className="panel table-wrap"><table><thead><tr><th>Examination</th><th>Student</th><th>Status</th><th>Answered</th><th>Incidents</th><th>Camera</th><th>Latest incident</th><th /></tr></thead><tbody>{attempts.map((attempt) => { const incidentCount = Object.values(attempt.integrityCounts || {}).reduce((sum: number, value: any) => sum + Number(value || 0), 0); return <tr key={attempt.attemptId}><td>{attempt.exam?.title}<small>{attempt.exam?.code}</small></td><td>{attempt.student?.fullName}<small>{attempt.student?.studentId}</small></td><td>{attempt.status}</td><td>{attempt.answeredCount}</td><td>{incidentCount}</td><td>{attempt.exam?.readinessRequirements?.camera ? "Required · health not reported" : "Not required"}</td><td>{attempt.latestIncident ? new Date(attempt.latestIncident.recordedAt).toLocaleString() : "None"}</td><td><button className="text-button" onClick={() => void viewEvents(attempt)}>View incidents</button></td></tr>; })}</tbody></table></div>}
    {selected && <div className="modal-backdrop"><div className="modal-card monitoring-events"><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className="paper-set-body"><h2>Incident timeline</h2><p>{selected.student?.fullName} · {selected.exam?.title}</p>{events.length === 0 ? <div className="dashboard-empty">No incidents recorded for this attempt.</div> : events.map((event) => <div className="monitoring-event" key={event.eventId}><strong>{event.eventType}</strong><span>{new Date(event.recordedAt).toLocaleString()}</span><small>Action: {event.action} · Attempt: {selected.attemptId}</small></div>)}</div><div className="modal-actions"><button className="secondary" onClick={() => setSelected(null)}>Close</button></div></div></div>}
  </div>;
}
