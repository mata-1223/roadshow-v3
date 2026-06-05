// Admin API 클라이언트
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export async function listTables() {
  const r = await fetch(`${BASE}/api/admin/tables`);
  if (!r.ok) throw new Error('Failed to list tables');
  return r.json();
}

export async function queryTable(name, opts = {}) {
  const { sessionId, limit = 50, offset = 0 } = opts;
  const params = new URLSearchParams({ limit, offset });
  if (sessionId) params.set('session_id', sessionId);
  const r = await fetch(`${BASE}/api/admin/tables/${name}?${params}`);
  if (!r.ok) throw new Error('Failed to query table');
  return r.json();
}

export async function getContextDetail(ctxId) {
  const r = await fetch(`${BASE}/api/admin/tables/customer_contexts/${ctxId}`);
  if (!r.ok) throw new Error('Failed to load context');
  return r.json();
}
