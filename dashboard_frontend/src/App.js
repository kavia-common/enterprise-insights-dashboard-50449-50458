import React, { useMemo, useState, useEffect } from 'react';
import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import Login from './pages/Login';
import { fetchMetrics } from './services/metricsService';

// Keep dashboard section components (Card, KPICard, etc.)
function Card({ title, subtitle, children, accent = false, tone }) {
  /** Generic surface card with subtle shadow and rounded corners. */
  return (
    <section className={`card ${accent ? 'accent' : ''} ${tone ? `tone-${tone}` : ''}`}>
      <header className="card-header">
        <div className="card-titles">
          <h2 className="card-title">{title}</h2>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
        <div className="card-actions">
          <button className="icon-button" aria-label="Refresh">↻</button>
          <button className="icon-button" aria-label="More">⋮</button>
        </div>
      </header>
      <div className="card-body">
        {children}
      </div>
    </section>
  );
}
function KPICard({ title, value, delta, trend }) {
  /** KPI card with colored delta badge. */
  const up = trend === 'up';
  return (
    <div className="kpi">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-delta ${up ? 'up' : 'down'}`}>
        {up ? '▲' : '▼'} {delta}
      </div>
    </div>
  );
}
function BarsFromSeries({ series }) {
  // Renders simple bars based on y values; purely presentational
  const maxY = Math.max(1, ...series.map(p => p.y || 0));
  return (
    <div className="chart-grid">
      {series.map((p, i) => {
        const h = Math.round((p.y / maxY) * 100);
        return <div key={i} className="chart-bar" style={{ height: `${h}%` }} />;
      })}
    </div>
  );
}
function ChartPlaceholder({ type = 'line', series = [] }) {
  /** Placeholder for charts using series data; replace with real chart library later. */
  return (
    <div className="chart-placeholder" role="img" aria-label={`${type} chart placeholder`}>
      <div className="chart-gradient" />
      <BarsFromSeries series={series.length ? series : Array.from({ length: 8 }).map((_, i) => ({ x: i, y: 20 + ((i * 7) % 60) }))} />
      <div className="chart-footer">
        <span>{type === 'line' ? 'Trend' : 'Segments'}</span>
        <span className="hint">Replace with real chart</span>
      </div>
    </div>
  );
}
function ListPlaceholder({ items }) {
  /** Simple list style for placeholder data. */
  return (
    <ul className="list">
      {items.map((it, idx) => (
        <li key={idx} className="list-row">
          <span className="list-name">{it.name}</span>
          <span className="list-value">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
function AlertsList({ alerts }) {
  /** Notification alert component. */
  return (
    <div className="alerts">
      {alerts.map((a, i) => (
        <div key={i} className={`alert sev-${a.sev}`}>
          <span className="badge">{(a.sev || 'info').toUpperCase()}</span>
          <span className="msg">{a.msg}</span>
        </div>
      ))}
    </div>
  );
}
function ExperimentPlaceholder() {
  /** Visible when REACT_APP_EXPERIMENTS_ENABLED is true. */
  return (
    <div className="experiment">
      <div className="exp-row">
        <div className="exp-name">Homepage CTA Variant</div>
        <div className="exp-metric up">+3.1% CTR</div>
      </div>
      <div className="exp-row">
        <div className="exp-name">Pricing Page Layout</div>
        <div className="exp-metric down">-0.8% Bounce</div>
      </div>
      <div className="exp-note">Experiments are enabled. Manage in Settings → Labs.</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function DashboardOverview() {
  /**
   * Dashboard overview: Sales chart with period switch, KPI cards,
   * employee activity, notifications, and recent feed.
   * Uses mock data with optional backend fetch via metricsService.
   */
  const [period, setPeriod] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    kpis: [],
    sales: [],
    activity: [],
    notifications: [],
    recent: [],
  });

  const load = async (p) => {
    setLoading(true);
    try {
      const data = await fetchMetrics(p);
      setMetrics(data);
    } catch (_e) {
      // metricsService already falls back; no-op
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const onSwitch = (p) => setPeriod(p);

  return (
    <section className="dashboard">
      <div className="kpi-grid" aria-label="KPI cards">
        {metrics.kpis.map((k, i) => (
          <KPICard key={i} title={k.title} value={k.value} delta={k.delta} trend={k.trend} />
        ))}
      </div>

      <div className="content-grid">
        <section className="card accent">
          <header className="card-header">
            <div className="card-titles">
              <h2 className="card-title">Sales Overview</h2>
              <div className="card-subtitle">
                {period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Year'}
              </div>
            </div>
            <div className="card-actions" role="tablist" aria-label="Sales period">
              <button
                className="btn primary ghost"
                aria-selected={period === 'daily'}
                onClick={() => onSwitch('daily')}
              >
                Daily
              </button>
              <button
                className="btn primary ghost"
                aria-selected={period === 'weekly'}
                onClick={() => onSwitch('weekly')}
              >
                Weekly
              </button>
              <button
                className="btn primary ghost"
                aria-selected={period === 'monthly'}
                onClick={() => onSwitch('monthly')}
              >
                Monthly
              </button>
            </div>
          </header>
          <div className="card-body">
            {loading ? (
              <div className="exp-note">Loading {period} metrics…</div>
            ) : (
              <ChartPlaceholder type="line" series={metrics.sales} />
            )}
          </div>
        </section>

        <Card title="Employee Activity" subtitle="Status breakdown">
          <ListPlaceholder items={metrics.activity} />
        </Card>

        <Card title="Notifications" subtitle="Operational and business alerts" tone="warning">
          <AlertsList alerts={metrics.notifications} />
        </Card>

        <Card title="Recent Tasks & Events" subtitle="Latest updates">
          <ListPlaceholder items={metrics.recent} />
        </Card>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function DashboardShell() {
  /**
   * DashboardShell composes the layout, header, sidebar, and main content, and
   * reads auth state to show role-aware navigation and user info.
   */
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, logout } = useAuth();

  // Respect existing environment variables without introducing new ones
  const API_BASE = process.env.REACT_APP_API_BASE || '';
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
  const WS_URL = process.env.REACT_APP_WS_URL || '';
  const FEATURE_FLAGS = process.env.REACT_APP_FEATURE_FLAGS || '';
  const EXPERIMENTS_ENABLED = (process.env.REACT_APP_EXPERIMENTS_ENABLED || 'false').toLowerCase() === 'true';

  const flags = useMemo(() => {
    return FEATURE_FLAGS
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .reduce((acc, k) => { acc[k] = true; return acc; }, {});
  }, [FEATURE_FLAGS]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const role = user?.role;

  // Role-gated nav items
  const nav = [
    { to: '/', label: 'Dashboard', icon: '📊', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE] },
    { to: '/admin', label: 'Admin Panel', icon: '🛠️', roles: [ROLES.ADMIN] },
    { to: '/management', label: 'Management', icon: '📈', roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { to: '/employee', label: 'My Tasks', icon: '📝', roles: [ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE] },
  ];

  const visibleNav = nav.filter(n => !n.roles || n.roles.includes(role));

  return (
    <div className="ocean-app">
      <aside className={`ocean-sidebar ${sidebarOpen ? 'open' : 'closed'}`} aria-label="Sidebar Navigation">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark">⧉</div>
            {sidebarOpen && <div className="brand-text">Insights</div>}
          </div>
          <button
            className="icon-button sidebar-toggle"
            onClick={() => setSidebarOpen(s => !s)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="nav">
          {visibleNav.map(item => (
            <Link key={item.to} to={item.to} className="nav-item" aria-label={item.label}>
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="env">
              <div className="env-title">Endpoints</div>
              <div className="env-row"><span>API</span><code>{API_BASE || '-'}</code></div>
              <div className="env-row"><span>Backend</span><code>{BACKEND_URL || '-'}</code></div>
              <div className="env-row"><span>WS</span><code>{WS_URL || '-'}</code></div>
            </div>
          )}
        </div>
      </aside>

      <main className="ocean-main">
        <header className="ocean-header" role="banner">
          <div className="header-left">
            <h1 className="page-title">Enterprise Dashboard</h1>
            <div className="header-pill">Ocean Professional</div>
          </div>
          <div className="header-actions">
            <div className="search">
              <span className="search-icon">🔎</span>
              <input className="search-input" placeholder="Search insights, reports, KPIs..." aria-label="Search" />
            </div>
            <button className="btn primary ghost" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'} Theme
            </button>
            <div className="profile">
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(o => !o)}
                aria-haspopup="menu"
                aria-expanded={profileOpen ? 'true' : 'false'}
                aria-label="User menu"
              >
                <span className="avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                <span className="username">{user?.name || 'User'}</span>
                <span className="chev">{profileOpen ? '▲' : '▼'}</span>
              </button>
              {profileOpen && (
                <div className="profile-menu" role="menu">
                  <button className="menu-item" role="menuitem">Profile</button>
                  <button className="menu-item" role="menuitem">Settings</button>
                  <button className="menu-item" role="menuitem">Help</button>
                  <div className="menu-sep" />
                  <button className="menu-item danger" role="menuitem" onClick={logout}>Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <DashboardOverview />
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
function AdminPage() {
  return (
    <div className="card">
      <div className="card-header"><div className="card-titles"><h2 className="card-title">Admin Panel</h2><div className="card-subtitle">Restricted to administrators</div></div></div>
      <div className="card-body">System settings, user management, and advanced configurations.</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function ManagementPage() {
  return (
    <div className="card">
      <div className="card-header"><div className="card-titles"><h2 className="card-title">Management</h2><div className="card-subtitle">For admins and managers</div></div></div>
      <div className="card-body">Team performance, goals, and planning tools.</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function EmployeePage() {
  return (
    <div className="card">
      <div className="card-header"><div className="card-titles"><h2 className="card-title">My Tasks</h2><div className="card-subtitle">For all authenticated roles</div></div></div>
      <div className="card-body">Your assigned tasks, deadlines, and progress.</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function AppRoutes() {
  /**
   * Defines application routes, using ProtectedRoute to enforce auth and roles.
   */
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardShell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <div className="ocean-app" style={{ gridTemplateColumns: '280px 1fr', gridTemplateAreas: '"sidebar header" "sidebar main"' }}>
              <DashboardShell />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/management"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <div className="ocean-app" style={{ gridTemplateColumns: '280px 1fr', gridTemplateAreas: '"sidebar header" "sidebar main"' }}>
              <DashboardShell />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
            <div className="ocean-app" style={{ gridTemplateColumns: '280px 1fr', gridTemplateAreas: '"sidebar header" "sidebar main"' }}>
              <DashboardShell />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * App wraps routes with AuthProvider and BrowserRouter.
   */
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
