import { useState } from 'react';
import { API_BASE_URL, setAuthToken } from '../../api';

export function AdminLoginPage({ onBackToLanding, onAuthenticated }: { onBackToLanding: () => void; onAuthenticated: (user: { email: string; role: string }) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Administrator authentication failed.');
      const data = await response.json();
      if (data.token) setAuthToken(data.token, true);
      onAuthenticated(data.user);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Administrator authentication failed.'); } finally { setLoading(false); }
  };
  return <div className="auth-entry-shell"><div className="modal-card auth-card"><div className="modal-header"><div className="brand"><div className="brand-mark"><span>K</span></div><div><strong>KGS EXAM PORTAL</strong><small>ADMINISTRATOR LOGIN</small></div></div><button className="close-button" onClick={onBackToLanding} aria-label="Back to landing">×</button></div><form className="modal-body" onSubmit={submit}><h3>Administrator Authentication</h3><p>Sign in with an authorized KGS administrator account.</p>{error && <div className="error-alert" role="alert">{error}</div>}<div className="form-group"><label htmlFor="admin-email">EMAIL ADDRESS</label><input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></div><div className="form-group"><label htmlFor="admin-password">PASSWORD</label><div className="password-field"><input id="admin-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></div><button className="primary full" disabled={loading}>{loading ? 'Authenticating...' : 'Administrator Login'}</button><button type="button" className="text-button" onClick={onBackToLanding}>Back to landing page</button></form></div></div>;
}
