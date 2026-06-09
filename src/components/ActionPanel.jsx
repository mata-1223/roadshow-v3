// 추천 액션 / 상담사 컨텍스트 — "Context → Intent → Action" 흐름의 Action 산출물.
// 현재 분포 상위 Intent 중 Action이 정의된 "가장 매칭되는" Intent를 골라,
// 앱 Push / 고객센터 상담사 컨텍스트 / AI Agent 3채널을 동시에 표출한다.
// (actions.json v0.2.0: intent-키 3채널 구조)

const FALLBACK_ICON = { push: '📱', call_center: '📞', agent: '🤖' };

export default function ActionPanel({ actionsData, topN = [] }) {
  const channels = actionsData?.channels || [];
  const actionsMap = actionsData?.actions || {};

  // 분포 상위(rank 순으로 이미 정렬된 topN) 중 Action이 정의된 첫 Intent = 가장 매칭
  const best = topN.find((t) => actionsMap[t.intent_id]);
  const act = best ? actionsMap[best.intent_id] : null;

  return (
    <div className="action-panel">
      <h2>추천 액션 · 상담사 컨텍스트</h2>
      <p className="caption">현재 가장 매칭되는 Intent의 채널별 Action — Context → Intent → Action</p>

      {!act ? (
        <div className="ac-empty">상위 Intent에 매칭된 Action이 없습니다. 행동을 선택하면 갱신됩니다.</div>
      ) : (
        <>
          <div className="ac-match">
            <span className="ac-rank">#{best.rank}</span>
            <span className="ac-iname">{best.intent_nm_ko}</span>
            <span className="ac-iid">{best.intent_id}</span>
            <span className="ac-prob">{(best.probability * 100).toFixed(1)}%</span>
          </div>

          <div className="ac-channels">
            {channels.map((c) => {
              const body = act[c.id];
              if (body == null) return null;
              const icon = c.icon || FALLBACK_ICON[c.id] || '•';
              return (
                <div key={c.id} className={`ac-ch ch-${c.id}`}>
                  <div className="ac-ch-head">
                    <span className="ac-ch-icon">{icon}</span>
                    <span className="ac-ch-name">{c.name}</span>
                  </div>
                  {typeof body === 'object' ? (
                    <div className="ac-ctx">
                      <div className="ac-ctx-row"><span className="ac-tag">상황</span><span>{body.situation}</span></div>
                      <div className="ac-ctx-row"><span className="ac-tag">안내</span><span>{body.guidance}</span></div>
                    </div>
                  ) : (
                    <div className="ac-msg">{c.id === 'agent' ? `“${body}”` : body}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        .action-panel { }
        .caption { color: var(--muted); margin: 0 0 1rem; }
        .ac-empty { color: var(--muted); font-size: 0.9rem; padding: 2rem 1rem; text-align: center;
                    background: #f8fafc; border: 2px dashed var(--border); border-radius: 12px; }
        .ac-match { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem;
                    padding: 0.6rem 0.9rem; background: #f8fafc; border-radius: 10px; }
        .ac-rank { font-weight: 800; color: var(--primary); }
        .ac-iname { font-weight: 700; font-size: 1.1rem; }
        .ac-iid { font-size: 0.75rem; color: var(--muted); }
        .ac-prob { margin-left: auto; font-weight: 800; color: var(--primary); }
        .ac-channels { display: flex; flex-direction: column; gap: 0.9rem; }
        .ac-ch { border: 2px solid var(--border); border-radius: 14px; padding: 0.9rem 1rem; background: white;
                 border-left: 5px solid var(--border); }
        .ac-ch.ch-push        { border-left-color: #f59e0b; }
        .ac-ch.ch-call_center { border-left-color: #475569; }
        .ac-ch.ch-agent       { border-left-color: var(--primary); }
        .ac-ch-head { display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.45rem; }
        .ac-ch-icon { font-size: 1.1rem; }
        .ac-ch-name { font-weight: 700; font-size: 0.95rem; }
        .ac-msg { font-size: 1rem; color: #1e293b; line-height: 1.45; }
        .ch-agent .ac-msg { color: var(--primary); font-weight: 600; }
        .ac-ctx { display: flex; flex-direction: column; gap: 0.4rem; }
        .ac-ctx-row { display: grid; grid-template-columns: 2.6rem 1fr; gap: 0.5rem; align-items: start; font-size: 0.92rem; line-height: 1.4; }
        .ac-tag { font-size: 0.72rem; font-weight: 700; color: #475569; background: #f1f5f9;
                  padding: 0.1rem 0.4rem; border-radius: 5px; text-align: center; }
      `}</style>
    </div>
  );
}
