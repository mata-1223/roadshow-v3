// 활용 예시 — "Context → Intent → Action" 흐름의 채널별 산출물 예시.
// 현재 분포 상위 Intent 중 Action이 정의된 "가장 매칭되는" Intent를 골라,
// 앱 Push(휴대폰 푸시 알림) / 고객센터 상담사 컨텍스트 / AI Agent 3채널을 동시에 표출한다.

import ktAppIcon from '../assets/kt-app-icon.png';

const FALLBACK_ICON = { push: '📱', call_center: '📞', agent: '🤖' };

// 휴대폰 락스크린 푸시 알림 목업
function PhonePush({ message }) {
  return (
    <div className="phone-push">
      <div className="pp-island" />
      <div className="pp-status"><span>9:41</span><span className="pp-sig">5G ▦ ▮</span></div>
      <div className="pp-date">6월 10일 화요일</div>
      <div className="pp-time">9:41</div>
      <div className="pp-notif">
        <img className="pp-icon" src={ktAppIcon} alt="마이케이티" />
        <div className="pp-ncontent">
          <div className="pp-nrow"><span className="pp-napp">마이케이티</span><span className="pp-ntime">지금</span></div>
          <div className="pp-nmsg">{message}</div>
        </div>
      </div>
      <div className="pp-home" />
    </div>
  );
}

// 고객센터 상담사 콘솔 화면 목업
function AgentConsole({ situation, guidance }) {
  return (
    <div className="cc-console">
      <div className="cc-bar">
        <span className="cc-dots"><i /><i /><i /></span>
        <span className="cc-title">상담 콘솔 · 고객 상담 화면 예시</span>
        <span className="cc-live">● 통화중</span>
      </div>
      <div className="cc-body">
        <div className="cc-customer">
          <span className="cc-ava">👤</span>
          <div className="cc-cinfo"><b>고객</b><small>마이케이티 · 상담 연결됨</small></div>
        </div>
        <div className="cc-banner">
          <div className="cc-bh"><span className="cc-spark">✨</span> AI 실시간 상담 컨텍스트</div>
          <div className="cc-row"><span className="cc-tag">상황</span><span>{situation}</span></div>
          <div className="cc-row"><span className="cc-tag">안내</span><span>{guidance}</span></div>
        </div>
      </div>
    </div>
  );
}

// AI Agent 발화 말풍선 목업
function AgentBubble({ message }) {
  return (
    <div className="agent-chat">
      <div className="ab-avatar">🤖</div>
      <div className="ab-bubble">
        <div className="ab-typing"><span /><span /><span /></div>
        <div className="ab-msg">{message}</div>
      </div>
    </div>
  );
}

export default function ActionPanel({ actionsData, topN = [] }) {
  const channels = actionsData?.channels || [];
  const actionsMap = actionsData?.actions || {};

  const best = topN.find((t) => actionsMap[t.intent_id]);
  const act = best ? actionsMap[best.intent_id] : null;

  return (
    <div className="action-panel">
      <h2>활용 예시</h2>
      <p className="caption">가장 매칭되는 Intent의 채널별 활용 예시 — Context → Intent → Action</p>

      {!act ? (
        <div className="ac-empty">상위 Intent에 매칭된 활용 예시가 없습니다. 행동을 선택하면 갱신됩니다.</div>
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
                  {c.id === 'push' ? (
                    <>
                      {act.service && (
                        <div className="ac-service"><span className="ac-service-tag">추천 서비스</span>{act.service}</div>
                      )}
                      <PhonePush message={body} />
                    </>
                  ) : c.id === 'agent' ? (
                    <AgentBubble message={body} />
                  ) : typeof body === 'object' ? (
                    <AgentConsole situation={body.situation} guidance={body.guidance} />
                  ) : (
                    <div className="ac-msg">{body}</div>
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
        .ac-service { display: flex; align-items: center; gap: 0.4rem; font-size: 0.92rem; font-weight: 700;
                      color: #6d28d9; margin-bottom: 0.5rem; }
        .ac-service-tag { font-size: 0.68rem; font-weight: 800; color: #6d28d9; background: #f3e8ff;
                          padding: 0.12rem 0.45rem; border-radius: 5px; }
        .ch-agent .ac-msg { color: var(--primary); font-weight: 600; }
        .ac-ctx { display: flex; flex-direction: column; gap: 0.4rem; }
        .ac-ctx-row { display: grid; grid-template-columns: 2.6rem 1fr; gap: 0.5rem; align-items: start; font-size: 0.92rem; line-height: 1.4; }
        .ac-tag { font-size: 0.72rem; font-weight: 700; color: #475569; background: #f1f5f9;
                  padding: 0.1rem 0.4rem; border-radius: 5px; text-align: center; }

        /* 휴대폰 락스크린 푸시 목업 */
        .phone-push { width: 184px; margin: 0.4rem auto 0.1rem; background: linear-gradient(170deg,#0b1220,#1e293b);
                      border-radius: 26px; padding: 7px 9px 11px; border: 4px solid #0f172a;
                      box-shadow: 0 8px 20px rgba(15,23,42,.28); position: relative; }
        .pp-island { width: 56px; height: 15px; background: #000; border-radius: 999px; margin: 1px auto 7px; }
        .pp-status { display: flex; justify-content: space-between; padding: 0 7px; color: #fff;
                     font-size: 9px; font-weight: 700; }
        .pp-sig { letter-spacing: 1px; }
        .pp-date { text-align: center; color: #cbd5e1; font-size: 9.5px; font-weight: 600; margin-top: 14px; }
        .pp-time { text-align: center; color: #fff; font-size: 34px; font-weight: 300; line-height: 1; letter-spacing: 1px; }
        .pp-notif { display: flex; gap: 7px; align-items: flex-start; background: rgba(248,250,252,.96);
                    border-radius: 14px; padding: 8px 9px; margin: 18px 2px 0; text-align: left;
                    box-shadow: 0 2px 10px rgba(0,0,0,.25); }
        .pp-icon { width: 27px; height: 27px; border-radius: 7px; object-fit: cover; flex: none;
                   box-shadow: 0 1px 3px rgba(0,0,0,.2); }
        .pp-ncontent { flex: 1; min-width: 0; }
        .pp-nrow { display: flex; justify-content: space-between; align-items: baseline; }
        .pp-napp { font-size: 10.5px; font-weight: 800; color: #0f172a; }
        .pp-ntime { font-size: 9.5px; color: #64748b; }
        .pp-nmsg { font-size: 11px; color: #1e293b; line-height: 1.35; margin-top: 2px; font-weight: 600; }
        .pp-home { width: 64px; height: 4px; background: rgba(255,255,255,.6); border-radius: 999px; margin: 13px auto 0; }

        /* AI Agent 발화 말풍선 */
        .agent-chat { display: flex; align-items: flex-end; gap: 8px; margin-top: 0.3rem; }
        .ab-avatar { width: 32px; height: 32px; border-radius: 50%; flex: none; display: flex; align-items: center;
                     justify-content: center; font-size: 17px; background: #ede9fe; border: 1.5px solid #ddd6fe; }
        .ab-bubble { position: relative; background: var(--primary); color: #fff; border-radius: 14px 14px 14px 4px;
                     padding: 0.65rem 0.85rem; max-width: 88%; box-shadow: 0 2px 8px rgba(37,99,235,.22); }
        .ab-bubble::before { content: ''; position: absolute; left: -6px; bottom: 0; width: 0; height: 0;
                     border: 6px solid transparent; border-right-color: var(--primary); border-bottom: 0; }
        .ab-msg { font-size: 0.97rem; line-height: 1.45; font-weight: 600; }
        .ab-typing { display: flex; gap: 3px; margin-bottom: 5px; }
        .ab-typing span { width: 5px; height: 5px; border-radius: 50%; background: rgba(255,255,255,.7);
                     animation: ab-blink 1.2s infinite ease-in-out; }
        .ab-typing span:nth-child(2) { animation-delay: .2s; }
        .ab-typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes ab-blink { 0%,80%,100% { opacity: .3; transform: translateY(0); }
                              40% { opacity: 1; transform: translateY(-2px); } }

        /* 고객센터 상담사 콘솔 화면 */
        .cc-console { border-radius: 12px; overflow: hidden; border: 1.5px solid #cbd5e1;
                      box-shadow: 0 4px 12px rgba(15,23,42,.12); margin-top: 0.3rem; }
        .cc-bar { display: flex; align-items: center; gap: 8px; background: #1e293b; padding: 6px 10px; }
        .cc-dots { display: flex; gap: 4px; }
        .cc-dots i { width: 8px; height: 8px; border-radius: 50%; background: #475569; }
        .cc-dots i:nth-child(1) { background: #ef4444; }
        .cc-dots i:nth-child(2) { background: #f59e0b; }
        .cc-dots i:nth-child(3) { background: #22c55e; }
        .cc-title { font-size: 0.72rem; font-weight: 700; color: #cbd5e1; }
        .cc-live { margin-left: auto; font-size: 0.68rem; font-weight: 800; color: #4ade80; }
        .cc-body { background: #f8fafc; padding: 0.7rem 0.8rem; }
        .cc-customer { display: flex; align-items: center; gap: 8px; margin-bottom: 0.6rem; }
        .cc-ava { width: 30px; height: 30px; border-radius: 50%; background: #e2e8f0; display: flex;
                  align-items: center; justify-content: center; font-size: 15px; flex: none; }
        .cc-cinfo b { display: block; font-size: 0.82rem; font-weight: 800; color: #1e293b; }
        .cc-cinfo small { font-size: 0.7rem; color: #64748b; }
        .cc-banner { background: #fff; border: 1.5px solid #c7d2fe; border-left: 4px solid var(--primary);
                     border-radius: 9px; padding: 0.6rem 0.7rem; }
        .cc-bh { font-size: 0.74rem; font-weight: 800; color: var(--primary); margin-bottom: 0.5rem;
                 display: flex; align-items: center; gap: 4px; }
        .cc-spark { font-size: 0.8rem; }
        .cc-row { display: grid; grid-template-columns: 2.6rem 1fr; gap: 0.5rem; align-items: start;
                  font-size: 0.9rem; line-height: 1.4; color: #1e293b; }
        .cc-row + .cc-row { margin-top: 0.35rem; }
        .cc-tag { font-size: 0.68rem; font-weight: 700; color: #475569; background: #f1f5f9;
                  padding: 0.1rem 0.4rem; border-radius: 5px; text-align: center; }
      `}</style>
    </div>
  );
}
