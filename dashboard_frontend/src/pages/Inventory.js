import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { fetchInventoryItems, fetchLowStock, fetchInventoryNotifications, triggerReorder, getFeatureFlags } from '../services/inventoryService';

// Status badge component
function StatusBadge({ stock, threshold }) {
  const s = Number(stock) || 0;
  const t = Number(threshold) || 0;
  const status = s <= 0 ? 'Out' : s <= t ? 'Low' : 'OK';
  const styles = {
    OK: { color: '#065F46', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
    Low: { color: '#78350F', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' },
    Out: { color: '#7F1D1D', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.25)' },
  };
  const st = styles[status];
  return (
    <span
      className="kpi-delta"
      style={{
        borderRadius: 999,
        fontSize: 12,
        padding: '4px 8px',
        color: st.color,
        background: st.bg,
        border: `1px solid ${st.border}`,
      }}
      aria-label={`Status: ${status}`}
      title={`Status: ${status}`}
    >
      {status}
    </span>
  );
}

// PUBLIC_INTERFACE
export default function Inventory() {
  /**
   * Inventory page: shows product stock levels, supports filter/search/sort,
   * highlights low-stock items, and surfaces reorder notifications with a bell.
   */
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [onlyLow, setOnlyLow] = useState(false);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name'); // name | sku | stock | threshold | category
  const [sortDir, setSortDir] = useState('asc'); // asc | desc

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const flags = useMemo(() => getFeatureFlags(), []);

  const load = async () => {
    setLoading(true);
    try {
      const data = onlyLow ? await fetchLowStock() : await fetchInventoryItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setNotifLoading(true);
    try {
      const data = await fetchInventoryNotifications();
      setNotifications(data);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyLow]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter(i => {
      const s = Number(i.stock) || 0;
      const t = Number(i.threshold) || 0;
      const stat = s <= 0 ? 'Out' : s <= t ? 'Low' : 'OK';
      if (category && i.category !== category) return false;
      if (status && stat !== status) return false;
      if (q) {
        const hay = [i.name, i.sku, i.category].map(v => String(v || '').toLowerCase());
        if (!hay.some(h => h.includes(q))) return false;
      }
      return true;
    });

    const compare = (a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const va = a[sortKey];
      const vb = b[sortKey];
      if (sortKey === 'stock' || sortKey === 'threshold') {
        return ((Number(va) || 0) - (Number(vb) || 0)) * dir;
      }
      return String(va || '').localeCompare(String(vb || '')) * dir;
    };

    return list.sort(compare);
  }, [items, query, category, status, sortKey, sortDir]);

  const lowCount = useMemo(() => items.filter(i => (Number(i.stock) || 0) <= (Number(i.threshold) || 0)).length, [items]);

  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const onReorder = async (item) => {
    const res = await triggerReorder(item);
    // Add a transient notification to panel for UX feedback in mock
    setNotifications(prev => [{ id: Math.random().toString(36).slice(2), sku: item.sku, product: item.name, message: res.message, date: new Date().toISOString(), status: res.success ? 'queued' : 'failed' }, ...prev]);
  };

  const headerButtonStyle = { position: 'relative' };
  const notifCount = notifications.length;

  return (
    <section className="dashboard" aria-label="Inventory Section">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Inventory</h2>
            <div className="card-subtitle">Monitor stock, thresholds, and reorder notices</div>
          </div>
          <div className="card-actions" style={{ gap: 8 }}>
            <div className="search">
              <span className="search-icon">🔎</span>
              <input
                className="search-input"
                placeholder="Search by name, SKU, category…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search inventory"
              />
            </div>

            <select className="search-input" value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter category">
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select className="search-input" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter status">
              <option value="">Any status</option>
              <option value="OK">OK</option>
              <option value="Low">Low</option>
              <option value="Out">Out</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={onlyLow} onChange={e => setOnlyLow(e.target.checked)} />
              <span className="exp-note">Only low stock</span>
            </label>

            <button className="btn primary ghost" onClick={load} aria-label="Refresh inventory">↻ Refresh</button>

            <div style={headerButtonStyle}>
              <button className="btn primary" onClick={() => setNotifOpen(o => !o)} aria-label="Open notifications">
                🔔 Notifications
              </button>
              {notifCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    background: 'var(--secondary)',
                    color: '#111827',
                    borderRadius: 999,
                    padding: '2px 6px',
                    fontSize: 12,
                    fontWeight: 800,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                  aria-label={`${notifCount} notifications`}
                >
                  {notifCount}
                </span>
              )}
              {notifOpen && (
                <div
                  className="profile-menu"
                  role="dialog"
                  aria-label="Reorder notifications"
                  style={{ right: 0, left: 'auto', minWidth: 340, maxHeight: 360, overflowY: 'auto' }}
                >
                  <div style={{ padding: '6px 8px', fontWeight: 700 }}>Automated Reorder Notices</div>
                  <div className="menu-sep" />
                  <div style={{ display: 'grid', gap: 6, padding: 6 }}>
                    {notifLoading ? (
                      <div className="exp-note" style={{ padding: 8 }}>Loading notifications…</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="list-row" style={{ gap: 8 }}>
                          <div>
                            <div className="list-name">{n.product} <span className="exp-note">({n.sku})</span></div>
                            <div className="exp-note">{n.message}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className="header-pill" style={{ marginBottom: 6, display: 'inline-block' }}>{n.status}</span>
                            <div className="exp-note">{new Date(n.date).toLocaleString()}</div>
                          </div>
                        </div>
                      ))
                    )}
                    {!notifLoading && notifications.length === 0 && (
                      <div className="exp-note" style={{ padding: 8 }}>No notifications.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="card-body">
          {loading ? (
            <div className="exp-note">Loading inventory…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <Th label="Product" onClick={() => onSort('name')} active={sortKey === 'name'} dir={sortDir} />
                    <Th label="SKU" onClick={() => onSort('sku')} active={sortKey === 'sku'} dir={sortDir} />
                    <Th label="Category" onClick={() => onSort('category')} active={sortKey === 'category'} dir={sortDir} />
                    <Th label="Stock" onClick={() => onSort('stock')} active={sortKey === 'stock'} dir={sortDir} />
                    <Th label="Threshold" onClick={() => onSort('threshold')} active={sortKey === 'threshold'} dir={sortDir} />
                    <th style={th}>Status</th>
                    <th style={th}>Last Updated</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(it => {
                    const isLow = (Number(it.stock) || 0) <= (Number(it.threshold) || 0);
                    const isOut = (Number(it.stock) || 0) <= 0;
                    return (
                      <tr
                        key={it.id}
                        style={{
                          borderTop: '1px solid var(--border)',
                          background: isOut
                            ? 'rgba(239,68,68,0.06)'
                            : isLow
                            ? 'rgba(245,158,11,0.06)'
                            : 'transparent',
                        }}
                      >
                        <td style={td}><strong>{it.name}</strong></td>
                        <td style={td}><code>{it.sku}</code></td>
                        <td style={td}>{it.category}</td>
                        <td style={td}>{it.stock} <span className="exp-note">{it.unit}</span></td>
                        <td style={td}>{it.threshold}</td>
                        <td style={td}><StatusBadge stock={it.stock} threshold={it.threshold} /></td>
                        <td style={td}><span className="exp-note">{new Date(it.lastUpdated).toLocaleString()}</span></td>
                        <td style={td}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="btn primary ghost" onClick={() => onReorder(it)} title="Reorder">
                              ↥ Reorder
                            </button>
                            <span className="exp-note" title="Last reorder status">
                              {isOut ? 'Out of stock' : isLow ? 'Below threshold' : 'Healthy'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ ...td, textAlign: 'center' }}>
                        <div className="exp-note">No inventory items match your filters.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="8" style={{ ...td, color: 'var(--muted)' }}>
                      Showing {filtered.length} of {items.length} items • Low stock: {lowCount}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
      {!flags.inventory && (
        <div className="exp-note" style={{ marginTop: 8 }}>
          Note: Inventory feature is behind feature flag "inventory". Ensure REACT_APP_FEATURE_FLAGS includes inventory=true to surface in navigation.
        </div>
      )}
    </section>
  );
}

function Th({ label, onClick, active, dir }) {
  return (
    <th style={th}>
      <button
        onClick={onClick}
        className="icon-button"
        style={{ background: 'transparent', border: 'none', fontWeight: active ? 800 : 600, cursor: 'pointer' }}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
      >
        {label} {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
      </button>
    </th>
  );
}

const th = { textAlign: 'left', padding: '8px 6px', whiteSpace: 'nowrap' };
const td = { padding: '8px 6px', verticalAlign: 'middle' };
