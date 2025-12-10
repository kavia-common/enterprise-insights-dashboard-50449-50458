import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, ROLES } from '../context/AuthContext';
import '../App.css';

/**
 * Login page with username/password and role selector (for mock login).
 * If backend is configured, it will attempt to call it; otherwise falls back to mock session.
 */

// PUBLIC_INTERFACE
export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.EMPLOYEE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim() || 'User', password, role);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocean-app" style={{ gridTemplateColumns: '1fr', gridTemplateAreas: '"main"' }}>
      <main className="ocean-main" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <section className="card" style={{ maxWidth: 420, width: '100%' }}>
          <header className="card-header">
            <div className="card-titles">
              <h2 className="card-title">Sign in</h2>
              <div className="card-subtitle">Access your enterprise dashboard</div>
            </div>
          </header>
          <div className="card-body">
            <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="username" style={{ fontWeight: 600 }}>Username</label>
                <input
                  id="username"
                  className="search-input"
                  placeholder="e.g., alex.w"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="password" style={{ fontWeight: 600 }}>Password</label>
                <input
                  id="password"
                  type="password"
                  className="search-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="role" style={{ fontWeight: 600 }}>Role</label>
                <select
                  id="role"
                  className="search-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value={ROLES.ADMIN}>Admin</option>
                  <option value={ROLES.MANAGER}>Manager</option>
                  <option value={ROLES.EMPLOYEE}>Employee</option>
                </select>
                <div className="exp-note">Role selector is for mock mode; when backend is connected, role from server will be used.</div>
              </div>
              {error && (
                <div className="alert sev-high">
                  <span className="badge">ERROR</span>
                  <span className="msg">{error}</span>
                </div>
              )}
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
