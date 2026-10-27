import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../api';

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
    fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => { if (!response.ok) throw new Error('Health check failed'); return response.json(); })
      .then((data) => setHealth(data?.ok === true ? 'operational' : 'unavailable'))
      .catch(() => setHealth('unavailable'))
      .finally(() => window.clearTimeout(timeout));
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, []);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="brand">
          <div className="brand-mark"><span>K</span></div>
          <div><strong>KGS</strong><small>EXAM PORTAL</small></div>
        </div>
        <nav className="landing-nav">
          <button className="text-button" onClick={onStudentLogin}>Student Login</button>
          <button className="secondary" onClick={onRegister}>Register</button>
          <button className="primary" onClick={onAdminLogin}>Admin Portal</button>
        </nav>
      </header>

      <main className="landing-main">
        <div className="landing-copy">
          <span className="landing-kicker">
            <span className="kicker-spark">✨</span> SECURE ONLINE EXAMINATION PLATFORM
          </span>
          <h1>Welcome to <span className="gradient-text">KGS Exam Portal</span></h1>
          <p>
            An enterprise-grade, proctored examination platform designed for seamless registration, real-time response recovery, and tamper-proof evaluation.
          </p>
          <div className="landing-actions">
            <button className="primary" onClick={onRegister}>Register as Student</button>
            <button className="secondary" onClick={onStudentLogin}>Student Login</button>
          </div>
          <button className="text-button landing-admin" onClick={onAdminLogin}>
            Administrator Portal <span>→</span>
          </button>
        </div>

        <div className="landing-panel">
          <div className={`landing-panel-top health-${health}`}>
            <span className="status-dot" />
            {health === 'operational' ? 'All systems operational' : health === 'checking' ? 'Checking service status...' : 'Service currently unavailable'}
          </div>
          <div className="landing-shield">🛡️</div>
          <h2>Protected Exam Environment</h2>
          <p>Encrypted authentication, autosaved responses, and real-time server timing integrity.</p>
          <div className="landing-stats">
            <div><b>OTP Auth</b><small>Passwordless Access</small></div>
            <div><b>Auto-Sync</b><small>Response Recovery</small></div>
            <div><b>Proctored</b><small>Policy Audit</small></div>
          </div>
        </div>
      </main>

      <section className="landing-features">
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure Authentication</h3>
          <p>Passwordless single-use OTP verification ensures cryptographically verified candidate access.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Real-time Response Sync</h3>
          <p>Instantaneous response autosaving prevents data loss during intermittent network disruptions.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Tamper-Proof Evaluation</h3>
          <p>Automated scoring engine with controlled result publishing policies and verified grade distribution.</p>
        </div>
      </section>

      <footer className="landing-footer">
        © 2025 KGS Institute · Secure examination and assessment infrastructure
      </footer>
    </div>
  );
}
