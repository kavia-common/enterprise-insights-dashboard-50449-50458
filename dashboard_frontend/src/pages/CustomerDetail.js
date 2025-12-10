import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchCustomerById, fetchCustomerTickets, fetchCustomerTimeline, updateCustomer } from '../services/customerService';

function TicketBadge({ status }) {
  const s = String(status || '').toLowerCase();
  const map = {
    open: { color: '#1E3A8A', bg: 'rgba(37,99,235,0.15)', border: 'rgba(37,99,235,0.25)' },
    pending: { color: '#78350F', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)' },
    closed: { color: '#065F46', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
  };
  const st = map[s] || map.open;
  return (
    <span className="kpi-delta" style={{ borderRadius: 999, fontSize: 12, padding: '4px 8px', color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
      {status}
    </span>
  );
}

function TimelineItem({ item }) {
  const icons = { call: '📞', message: '✉️', note: '📝' };
  return (
    <div className="list-row" style={{ alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="avatar" aria-hidden>{icons[item.type] || '📝'}</div>
        <div>
          <div className="list-name">{item.summary}</div>
          <div className="exp-note">{new Date(item.date).toLocaleString()} • {item.agent}</div>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function CustomerDetail() {
  /** Customer profile detail view with recent timeline and current ticket status. */
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketStatus, setTicketStatus] = useState('open');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', status: 'Active', tags: [] });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const c = await fetchCustomerById(id);
      setCustomer(c);
      setForm({ name: c.name, email: c.email, company: c.company, phone: c.phone, status: c.status, tags: c.tags || [] });
      const tl = await fetchCustomerTimeline(id);
      setTimeline(tl);
      const tk = await fetchCustomerTickets(id, { status: ticketStatus });
      setTickets(tk);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async (status) => {
    const tk = await fetchCustomerTickets(id, { status });
    setTickets(tk);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!loading) loadTickets(ticketStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketStatus]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await updateCustomer(id, form);
      setCustomer(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const tagsText = useMemo(() => (form.tags || []).join(', '), [form.tags]);

  if (loading) {
    return <div className="ocean-main"><div className="exp-note">Loading customer…</div></div>;
  }
  if (!customer) {
    return <div className="ocean-main"><div className="exp-note">Customer not found.</div></div>;
  }

  return (
    <section className="dashboard">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">{customer.name}</h2>
            <div className="card-subtitle">{customer.company} • <a href={`mailto:${customer.email}`}>{customer.email}</a></div>
          </div>
          <div className="card-actions" style={{ gap: 8 }}>
            <button className="btn primary ghost" onClick={() => navigate('/customers')}>← Back</button>
            {!editing ? (
              <button className="btn primary" onClick={() => setEditing(true)}>Edit</button>
            ) : (
              <>
                <button className="btn primary ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </>
            )}
          </div>
        </header>
        <div className="card-body" style={{ display: 'grid', gap: 12 }}>
          <div className="list-row">
            <div className="list-name">Status</div>
            <div>
              {!editing ? (
                <span className="header-pill">{customer.status}</span>
              ) : (
                <select className="search-input" value={form.status} onChange={e => onChange('status', e.target.value)}>
                  <option>Active</option>
                  <option>Prospect</option>
                  <option>Churn Risk</option>
                  <option>Inactive</option>
                </select>
              )}
            </div>
          </div>
          <div className="list-row">
            <div className="list-name">Phone</div>
            {!editing ? <div className="list-value">{customer.phone}</div> : <input className="search-input" value={form.phone} onChange={e => onChange('phone', e.target.value)} />}
          </div>
          <div className="list-row">
            <div className="list-name">Company</div>
            {!editing ? <div className="list-value">{customer.company}</div> : <input className="search-input" value={form.company} onChange={e => onChange('company', e.target.value)} />}
          </div>
          <div className="list-row">
            <div className="list-name">Email</div>
            {!editing ? <div className="list-value">{customer.email}</div> : <input className="search-input" value={form.email} onChange={e => onChange('email', e.target.value)} />}
          </div>
          <div className="list-row">
            <div className="list-name">Tags</div>
            {!editing ? (
              <div className="list-value">{(customer.tags || []).join(', ') || '-'}</div>
            ) : (
              <input
                className="search-input"
                value={tagsText}
                onChange={e => onChange('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="priority, enterprise"
              />
            )}
          </div>
          <div className="exp-note">Last contact: {new Date(customer.lastContact).toLocaleString()} • Open tickets: {customer.openTickets}</div>
        </div>
      </div>

      <div className="card tone-info">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Recent Calls & Messages</h2>
            <div className="card-subtitle">Timeline of interactions</div>
          </div>
        </header>
        <div className="card-body" style={{ display: 'grid', gap: 10 }}>
          {timeline.map(it => <TimelineItem key={it.id} item={it} />)}
          {timeline.length === 0 && <div className="exp-note">No recent interactions.</div>}
        </div>
      </div>

      <div className="card tone-warning">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Support Tickets</h2>
            <div className="card-subtitle">Status overview</div>
          </div>
          <div className="card-actions" style={{ gap: 8 }}>
            <select className="search-input" value={ticketStatus} onChange={e => setTicketStatus(e.target.value)} aria-label="Filter tickets">
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </header>
        <div className="card-body">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Subject</th>
                  <th style={th}>Status</th>
                  <th style={th}>Priority</th>
                  <th style={th}>Opened</th>
                  <th style={th}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={td}><strong>{t.subject}</strong></td>
                    <td style={td}><TicketBadge status={t.status} /></td>
                    <td style={td}><span className="header-pill">{t.priority}</span></td>
                    <td style={td}><span className="exp-note">{new Date(t.openedAt).toLocaleString()}</span></td>
                    <td style={td}><span className="exp-note">{new Date(t.updatedAt).toLocaleString()}</span></td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr><td colSpan="5" style={{ ...td, textAlign: 'center' }}><div className="exp-note">No tickets.</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

const th = { textAlign: 'left', padding: '8px 6px', whiteSpace: 'nowrap' };
const td = { padding: '8px 6px', verticalAlign: 'middle' };
