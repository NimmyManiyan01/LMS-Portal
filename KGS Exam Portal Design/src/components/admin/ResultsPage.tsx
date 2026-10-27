import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import { API_BASE_URL, authFetch } from "../../api";

type Props = { PageHead: ComponentType<any> };

export function ResultsPage({ PageHead }: Props) {
  const [data, setData] = useState<any>({ rows: [], exams: [], colleges: [], counts: {} });
  const [examId, setExamId] = useState("");
  const [college, setCollege] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/results${examId ? `?examId=${encodeURIComponent(examId)}` : ""}`, {}, true);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load results.");
      setData(payload);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load results."); }
    finally { setLoading(false); }
  }, [examId]);
  useEffect(() => { void load(); }, [load]);
  const rows = useMemo(() => data.rows.filter((row: any) => {
    const haystack = `${row.student?.studentId || ""} ${row.student?.fullName || ""} ${row.student?.email || ""} ${row.exam?.title || ""} ${row.exam?.code || ""}`.toLowerCase();
    return (!college || row.student?.college === college) && (!search.trim() || haystack.includes(search.trim().toLowerCase()));
  }), [data.rows, college, search]);
  return <>
    <PageHead eyebrow="ADMINISTRATION" title="Results" subtitle="Review finalized examination results and release statuses." />
    <section className="kpi-grid results-kpis">
      {[["Assigned students", data.counts.assignedStudents || 0], ["Submitted attempts", data.counts.submittedAttempts || 0], ["Pending evaluations", data.counts.pendingEvaluations || 0], ["Awaiting release", data.counts.awaitingRelease || 0], ["Released results", data.counts.released || 0]].map(([label, value]) => <article className="kpi" key={String(label)}><small>{label}</small><strong>{value}</strong></article>)}
    </section>
    <div className="student-filters results-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, ID, email, or examination" /><select value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">All examinations</option>{data.exams.map((exam: any) => <option key={exam.id} value={exam.id}>{exam.title} ({exam.code})</option>)}</select><select value={college} onChange={(event) => setCollege(event.target.value)}><option value="">All colleges</option>{data.colleges.map((name: string) => <option key={name}>{name}</option>)}</select><button className="secondary" onClick={() => void load()}>Refresh</button></div>
    <div className="panel student-table-panel">
      {loading ? <div className="dashboard-empty">Loading results...</div> : error ? <div className="dashboard-empty"><p>{error}</p><button className="secondary" onClick={() => void load()}>Retry</button></div> : !rows.length ? <div className="dashboard-empty"><h3>No finalized results found</h3><p>Results will appear here after an attempt is finalized.</p></div> : <div className="table-scroll"><table className="student-table"><thead><tr><th>Student</th><th>College</th><th>Examination</th><th>Marks</th><th>Submitted</th><th>Evaluation</th><th>Release</th></tr></thead><tbody>{rows.map((row: any) => <tr key={row.id}><td><strong>{row.student?.studentId || "—"}</strong><small>{row.student?.fullName || "Unknown student"}<br />{row.student?.email || "—"}</small></td><td>{row.student?.college || "College Not Specified"}</td><td>{row.exam?.title || "—"}<small>{row.exam?.code || "—"}</small></td><td><strong>{row.marksScored} / {row.maximumMarks}</strong></td><td>{row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "—"}</td><td><span className="status-pill active">{row.evaluationStatus}</span></td><td><span className={`status-pill ${row.releaseStatus === "RELEASED" ? "active" : "inactive"}`}>{row.releaseStatus === "RELEASED" ? "RELEASED" : "AWAITING RELEASE"}</span></td></tr>)}</tbody></table></div>}
      <div className="pagination"><span>{rows.length} results</span></div>
    </div>
  </>;
}
