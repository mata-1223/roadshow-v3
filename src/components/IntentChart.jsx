// Top-N Intent 차트 (Probability 바 + L1 색상 + Δ Probability·Rank Change 표시)
//
// 페이로드 양식 (서버 → 클라이언트):
//   probability / baseline_probability / delta_probability (0~1)
//   rank / baseline_rank / rank_change
//   intent_nm_ko / L1_id / L1_name / L2_name / inference_type

import { intentName } from '../utils/intent.js';

const L1_COLOR = {
  'INT-1000': 'var(--l1-1000)',
  'INT-2000': 'var(--l1-2000)',
  'INT-3000': 'var(--l1-3000)',
  'INT-4000': 'var(--l1-4000)',
  'INT-5000': 'var(--l1-5000)',
  'INT-6000': 'var(--l1-6000)',
  'INT-7000': 'var(--l1-7000)',
};

function DeltaBadge({ delta }) {
  if (delta === undefined || delta === null) return null;
  const v = Number(delta);
  if (Math.abs(v) < 0.0005) return null;
  const sign = v > 0 ? '+' : '';
  const cls = v > 0 ? 'delta-up' : 'delta-down';
  return <span className={`delta-badge ${cls}`}>Δ {sign}{(v * 100).toFixed(1)}%p</span>;
}

function RankChange({ change }) {
  if (change === undefined || change === null || change === 0) return null;
  const up = change > 0;
  return (
    <span className={`rank-change ${up ? 'up' : 'down'}`}>
      {up ? '▲' : '▼'} {Math.abs(change)}
    </span>
  );
}

// 새/옛 페이로드 양식 호환 헬퍼
const pctOf = (t) => (t.probability ?? t.final_score ?? 0);
const basePctOf = (t) => (t.baseline_probability ?? t.baseline_score);
const deltaOf = (t) => (t.delta_probability ?? t.delta_score);

export default function IntentChart({ topN }) {
  if (!topN || topN.length === 0) {
    return <div className="empty">결과 없음</div>;
  }
  const max = Math.max(...topN.map(pctOf));

  return (
    <div className="intent-chart">
      {topN.map((t) => {
        const p = pctOf(t);
        const baseP = basePctOf(t);
        return (
        <div key={t.intent_id} className="row">
          <div className="meta">
            <div className="rank">
              <div className="rank-num">#{t.rank}</div>
              <RankChange change={t.rank_change} />
            </div>
            <div className="info">
              <div className="name">
                <span className="dot" style={{ background: L1_COLOR[t.L1_id] || '#94a3b8' }} />
                {intentName(t)}
              </div>
              <div className="sub">
                <span className="id">{t.intent_id}</span>
                <span className="type">{t.inference_type}</span>
                <span className="l2">{t.L2_name}</span>
              </div>
            </div>
            <div className="score-block">
              <div className="score">{(p * 100).toFixed(1)}%</div>
              <DeltaBadge delta={deltaOf(t)} />
            </div>
          </div>
          <div className="bar">
            <div className="fill" style={{
              width: `${(p / Math.max(max, 0.001)) * 100}%`,
              background: L1_COLOR[t.L1_id] || '#94a3b8',
            }} />
            {baseP !== undefined && (
              <div className="baseline-marker" style={{
                left: `${(baseP / Math.max(max, 0.001)) * 100}%`,
              }} />
            )}
          </div>
        </div>
        );
      })}
      <style>{`
        .intent-chart { display: flex; flex-direction: column; gap: 1rem; }
        .row { background: #f8fafc; border-radius: 12px; padding: 0.75rem 1rem; }
        .meta { display: flex; align-items: center; gap: 0.75rem; }
        .rank { width: 3rem; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .rank-num { font-weight: 800; font-size: 1.1rem; color: var(--muted); }
        .rank-change { font-size: 0.7rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
        .rank-change.up { background: #dcfce7; color: #15803d; }
        .rank-change.down { background: #fee2e2; color: #b91c1c; }
        .info { flex: 1; }
        .name { font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .sub { color: var(--muted); font-size: 0.85rem; display: flex; gap: 0.75rem; margin-top: 0.2rem; }
        .id { font-weight: 600; }
        .type { background: white; padding: 0 0.5rem; border-radius: 4px; border: 1px solid var(--border); }
        .score-block { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .score { font-size: 1.3rem; font-weight: 700; color: var(--fg); }
        .delta-badge { font-size: 0.72rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
        .delta-badge.delta-up { background: #dcfce7; color: #15803d; }
        .delta-badge.delta-down { background: #fef3c7; color: #92400e; }
        .bar { margin-top: 0.5rem; height: 8px; background: white; border-radius: 999px; overflow: hidden; position: relative; }
        .fill { height: 100%; transition: width 0.5s ease-out; }
        .baseline-marker { position: absolute; top: -2px; width: 2px; height: 12px; background: rgba(15,23,42,0.5); }
        .empty { color: var(--muted); padding: 2rem; text-align: center; }
      `}</style>
    </div>
  );
}
