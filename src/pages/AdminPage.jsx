import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listTables, queryTable, getContextDetail } from '../api/admin.js';
import { useSessionStore } from '../store/sessionStore.js';

const DEFAULT_TABLE = 'intent_scores';
const PAGE_SIZES   = [25, 50, 100, 200, 500];
const AUTO_REFRESH_MS = 2000;

export default function AdminPage() {
  const { sessionId } = useSessionStore();
  const [tables, setTables] = useState([]);
  const [active, setActive] = useState(DEFAULT_TABLE);
  const [data, setData] = useState(null);
  const [filterSession, setFilterSession] = useState(sessionId || '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [contextDetail, setContextDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // 페이지 변경 시 자동으로 데이터 재조회
  const offset = (page - 1) * pageSize;

  const fetchTables = useCallback(async () => {
    try {
      const t = await listTables();
      setTables(t);
    } catch (e) { console.error(e); }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await queryTable(active, {
        sessionId: filterSession || undefined,
        limit:  pageSize,
        offset,
      });
      setData(d);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [active, filterSession, pageSize, offset]);

  // 초기 로드 + 의존성 변경 시
  useEffect(() => { fetchTables(); }, [fetchTables]);
  useEffect(() => { fetchData(); }, [fetchData]);

  // 테이블/세션 필터 변경 시 페이지 리셋
  useEffect(() => { setPage(1); }, [active, filterSession, pageSize]);

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => { fetchTables(); fetchData(); }, AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [autoRefresh, fetchTables, fetchData]);

  // 테이블을 runtime/catalog/other 로 그룹화
  const groupedTables = useMemo(() => {
    const groups = { runtime: [], catalog: [], other: [] };
    tables.forEach((t) => {
      const k = groups[t.kind] ? t.kind : 'other';
      groups[k].push(t);
    });
    return groups;
  }, [tables]);

  return (
    <div className="admin-page">
      <header className="admin-head">
        <div className="container head-row">
          <div>
            <h1>관리자 화면 — DB 조회</h1>
            <p className="muted">3-Layer Engine이 적재하는 모든 데이터 (실시간 + 카탈로그)</p>
          </div>
          <div className="head-ctrl">
            <Link to="/" className="btn">데모 화면 ↗</Link>
          </div>
        </div>
      </header>

      <div className="container body">
        <aside className="sidebar">
          {(['runtime', 'catalog', 'other']).map((kind) => {
            const list = groupedTables[kind];
            if (!list || list.length === 0) return null;
            return (
              <div key={kind} className="group">
                <h3>{kindLabel(kind)}</h3>
                <ul className="table-list">
                  {list.map((t) => (
                    <li key={t.name} className={t.name === active ? 'on' : ''}
                        onClick={() => { setActive(t.name); setContextDetail(null); }}>
                      <div className="t-label">{t.label}</div>
                      <div className="t-meta">
                        <code>{t.name}</code>
                        <span className="cnt">{t.row_count.toLocaleString()}행</span>
                      </div>
                      {t.description && <div className="t-desc">{t.description}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </aside>

        <main className="content">
          <div className="content-head">
            <div>
              <h2>
                {data?.label || active}
                {data?.kind && <span className={`kind-tag ${data.kind}`}>{kindLabel(data.kind)}</span>}
              </h2>
              <div className="meta">
                {data && (
                  <>
                    <span>총 <strong>{data.total.toLocaleString()}</strong>행</span>
                    {data.total > 0 && (
                      <span>{offset + 1}–{Math.min(offset + data.rows.length, data.total)} 표시</span>
                    )}
                    {loading && <span className="loading">갱신 중...</span>}
                  </>
                )}
              </div>
            </div>
            <div className="filters">
              <label className="auto-refresh">
                <input type="checkbox" checked={autoRefresh}
                       onChange={(e) => setAutoRefresh(e.target.checked)} />
                자동 새로고침
              </label>
              <input
                className="session-filter"
                placeholder="세션 ID 필터 (선택)"
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
              />
              <button className="btn" onClick={() => { fetchTables(); fetchData(); }}>새로고침</button>
            </div>
          </div>

          {!data ? (
            <div className="empty">로딩 중...</div>
          ) : data.rows.length === 0 ? (
            <div className="empty">데이터 없음</div>
          ) : (
            <DataTable
              columns={data.columns}
              rows={data.rows}
              tableName={active}
              onViewContext={async (id) => {
                const detail = await getContextDetail(id);
                setContextDetail(detail);
              }}
            />
          )}

          {data && data.page_count > 1 && (
            <Pagination
              page={page}
              pageCount={data.page_count}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </main>

        {contextDetail && (
          <div className="ctx-modal" onClick={() => setContextDetail(null)}>
            <div className="ctx-body" onClick={(e) => e.stopPropagation()}>
              <div className="ctx-head">
                <h3>Customer Context #{contextDetail.id}</h3>
                <span className="muted">{contextDetail.session_id} · stage = {contextDetail.stage}</span>
                <button className="btn close" onClick={() => setContextDetail(null)}>닫기</button>
              </div>
              <pre>{JSON.stringify(contextDetail.context_json, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-page { min-height: 100vh; background: #f8fafc; }
        .admin-head { background: white; border-bottom: 2px solid var(--border); padding: 1.5rem 0; }
        .head-row { display: flex; justify-content: space-between; align-items: center; }
        .admin-head h1 { font-size: 1.6rem; margin: 0 0 0.25rem; }
        .muted { color: var(--muted); }
        .body { display: grid; grid-template-columns: 320px 1fr; gap: 1.5rem; padding-top: 1.5rem; padding-bottom: 2rem; }

        .sidebar { background: white; border: 2px solid var(--border); border-radius: 12px; padding: 1rem; height: fit-content; position: sticky; top: 1rem; }
        .group { margin-bottom: 1.25rem; }
        .group:last-child { margin-bottom: 0; }
        .group h3 { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.6rem; padding: 0 0.3rem; }
        .table-list { list-style: none; padding: 0; margin: 0; }
        .table-list li { padding: 0.6rem 0.8rem; border-radius: 8px; cursor: pointer; border: 2px solid transparent; margin-bottom: 0.3rem; }
        .table-list li:hover { background: #f1f5f9; }
        .table-list li.on { background: #eff6ff; border-color: var(--primary); }
        .t-label { font-weight: 700; font-size: 0.95rem; }
        .t-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem; }
        .t-meta code { font-size: 0.75rem; color: var(--muted); background: transparent; padding: 0; }
        .cnt { font-size: 0.75rem; color: var(--primary); font-weight: 700; }
        .t-desc { font-size: 0.78rem; color: var(--muted); margin-top: 0.3rem; line-height: 1.3; }

        .content { background: white; border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem; min-height: 70vh; display: flex; flex-direction: column; }
        .content-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
        .content-head h2 { font-size: 1.3rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
        .kind-tag { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
        .kind-tag.runtime { background: #fef3c7; color: #92400e; }
        .kind-tag.catalog { background: #ddd6fe; color: #5b21b6; }
        .kind-tag.other { background: #e5e7eb; color: var(--muted); }
        .meta { display: flex; gap: 1rem; color: var(--muted); margin-top: 0.3rem; font-size: 0.9rem; align-items: center; }
        .loading { color: var(--accent); font-size: 0.8rem; }
        .filters { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
        .auto-refresh { display: flex; align-items: center; gap: 0.4rem; color: var(--muted); font-size: 0.9rem; }
        .session-filter { padding: 0.5rem 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-family: monospace; font-size: 0.9rem; width: 220px; }
        .empty { text-align: center; color: var(--muted); padding: 4rem; flex: 1; display: flex; align-items: center; justify-content: center; }

        .ctx-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; justify-content: center; align-items: center; z-index: 100; padding: 2rem; }
        .ctx-body { background: white; border-radius: 12px; max-width: 900px; width: 100%; max-height: 80vh; display: flex; flex-direction: column; }
        .ctx-head { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 2px solid var(--border); }
        .ctx-head h3 { margin: 0; flex: 1; }
        .ctx-head .muted { font-size: 0.85rem; margin-right: 1rem; }
        .ctx-head .close { padding: 0.4rem 0.8rem; }
        .ctx-body pre { padding: 1rem 1.5rem; overflow: auto; margin: 0; font-size: 0.85rem; background: #f8fafc; flex: 1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
        @media (max-width: 1024px) { .body { grid-template-columns: 1fr; } .sidebar { position: static; } }
      `}</style>
    </div>
  );
}

function kindLabel(kind) {
  switch (kind) {
    case 'runtime': return '실시간';
    case 'catalog': return '카탈로그';
    default:        return '기타';
  }
}

function DataTable({ columns, rows, tableName, onViewContext }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => <th key={c}>{c}</th>)}
            {tableName === 'customer_contexts' && <th>JSON</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} className={typeof r[c] === 'number' ? 'num' : ''}>
                  {formatCell(c, r[c])}
                </td>
              ))}
              {tableName === 'customer_contexts' && (
                <td>
                  <button className="btn-mini" onClick={() => onViewContext(r.id)}>View</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        .data-table-wrap { overflow-x: auto; max-height: 60vh; overflow-y: auto; flex: 1; }
        .data-table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
        .data-table th, .data-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .data-table th { background: #f1f5f9; position: sticky; top: 0; font-weight: 700; color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
        .data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
        .data-table tr:hover { background: #f8fafc; }
        .btn-mini { padding: 0.25rem 0.6rem; border: 1px solid var(--border); background: white; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
        .btn-mini:hover { background: #eff6ff; border-color: var(--primary); }
      `}</style>
    </div>
  );
}

function Pagination({ page, pageCount, pageSize, onPageChange, onPageSizeChange }) {
  const [jumpInput, setJumpInput] = useState(String(page));
  useEffect(() => { setJumpInput(String(page)); }, [page]);

  function handleJump(e) {
    e.preventDefault();
    const n = parseInt(jumpInput, 10);
    if (!Number.isFinite(n)) return;
    onPageChange(Math.max(1, Math.min(pageCount, n)));
  }

  return (
    <div className="pagination">
      <div className="pg-left">
        <span className="pg-info">
          페이지 <strong>{page}</strong> / {pageCount}
        </span>
        <select className="page-size" value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))}>
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}행씩</option>)}
        </select>
      </div>

      <div className="pg-right">
        <button className="pg-btn" disabled={page === 1} onClick={() => onPageChange(1)}>« 처음</button>
        <button className="pg-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹ 이전</button>
        <form onSubmit={handleJump} className="pg-jump">
          <input
            type="text"
            value={jumpInput}
            onChange={(e) => setJumpInput(e.target.value)}
            onBlur={handleJump}
          />
          / {pageCount}
        </form>
        <button className="pg-btn" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>다음 ›</button>
        <button className="pg-btn" disabled={page === pageCount} onClick={() => onPageChange(pageCount)}>마지막 »</button>
      </div>

      <style>{`
        .pagination { display: flex; justify-content: space-between; align-items: center; gap: 1rem;
                      margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border); flex-wrap: wrap; }
        .pg-left, .pg-right { display: flex; align-items: center; gap: 0.5rem; }
        .pg-info { color: var(--muted); }
        .page-size { padding: 0.4rem 0.6rem; border: 2px solid var(--border); border-radius: 8px; font-size: 0.9rem; background: white; }
        .pg-btn { padding: 0.4rem 0.8rem; border: 2px solid var(--border); background: white; border-radius: 8px;
                  cursor: pointer; font-weight: 600; font-size: 0.9rem; }
        .pg-btn:hover:not(:disabled) { border-color: var(--primary); background: #eff6ff; }
        .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pg-jump { display: flex; align-items: center; gap: 0.4rem; color: var(--muted); }
        .pg-jump input { width: 60px; padding: 0.4rem 0.5rem; border: 2px solid var(--border); border-radius: 8px;
                         text-align: center; font-variant-numeric: tabular-nums; }
      `}</style>
    </div>
  );
}

function formatCell(col, val) {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (col.endsWith('_score') || col === 'realtime_boost') return val.toFixed(3);
    return String(val);
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return val.slice(0, 19).replace('T', ' ');
  }
  return String(val);
}
