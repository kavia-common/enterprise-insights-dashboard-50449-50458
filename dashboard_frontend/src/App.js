import React, { useMemo, useState, useEffect } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  /**
   * This component renders the enterprise dashboard shell with:
   * - Sidebar navigation
   * - Top header with search and profile menu
   * - Main content with widgets and chart placeholders
   * - Feature-flag aware sections
   * It follows the Ocean Professional theme implemented in App.css and index.css.
   */
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

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

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'analytics', label: 'Analytics', icon: '📈' },
    { key: 'reports', label: 'Reports', icon: '📄' },
    { key: 'alerts', label: 'Alerts', icon: '🔔', flag: 'alerts' },
    { key: 'exp-labs', label: 'Experiments', icon: '🧪', experiment: true },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.experiment) return EXPERIMENTS_ENABLED;
    if (item.flag) return !!flags[item.flag];
    return true;
  });

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
          {visibleNavItems.map(item => (
            <button key={item.key} className="nav-item" aria-label={item.label}>
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
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
                <span className="avatar">A</span>
                <span className="username">Admin</span>
                <span className="chev">{profileOpen ? '▲' : '▼'}</span>
              </button>
              {profileOpen && (
                <div className="profile-menu" role="menu">
                  <button className="menu-item" role="menuitem">Profile</button>
                  <button className="menu-item" role="menuitem">Settings</button>
                  <button className="menu-item" role="menuitem">Help</button>
                  <div className="menu-sep" />
                  <button className="menu-item danger" role="menuitem">Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="dashboard">
          <div className="kpi-grid">
            <KPICard title="Revenue" value="$1.24M" delta="+4.2%" trend="up" />
            <KPICard title="Active Users" value="58,421" delta="+2.1%" trend="up" />
            <KPICard title="Churn" value="2.3%" delta="-0.3%" trend="down" />
            <KPICard title="NPS" value="47" delta="+1" trend="up" />
          </div>

          <div className="content-grid">
            <Card title="Sales Overview" subtitle="Last 12 months" accent>
              <ChartPlaceholder type="line" />
            </Card>

            <Card title="Top Products" subtitle="By revenue">
              <ListPlaceholder
                items={[
                  { name: 'Product Alpha', value: '$420k' },
                  { name: 'Product Beta', value: '$315k' },
                  { name: 'Service Gamma', value: '$210k' },
                  { name: 'Addon Delta', value: '$145k' }
                ]}
              />
            </Card>

            <Card title="Geographic Distribution" subtitle="Active users by region">
              <ChartPlaceholder type="map" />
            </Card>

            {flags['alerts'] && (
              <Card title="Alerts" subtitle="Operational and business alerts" tone="warning">
                <AlertsPlaceholder />
              </Card>
            )}

            {EXPERIMENTS_ENABLED && (
              <Card title="Experiments Lab" subtitle="Feature experiments and A/B results" tone="info">
                <ExperimentPlaceholder />
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// Components (kept in the same file for simplicity; could be moved to /components)

// PUBLIC_INTERFACE
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

// PUBLIC_INTERFACE
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

// PUBLIC_INTERFACE
function ChartPlaceholder({ type }) {
  /** Placeholder for charts; replace with real chart library integration later. */
  return (
    <div className="chart-placeholder" role="img" aria-label={`${type} chart placeholder`}>
      <div className="chart-gradient" />
      <div className="chart-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="chart-bar" style={{ height: `${25 + ((i * 7) % 60)}%` }} />
        ))}
      </div>
      <div className="chart-footer">
        <span>{type === 'line' ? 'Jan - Dec' : 'Regions'}</span>
        <span className="hint">Replace with real chart</span>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
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

// PUBLIC_INTERFACE
function AlertsPlaceholder() {
  /** Example alert items. */
  const alerts = [
    { sev: 'high', msg: 'API latency increased in region us-west-2' },
    { sev: 'medium', msg: 'Revenue tracking delay for EU market' },
    { sev: 'low', msg: 'New data source pending verification' }
  ];
  return (
    <div className="alerts">
      {alerts.map((a, i) => (
        <div key={i} className={`alert sev-${a.sev}`}>
          <span className="badge">{a.sev.toUpperCase()}</span>
          <span className="msg">{a.msg}</span>
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
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

export default App;
