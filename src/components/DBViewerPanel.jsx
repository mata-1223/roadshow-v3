// DB 조회 패널 — 3-Layer Engine이 적재하는 데이터를 화면에 임베드해서 실시간으로 보여준다.
// (기존 /admin 라우트의 경량 임베드 버전. 세션 필터 + 자동 새로고침)
import { useState } from 'react';
import { useTableQuery } from '../hooks/useTableQuery.js';
import { formatCell } from '../utils/format.js';

// 테이블별 탭 라벨
const TAB_LABEL = {
  event_log:         '행동 로그',
  intent_scores:     'Intent Score',
  customer_contexts: 'Context',
  sessions:          '세션',
  survey_answers:    '설문 답변',
};

// 컴팩트 노출용 컬럼 화이트리스트 (없으면 전체 컬럼)
const COLS = {
  event_log:         ['step', 'behavior_id', 'event_type', 'entity', 'occurred_at'],
  intent_scores:     ['rank', 'intent_id', 'final_score', 'delta_score', 'rank_change', 'inference_type'],
  customer_contexts: ['id', 'stage', 'created_at'],
  sessions:          ['id', 'scenario_id', 'stage', 'created_at'],
  survey_answers:    ['question_id', 'answer_code'],
};

// intent_scores는 가장 최근 추론 배치만 골라 Rank순 정렬해 보여준다.
// 한 번의 재추론(executemany)은 113행을 수 ms 내에 적재하므로 computed_at이 행마다
// 미세하게 다르다. 반면 배치 사이에는 사용자 클릭 간격(수 초)이 존재한다.
// → computed_at 내림차순으로 정렬 후 "첫 큰 시간 간격" 이전까지를 최신 배치로 본다.
const BATCH_GAP_MS = 200;
function latestRankedBatch(rows) {
  if (!rows.length) return rows;
  const sorted = [...rows].sort((a, b) => (a.computed_at < b.computed_at ? 1 : -1)); // desc
  const t = sorted.map((r) => new Date(r.computed_at).getTime());
  let cut = sorted.length;
  for (let i = 1; i < sorted.length; i++) {
    if (t[i - 1] - t[i] > BATCH_GAP_MS) { cut = i; break; }
  }
  return sorted.slice(0, cut).sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));
}

export default function DBViewerPanel({
  sessionId,
  tables = ['event_log', 'intent_scores', 'customer_contexts'],
  defaultTable,
  limit = 8,
  title = 'DB 조회',
}) {
  const [active, setActive] = useState(defaultTable || tables[0]);

  // intent_scores는 최근 배치(113개)를 통째로 받아 Rank순 재정렬해야 하므로 넉넉히 조회
  const isIntent = active === 'intent_scores';
  const { data, ok: live } = useTableQuery({
    table: active,
    params: { sessionId: sessionId || undefined, limit: isIntent ? 130 : limit, offset: 0 },
    transform: (d) => (isIntent ? { ...d, rows: latestRankedBatch(d.rows) } : d),
  });

  const cols = data ? (COLS[active] || data.columns).filter((c) => data.columns.includes(c)) : [];

  return (
    <div className="db-panel">
      <div className="db-head">
        <h3>{title}</h3>
        <span className={`db-live ${live ? 'on' : ''}`}>● {live ? '실시간 적재' : '연결 대기'}</span>
      </div>

      <div className="db-tabs">
        {tables.map((t) => (
          <button key={t} className={`db-tab ${t === active ? 'on' : ''}`} onClick={() => setActive(t)}>
            {TAB_LABEL[t] || t}
            {data && t === active && <span className="db-total">{data.total.toLocaleString()}</span>}
          </button>
        ))}
      </div>

      {active === 'intent_scores' && data && data.rows.length > 0 && (
        <p className="db-caption">
          가장 최근 추론(stage = {data.rows[0].stage}) · Rank순 · {data.rows.length}개
        </p>
      )}

      <div className="db-table-wrap">
        {!data ? (
          <div className="db-empty">로딩 중…</div>
        ) : data.rows.length === 0 ? (
          <div className="db-empty">{sessionId ? '아직 적재된 데이터 없음 — 행동을 선택하면 채워집니다' : '데이터 없음'}</div>
        ) : (
          <table className="db-table">
            <thead>
              <tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td key={c} className={typeof r[c] === 'number' ? 'num' : ''}>{formatCell(c, r[c], { date: 'time' })}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .db-panel { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem; }
        .db-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.75rem; }
        .db-head h3 { margin: 0; }
        .db-live { font-size: 0.78rem; font-weight: 700; color: var(--muted); }
        .db-live.on { color: #16a34a; }
        .db-tabs { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
        .db-tab { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.7rem;
                  border: 2px solid var(--border); background: #f8fafc; border-radius: 999px;
                  font-size: 0.82rem; font-weight: 600; color: var(--muted); }
        .db-tab.on { border-color: var(--primary); background: #eff6ff; color: var(--primary); }
        .db-total { background: var(--primary); color: white; border-radius: 999px; padding: 0 0.4rem; font-size: 0.7rem; }
        .db-caption { margin: 0 0 0.5rem; font-size: 0.78rem; color: var(--muted); font-weight: 600; }
        .db-table-wrap { overflow-x: auto; max-height: 32vh; overflow-y: auto; border: 1px solid var(--border); border-radius: 10px; }
        .db-table { border-collapse: collapse; width: 100%; font-size: 0.8rem; }
        .db-table th, .db-table td { padding: 0.4rem 0.6rem; text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .db-table th { background: #f1f5f9; position: sticky; top: 0; font-weight: 700; color: var(--muted);
                       font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.03em; }
        .db-table td.num { text-align: right; font-variant-numeric: tabular-nums; }
        .db-table tr:hover { background: #f8fafc; }
        .db-empty { text-align: center; color: var(--muted); padding: 1.5rem 1rem; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
