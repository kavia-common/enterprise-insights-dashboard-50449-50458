//
// Metrics service with graceful fallback to mock data.
// Uses REACT_APP_API_BASE or REACT_APP_BACKEND_URL if available.
// No new env vars are introduced.
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
export async function fetchMetrics(period = 'daily') {
  /**
   * Fetches dashboard metrics for the given period.
   * Attempts backend at /metrics?period={period} if API base is configured.
   * Falls back to mock metrics if backend is not available or returns an error.
   *
   * Params:
   * - period: 'daily' | 'weekly' | 'monthly'
   *
   * Returns:
   * - { kpis: [...], sales: [...], activity: [...], notifications: [...], recent: [...] }
   */
  const base = getApiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/metrics?period=${encodeURIComponent(period)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          return withDefaults(data, period);
        }
      }
      // fallthrough to mock if non-ok
    } catch (_e) {
      // swallow and fallback
    }
  }
  return getMockMetrics(period);
}

function withDefaults(data, period) {
  // Ensure minimum structure; fallback to mock fields when missing
  const mock = getMockMetrics(period);
  return {
    kpis: Array.isArray(data.kpis) ? data.kpis : mock.kpis,
    sales: Array.isArray(data.sales) ? data.sales : mock.sales,
    activity: Array.isArray(data.activity) ? data.activity : mock.activity,
    notifications: Array.isArray(data.notifications) ? data.notifications : mock.notifications,
    recent: Array.isArray(data.recent) ? data.recent : mock.recent,
  };
}

function getMockMetrics(period) {
  const periodMap = {
    daily: { points: 8, label: 'Today' },
    weekly: { points: 8, label: 'This Week' },
    monthly: { points: 12, label: 'This Year' },
  };
  const pconf = periodMap[period] || periodMap.daily;
  const sales = Array.from({ length: pconf.points }).map((_, i) => ({
    x: i,
    y: 40 + Math.round(30 * Math.sin(i / 1.6) + (i * 3) % 15),
  }));
  return {
    kpis: [
      { title: 'Revenue', value: '$1.24M', delta: '+4.2%', trend: 'up' },
      { title: 'Active Users', value: '58,421', delta: '+2.1%', trend: 'up' },
      { title: 'Churn', value: '2.3%', delta: '-0.3%', trend: 'down' },
      { title: 'NPS', value: '47', delta: '+1', trend: 'up' },
    ],
    sales,
    activity: [
      { name: 'On-site', value: '42%' },
      { name: 'Remote', value: '36%' },
      { name: 'PTO', value: '12%' },
      { name: 'OOO', value: '10%' },
    ],
    notifications: [
      { sev: 'high', msg: 'API latency increased in region us-west-2' },
      { sev: 'medium', msg: 'Revenue tracking delay for EU market' },
      { sev: 'low', msg: 'New data source pending verification' },
    ],
    recent: [
      { name: 'Quarterly review scheduled', value: 'Today, 3:00 PM' },
      { name: 'Marketing sync', value: 'Tue, 10:00 AM' },
      { name: 'Release v2.1.0', value: 'Fri, 4:30 PM' },
      { name: 'Team offsite planning', value: 'Next Mon' },
    ],
  };
}
