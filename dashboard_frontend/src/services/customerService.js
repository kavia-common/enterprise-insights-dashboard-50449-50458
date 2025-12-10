//
// Customer Management services with graceful fallback to mock data.
// Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL if available.
// Mock fallback is always available; visibility controlled via feature flag "customers".
//


// PUBLIC_INTERFACE
export function getApiBase() {
  /** Returns the prioritized API base URL from environment variables. */
  const a = process.env.REACT_APP_API_BASE || '';
  const b = process.env.REACT_APP_BACKEND_URL || '';
  return (a || b || '').replace(/\/$/, '');
}

// PUBLIC_INTERFACE
export function getFeatureFlags() {
  /** Parse REACT_APP_FEATURE_FLAGS into a boolean map. */
  const str = process.env.REACT_APP_FEATURE_FLAGS || '';
  return str
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const [k, v] = entry.split('=').map(x => x?.trim());
      if (!k) return acc;
      acc[k] = typeof v === 'undefined' ? true : String(v).toLowerCase() !== 'false';
      return acc;
    }, {});
}

async function tryFetchJson(url, init) {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (_e) {
    return null;
  }
}

// PUBLIC_INTERFACE
export async function fetchCustomers(params = {}) {
  /**
   * Fetch the list of customers.
   * GET /customers?search=&sort=&dir=&status=
   * Returns: [{ id, name, email, company, phone, status, lastContact, openTickets, tags: [] }]
   */
  const base = getApiBase();
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  if (params.dir) qs.set('dir', params.dir);
  if (params.status) qs.set('status', params.status);

  if (base) {
    const data = await tryFetchJson(`${base}/customers${qs.toString() ? `?${qs}` : ''}`, { headers: { Accept: 'application/json' } });
    if (Array.isArray(data)) return withCustomerDefaults(data);
  }
  return getMockCustomers(params);
}

// PUBLIC_INTERFACE
export async function fetchCustomerById(id) {
  /**
   * Fetch a single customer by id.
   * GET /customers/:id
   */
  const base = getApiBase();
  if (base) {
    const data = await tryFetchJson(`${base}/customers/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } });
    if (data && typeof data === 'object') return withCustomerDefault(data);
  }
  const mock = getMockCustomers().find(c => String(c.id) === String(id));
  return mock || withCustomerDefault({ id, name: 'Unknown', email: 'unknown@example.com', company: 'N/A', phone: '-', status: 'Prospect', lastContact: new Date().toISOString(), openTickets: 0, tags: [] });
}

// PUBLIC_INTERFACE
export async function fetchCustomerTimeline(id) {
  /**
   * Fetch recent calls/messages timeline for a customer.
   * GET /customers/:id/timeline
   * Returns: [{ id, type: 'call'|'message'|'note', date, summary, agent }]
   */
  const base = getApiBase();
  if (base) {
    const data = await tryFetchJson(`${base}/customers/${encodeURIComponent(id)}/timeline`, { headers: { Accept: 'application/json' } });
    if (Array.isArray(data)) return withTimelineDefaults(data);
  }
  return getMockTimeline(id);
}

// PUBLIC_INTERFACE
export async function fetchCustomerTickets(id, params = {}) {
  /**
   * Fetch current/open tickets for a customer.
   * GET /customers/:id/tickets?status=open|pending|closed
   * Returns: [{ id, subject, status, priority, openedAt, updatedAt }]
   */
  const base = getApiBase();
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (base) {
    const data = await tryFetchJson(`${base}/customers/${encodeURIComponent(id)}/tickets${qs.toString() ? `?${qs}` : ''}`, { headers: { Accept: 'application/json' } });
    if (Array.isArray(data)) return withTicketDefaults(data);
  }
  return getMockTickets(id, params.status);
}

// PUBLIC_INTERFACE
export async function updateCustomer(id, payload) {
  /**
   * Update customer profile.
   * PUT /customers/:id
   */
  const base = getApiBase();
  if (base) {
    const data = await tryFetchJson(`${base}/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (data && typeof data === 'object') return withCustomerDefault(data);
  }
  // mock optimistic update
  const orig = await fetchCustomerById(id);
  return { ...orig, ...payload };
}

// Helpers: defaults
function withCustomerDefaults(list) {
  return list.map(withCustomerDefault);
}
function withCustomerDefault(c) {
  return {
    id: c.id ?? Math.random().toString(36).slice(2),
    name: c.name ?? 'Customer',
    email: c.email ?? 'customer@example.com',
    company: c.company ?? 'Acme Inc',
    phone: c.phone ?? '-',
    status: c.status ?? 'Active', // Active | Prospect | Churn Risk | Inactive
    lastContact: c.lastContact ?? new Date().toISOString(),
    openTickets: Number.isFinite(c.openTickets) ? c.openTickets : 0,
    tags: Array.isArray(c.tags) ? c.tags : [],
  };
}
function withTimelineDefaults(list) {
  return list.map(t => ({
    id: t.id ?? Math.random().toString(36).slice(2),
    type: t.type ?? 'note',
    date: t.date ?? new Date().toISOString(),
    summary: t.summary ?? 'Interaction logged',
    agent: t.agent ?? 'System',
  }));
}
function withTicketDefaults(list) {
  return list.map(x => ({
    id: x.id ?? Math.random().toString(36).slice(2),
    subject: x.subject ?? 'Support Ticket',
    status: x.status ?? 'open', // open|pending|closed
    priority: x.priority ?? 'normal', // low|normal|high|urgent
    openedAt: x.openedAt ?? new Date().toISOString(),
    updatedAt: x.updatedAt ?? new Date().toISOString(),
  }));
}

// Mocks
function getMockCustomers(params = {}) {
  const base = [
    { id: 'C1', name: 'Acme Purchasing', email: 'purchasing@acme.com', company: 'Acme Corp', phone: '+1 555-1212', status: 'Active', lastContact: new Date(Date.now() - 3600_000).toISOString(), openTickets: 1, tags: ['enterprise', 'priority'] },
    { id: 'C2', name: 'Globex IT', email: 'it@globex.com', company: 'Globex', phone: '+44 20 7946 0958', status: 'Churn Risk', lastContact: new Date(Date.now() - 86400_000 * 2).toISOString(), openTickets: 2, tags: ['europe'] },
    { id: 'C3', name: 'Initech Ops', email: 'ops@initech.com', company: 'Initech', phone: '+1 415-555-8989', status: 'Prospect', lastContact: new Date(Date.now() - 86400_000 * 10).toISOString(), openTickets: 0, tags: ['trial'] },
    { id: 'C4', name: 'Umbrella Support', email: 'support@umbrella.co', company: 'Umbrella Co', phone: '+81 3-1234-5678', status: 'Active', lastContact: new Date(Date.now() - 7200_000).toISOString(), openTickets: 3, tags: ['priority', 'sla'] },
  ];
  const q = String(params.search || '').toLowerCase();
  const filtered = q
    ? base.filter(c =>
        [c.name, c.email, c.company, c.phone, c.status, ...(c.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : base;
  return withCustomerDefaults(filtered);
}

function getMockTimeline(customerId) {
  const now = Date.now();
  const list = [
    { id: 'T1', type: 'call', date: new Date(now - 3600_000).toISOString(), summary: '30 min call about renewal terms', agent: 'Alex W' },
    { id: 'T2', type: 'message', date: new Date(now - 7200_000).toISOString(), summary: 'Email: Sent revised pricing proposal', agent: 'Nina S' },
    { id: 'T3', type: 'note', date: new Date(now - 3 * 3600_000).toISOString(), summary: 'Meeting scheduled next Tue 10am PT', agent: 'System' },
  ];
  return withTimelineDefaults(list.map(t => ({ ...t, id: `${customerId}-${t.id}` })));
}

function getMockTickets(customerId, statusFilter) {
  const list = [
    { id: 'K1', subject: 'Cannot access portal', status: 'open', priority: 'high', openedAt: new Date(Date.now() - 5 * 3600_000).toISOString(), updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
    { id: 'K2', subject: 'Billing discrepancy', status: 'pending', priority: 'normal', openedAt: new Date(Date.now() - 86400_000).toISOString(), updatedAt: new Date(Date.now() - 6 * 3600_000).toISOString() },
    { id: 'K3', subject: 'Feature request: SSO', status: 'closed', priority: 'low', openedAt: new Date(Date.now() - 86400_000 * 4).toISOString(), updatedAt: new Date(Date.now() - 86400_000 * 2).toISOString() },
  ];
  const filtered = statusFilter ? list.filter(k => k.status === statusFilter) : list;
  return withTicketDefaults(filtered.map(k => ({ ...k, id: `${customerId}-${k.id}` })));
}
