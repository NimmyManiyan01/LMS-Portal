import { useEffect, useState } from 'react';

interface LandingPageProps {
  onStudentLogin: () => void;
  onRegister: () => void;
  onAdminLogin: () => void;
}

export function LandingPage({ onStudentLogin, onRegister, onAdminLogin }: LandingPageProps) {
  const [health, setHealth] = useState<'checking' | 'operational' | 'unavailable'>('checking');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/health`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => { if (!response.ok) throw new Error('Health check failed'); return response.json(); })
      .then((data) => setHealth(data?.ok === true ? 'operational' : 'unavailable'))
      .catch(() => setHealth('unavailable'))
      .finally(() => window.clearTimeout(timeout));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="brand"><div className="brand-mark"><span>K</span></div><div><strong>KGS</strong><small>EXAM PORTAL</small></div></div>
        <nav className="landing-nav">
          <button className="text-button" onClick={onStudentLogin}>Student Login</button>
          <button className="secondary" onClick={onRegister}>Register</button>
          <button className="primary" onClick={onAdminLogin}>Admin Login</button>
        </nav>
      </header>
      <main className="landing-main">
        <div className="landing-copy">
          <span className="landing-kicker">SECURE ONLINE EXAMINATION PLATFORM</span>
          <h1>Welcome to KGS Exam Portal</h1>
          <p>A secure platform to register, attend examinations, and access your examination results.</p>
          <div className="landing-actions">
            <button className="primary" onClick={onRegister}>Register as Student</button>
            <button className="secondary" onClick={onStudentLogin}>Student Login</button>
          </div>
          <button className="text-button landing-admin" onClick={onAdminLogin}>Administrator Login <span>→</span></button>
        </div>
        <div className="landing-panel">
          <div className={`landing-panel-top health-${health}`}><span className="status-dot" /> {health === 'operational' ? 'All systems operational' : health === 'checking' ? 'Checking service status...' : 'Service currently unavailable'}</div>
          <div className="landing-shield">✓</div>
          <h2>Examination environment protected</h2>
          <p>Encrypted authentication, autosaved responses, and reliable result publication.</p>
          <div className="landing-stats"><span><b>OTP</b><small>Passwordless login</small></span><span><b>Auto-save</b><small>Answer recovery</small></span><span><b>Server</b><small>Controlled timing</small></span></div>
        </div>
      </main>
      <footer className="landing-footer">© 2025 KGS Institute · Secure examination services</footer>
    </div>
  );
}
