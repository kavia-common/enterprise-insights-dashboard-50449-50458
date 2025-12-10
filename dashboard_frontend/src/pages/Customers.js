import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import { fetchCustomers } from '../services/customerService';

// Status badge with Ocean Professional tones
function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  const map = {
    active: { color: '#065F46', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
    prospect: { color: '#1E3A8A', bg: 'rgba(37,99,235,0.15)', border: 'rgba(37,99,235,0.25)' },
    'churn risk': { color: '#7F1D1D', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.25)' },
    inactive: { color: '#78350F', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' },
  };
  const st = map[s] || map.active;
  return (
    <span
      className="kpi-delta"
      style={{ borderRadius: 999, fontSize: 12, padding: '4px 8px', color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
    >
      {status}
    </span>
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

// PUBLIC_INTERFACE
export default function Customers() {
  /** Customers list with search, sort, filter and quick links to detail page. */
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(r => {
      if (status && String(r.status).toLowerCase() !== String(status).toLowerCase()) return false;
      if (q) {
        const hay = [r.name, r.email, r.company, r.phone, r.status, ...(r.tags || [])]
          .map(v => String(v || '').toLowerCase());
        if (!hay.some(h => h.includes(q))) return false;
      }
      return true;
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    const compare = (a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (sortKey === 'openTickets') {
        return ((Number(va) || 0) - (Number(vb) || 0)) * dir;
      }
      return String(va || '').localeCompare(String(vb || '')) * dir;
    };
    return list.sort(compare);
  }, [rows, query, status, sortKey, sortDir]);

  const onSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <section className="dashboard" aria-label="Customers Section">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Customers</h2>
            <div className="card-subtitle">Customer database, communications, and ticket status</div>
          </div>
          <div className="card-actions" style={{ gap: 8 }}>
            <div className="search">
              <span className="search-icon">🔎</span>
              <input
                className="search-input"
                placeholder="Search by name, company, email…" value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search customers"
              />
            </div>
            <select className="search-input" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter status">
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Prospect">Prospect</option>
              <option value="Churn Risk">Churn Risk</option>
              <option value="Inactive">Inactive</option>
            </select>
            <button className="btn primary ghost" onClick={load} aria-label="Refresh customers">↻ Refresh</button>
          </div>
        </header>
        <div className="card-body">
          {loading ? (
            <div className="exp-note">Loading customers…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <Th label="Name" onClick={() => onSort('name')} active={sortKey === 'name'} dir={sortDir} />
                    <Th label="Company" onClick={() => onSort('company')} active={sortKey === 'company'} dir={sortDir} />
                    <Th label="Email" onClick={() => onSort('email')} active={sortKey === 'email'} dir={sortDir} />
                    <Th label="Phone" onClick={() => onSort('phone')} active={sortKey === 'phone'} dir={sortDir} />
                    <th style={th}>Status</th>
                    <Th label="Open Tickets" onClick={() => onSort('openTickets')} active={sortKey === 'openTickets'} dir={sortDir} />
                    <th style={th}>Last Contact</th>
                    <th style={th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={td}><strong>{c.name}</strong></td>
                      <td style={td}>{c.company}</td>
                      <td style={td}><a href={`mailto:${c.email}`} rel="noreferrer">{c.email}</a></td>
                      <td style={td}>{c.phone}</td>
                      <td style={td}><StatusBadge status={c.status} /></td>
                      <td style={td}>{c.openTickets}</td>
                      <td style={td}><span className="exp-note">{new Date(c.lastContact).toLocaleString()}</span></td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link className="btn primary ghost" to={`/customers/${c.id}`}>View</Link>
                          <button className="btn primary ghost" onClick={() => navigate(`/customers/${c.id}`)}>↗</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="8" style={{ ...td, textAlign: 'center' }}><div className="exp-note">No customers match your filters.</div></td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="8" style={{ ...td, color: 'var(--muted)' }}>
                      Showing {filtered.length} of {rows.length} customers
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const th = { textAlign: 'left', padding: '8px 6px', whiteSpace: 'nowrap' };
const td = { padding: '8px 6px', verticalAlign: 'middle' };
