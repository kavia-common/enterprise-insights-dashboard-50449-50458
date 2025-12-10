//
// Inventory services with graceful fallback to mock data.
// Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL if available (no new env vars introduced).
//

// PUBLIC_INTERFACE
export function getApiBase() {
  /**
   * Returns the prioritized API base URL from environment variables.
   * Order: REACT_APP_API_BASE -> REACT_APP_BACKEND_URL -> '' (empty)
   */
  const a = process.env.REACT_APP_API_BASE || '';
  const b = process.env.REACT_APP_BACKEND_URL || '';
  return (a || b || '').replace(/\/$/, '');
}

// PUBLIC_INTERFACE
export function getFeatureFlags() {
  /**
   * Parses REACT_APP_FEATURE_FLAGS into a boolean map. Example: "inventory=true,experiments"
   * Any key present (with or without '=true') is treated as true. Keys with '=false' are false.
   */
  const flagsStr = process.env.REACT_APP_FEATURE_FLAGS || '';
  const parts = flagsStr.split(',').map(s => s.trim()).filter(Boolean);
  const obj = {};
  for (const part of parts) {
    const [k, v] = part.split('=').map(s => s?.trim());
    if (!k) continue;
    if (typeof v === 'undefined') obj[k] = true;
    else obj[k] = String(v).toLowerCase() !== 'false';
  }
  return obj;
}

// Utility to fetch with fallback
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
export async function fetchInventoryItems() {
  /**
   * Fetch inventory items.
   * GET /inventory/items
   * Returns: [{ id, name, sku, category, stock, unit, threshold, lastUpdated }]
   */
  const base = getApiBase();
  if (base) {
    const data = await tryFetchJson(`${base}/inventory/items`, { headers: { Accept: 'application/json' } });
    if (Array.isArray(data)) return withItemDefaults(data);
  }
  return getMockInventoryItems();
}

// PUBLIC_INTERFACE
export async function fetchLowStock() {
  /**
   * Fetch low stock items from backend, else compute client-side from items.
   * GET /inventory/low-stock
   */
  const base = getApiBase();
  if (base) {
    const data = await tryFetchJson(`${base}/inventory/low-stock`, { headers: { Accept: 'application/json' } });
    if (Array.isArray(data)) return withItemDefaults(data);
  }
  const all = await fetchInventoryItems();
  return all.filter(it => (Number(it.stock) || 0) <= (Number(it.threshold) || 0));
}

// PUBLIC_INTERFACE
export async function fetchInventoryNotifications() {
  /**
   * Fetch automated reorder notifications.
   * GET /inventory/notifications
   * Returns: [{ id, sku, product, message, date, status }]
   */
  const base = getApiBase();
  if (base) {
    const data = await tryFetchJson(`${base}/inventory/notifications`, { headers: { Accept: 'application/json' } });
    if (Array.isArray(data)) return withNotifDefaults(data);
  }
  return getMockNotifications();
}

// PUBLIC_INTERFACE
export async function triggerReorder(item) {
  /**
   * Stub handler to trigger reorder action.
   * POST /inventory/reorder?sku=...
   * Returns: { success: boolean, message }
   */
  const base = getApiBase();
  const sku = encodeURIComponent(item?.sku || '');
  if (base && sku) {
    const data = await tryFetchJson(`${base}/inventory/reorder?sku=${sku}`, { method: 'POST', headers: { Accept: 'application/json' } });
    if (data && typeof data === 'object') {
      return { success: !!data.success, message: data.message || 'Reorder requested' };
    }
  }
  // mock response
  return { success: true, message: `Mock reorder placed for ${item?.sku}` };
}

// Helpers

function withItemDefaults(list) {
  return list.map(withItemDefault);
}
function withItemDefault(i) {
  return {
    id: i.id ?? `${i.sku || Math.random().toString(36).slice(2)}`,
    name: i.name ?? 'Product',
    sku: i.sku ?? 'SKU-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
    category: i.category ?? 'General',
    stock: Number.isFinite(i.stock) ? i.stock : Math.floor(Math.random() * 80 + 5),
    unit: i.unit ?? 'pcs',
    threshold: Number.isFinite(i.threshold) ? i.threshold : 20,
    lastUpdated: i.lastUpdated ?? new Date().toISOString(),
  };
}
function withNotifDefaults(list) {
  return list.map(n => ({
    id: n.id ?? Math.random().toString(36).slice(2),
    sku: n.sku ?? 'SKU-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
    product: n.product ?? 'Product',
    message: n.message ?? 'Auto-reorder threshold reached',
    date: n.date ?? new Date().toISOString(),
    status: n.status ?? 'queued', // queued | sent | failed
  }));
}

// Mock generators

function getMockInventoryItems() {
  const items = [
    { id: 'P-001', name: 'Wireless Mouse', sku: 'WM-100', category: 'Peripherals', stock: 42, unit: 'pcs', threshold: 20 },
    { id: 'P-002', name: 'Mechanical Keyboard', sku: 'MK-200', category: 'Peripherals', stock: 12, unit: 'pcs', threshold: 15 },
    { id: 'P-003', name: 'USB-C Cable', sku: 'UC-050', category: 'Cables', stock: 0, unit: 'pcs', threshold: 25 },
    { id: 'P-004', name: '27" Monitor', sku: 'MN-270', category: 'Displays', stock: 8, unit: 'pcs', threshold: 10 },
    { id: 'P-005', name: 'Laptop Stand', sku: 'LS-310', category: 'Accessories', stock: 58, unit: 'pcs', threshold: 12 },
    { id: 'P-006', name: 'External SSD 1TB', sku: 'ES-1TB', category: 'Storage', stock: 19, unit: 'pcs', threshold: 20 },
  ];
  // Spread realistic lastUpdated
  const now = Date.now();
  return withItemDefaults(
    items.map((it, idx) => ({ ...it, lastUpdated: new Date(now - idx * 3600_000).toISOString() }))
  );
}

function getMockNotifications() {
  const list = [
    { id: 'N1', sku: 'UC-050', product: 'USB-C Cable', message: 'Auto-reorder placed for 200 pcs', date: new Date(Date.now() - 3600_000).toISOString(), status: 'sent' },
    { id: 'N2', sku: 'ES-1TB', product: 'External SSD 1TB', message: 'Threshold reached. Awaiting approval.', date: new Date(Date.now() - 7200_000).toISOString(), status: 'queued' },
  ];
  return withNotifDefaults(list);
}
