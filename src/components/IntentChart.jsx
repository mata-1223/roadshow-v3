// Top-N Intent 차트 (Score 바 + L1 색상)

const L1_COLOR = {
  'INT-1000': 'var(--l1-1000)',
  'INT-2000': 'var(--l1-2000)',
  'INT-3000': 'var(--l1-3000)',
  'INT-4000': 'var(--l1-4000)',
  'INT-5000': 'var(--l1-5000)',
  'INT-6000': 'var(--l1-6000)',
  'INT-7000': 'var(--l1-7000)',
};

export default function IntentChart({ topN }) {
  if (!topN || topN.length === 0) {
    return <div className="empty">결과 없음</div>;
  }
  const max = Math.max(...topN.map((t) => t.final_score));

  return (
    <div className="intent-chart">
      {topN.map((t) => (
        <div key={t.intent_id} className="row">
          <div className="meta">
            <div className="rank">#{t.rank}</div>
            <div className="info">
              <div className="name">
                <span className="dot" style={{ background: L1_COLOR[t.L1_id] || '#94a3b8' }} />
                {t.intent_name}
              </div>
              <div className="sub">
                <span className="id">{t.intent_id}</span>
                <span className="type">{t.inference_type}</span>
                <span className="l2">{t.L2_name}</span>
              </div>
            </div>
            <div className="score">{t.final_score.toFixed(2)}</div>
          </div>
          <div className="bar">
            <div className="fill" style={{
              width: `${(t.final_score / Math.max(max, 0.01)) * 100}%`,
              background: L1_COLOR[t.L1_id] || '#94a3b8',
            }} />
            {t.realtime_boost > 0 && (
              <div className="boost-badge">boost +{t.realtime_boost.toFixed(2)}</div>
            )}
          </div>
        </div>
      ))}
      <style>{`
        .intent-chart { display: flex; flex-direction: column; gap: 1rem; }
        .row { background: #f8fafc; border-radius: 12px; padding: 0.75rem 1rem; }
        .meta { display: flex; align-items: center; gap: 0.75rem; }
        .rank { font-weight: 800; font-size: 1.1rem; color: var(--muted); width: 2.5rem; }
        .info { flex: 1; }
        .name { font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .sub { color: var(--muted); font-size: 0.85rem; display: flex; gap: 0.75rem; margin-top: 0.2rem; }
        .id { font-weight: 600; }
        .type { background: white; padding: 0 0.5rem; border-radius: 4px; border: 1px solid var(--border); }
        .score { font-size: 1.3rem; font-weight: 700; color: var(--fg); }
        .bar { margin-top: 0.5rem; height: 8px; background: white; border-radius: 999px; overflow: hidden; position: relative; }
        .fill { height: 100%; transition: width 0.5s ease-out; }
        .boost-badge { position: absolute; top: -22px; right: 0; background: var(--accent); color: white;
                       font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; }
        .empty { color: var(--muted); padding: 2rem; text-align: center; }
      `}</style>
    </div>
  );
}
