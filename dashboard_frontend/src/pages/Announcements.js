import React, { useEffect, useState } from 'react';
import '../App.css';
import { createAnnouncement, fetchAnnouncements } from '../services/employeeService';
import { useAuth, ROLES } from '../context/AuthContext';

// PUBLIC_INTERFACE
export default function Announcements() {
  /** Internal announcements board */
  const { user } = useAuth();
  const canCreate = user && (user.role === ROLES.ADMIN || user.role === ROLES.MANAGER);

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAnnouncements();
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
      const created = await createAnnouncement({ ...form, author: user?.name || 'System' });
      setList(prev => [created, ...prev]);
      setForm({ title: '', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dashboard">
      <div className="card accent">
        <header className="card-header">
          <div className="card-titles">
            <h2 className="card-title">Announcements</h2>
            <div className="card-subtitle">Company-wide updates</div>
          </div>
        </header>
        <div className="card-body" style={{ display: 'grid', gap: 16 }}>
          {canCreate && (
            <form onSubmit={onCreate} style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontWeight: 600 }}>Title</label>
                <input className="search-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontWeight: 600 }}>Message</label>
                <textarea className="search-input" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              <div>
                <button className="btn primary" type="submit" disabled={submitting}>{submitting ? 'Posting…' : 'Post Announcement'}</button>
              </div>
            </form>
          )}

          <div className="card tone-info">
            <header className="card-header">
              <div className="card-titles">
                <h3 className="card-title">Latest</h3>
                <div className="card-subtitle">Visible to all users</div>
              </div>
            </header>
            <div className="card-body" style={{ display: 'grid', gap: 10 }}>
              {loading ? (
                <div className="exp-note">Loading announcements…</div>
              ) : (
                list.map(a => (
                  <div key={a.id} className="list-row">
                    <div>
                      <div className="list-name">{a.title}</div>
                      <div className="exp-note">{a.message}</div>
                    </div>
                    <div className="exp-note">{a.author} • {new Date(a.date).toLocaleString()}</div>
                  </div>
                ))
              )}
              {!loading && list.length === 0 && <div className="exp-note">No announcements yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
