//
// Employee Management services with graceful fallback to mock data.
// Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL if available (no new env vars).
//

// Utility to get API base
function getApiBase() {
  const a = process.env.REACT_APP_API_BASE || '';
  const b = process.env.REACT_APP_BACKEND_URL || '';
  return (a || b || '').replace(/\/$/, '');
}

// PUBLIC_INTERFACE
export async function fetchEmployees() {
  /**
   * Fetch list of employees.
   * GET /employees
   * Returns: [{ id, name, role, department, email, status, avatar? }]
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/employees`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return withEmployeeDefaults(data);
      }
    } catch (_e) { /* ignore and fallback */ }
  }
  return getMockEmployees();
}

// PUBLIC_INTERFACE
export async function fetchEmployeeById(id) {
  /**
   * Fetch a single employee by id.
   * GET /employees/:id
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/employees/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        return withEmployeeDefault(data);
      }
    } catch (_e) {}
  }
  const mock = getMockEmployees().find(e => String(e.id) === String(id));
  return mock || withEmployeeDefault({ id, name: 'Unknown', role: 'employee', department: 'N/A', email: 'unknown@example.com', status: 'Inactive' });
}

// PUBLIC_INTERFACE
export async function updateEmployee(id, payload) {
  /**
   * Update an employee (optimistic in mock).
   * PUT /employees/:id
   * Role gated at UI layer (admin/manager).
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/employees/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (_e) {}
  }
  // mock: return merged object
  const orig = await fetchEmployeeById(id);
  return { ...orig, ...payload };
}

// PUBLIC_INTERFACE
export async function fetchAttendance(params = {}) {
  /**
   * Fetch attendance records.
   * GET /attendance?employeeId=&dateFrom=&dateTo=
   * Returns: [{ id, employeeId, date: 'YYYY-MM-DD', status: 'Present'|'Absent'|'Remote'|'Leave' }]
   */
  const base = getApiBase();
  const qs = new URLSearchParams();
  if (params.employeeId) qs.set('employeeId', params.employeeId);
  if (params.dateFrom) qs.set('dateFrom', params.dateFrom);
  if (params.dateTo) qs.set('dateTo', params.dateTo);

  if (base) {
    try {
      const res = await fetch(`${base}/attendance${qs.toString() ? `?${qs.toString()}` : ''}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return withAttendanceDefaults(data);
      }
    } catch (_e) {}
  }
  return getMockAttendance(params);
}

// PUBLIC_INTERFACE
export async function fetchPerformance(employeeId) {
  /**
   * Fetch performance rating history for an employee.
   * GET /performance?employeeId=
   * Returns: { employeeId, current: number, history: [{ date, score, note }] }
   */
  const base = getApiBase();
  const qs = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : '';
  if (base) {
    try {
      const res = await fetch(`${base}/performance${qs}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        return withPerformanceDefaults(data, employeeId);
      }
    } catch (_e) {}
  }
  return getMockPerformance(employeeId);
}

// PUBLIC_INTERFACE
export async function fetchLeaves(params = {}) {
  /**
   * Fetch leave requests.
   * GET /leaves?employeeId=&status=
   * Returns: [{ id, employeeId, from, to, type, status: 'Pending'|'Approved'|'Rejected', reason }]
   */
  const base = getApiBase();
  const qs = new URLSearchParams();
  if (params.employeeId) qs.set('employeeId', params.employeeId);
  if (params.status) qs.set('status', params.status);
  if (base) {
    try {
      const res = await fetch(`${base}/leaves${qs.toString() ? `?${qs.toString()}` : ''}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return withLeaveDefaults(data);
      }
    } catch (_e) {}
  }
  return getMockLeaves(params.employeeId);
}

// PUBLIC_INTERFACE
export async function createLeave(payload) {
  /**
   * Create a leave request (employee self-service).
   * POST /leaves
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (_e) {}
  }
  // mock creation
  return { id: Math.random().toString(36).slice(2), status: 'Pending', ...payload };
}

// PUBLIC_INTERFACE
export async function approveLeave(leaveId, decision = 'Approved') {
  /**
   * Approve or reject leave (manager/admin action).
   * PATCH /leaves/:id
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/leaves/${encodeURIComponent(leaveId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status: decision }),
      });
      if (res.ok) return await res.json();
    } catch (_e) {}
  }
  // mock: return basic updated object
  return { id: leaveId, status: decision };
}

// PUBLIC_INTERFACE
export async function fetchAnnouncements() {
  /**
   * Fetch internal announcements.
   * GET /announcements
   * Returns: [{ id, title, message, author, date }]
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/announcements`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return withAnnouncementDefaults(data);
      }
    } catch (_e) {}
  }
  return getMockAnnouncements();
}

// PUBLIC_INTERFACE
export async function createAnnouncement(payload) {
  /**
   * Create a new announcement (manager/admin).
   * POST /announcements
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch (_e) {}
  }
  // mock creation
  return { id: Math.random().toString(36).slice(2), date: new Date().toISOString(), ...payload };
}

// Helpers - defaults and mocks

function withEmployeeDefaults(list) {
  return list.map(withEmployeeDefault);
}
function withEmployeeDefault(e) {
  return {
    id: e.id ?? Math.random().toString(36).slice(2),
    name: e.name ?? 'Unknown',
    role: e.role ?? 'employee',
    department: e.department ?? 'General',
    email: e.email ?? 'unknown@example.com',
    status: e.status ?? 'Active',
    avatar: e.avatar ?? '',
  };
}
function withAttendanceDefaults(list) {
  return list.map(a => ({
    id: a.id ?? Math.random().toString(36).slice(2),
    employeeId: a.employeeId ?? '0',
    date: a.date ?? new Date().toISOString().slice(0, 10),
    status: a.status ?? 'Present',
  }));
}
function withPerformanceDefaults(data, employeeId) {
  return {
    employeeId: data.employeeId ?? employeeId ?? '0',
    current: Number.isFinite(data.current) ? data.current : 3.8,
    history: Array.isArray(data.history) ? data.history : getMockPerformance(employeeId).history,
  };
}
function withLeaveDefaults(list) {
  return list.map(l => ({
    id: l.id ?? Math.random().toString(36).slice(2),
    employeeId: l.employeeId ?? '0',
    from: l.from ?? new Date().toISOString().slice(0, 10),
    to: l.to ?? new Date().toISOString().slice(0, 10),
    type: l.type ?? 'Paid',
    status: l.status ?? 'Pending',
    reason: l.reason ?? '',
  }));
}
function withAnnouncementDefaults(list) {
  return list.map(a => ({
    id: a.id ?? Math.random().toString(36).slice(2),
    title: a.title ?? 'Announcement',
    message: a.message ?? '',
    author: a.author ?? 'System',
    date: a.date ?? new Date().toISOString(),
  }));
}

// Mock data generators

function getMockEmployees() {
  return [
    { id: '1', name: 'Alice Johnson', role: 'manager', department: 'Operations', email: 'alice@corp.com', status: 'Active' },
    { id: '2', name: 'Bob Smith', role: 'employee', department: 'Engineering', email: 'bob@corp.com', status: 'Active' },
    { id: '3', name: 'Carol Lee', role: 'employee', department: 'Design', email: 'carol@corp.com', status: 'Remote' },
    { id: '4', name: 'David Kim', role: 'employee', department: 'Support', email: 'david@corp.com', status: 'Leave' },
  ];
}

function getMockAttendance(params = {}) {
  const { employeeId } = params;
  const employees = getMockEmployees();
  const days = 10;
  const list = [];
  employees.forEach(e => {
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const statuses = ['Present', 'Remote', 'Leave', 'Absent'];
      const status = statuses[(i + Number(e.id)) % statuses.length];
      list.push({
        id: `${e.id}-${i}`,
        employeeId: e.id,
        date: d.toISOString().slice(0, 10),
        status,
      });
    }
  });
  return withAttendanceDefaults(employeeId ? list.filter(r => String(r.employeeId) === String(employeeId)) : list);
}

function getMockPerformance(employeeId) {
  const id = employeeId || '1';
  const history = Array.from({ length: 8 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const score = 3 + (i % 3) * 0.3 + (id === '2' ? 0.4 : 0);
    return { date: d.toISOString().slice(0, 10), score: Number(score.toFixed(2)), note: 'Quarterly review' };
    });
  const current = history[0]?.score ?? 3.8;
  return { employeeId: id, current, history };
}

function getMockLeaves(employeeId) {
  const all = [
    { id: 'L1', employeeId: '2', from: '2025-01-10', to: '2025-01-12', type: 'Paid', status: 'Pending', reason: 'Family event' },
    { id: 'L2', employeeId: '3', from: '2025-01-18', to: '2025-01-22', type: 'Sick', status: 'Approved', reason: 'Medical' },
    { id: 'L3', employeeId: '4', from: '2025-01-05', to: '2025-01-08', type: 'Unpaid', status: 'Rejected', reason: 'Travel' },
  ];
  return withLeaveDefaults(employeeId ? all.filter(l => String(l.employeeId) === String(employeeId)) : all);
}

function getMockAnnouncements() {
  return withAnnouncementDefaults([
    { id: 'A1', title: 'Q1 Town Hall', message: 'Join us for the quarterly town hall on Friday at 3pm.', author: 'HR', date: new Date().toISOString() },
    { id: 'A2', title: 'New Benefits', message: 'We have updated our benefits package. Check your email for details.', author: 'HR', date: new Date().toISOString() },
  ]);
}
