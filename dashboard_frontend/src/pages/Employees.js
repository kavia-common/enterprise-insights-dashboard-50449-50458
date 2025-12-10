import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import { fetchEmployees } from '../services/employeeService';
import { useAuth, ROLES } from '../context/AuthContext';

// PUBLIC_INTERFACE
export default function Employees() {
  /** Employee Profiles: list with quick filters and link to detail */
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const list = await fetchEmployees();
        setEmployees(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(e =>
      [e.name, e.email, e.department, e.role].some(v => String(v).toLowerCase().includes(q))
    );
  }, [employees, query]);

  const canManage = user && (user.role === ROLES.ADMIN || user.role === ROLES.MANAGER);

  return (
    <section className="dashboard" aria-label="Employees Section">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Employees</h2>
            <div className="card-subtitle">Directory & profiles</div>
          </div>
          <div className="card-actions">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="search-input"
              placeholder="Search employees..."
              aria-label="Search employees"
              style={{ minWidth: 220 }}
            />
            {canManage && (
              <button className="btn primary ghost" onClick={() => navigate('/employees/new')}>
                + Add
              </button>
            )}
          </div>
        </header>
        <div className="card-body">
          {loading ? (
            <div className="exp-note">Loading employees…</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map(e => (
                <div key={e.id} className="list-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" aria-hidden>{e.name?.[0]?.toUpperCase() || 'U'}</div>
                    <div>
                      <div className="list-name">{e.name}</div>
                      <div className="exp-note">{e.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="header-pill" title="Department">{e.department}</span>
                    <span className="header-pill" title="Role">{e.role}</span>
                    <span className="header-pill" title="Status">{e.status}</span>
                    <Link className="btn primary ghost" to={`/employees/${e.id}`}>View</Link>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="exp-note">No employees match your search.</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
