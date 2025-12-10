import React, { useEffect, useState } from 'react';
import '../App.css';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchEmployeeById, updateEmployee, fetchPerformance } from '../services/employeeService';
import { useAuth, ROLES } from '../context/AuthContext';

function PerformanceSpark({ history }) {
  const max = Math.max(5, ...history.map(h => h.score || 0));
  return (
    <div className="chart-placeholder" style={{ height: 120 }}>
      <div className="chart-gradient" />
      <div className="chart-grid" style={{ height: 80 }}>
        {history.map((h, i) => (
          <div key={i} className="chart-bar" style={{ height: `${Math.round((h.score / max) * 100)}%` }} />
        ))}
      </div>
      <div className="chart-footer">
        <span>Performance history</span>
        <span className="hint">Scores over time</span>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function EmployeeDetail() {
  /** Employee detail view with inline edit (admin/manager only) and performance panel */
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user && (user.role === ROLES.ADMIN || user.role === ROLES.MANAGER);

  const [loading, setLoading] = useState(false);
  const [emp, setEmp] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', department: '', role: 'employee', status: 'Active' });
  const [perf, setPerf] = useState({ current: 0, history: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchEmployeeById(id);
        setEmp(data);
        setForm({ name: data.name, email: data.email, department: data.department, role: data.role, status: data.status });
        const p = await fetchPerformance(id);
        setPerf(p);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await updateEmployee(id, form);
      setEmp(updated);
      navigate(`/employees/${id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="ocean-main"><div className="exp-note">Loading profile…</div></div>;
  }
  if (!emp) {
    return <div className="ocean-main"><div className="exp-note">Employee not found.</div></div>;
  }

  return (
    <section className="dashboard">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">{emp.name}</h2>
            <div className="card-subtitle">{emp.email}</div>
          </div>
          <div className="card-actions">
            <button className="btn primary ghost" onClick={() => navigate('/employees')}>← Back</button>
            {canEdit && <button className="btn primary" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>}
          </div>
        </header>
        <div className="card-body" style={{ display: 'grid', gap: 16 }}>
          <div className="list-row">
            <div className="list-name">Department</div>
            {canEdit ? (
              <input className="search-input" value={form.department} onChange={e => onChange('department', e.target.value)} />
            ) : (<div className="list-value">{emp.department}</div>)}
          </div>
          <div className="list-row">
            <div className="list-name">Role</div>
            {canEdit ? (
              <select className="search-input" value={form.role} onChange={e => onChange('role', e.target.value)}>
                <option value="admin">admin</option>
                <option value="manager">manager</option>
                <option value="employee">employee</option>
              </select>
            ) : (<div className="list-value">{emp.role}</div>)}
          </div>
          <div className="list-row">
            <div className="list-name">Status</div>
            {canEdit ? (
              <select className="search-input" value={form.status} onChange={e => onChange('status', e.target.value)}>
                <option>Active</option>
                <option>Remote</option>
                <option>Leave</option>
                <option>Inactive</option>
              </select>
            ) : (<div className="list-value">{emp.status}</div>)}
          </div>
          <div className="list-row">
            <div className="list-name">Name</div>
            {canEdit ? (
              <input className="search-input" value={form.name} onChange={e => onChange('name', e.target.value)} />
            ) : (<div className="list-value">{emp.name}</div>)}
          </div>
          <div className="list-row">
            <div className="list-name">Email</div>
            {canEdit ? (
              <input className="search-input" value={form.email} onChange={e => onChange('email', e.target.value)} />
            ) : (<div className="list-value">{emp.email}</div>)}
          </div>
        </div>
      </div>

      <div className="card tone-info">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Performance</h2>
            <div className="card-subtitle">Current rating: {perf.current?.toFixed?.(2) ?? perf.current}</div>
          </div>
        </header>
        <div className="card-body">
          <PerformanceSpark history={perf.history || []} />
        </div>
      </div>
    </section>
  );
}
