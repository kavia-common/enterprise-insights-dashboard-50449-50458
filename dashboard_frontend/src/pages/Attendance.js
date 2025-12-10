import React, { useEffect, useState } from 'react';
import '../App.css';
import { fetchAttendance, fetchEmployees } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';

// PUBLIC_INTERFACE
export default function Attendance() {
  /** Attendance Tracking: filter by employee and date range, render table */
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const emps = await fetchEmployees();
      setEmployees(emps);
      if (user?.role === 'employee') {
        // if employee, default filter to self if matches mock email/name
        const me = emps.find(e => e.name.split(' ')[0].toLowerCase() === (user.name || '').split(' ')[0]?.toLowerCase());
        if (me) setEmployeeId(me.id);
      }
    })();
  }, [user]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAttendance({ employeeId, dateFrom, dateTo });
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  return (
    <section className="dashboard">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Attendance</h2>
            <div className="card-subtitle">Presence status over time</div>
          </div>
          <div className="card-actions" style={{ gap: 8 }}>
            <select className="search-input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">All employees</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <input className="search-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input className="search-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            <button className="btn primary" onClick={load}>Filter</button>
          </div>
        </header>
        <div className="card-body">
          {loading ? (
            <div className="exp-note">Loading attendance…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Date</th>
                    <th style={th}>Employee</th>
                    <th style={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const emp = employees.find(e => String(e.id) === String(r.employeeId));
                    return (
                      <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={td}>{r.date}</td>
                        <td style={td}>{emp ? emp.name : r.employeeId}</td>
                        <td style={td}><span className="header-pill">{r.status}</span></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan="3" style={{ ...td, textAlign: 'center' }}><div className="exp-note">No attendance records.</div></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const th = { textAlign: 'left', padding: '8px 6px' };
const td = { padding: '8px 6px' };
