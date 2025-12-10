import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { approveLeave, createLeave, fetchEmployees, fetchLeaves } from '../services/employeeService';
import { useAuth, ROLES } from '../context/AuthContext';

// PUBLIC_INTERFACE
export default function Leaves() {
  /** Leave Management: list, create (all), approve/reject (manager/admin) */
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ employeeId: '', from: '', to: '', type: 'Paid', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const canApprove = user && (user.role === ROLES.ADMIN || user.role === ROLES.MANAGER);

  useEffect(() => {
    (async () => {
      const emps = await fetchEmployees();
      setEmployees(emps);
      setLoading(true);
      try {
        const data = await fetchLeaves();
        setList(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await createLeave({ ...form, status: 'Pending' });
      setList(prev => [created, ...prev]);
      setForm({ employeeId: '', from: '', to: '', type: 'Paid', reason: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const onDecision = async (id, status) => {
    const updated = await approveLeave(id, status);
    setList(prev => prev.map(l => (String(l.id) === String(id) ? { ...l, status: updated.status } : l)));
  };

  const myId = useMemo(() => {
    // try matching by name initial to filter for employee
    const me = employees.find(e => e.name.split(' ')[0].toLowerCase() === (user?.name || '').split(' ')[0]?.toLowerCase());
    return me?.id || '';
  }, [employees, user]);

  return (
    <section className="dashboard">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Leave Management</h2>
            <div className="card-subtitle">Submit and review leave requests</div>
          </div>
        </header>
        <div className="card-body" style={{ display: 'grid', gap: 16 }}>
          <form onSubmit={onCreate} style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontWeight: 600 }}>Employee</label>
              <select
                className="search-input"
                value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                required
              >
                <option value="">Select</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              {!form.employeeId && user?.role === ROLES.EMPLOYEE && myId && (
                <button type="button" className="btn primary ghost" onClick={() => setForm(f => ({ ...f, employeeId: myId }))}>
                  Use my profile
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontWeight: 600 }}>From</label>
                <input type="date" className="search-input" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontWeight: 600 }}>To</label>
                <input type="date" className="search-input" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontWeight: 600 }}>Type</label>
              <select className="search-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option>Paid</option>
                <option>Sick</option>
                <option>Unpaid</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ fontWeight: 600 }}>Reason</label>
              <textarea className="search-input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Optional details" />
            </div>
            <div>
              <button className="btn primary" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Leave'}</button>
            </div>
          </form>

          <div className="card tone-info">
            <header className="card-header">
              <div className="card-titles">
                <h3 className="card-title">Requests</h3>
                <div className="card-subtitle">Pending and history</div>
              </div>
            </header>
            <div className="card-body" style={{ display: 'grid', gap: 10 }}>
              {loading ? (
                <div className="exp-note">Loading leaves…</div>
              ) : (
                list.map(l => {
                  const emp = employees.find(e => String(e.id) === String(l.employeeId));
                  return (
                    <div key={l.id} className="list-row">
                      <div>
                        <div className="list-name">{emp ? emp.name : l.employeeId}</div>
                        <div className="exp-note">{l.from} → {l.to} • {l.type}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="header-pill">{l.status}</span>
                        {canApprove && l.status === 'Pending' && (
                          <>
                            <button className="btn primary ghost" onClick={() => onDecision(l.id, 'Approved')}>Approve</button>
                            <button className="btn primary ghost" onClick={() => onDecision(l.id, 'Rejected')}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {!loading && list.length === 0 && <div className="exp-note">No leave requests.</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
