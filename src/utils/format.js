export const AUTO_REFRESH_MS = 2000;

// DB 셀 표시 포매터. date: 'full' → 'YYYY-MM-DD HH:MM:SS' | 'time' → 'HH:MM:SS'
export function formatCell(col, val, { date = 'full' } = {}) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (col.endsWith('_score') || col === 'delta_score') return val.toFixed(3);
    return String(val);
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return date === 'time' ? val.slice(11, 19) : val.slice(0, 19).replace('T', ' ');
  }
  return String(val);
}
