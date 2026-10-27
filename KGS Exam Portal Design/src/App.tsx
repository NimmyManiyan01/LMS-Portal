import { useEffect, useRef, useState } from 'react';
import { Exam, AnswerState, StudentProfile } from './types';
import { API_BASE_URL, authFetch, clearAuthToken } from './api';
import { SystemCheckModal } from './components/student/SystemCheckModal';
import { ExamInstructionsModal } from './components/student/ExamInstructionsModal';
import { ExamPlayer } from './components/student/ExamPlayer';
import { SubmissionModal } from './components/student/SubmissionModal';
import { ResultsView } from './components/student/ResultsView';
import { SubmissionConfirmation } from './components/student/SubmissionConfirmation';
import { LandingPage } from './components/public/LandingPage';
import { RegistrationPage } from './components/auth/RegistrationPage';
import { StudentLoginPage } from './components/auth/StudentLoginPage';
import { AdminLoginPage } from './components/auth/AdminLoginPage';
import { StudentExaminations } from './components/student/StudentExaminations';
import { QuestionBankPage } from './components/admin/QuestionBankPage';
import { PaperSetsPage } from './components/admin/PaperSetsPage';
import { ExaminationsPage } from './components/admin/ExaminationsPage';

type IconName =
  | 'grid' | 'book' | 'result' | 'shield' | 'help' | 'bell' | 'chevron'
  | 'clock' | 'calendar' | 'file' | 'check' | 'arrow' | 'users' | 'pulse'
  | 'review' | 'download' | 'settings' | 'search' | 'plus' | 'more' | 'menu';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></>,
    result: <><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"/><path d="M12 18h.01"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    pulse: <><path d="M3 12h4l2-6 4 12 2-6h6"/></>,
    review: <><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4H3a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4V3a1.7 1.7 0 0 0 1.1 1.6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.36.37.7.6 1 .27.3.63.44 1 .4h.1v4H21a1.7 1.7 0 0 0-1.6.6Z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const studentNav = [
  ['grid', 'Overview'], ['book', 'My examinations'], ['result', 'Results'],
  ['shield', 'System check'], ['help', 'Help & support'],
] as const;

const adminNav = [
  ['grid', 'Overview'], ['book', 'Examinations'], ['review', 'Question bank'],
  ['file', 'Paper sets'], ['users', 'Students'], ['pulse', 'Live monitoring'],
  ['result', 'Results'], ['download', 'Reports'], ['shield', 'Security & audit'],
] as const;

async function readApiJson(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`API returned ${response.status} ${response.statusText || 'an invalid response'} instead of JSON.`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('The administrator API returned malformed JSON.');
  }
}

function Brand() {
  return <div className="brand"><div className="brand-mark"><span>K</span></div><div><strong>KGS</strong><small>EXAM PORTAL</small></div></div>;
}

function Sidebar({ admin, active, onNav }: { admin: boolean; active: string; onNav: (v: string) => void }) {
  const nav = admin ? adminNav : studentNav;
  const [activeAttempts, setActiveAttempts] = useState<number | null>(null);
  useEffect(() => {
    if (!admin) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/admin/dashboard?range=month`, {}, true);
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled) setActiveAttempts(Number(payload?.stats?.activeAttempts || 0));
      } catch { /* The dashboard remains usable when the count cannot be refreshed. */ }
    };
    void load();
    const timer = window.setInterval(load, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [admin]);
  return (
    <aside className="sidebar">
      <Brand />
      <div className="portal-label">{admin ? 'ADMIN PORTAL' : 'STUDENT PORTAL'}</div>
      <nav>
        {nav.map(([icon, label]) => (
          <button key={label} className={active === label ? 'nav-item active' : 'nav-item'} onClick={() => onNav(label)}>
            <Icon name={icon}/><span>{label}</span>{label === 'Live monitoring' && activeAttempts !== null && activeAttempts > 0 && <i>{activeAttempts}</i>}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="secure">
          <Icon name="shield"/>
          <div><b>Examination security</b><span>Monitoring follows the configured policy</span></div>
        </div>
        <small>© 2025 KGS Institute</small>
      </div>
    </aside>
  );
}

function Topbar({
  admin,
  setAdmin,
  student,
  adminUser,
  onOpenLogin,
  openMenu,
  onLogout,
}: {
  admin: boolean;
  setAdmin: (v: boolean) => void;
  student: StudentProfile | null;
  adminUser: { email: string; role: string } | null;
  onOpenLogin: () => void;
  openMenu: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={openMenu} aria-label="Open menu"><Icon name="menu"/></button>
      <div className="environment">
        <span className="status-dot"></span><span>All systems operational</span>
      </div>
      <div className="top-actions">
        <button className="icon-button notify" aria-label="Notifications"><Icon name="bell"/><span></span></button>
        {admin && adminUser ? (
          <button className="profile profile-button" onClick={onLogout} aria-label="Log out administrator"><div className="avatar">AD</div><div><b>{adminUser.email}</b><small>Administrator</small></div><Icon name="chevron" size={14}/><span className="profile-logout">Log out</span></button>
        ) : student ? (
          <button className="profile profile-button" onClick={onLogout} aria-label="Log out">
            <div className="avatar">{admin ? 'AM' : 'AK'}</div>
            <div><b>{admin ? (adminUser?.email || 'Administrator') : student.fullName}</b><small>{admin ? 'Administrator' : student.registrationId}</small></div>
            <Icon name="chevron" size={14}/>
            <span className="profile-logout">Log out</span>
          </button>
        ) : (
          <button className="primary mini" onClick={onOpenLogin}>Sign In (OTP)</button>
        )}
      </div>
    </header>
  );
}

function PageHead({ admin, student, title, description, showCreateAction = true }: { admin: boolean; student: StudentProfile | null; title?: string; description?: string; showCreateAction?: boolean }) {
  const current = new Date(); const greeting = current.getHours() < 12 ? 'Good morning' : current.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const localDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(current).toUpperCase();
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{admin ? 'ADMINISTRATION' : localDate}</div>
        <h1>{title || (admin ? 'Examination overview' : `${greeting}, ${student?.fullName || 'Student'}`)}</h1>
        <p>{admin ? 'Monitor operations and manage the examination lifecycle.' : 'Here’s what’s happening with your examinations.'}</p>
      </div>
      {admin && showCreateAction ? (
        <button className="primary"><Icon name="plus"/>Create examination</button>
      ) : admin ? null : (
        <div className="student-id">
          <small>STUDENT ID</small>
          <b>{student?.registrationId || '—'}</b>
          <span><Icon name="check" size={12}/> Verified</span>
        </div>
      )}
    </div>
  );
}

function Meta({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <div className="meta"><Icon name={icon}/><div><small>{label}</small><b>{value}</b></div></div>;
}

export default function App() {
  const publicPath = window.location.pathname;
  const [entryRoute, setEntryRoute] = useState(publicPath);
  const [admin, setAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
  const [active, setActive] = useState('Overview');
  const [menu, setMenu] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [dashboardExams, setDashboardExams] = useState<Exam[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [examActionError, setExamActionError] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState({ available: 0, upcoming: 0, inProgress: 0, completed: 0, resultsPending: 0 });
  const [loginEmail, setLoginEmail] = useState('');

  // Flow State for Exam Attempt
  const [viewState, setViewState] = useState<'DASHBOARD' | 'INSTRUCTIONS' | 'SYSTEM_CHECK' | 'EXAM_PLAYER' | 'SUBMISSION_CONFIRM' | 'SUBMISSION_SUCCESS' | 'RESULTS'>('DASHBOARD');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [tab, setTab] = useState('Eligible');
  const initialStatusTabApplied = useRef(false);
  const [lastAnswers, setLastAnswers] = useState<Record<string, AnswerState>>({});
  const [examQuestions, setExamQuestions] = useState<import('./types').Question[]>([]);

  useEffect(() => {
    if (entryRoute === '/admin/dashboard' && !admin) {
      authFetch(`${API_BASE_URL}/api/auth/admin/me`, {}, true)
        .then(async (response) => {
          if (!response.ok) throw new Error();
          const data = await response.json();
          setAdminUser(data.user);
          setAdmin(true);
        })
        .catch(() => navigateEntry('/admin'));
      return;
    }
    if (entryRoute !== '/dashboard') return;
    const loadDashboard = async () => {
      setDashboardLoading(true); setDashboardError('');
      try {
        const api = API_BASE_URL;
        const [meResponse, dashboardResponse] = await Promise.all([
          authFetch(`${api}/api/auth/me`, { cache: 'no-store' }),
          authFetch(`${api}/api/student/dashboard`, { cache: 'no-store' })
        ]);
        if (meResponse.status === 401 || dashboardResponse.status === 401) {
          clearAuthToken();
          navigateEntry('/login');
          return;
        }
        if (!meResponse.ok || !dashboardResponse.ok) throw new Error('Unable to load your dashboard.');
        const me = await meResponse.json(); const dashboard = await dashboardResponse.json();
        setStudent(me.user); setDashboardSummary(dashboard.summary || { available: 0, upcoming: 0, inProgress: 0, completed: 0, resultsPending: 0 });
        const mappedExams = (dashboard.exams || []).map((exam: any) => ({ ...exam, id: String(exam.id || exam._id), examCode: exam.code || exam.examCode || String(exam.id || exam._id), subtitle: exam.subtitle || 'KGS examination', scheduledDate: exam.scheduledAt ? new Date(exam.scheduledAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Date to be announced', totalQuestions: exam.totalQuestions ?? exam.questionCount ?? exam.questionsCount ?? 0, totalMarks: exam.totalMarks ?? exam.maximumMarks ?? 0, durationMinutes: exam.durationMinutes ?? 0, negativeMarking: exam.negativeMarking ?? 0, markingScheme: exam.markingScheme, maxAttempts: exam.maxAttempts ?? 1, activeAttempt: exam.activeAttempt || null, integrityProfile: exam.integrityProfile, integrityRules: exam.integrityRules, instructions: exam.instructions || [], sections: exam.sections || [] }));
        setDashboardExams(mappedExams);
        if (!initialStatusTabApplied.current && mappedExams.some((exam: any) => exam.status === 'IN_PROGRESS')) { setTab('In Progress'); initialStatusTabApplied.current = true; }
      } catch (error) { setDashboardError(error instanceof Error ? error.message : 'Unable to load your dashboard.'); } finally { setDashboardLoading(false); }
    };
    void loadDashboard();
  }, [entryRoute]);

  const switchPortal = (v: boolean) => {
    setAdmin(v);
    setActive('Overview');
    setViewState('DASHBOARD');
  };

  const navigateEntry = (path: string) => {
    window.history.pushState({}, '', path);
    setEntryRoute(path);
  };

  const handleLogout = async () => {
    try { await authFetch(`${API_BASE_URL}${admin ? '/api/auth/admin/logout' : '/api/auth/logout'}`, { method: 'POST' }, admin); } finally {
      clearAuthToken(); setStudent(null); setAdmin(false); setAdminUser(null); setViewState('DASHBOARD'); navigateEntry('/');
    }
  };

  if (entryRoute === '/') {
    return <LandingPage onStudentLogin={() => navigateEntry('/login')} onRegister={() => navigateEntry('/register')} onAdminLogin={() => navigateEntry('/admin')} />;
  }

  if (entryRoute === '/login' || entryRoute === '/register' || entryRoute === '/admin') {
    if (entryRoute === '/register') return <RegistrationPage onBackToLogin={() => navigateEntry('/login')} onRegistered={(email) => { setLoginEmail(email); navigateEntry('/login'); }} />;
    if (entryRoute === '/login') return <StudentLoginPage initialEmail={loginEmail} onBackToLanding={() => navigateEntry('/')} onRegister={() => navigateEntry('/register')} onAuthenticated={(stu) => { setStudent(stu); navigateEntry('/dashboard'); }} />;
    if (entryRoute === '/admin') return <AdminLoginPage onBackToLanding={() => navigateEntry('/')} onAuthenticated={(user) => { setAdminUser(user); setAdmin(true); navigateEntry('/admin/dashboard'); }} />;
  }

  if (entryRoute === '/admin/dashboard' && !admin) return <div className="dashboard-state"><h2>Checking administrator session...</h2></div>;
  if (entryRoute === '/dashboard' && dashboardLoading) return <div className="dashboard-state"><h2>Loading your dashboard...</h2><p>Fetching your eligible examinations.</p></div>;
  if (entryRoute === '/dashboard' && dashboardError) return <div className="dashboard-state"><h2>Unable to load dashboard</h2><p>{dashboardError}</p><button className="primary" onClick={() => setEntryRoute('/dashboard')}>Retry</button></div>;

  const handleStartExam = (exam: Exam) => {
    setSelectedExam(exam);
    if ((exam as Exam & { status?: string }).status === 'IN_PROGRESS') { void handleProceedToExam(exam); return; }
    setViewState('INSTRUCTIONS');
  };

  const handleProceedToExam = async (examOverride?: Exam) => {
    const exam = examOverride || selectedExam;
    if (!exam) return;
    setExamActionError('');
    const base = API_BASE_URL;
    const activeAttempt = (exam as Exam & { activeAttempt?: { attemptId?: string } }).activeAttempt;
    let attemptId = activeAttempt?.attemptId;
    try {
      if (!attemptId) {
        if (!exam.id) throw new Error('This examination has no valid identifier.');
        const start = await authFetch(`${base}/api/exams/${exam.id}/start`, { method: 'POST' });
        if (!start.ok) throw new Error((await start.json().catch(() => null))?.error || 'Unable to resume this examination.');
        const attempt = await start.json();
        attemptId = attempt.attemptId;
      }
      if (!attemptId) throw new Error('The active examination attempt could not be identified.');
      const response = await authFetch(`${base}/api/attempts/${attemptId}/questions`);
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Unable to load the examination questions.');
      const data = await response.json();
    const normalizedQuestions = (data.questions || []).map((question: any, index: number) => ({
      ...question,
      id: String(question.id || question._id),
      questionText: question.questionText || question.text || question.question || '',
      sectionName: question.sectionName || question.sectionTitle || question.section || 'General',
      questionNumber: question.questionNumber || index + 1,
      options: (question.options || question.choices || []).map((option: any, optionIndex: number) => typeof option === 'string' ? { id: String.fromCharCode(65 + optionIndex), text: option } : { id: String(option.id || option.value || String.fromCharCode(65 + optionIndex)), text: option.text || option.label || option.value || '' }),
    }));
      if (!normalizedQuestions.length || normalizedQuestions.some((question: any) => !question.questionText.trim() || !question.options.length || question.options.some((option: any) => !option.text.trim()))) throw new Error('The assigned examination questions are incomplete. Please retry or contact support.');
      setExamQuestions(normalizedQuestions);
      setViewState('EXAM_PLAYER');
    } catch (error) {
      setExamActionError(error instanceof Error ? error.message : 'Unable to open the examination.');
    }
  };

  const handleSubmitExamClick = (answers: Record<string, AnswerState>) => {
    setLastAnswers(answers);
    setViewState('SUBMISSION_CONFIRM');
  };

  const handleConfirmFinalSubmit = () => {
    setViewState('SUBMISSION_SUCCESS');
  };

  if (viewState === 'EXAM_PLAYER' && selectedExam) {
    return (
      <ExamPlayer
        exam={selectedExam}
        questions={examQuestions}
        candidateName={student?.fullName}
        onSubmitExam={handleSubmitExamClick}
      />
    );
  }

  if (viewState === 'RESULTS' && selectedExam) {
    return (
      <ResultsView
        exam={selectedExam}
        questions={examQuestions}
        answers={lastAnswers}
        onBackToDashboard={() => setViewState('DASHBOARD')}
      />
    );
  }

  if (viewState === 'SUBMISSION_SUCCESS' && selectedExam) {
    return <SubmissionConfirmation examTitle={selectedExam.title} submittedAt={new Date()} onBackToDashboard={() => setViewState('DASHBOARD')} />;
  }

  return (
    <div className="app">
      {viewState === 'SYSTEM_CHECK' && selectedExam && (
        <SystemCheckModal
          examTitle={selectedExam.title}
          examId={selectedExam.id}
          scheduledAt={(selectedExam as Exam & { scheduledAt?: string }).scheduledAt}
          closesAt={(selectedExam as Exam & { closesAt?: string }).closesAt}
          requirements={selectedExam.readinessRequirements}
          onClose={() => setViewState('DASHBOARD')}
          onProceedToExam={handleProceedToExam}
        />
      )}

      {viewState === 'INSTRUCTIONS' && (
        <ExamInstructionsModal
          exam={selectedExam}
          onClose={() => setViewState('DASHBOARD')}
          onContinue={() => setViewState('SYSTEM_CHECK')}
        />
      )}

      {viewState === 'SUBMISSION_CONFIRM' && (
        <SubmissionModal
          examTitle={selectedExam.title}
          questions={examQuestions}
          answers={lastAnswers}
          onClose={() => setViewState('EXAM_PLAYER')}
          onConfirmSubmit={handleConfirmFinalSubmit}
        />
      )}

      <div className={menu ? 'sidebar-shell open' : 'sidebar-shell'}>
        <Sidebar admin={admin} active={active} onNav={(v) => { setActive(v); setMenu(false); setViewState('DASHBOARD'); }} />
      </div>

      {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Close navigation"/>}

      <div className="workspace">
        <Topbar
          admin={admin}
          setAdmin={switchPortal}
          student={student}
          adminUser={adminUser}
          onOpenLogin={() => navigateEntry('/login')}
          openMenu={() => setMenu(true)}
          onLogout={handleLogout}
        />

        <main>
          {active === 'My examinations' && viewState === 'DASHBOARD' ? (
            <StudentExaminations onStartExam={handleStartExam} onViewMarks={(exam) => { setSelectedExam(exam); setViewState('RESULTS'); }} />
          ) : admin && active === 'Students' && viewState === 'DASHBOARD' ? (
            <AdminStudents />
          ) : admin && active === 'Examinations' && viewState === 'DASHBOARD' ? (
            <ExaminationsPage Icon={Icon} PageHead={PageHead} />
          ) : admin && active === 'Question bank' && viewState === 'DASHBOARD' ? (
            <QuestionBankPage Icon={Icon} PageHead={PageHead} />
          ) : admin && active === 'Paper sets' && viewState === 'DASHBOARD' ? (
            <PaperSetsPage Icon={Icon} PageHead={PageHead} />
          ) : active === 'Overview' && viewState === 'DASHBOARD' ? (
            admin ? (
              <AdminDashboard />
            ) : (
              <StudentDashboard
                student={student}
                exams={dashboardExams}
                summary={dashboardSummary}
                activeTab={tab}
                setTab={setTab}
                examActionError={examActionError}
                onStartExam={handleStartExam}
                onViewResults={() => {
                  setSelectedExam(dashboardExams[0]);
                  setViewState('RESULTS');
                }}
              />
            )
          ) : (
            <div className="placeholder panel">
              <Icon name={admin ? 'settings' : 'book'} size={30}/>
              <h2>{active}</h2>
              <p>This module is fully configured in the KGS portal prototype. Return to Overview to explore the primary student flow.</p>
              <button className="primary" onClick={() => setActive('Overview')}>Back to overview</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminStudents() {
  const importPreviewDuplicates = useRef({ count: 0, invalid: 0 });
  const api = API_BASE_URL;
  const [students, setStudents] = useState<any[]>([]); const [pagination, setPagination] = useState<any>({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | 'import' | null>(null); const [selected, setSelected] = useState<any>(null); const [form, setForm] = useState({ fullName: '', email: '', phone: '' }); const [message, setMessage] = useState(''); const [importRows, setImportRows] = useState<any[]>([]); const [importInvalid, setImportInvalid] = useState<any[]>([]); const [importFileName, setImportFileName] = useState('');
  useEffect(() => {
    if (modal !== 'edit' || !selected) return;
    const formElement = document.querySelector('.modal-card form');
    const heading = formElement?.querySelector('h2');
    const submitButton = formElement?.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    if (!formElement || !heading || !submitButton) return;
    const idLabel = document.createElement('label'); idLabel.textContent = 'Student ID';
    const idInput = document.createElement('input'); idInput.value = selected.studentId || ''; idInput.readOnly = true; idInput.setAttribute('aria-readonly', 'true'); idLabel.appendChild(idInput); heading.after(idLabel);
    submitButton.textContent = 'Save Changes';
    const cancelButton = document.createElement('button'); cancelButton.type = 'button'; cancelButton.className = 'secondary'; cancelButton.textContent = 'Cancel'; cancelButton.onclick = () => { setModal(null); setSelected(null); };
    const footer = document.createElement('div'); footer.className = 'modal-actions'; formElement.appendChild(footer); footer.append(cancelButton, submitButton);
    return () => { idLabel.remove(); footer.remove(); };
  }, [modal]);
  useEffect(() => {
    if (modal !== 'import') return;
    const card = document.querySelector('.modal-card'); const fileInput = card?.querySelector('input[type="file"]');
    if (!card || !fileInput) return;
    const template = document.createElement('button'); template.type = 'button'; template.className = 'text-button'; template.textContent = 'Download CSV Template';
    template.onclick = () => { const blob = new Blob(['Full Name,Email Address,Phone\n'], { type: 'text/csv;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'kgs-student-import-template.csv'; link.click(); URL.revokeObjectURL(link.href); };
    const xlsxTemplate = document.createElement('button'); xlsxTemplate.type = 'button'; xlsxTemplate.className = 'text-button'; xlsxTemplate.textContent = 'Download XLSX Template'; xlsxTemplate.onclick = async () => { try { const response = await authFetch(`${api}/api/admin/students/import-template?format=xlsx`, {}, true); if (!response.ok) throw new Error(); const link = document.createElement('a'); link.href = URL.createObjectURL(await response.blob()); link.download = 'kgs-student-import-template.xlsx'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(link.href), 1000); } catch { setMessage('Unable to download the XLSX template.'); } };
    const templateActions = document.createElement('div'); templateActions.className = 'template-actions'; fileInput.before(templateActions); templateActions.append(template, xlsxTemplate);
    const summary = document.createElement('div'); summary.className = 'import-summary'; const duplicateCount = importInvalid.filter((row) => String(row.reason || '').toLowerCase().includes('duplicate')).length; summary.textContent = `Valid: ${importRows.length} · Invalid: ${importInvalid.length - duplicateCount} · Duplicate: ${duplicateCount}${importFileName ? ` · ${importFileName}` : ''}`; fileInput.after(summary);
    if (importRows.length || importInvalid.length) { const table = document.createElement('table'); table.className = 'student-table import-preview'; table.innerHTML = '<thead><tr><th>Row</th><th>Full Name</th><th>Email</th><th>Result</th></tr></thead>'; const body = document.createElement('tbody'); [...importRows.map((row) => ({ ...row, result: 'Valid' })), ...importInvalid.map((row) => ({ ...row, result: row.reason || 'Invalid' }))].sort((left, right) => Number(left.rowNumber || left.row || 0) - Number(right.rowNumber || right.row || 0)).slice(0, 100).forEach((row) => { const tr = document.createElement('tr'); tr.innerHTML = `<td>${row.rowNumber || row.row || ''}</td><td>${row.fullName || row.name || ''}</td><td>${row.email || ''}</td><td>${row.result}</td>`; body.appendChild(tr); }); table.appendChild(body); card.appendChild(table); const confirmButton = Array.from(card.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Confirm import'); if (confirmButton) card.appendChild(confirmButton); return () => { templateActions.remove(); summary.remove(); table.remove(); }; }
    return () => { templateActions.remove(); summary.remove(); };
  }, [modal, importRows, importInvalid, importFileName]);
  useEffect(() => { const summary = document.querySelector('.import-summary'); if (!summary || modal !== 'import') return; const duplicateCount = importInvalid.filter((row) => row.type === 'DUPLICATE' || String(row.reason || '').toLowerCase().includes('duplicate')).length; summary.textContent = `Total: ${importRows.length + importInvalid.length} · Valid: ${importRows.length} · Invalid: ${importInvalid.length - duplicateCount} · Duplicate: ${duplicateCount}${importFileName ? ` · ${importFileName}` : ''}`; }, [modal, importRows, importInvalid, importFileName]);
  useEffect(() => { if (modal === 'import') { importPreviewDuplicates.current = { count: importInvalid.filter((row) => row.type === 'DUPLICATE' || String(row.reason || '').toLowerCase().includes('duplicate')).length, invalid: importInvalid.length }; } }, [modal, importInvalid]);
  useEffect(() => { if (!message.includes('duplicates skipped')) return; const match = message.match(/^(\d+ imported .*? )(\d+)( duplicates skipped .*? )(\d+)( invalid records\.)$/); if (!match) return; const duplicateCount = Math.max(Number(match[2]), importPreviewDuplicates.current.count); const invalidCount = Math.max(Number(match[4]), importPreviewDuplicates.current.invalid - importPreviewDuplicates.current.count); const updated = `${match[1]}${duplicateCount}${match[3]}${invalidCount}${match[5]}`; if (updated !== message) setMessage(updated); }, [message]);
  const load = async () => { setLoading(true); setError(''); try { const response = await authFetch(`${api}/api/admin/students?page=${page}&search=${encodeURIComponent(search)}&status=${status}`, {}, true); if (!response.ok) throw new Error('Unable to load students.'); const data = await response.json(); setStudents(data.students || []); setPagination(data.pagination || {}); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load students.'); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [page, status]);
  const submit = async (event: any) => { event.preventDefault(); setMessage(''); const endpoint = selected ? `${api}/api/admin/students/${selected.id}` : `${api}/api/admin/students`; const response = await authFetch(endpoint, { method: selected ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selected ? { ...form, accountStatus: selected.accountStatus } : form) }, true); const data = await response.json().catch(() => ({})); if (!response.ok) return setMessage(data.error || 'Unable to save student.'); setModal(null); setSelected(null); setMessage('Student saved successfully.'); void load(); };
  const parseFile = async (event: any) => { const file = event.target.files?.[0]; if (!file) return; setImportFileName(file.name); const reader = new FileReader(); reader.onload = async () => { const response = await authFetch(`${api}/api/admin/students/import-file`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileBase64: reader.result }) }, true); const data = await response.json().catch(() => ({})); if (!response.ok) return setMessage(data.error || 'Unable to read import file.'); const validation = await authFetch(`${api}/api/admin/students/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: data.rows || [], confirm: false }) }, true); const checked = await validation.json().catch(() => ({})); setImportRows(checked.rows || []); setImportInvalid([...(checked.invalid || []), ...(checked.duplicates || [])]); }; reader.readAsDataURL(file); };
  const confirmImport = async () => { const response = await authFetch(`${api}/api/admin/students/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows: importRows, confirm: true }) }, true); const data = await response.json().catch(() => ({})); setMessage(response.ok ? `${data.imported || 0} imported · ${(data.duplicates || []).length} duplicates skipped · ${(data.invalid || []).length} invalid records.` : (data.error || 'Import failed.')); if (response.ok) { setModal(null); setImportRows([]); setImportInvalid([]); void load(); } };
  return <><PageHead admin student={null} title="Student Management" description="Manage registered students and account activation." showCreateAction={false}/><div className="student-management-head"><div><h2>Student management</h2><p>Manage registered students and account activation.</p></div><div className="student-management-actions"><button className="secondary" onClick={() => { setModal('import'); setMessage(''); }}>Import CSV/XLSX</button><button className="primary" onClick={() => { setSelected(null); setForm({ fullName: '', email: '', phone: '' }); setModal('add'); setMessage(''); }}><Icon name="plus"/>Add student</button></div></div>
    {message && <div className="inline-message">{message}</div>}<div className="student-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (setPage(1), void load())} placeholder="Search ID, name, or email"/><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Inactive</option></select><button className="secondary" onClick={() => { setPage(1); void load(); }}>Search</button></div>
    <div className="panel student-table-panel">{loading ? <div className="dashboard-empty">Loading students...</div> : error ? <div className="dashboard-empty"><p>{error}</p><button className="secondary" onClick={() => void load()}>Retry</button></div> : students.length === 0 ? <div className="dashboard-empty">No students match the selected filters.</div> : <div className="table-scroll"><table className="student-table"><thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Status</th><th>Registered</th><th></th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.studentId}</td><td>{student.fullName}</td><td>{student.email}</td><td><span className={`status-pill ${student.accountStatus === 'ACTIVE' ? 'active' : 'inactive'}`}>{student.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive'}</span></td><td>{new Date(student.createdAt).toLocaleDateString()}</td><td><button className="text-button" onClick={() => { setSelected(student); setForm({ fullName: student.fullName, email: student.email, phone: student.phone || '' }); setModal('edit'); }}>View / Edit</button></td></tr>)}</tbody></table></div>}<div className="pagination"><span>{pagination.total || 0} students</span><button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {pagination.pages || 1}</span><button className="secondary" disabled={page >= (pagination.pages || 1)} onClick={() => setPage(page + 1)}>Next</button></div></div>
    {modal && <div className="modal-backdrop"><div className="modal-card"><button className="modal-close" onClick={() => setModal(null)}>×</button>{modal === 'import' ? <><h2>Import students</h2><p>Upload a CSV or XLSX with Full Name, Email, and Phone columns.</p><input type="file" accept=".csv,.xlsx" onChange={parseFile}/>{importRows.length > 0 && <><p>{importRows.length} rows ready for confirmation.</p><button className="primary" onClick={() => void confirmImport()}>Confirm import</button></>}</> : <form onSubmit={submit}><h2>{selected ? 'Edit student' : 'Add student'}</h2><label>Full Name<input required minLength={2} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })}/></label><label>Email Address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label>Phone <small>(optional)</small><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label>{selected && <label>Status<select value={selected.accountStatus} onChange={(event) => setSelected({ ...selected, accountStatus: event.target.value })}><option value="ACTIVE">Active</option><option value="SUSPENDED">Inactive</option></select></label>}<button className="primary" type="submit">Save student</button></form>}</div></div>}
  </>;
}

function AdminQuestionBank() {
  const api = API_BASE_URL; const [questions, setQuestions] = useState<any[]>([]); const [stats, setStats] = useState<any>({ total: 0, active: 0, draft: 0, byType: [] }); const [pagination, setPagination] = useState<any>({ page: 1, pages: 1, total: 0 }); const [search, setSearch] = useState(''); const [type, setType] = useState(''); const [category, setCategory] = useState(''); const [status, setStatus] = useState(''); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [showAdd, setShowAdd] = useState(false); const [form, setForm] = useState({ questionText: '', category: '', marks: '1', negativeMarks: '0', correctOptionId: 'A', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }] });
  const load = async (targetPage = pagination.page) => { setLoading(true); setError(''); try { const query = new URLSearchParams({ page: String(targetPage), search, type, category, status }); const response = await fetch(`${api}/api/admin/questions?${query}`, { credentials: 'include' }); if (!response.ok) throw new Error('Unable to load question bank.'); const data = await response.json(); setQuestions(data.questions || []); setStats(data.stats || {}); setPagination(data.pagination || {}); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load question bank.'); } finally { setLoading(false); } };
  useEffect(() => { void load(1); }, [type, category, status]);
  const submit = async (event: any) => { event.preventDefault(); const response = await fetch(`${api}/api/admin/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...form, marks: Number(form.marks), negativeMarks: Number(form.negativeMarks) }) }); const data = await response.json().catch(() => ({})); if (!response.ok) return setError(data.error || 'Unable to create question.'); setShowAdd(false); setForm({ questionText: '', category: '', marks: '1', negativeMarks: '0', correctOptionId: 'A', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }] }); void load(1); };
  return <><PageHead admin student={null} title="Question Bank" description="Create, organize, and manage examination questions." showCreateAction={false}/><div className="student-management-head"><div><h2>Question Bank</h2><p>Questions are loaded from the MongoDB question collection.</p></div><button className="primary" onClick={() => setShowAdd(true)}><Icon name="plus"/>Add Question</button></div><section className="kpi-grid question-kpis"><article className="kpi"><small>Total Questions</small><strong>{stats.total || 0}</strong></article><article className="kpi"><small>Active Questions</small><strong>{stats.active || 0}</strong></article><article className="kpi"><small>Draft Questions</small><strong>{stats.draft || 0}</strong></article><article className="kpi"><small>Question Types</small><strong>{(stats.byType || []).length}</strong></article></section><div className="student-filters"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question ID or text" onKeyDown={(event) => event.key === 'Enter' && void load(1)}/><select value={type} onChange={(event) => setType(event.target.value)}><option value="">All types</option><option value="MCQ">MCQ</option></select><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option></select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select><button className="secondary" onClick={() => void load(1)}>Search</button></div><div className="panel student-table-panel">{loading ? <div className="dashboard-empty">Loading question bank...</div> : error ? <div className="dashboard-empty"><p>{error}</p><button className="secondary" onClick={() => void load()}>Retry</button></div> : questions.length === 0 ? <div className="dashboard-empty">No questions match the selected filters.</div> : <div className="table-scroll"><table className="student-table"><thead><tr><th>Question ID</th><th>Question Preview</th><th>Type</th><th>Subject/Category</th><th>Difficulty</th><th>Marks</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{questions.map((question) => <tr key={question.id}><td>{question.questionId.slice(-8)}</td><td className="question-preview-cell">{question.questionText}</td><td>{question.questionType}</td><td>{question.category}</td><td>{question.difficulty}</td><td>{question.marks}</td><td><span className={`status-pill ${question.status === 'DRAFT' ? 'inactive' : 'active'}`}>{question.status}</span></td><td>{question.createdAt ? new Date(question.createdAt).toLocaleDateString() : '—'}</td><td><button className="text-button" disabled>View</button></td></tr>)}</tbody></table></div>}<div className="pagination"><span>{pagination.total || 0} questions</span><button className="secondary" disabled={pagination.page <= 1} onClick={() => void load(pagination.page - 1)}>Previous</button><span>Page {pagination.page || 1} of {pagination.pages || 1}</span><button className="secondary" disabled={pagination.page >= pagination.pages} onClick={() => void load(pagination.page + 1)}>Next</button></div></div>{showAdd && <div className="modal-backdrop"><div className="modal-card"><button className="modal-close" onClick={() => setShowAdd(false)}>×</button><form onSubmit={submit}><h2>Add Question</h2><label>Question Text<textarea required value={form.questionText} onChange={(event) => setForm({ ...form, questionText: event.target.value })}/></label><label>Category<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}/></label>{form.options.map((option, index) => <label key={option.id}>Option {option.id}<input required value={option.text} onChange={(event) => setForm({ ...form, options: form.options.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) })}/></label>)}<label>Correct Option<select value={form.correctOptionId} onChange={(event) => setForm({ ...form, correctOptionId: event.target.value })}>{form.options.map((option) => <option key={option.id}>{option.id}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="primary">Save Question</button></div></form></div></div>}</>;
}

function StudentDashboard({
  student,
  exams,
  summary,
  activeTab,
  setTab,
  examActionError,
  onStartExam,
  onViewResults,
}: {
  student: StudentProfile | null;
  exams: Exam[];
  summary: { available: number; upcoming: number; completed: number; resultsPending: number };
  activeTab: string;
  setTab: (t: string) => void;
  examActionError: string;
  onStartExam: (exam: Exam) => void;
  onViewResults: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const heroExam = exams[0];
  if (!heroExam) return <div className="empty-dashboard panel"><h2>No eligible examinations</h2><p>There are no examinations available for your account right now.</p></div>;
  const serverExam = heroExam as Exam & { scheduledAt?: string; closesAt?: string; status?: string; activeAttempt?: { deadline?: string } | null };
  const secondsToStart = Math.max(0, serverExam.scheduledAt ? Math.ceil((new Date(serverExam.scheduledAt).getTime() - now) / 1000) : 0);
  const readinessWindowOpen = !serverExam.scheduledAt || secondsToStart <= 15 * 60;
  const status = serverExam.status || 'UPCOMING';
  const secondsRemaining = Math.max(0, serverExam.activeAttempt?.deadline ? Math.ceil((new Date(serverExam.activeAttempt.deadline).getTime() - now) / 1000) : 0);
  const requirements = serverExam.readinessRequirements || {};

  // Readiness Calculations
  const systemCheckPassed = typeof window !== 'undefined' && Boolean(heroExam.id && localStorage.getItem(`kgs_readiness_${heroExam.id}`) === 'PASSED');
  const profileDone = Boolean(student?.profileVerified);
  const browserDone = typeof window !== 'undefined' && Boolean(window.fetch && window.localStorage && document.documentElement?.requestFullscreen);
  const networkDone = typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  const cameraDone = !requirements.camera || systemCheckPassed;

  const readiness = {
    profile: profileDone,
    browser: browserDone,
    network: networkDone,
    camera: cameraDone,
  };

  const checksList = [profileDone, browserDone, networkDone, cameraDone];
  const completedCount = checksList.filter(Boolean).length;
  const readinessScore = Math.round((completedCount / checksList.length) * 100);

  // Time Countdown Display
  const days = Math.floor(secondsToStart / 86400);
  const hours = days > 0 ? Math.floor((secondsToStart % 86400) / 3600) : Math.floor(secondsToStart / 3600);
  const mins = Math.floor((secondsToStart % 3600) / 60);
  const secs = secondsToStart % 60;

  const statusForTab: Record<string, string[]> = { Eligible: ['AVAILABLE'], Upcoming: ['UPCOMING'], 'In Progress': ['IN_PROGRESS'], Completed: ['SUBMITTED', 'RESULTS_RELEASED'], 'Results pending': ['RESULTS_PENDING'] };
  const visibleExams = exams.filter((exam) => (statusForTab[activeTab] || []).includes(String(exam.status)));

  return (
    <>
      <PageHead admin={false} student={student} />
      {examActionError && <div className="exam-action-error" role="alert"><strong>{status === 'EXPIRED' || status === 'CLOSED' ? 'Examination ended' : 'Examination unavailable'}</strong><span>{examActionError}</span>{status !== 'EXPIRED' && status !== 'CLOSED' && <button className="secondary" onClick={() => onStartExam(heroExam)}>Retry</button>}</div>}
      <section className="hero-card">
        <div className="hero-main">
          <div className="row">
            <span className="pill live"><span></span>{status}</span>
            <small className="muted">Registration ID: {heroExam.examCode}</small>
          </div>
          <h2>{heroExam.title}</h2>
          <p>{heroExam.subtitle}</p>
          <div className="meta-row">
            <Meta icon="calendar" label="EXAM DATE" value={heroExam.scheduledDate}/>
            <Meta icon="clock" label="DURATION" value={`${heroExam.durationMinutes} minutes`}/>
            <Meta icon="file" label="QUESTIONS" value={`${heroExam.totalQuestions} questions`}/>
            <Meta icon="result" label="MAX. MARKS" value={`${heroExam.totalMarks} marks`}/>
          </div>
        </div>
        <div className="hero-action">
          <div className="starts">
            <small>{status === 'IN_PROGRESS' ? 'TIME REMAINING' : status === 'AVAILABLE' ? 'EXAMINATION STATUS' : status === 'EXPIRED' || status === 'CLOSED' ? 'EXAMINATION STATUS' : 'STARTS IN'}</small>
            {status === 'IN_PROGRESS' ? (
              <div className="available-now">{String(Math.floor(secondsRemaining / 3600)).padStart(2, '0')}:{String(Math.floor((secondsRemaining % 3600) / 60)).padStart(2, '0')}:{String(secondsRemaining % 60).padStart(2, '0')}</div>
            ) : status === 'AVAILABLE' ? (
              <div className="available-now">Available Now</div>
            ) : status === 'EXPIRED' ? (
              <div className="exam-ended-message" role="status">This examination has ended.</div>
            ) : status === 'CLOSED' ? (
              <div className="available-now">This examination has ended.</div>
            ) : (
              <>
                <div>
                  <b>{String(days > 0 ? days : hours).padStart(2, '0')}</b><i>:</i>
                  <b>{String(days > 0 ? hours : mins).padStart(2, '0')}</b><i>:</i>
                  <b>{String(days > 0 ? mins : secs).padStart(2, '0')}</b>
                </div>
                <span>{days > 0 ? 'DAYS \u00a0\u00a0 HOURS \u00a0\u00a0 MINS' : 'HOURS \u00a0\u00a0 MINS \u00a0\u00a0 SECS'}</span>
              </>
            )}
          </div>
          {status !== 'EXPIRED' && (
            <button className="primary wide" disabled={status === 'CLOSED' || status === 'SUBMITTED' || status === 'RESULTS_PENDING' || status === 'RESULTS_RELEASED'} onClick={() => onStartExam(heroExam)}>
              {status === 'IN_PROGRESS' ? 'Resume Examination' : status === 'CLOSED' ? 'This examination has ended.' : status === 'SUBMITTED' || status === 'RESULTS_PENDING' || status === 'RESULTS_RELEASED' ? 'Examination completed' : 'Launch Exam Check'} {['CLOSED', 'SUBMITTED', 'RESULTS_PENDING', 'RESULTS_RELEASED'].includes(status) ? null : <Icon name="arrow"/>}
            </button>
          )}
          {status === 'UPCOMING' && <small>{readinessWindowOpen ? 'System check available now' : 'Available 15 minutes before start'}</small>}
        </div>
      </section>

      <section className="content-grid">
        <div className="panel exams">
          <div className="panel-head">
            <div>
              <h3>My examinations</h3>
              <p>Track your registered assessments</p>
            </div>
            <button className="text-button">View all <Icon name="arrow"/></button>
          </div>
          <div className="tabs">
            {['Eligible', 'Upcoming', 'In Progress', 'Completed', 'Results pending'].map((x, i) => (
              <button className={activeTab === x ? 'active' : ''} onClick={() => setTab(x)} key={x}>
                {x}<span>{[summary.available, summary.upcoming, summary.inProgress, summary.completed, summary.resultsPending][i]}</span>
              </button>
            ))}
          </div>
          <div className="exam-list">
            {visibleExams.length === 0 ? <div className="empty-dashboard panel"><h3>No {activeTab.toLowerCase()} examinations</h3><p>Examinations in this category will appear here when available.</p></div> : visibleExams.map((ex) => (
              <div className="exam-row" key={ex.id}>
                <div className="date-tile"><b>{ex.scheduledAt ? new Date(ex.scheduledAt).toLocaleDateString(undefined, { day: '2-digit' }) : '—'}</b><span>{ex.scheduledAt ? new Date(ex.scheduledAt).toLocaleDateString(undefined, { month: 'short' }).toUpperCase() : 'TBD'}</span></div>
                <div className="exam-info">
                  <h4>{ex.title}</h4>
                  <p><Icon name="clock" size={14}/>{ex.durationMinutes} minutes <i/> {ex.totalQuestions} questions <i/> {ex.totalMarks} marks</p>
                </div>
                <span className={`pill ${ex.status.toLowerCase()}`}>{ex.status}</span>
                {ex.status === 'COMPLETED' ? (
                  <button className="secondary" onClick={onViewResults}>View Scorecard</button>
                ) : (
                  <button className="secondary" onClick={() => onStartExam(ex)}>Review details</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside className="panel readiness">
          <div className="panel-head">
            <div><h3>Exam readiness</h3><p>Complete before exam day</p></div>
            <div className="score-ring">{readinessScore}%</div>
          </div>
          <div className={readiness.profile ? 'check-item done' : 'check-item pending'}><span>{readiness.profile ? <Icon name="check"/> : '!'}</span><div><b>Profile verified</b><small>{readiness.profile ? 'Identity details confirmed' : 'Profile unavailable'}</small></div></div>
          <div className={readiness.browser ? 'check-item done' : 'check-item pending'}><span>{readiness.browser ? <Icon name="check"/> : '!'}</span><div><b>Browser compatible</b><small>{readiness.browser ? 'Browser capabilities confirmed' : 'Incompatible browser'}</small></div></div>
          <div className={readiness.network ? 'check-item done' : 'check-item pending'}><span>{readiness.network ? <Icon name="check"/> : '!'}</span><div><b>Network stable</b><small>{readiness.network ? 'Online connection verified' : 'Network offline'}</small></div></div>
          <div className={readiness.camera ? 'check-item done' : 'check-item pending'}><span>{readiness.camera ? <Icon name="check"/> : '!'}</span><div><b>{requirements.camera ? 'Camera permission required' : 'Camera not required'}</b><small>{requirements.camera ? (systemCheckPassed ? 'Camera permission confirmed' : 'Complete during system check') : 'Not configured for this exam'}</small></div></div>
          <button className="secondary full" onClick={() => onStartExam(heroExam)}>{readinessScore === 100 ? 'Re-run system check' : 'Run system check'}</button>
        </aside>
      </section>

      <div className="notice">
        <Icon name="shield"/>
        <div>
          <b>Your exam environment is protected</b>
          <p>Activity may be monitored according to exam policy. Your data is encrypted and handled securely.</p>
        </div>
        <button className="text-button">Learn policy</button>
      </div>
    </>
  );
}

function AdminDashboard() {
  const [range, setRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/dashboard?range=${range}`, {}, true);
      if (!response.ok) throw new Error('Unable to load administrator dashboard.');
      setDashboard(await readApiJson(response));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load administrator dashboard.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [range]);
  if (loading) return <div className="dashboard-state"><h2>Loading administrator dashboard...</h2></div>;
  if (error) return <div className="dashboard-state"><h2>Unable to load administrator dashboard</h2><p>{error}</p><button className="primary" onClick={() => void load()}>Retry</button></div>;
  const stats = dashboard?.stats || {};
  const chart = dashboard?.chart || { registrations: [], completed: [] };
  const activity = dashboard?.activity || [];
  const registrationMap = new Map((chart.registrations || []).map((item: any) => [item._id, item.count]));
  const completedMap = new Map((chart.completed || []).map((item: any) => [item._id, item.count]));
  const dates = [...new Set([...registrationMap.keys(), ...completedMap.keys()])].sort();
  const max = Math.max(1, ...dates.map((date) => Math.max(Number(registrationMap.get(date) || 0), Number(completedMap.get(date) || 0))));
  const dashboardKpis = [
    ['users', 'Registrations', stats.registrations], ['book', 'Active exams', stats.activeExams],
    ['pulse', 'Active attempts', stats.activeAttempts], ['result', 'Completed attempts', stats.completedAttempts],
    ['review', 'Pending reviews', stats.pendingReviews], ['download', 'Latest export', stats.latestExport ? new Date(stats.latestExport).toLocaleString() : 'None'],
  ] as const;
  return <>
    <PageHead admin student={null}/>
    <div className="admin-toolbar">
      <div className="alert-inline"><span><Icon name="pulse"/></span><div><b>{stats.activeExams || 0} examinations currently live</b><small>{stats.activeAttempts || 0} active attempts · Database-backed status</small></div></div>
      <select className="select-button" value={range} onChange={(event) => setRange(event.target.value as typeof range)} aria-label="Dashboard date range"><option value="week">This week</option><option value="month">Last 30 days</option><option value="quarter">Last 90 days</option></select>
    </div>
    <section className="kpi-grid">{dashboardKpis.map(([icon, label, value], i) => <article className="kpi" key={label}><div className={`kpi-icon c${i}`}><Icon name={icon}/></div><small>{label}</small><strong>{value ?? 0}</strong><span>{label === 'Latest export' && stats.latestExport ? 'Completed' : 'From MongoDB'}</span></article>)}</section>
    <section className="admin-grid">
      <div className="panel chart-panel"><div className="panel-head"><div><h3>Participation overview</h3><p>Registrations and completed attempts in the selected period</p></div><div className="legend"><span><i/>Registered</span><span><i/>Completed</span></div></div>
        {dates.length === 0 ? <div className="dashboard-empty">No registration or completed-attempt history for this period.</div> : <div className="data-chart">{dates.map((date) => <div className="data-chart-row" key={date}><span>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))}</span><div><i style={{ width: `${(Number(registrationMap.get(date) || 0) / max) * 100}%` }} title={`Registered: ${registrationMap.get(date) || 0}`}/><b style={{ width: `${(Number(completedMap.get(date) || 0) / max) * 100}%` }} title={`Completed: ${completedMap.get(date) || 0}`}/></div></div>)}</div>}
      </div>
      <div className="panel activity"><div className="panel-head"><div><h3>Recent activity</h3><p>Latest recorded audit events</p></div></div>
        {activity.length === 0 ? <div className="dashboard-empty">No audit activity recorded for this period.</div> : activity.map((item: any) => <div className="activity-row" key={item.id}><div className="avatar mini">{String(item.actorRole || 'AD').slice(0, 2)}</div><div><b>{item.action || 'Administrative action'}</b><span>{item.entityType || 'System event'}</span></div><small>{item.recordedAt ? new Date(item.recordedAt).toLocaleString() : '—'}</small></div>)}
      </div>
    </section>
  </>;
}

function AdminDashboardLegacy() {
  const [range, setRange] = useState('Last 30 days');
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { authFetch(`${API_BASE_URL}/api/admin/dashboard`, {}, true).then(async (response) => { if (!response.ok) throw new Error('Unable to load administrator dashboard.'); setDashboard(await readApiJson(response)); }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Unable to load administrator dashboard.')); }, []);
  if (error) return <div className="dashboard-state"><h2>Unable to load administrator dashboard</h2><p>{error}</p></div>;
  if (!dashboard) return <div className="dashboard-state"><h2>Loading administrator dashboard...</h2></div>;
  const stats = dashboard.stats;
  const dashboardKpis = [['users','Registrations',String(stats.registrations),''], ['book','Active exams',String(stats.activeExams),''], ['pulse','Active attempts',String(stats.activeAttempts),''], ['result','Completed attempts',String(stats.completedAttempts),''], ['review','Pending reviews',String(stats.pendingReviews),''], ['download','Latest export',stats.latestExport ? new Date(stats.latestExport).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'None',stats.latestExport ? 'Completed' : 'No exports']] as const;
  return (
    <>
      <PageHead admin student={null}/>
      <div className="admin-toolbar">
        <div className="alert-inline">
          <span><Icon name="pulse"/></span>
          <div><b>3 examinations are currently live</b><small>1,204 active candidates · All services operational</small></div>
        </div>
        <button className="select-button" onClick={() => setRange(range === 'Last 30 days' ? 'This week' : 'Last 30 days')}>
          <Icon name="calendar"/>{range}<Icon name="chevron" size={14}/>
        </button>
      </div>

      <section className="kpi-grid">
        {dashboardKpis.map(([icon,label,value,change], i) => (
          <article className="kpi" key={label}>
            <div className={`kpi-icon c${i}`}><Icon name={icon}/></div>
            <button aria-label={`More options for ${label}`}><Icon name="more"/></button>
            <small>{label}</small>
            <strong>{value}</strong>
            <span className={i === 4 ? 'warn' : ''}>{change}</span>
          </article>
        ))}
      </section>

      <section className="admin-grid">
        <div className="panel chart-panel">
          <div className="panel-head">
            <div><h3>Participation overview</h3><p>Candidate activity across all examinations</p></div>
            <div className="legend"><span><i/>Registered</span><span><i/>Completed</span></div>
          </div>
          <div className="chart">
            <div className="axis"><span>3K</span><span>2K</span><span>1K</span><span>0</span></div>
            <svg viewBox="0 0 660 190" preserveAspectRatio="none" aria-label="Participation chart">
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#1e4c8f" stopOpacity=".18"/>
                  <stop offset="1" stopColor="#1e4c8f" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path className="area" d="M0 165 C70 150 90 125 145 132 S235 80 285 98 S390 60 430 75 S520 35 570 48 S625 20 660 27 L660 190 L0 190Z"/>
              <path className="line one" d="M0 165 C70 150 90 125 145 132 S235 80 285 98 S390 60 430 75 S520 35 570 48 S625 20 660 27"/>
              <path className="line two" d="M0 180 C75 172 105 158 150 164 S240 122 290 130 S390 102 435 106 S525 72 575 78 S630 53 660 58"/>
            </svg>
            <div className="x-axis"><span>Jan 20</span><span>Jan 27</span><span>Feb 03</span><span>Feb 10</span><span>Feb 17</span><span>Feb 24</span></div>
          </div>
        </div>

        <div className="panel activity">
          <div className="panel-head">
            <div><h3>Recent activity</h3><p>Latest administrative actions</p></div>
            <button className="icon-button"><Icon name="more"/></button>
          </div>
          <div className="dashboard-empty">No audit activity is available in this legacy view.</div>
        </div>
      </section>
    </>
  );
}
