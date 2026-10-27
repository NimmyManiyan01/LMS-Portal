import { useEffect, useMemo, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function PaperSetsPage({ Icon, PageHead }: { Icon: any; PageHead: any }) {
  const [sets, setSets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [exams, setExams] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [filters, setFilters] = useState({ search: '', examId: '', status: '' });
  const [questionFilters, setQuestionFilters] = useState({ search: '', category: '', difficulty: '' });
  const [form, setForm] = useState<any>({ name: '', examId: '', description: '', durationMinutes: 30, passingMarks: 0, instructions: '', questionIds: [] });
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(''); const [examError, setExamError] = useState(''); const [errors, setErrors] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [paperResponse, examResponse, questionResponse] = await Promise.all([
        fetch(`${API}/api/admin/paper-sets?${new URLSearchParams(filters)}`, { credentials: 'include' }),
        fetch(`${API}/api/admin/exams`, { credentials: 'include' }),
        fetch(`${API}/api/admin/paper-sets/questions/eligible`, { credentials: 'include' }),
      ]);
      const paperData = await paperResponse.json(); const examData = await examResponse.json(); const questionData = await questionResponse.json();
      if (!paperResponse.ok) throw new Error(paperData.error || 'Unable to load paper sets.');
      setSets(paperData.paperSets || []); setStats(paperData.stats || {}); if (!examResponse.ok) setExamError(examData.error || 'Unable to load examinations.'); else { setExamError(''); setExams(examData.exams || []); } setQuestions(questionData.questions || []);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to load paper sets.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [filters.examId, filters.status]);

  const selectedQuestions = useMemo(() => questions.filter((question) => form.questionIds.includes(question.id)), [questions, form.questionIds]);
  const calculatedMarks = selectedQuestions.reduce((total, question) => total + Number(question.marks || 0), 0);
  const visibleQuestions = questions.filter((question) => (!questionFilters.search || `${question.questionId} ${question.questionText}`.toLowerCase().includes(questionFilters.search.toLowerCase())) && (!questionFilters.category || question.category === questionFilters.category) && (!questionFilters.difficulty || question.difficulty === questionFilters.difficulty));
  const categories = [...new Set(questions.map((question) => question.category).filter(Boolean))];

  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Paper set name is required.';
    if (!form.examId) nextErrors.examId = 'Select an examination.';
    if (!Number(form.durationMinutes) || Number(form.durationMinutes) <= 0) nextErrors.durationMinutes = 'Duration must be greater than zero.';
    if (Number(form.passingMarks) > calculatedMarks) nextErrors.passingMarks = 'Passing marks cannot exceed total selected marks.';
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/admin/paper-sets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...form, totalMarks: calculatedMarks, instructions: form.instructions ? [form.instructions] : [], questionIds: form.questionIds }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to save paper set.');
      setMessage('Paper set saved as draft.'); setOpen(false); await load();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to save paper set.'); }
    finally { setSaving(false); }
  };
  const publish = async (id: string) => { if (!window.confirm('Publish this paper set?')) return; const response = await fetch(`${API}/api/admin/paper-sets/${id}/publish`, { method: 'POST', credentials: 'include' }); const data = await response.json(); setMessage(response.ok ? 'Paper set published.' : data.error || 'Unable to publish paper set.'); if (response.ok) await load(); };

  const updateForm = (key: string, value: any) => { setForm((current: any) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); };
  return <>
    <PageHead admin student={null} title="Paper Sets" description="Build, validate, and publish examination paper sets." showCreateAction={false}/>
    <div className="student-management-head"><div><h2>Paper Sets</h2><p>Manage examination papers using active Question Bank records.</p></div><button className="primary" onClick={() => { setOpen(true); setErrors({}); }}><Icon name="plus"/>Create Paper Set</button></div>
    <section className="kpi-grid"><article className="kpi"><small>Total Paper Sets</small><strong>{stats.total || 0}</strong></article><article className="kpi"><small>Draft Paper Sets</small><strong>{stats.draft || 0}</strong></article><article className="kpi"><small>Published Paper Sets</small><strong>{stats.published || 0}</strong></article><article className="kpi"><small>Total Questions Assigned</small><strong>{stats.questions || 0}</strong></article></section>
    {message && <div className="import-notice error">{message}</div>}
    <div className="student-filters"><input placeholder="Search paper set name" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} onKeyDown={(event) => event.key === 'Enter' && void load()}/><select value={filters.examId} onChange={(event) => setFilters({ ...filters, examId: event.target.value })}><option value="">All examinations</option>{exams.map((exam) => <option key={exam._id || exam.id} value={exam._id || exam.id}>{exam.title || exam.name}</option>)}</select><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select><button className="secondary" onClick={() => void load()}>Search</button></div>
    <div className="panel student-table-panel">{loading ? <div className="dashboard-empty">Loading paper sets...</div> : sets.length === 0 ? <div className="dashboard-empty"><h3>No paper sets created yet</h3><p>Create a paper set to begin assigning active questions.</p><button className="primary" onClick={() => setOpen(true)}><Icon name="plus"/>Create Paper Set</button></div> : <div className="table-scroll"><table className="student-table"><thead><tr><th>ID</th><th>Name</th><th>Examination</th><th>Questions</th><th>Marks</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{sets.map((set) => <tr key={set.id}><td>{set.code}</td><td>{set.name || set.code}</td><td>{set.exam?.title || '—'}</td><td>{set.questionCount}</td><td>{set.totalMarks}</td><td>{set.status}</td><td>{set.createdAt ? new Date(set.createdAt).toLocaleDateString() : '—'}</td><td><button className="text-button" onClick={() => set.status === 'DRAFT' && void publish(set.id)}>{set.status === 'DRAFT' ? 'Publish' : 'View'}</button></td></tr>)}</tbody></table></div>}</div>
    {open && <div className="modal-backdrop"><div className="modal-card paper-set-modal"><button className="modal-close" onClick={() => setOpen(false)}>×</button><div className="paper-set-body"><h2>Create Paper Set</h2><label>Paper Set Name<input value={form.name} onChange={(event) => updateForm('name', event.target.value)}/>{errors.name && <small className="field-error">{errors.name}</small>}</label><label>Examination<select value={form.examId} onChange={(event) => updateForm('examId', event.target.value)}><option value="">Select examination</option>{exams.map((exam) => <option key={exam._id || exam.id} value={exam._id || exam.id}>{exam.title || exam.name}</option>)}</select>{errors.examId && <small className="field-error">{errors.examId}</small>}</label><label>Description<textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)}/></label><div className="form-grid"><label>Duration (minutes)<input type="number" min="1" value={form.durationMinutes} onChange={(event) => updateForm('durationMinutes', event.target.value)}/>{errors.durationMinutes && <small className="field-error">{errors.durationMinutes}</small>}</label><label>Total Marks<input readOnly value={calculatedMarks}/></label><label>Passing Marks<input type="number" min="0" value={form.passingMarks} onChange={(event) => updateForm('passingMarks', event.target.value)}/>{errors.passingMarks && <small className="field-error">{errors.passingMarks}</small>}</label></div><label>Instructions<textarea value={form.instructions} onChange={(event) => updateForm('instructions', event.target.value)}/></label><div className="paper-question-heading"><h3>Select Active Questions</h3><span>{selectedQuestions.length} selected · {calculatedMarks} marks</span></div><div className="student-filters paper-question-filters"><input placeholder="Search question ID or text" value={questionFilters.search} onChange={(event) => setQuestionFilters({ ...questionFilters, search: event.target.value })}/><select value={questionFilters.category} onChange={(event) => setQuestionFilters({ ...questionFilters, category: event.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><select value={questionFilters.difficulty} onChange={(event) => setQuestionFilters({ ...questionFilters, difficulty: event.target.value })}><option value="">All difficulty</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></div><div className="paper-question-list">{visibleQuestions.map((question) => <label key={question.id}><input type="checkbox" checked={form.questionIds.includes(question.id)} onChange={(event) => updateForm('questionIds', event.target.checked ? [...form.questionIds, question.id] : form.questionIds.filter((id: string) => id !== question.id))}/><span>{question.questionText}<small>{question.category} · {question.difficulty} · {question.marks} marks</small></span></label>)}</div></div><div className="modal-actions"><button className="secondary" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={saving} onClick={() => void save()}>{saving ? 'Saving...' : 'Save Draft'}</button></div></div></div>}
  </>;
}
