import { useState, useEffect, useCallback } from 'react';
import { queryTable } from '../api/admin.js';
import { AUTO_REFRESH_MS } from '../utils/format.js';

// queryTable + auto-refresh 공통 패턴. transform: 응답 후처리(예: 최신배치 정렬).
export function useTableQuery({ table, params, transform, intervalMs = AUTO_REFRESH_MS, enabled = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const key = JSON.stringify(params);   // params 변경 감지

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const d = await queryTable(table, params);
      setData(transform ? transform(d) : d);
      setOk(true);
    } catch { setOk(false); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, key, enabled]);

  useEffect(() => {
    reload();
    if (!intervalMs) return;
    const t = setInterval(reload, intervalMs);
    return () => clearInterval(t);
  }, [reload, intervalMs]);

  return { data, loading, ok, reload };
}
