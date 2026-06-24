// 활용 예시 — "Context → Intent → Action" 흐름의 채널별 산출물 예시.
// 현재 분포 상위 Intent 중 Action이 정의된 "가장 매칭되는" Intent를 골라,
// 앱 Push(휴대폰 푸시 알림) / 고객센터 상담사 컨텍스트 / AI Agent 3채널을 동시에 표출한다.

import { useEffect, useState } from 'react';
import ktAppIcon from '../assets/kt-app-icon.png';
import { intentName } from '../utils/intent.js';
import { wonText, bundleCardForIntent } from '../utils/bundleSim.js';
import { useSessionStore } from '../store/sessionStore.js';

// 이력 placeholder 기본값(페르소나 미선택 시) — {key}가 비면 일반 표현으로 대체
const HIST_DEFAULT = { fav_genre: '취향 음악', last_meal: '최근 식사', last_watched: '보시던 콘텐츠', home_pref: '평소 설정' };

// 절감액 카운트업 (마운트 시 0→target) — 극적 연출
function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!target) { setV(0); return undefined; }
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

// 🧮 결합 시뮬레이터 카드 — 총액결합할인 중심(내 모바일 요금에서 할인) + 감지된 '왜 나에게'.
function BundleSim({ sim }) {
  const discount = useCountUp(sim.discount || 0);
  return (
    <div className="bsim">
      <div className="bsim-head">
        <span>🧮 결합 시뮬레이터</span>
        <span className="bsim-tag">고객님 맞춤</span>
      </div>

      <div className="bsim-why"><span className="bsim-why-ic">💡</span>{sim.why}</div>

      <div className="bsim-calc">
        {sim.cost != null && (
          <div className="bsim-line">
            <span>{sim.services.join(' + ')} <em>(3년 약정)</em></span>
            <b>월 {wonText(sim.cost)}</b>
          </div>
        )}
        {sim.discount > 0 && (
          <div className="bsim-line disc">
            <span>모바일 결합할인 <em>({sim.mobileLabel || '요금대'} 기준)</em></span>
            <b>−{wonText(sim.discount)}/월</b>
          </div>
        )}
        {sim.net != null && sim.discount > 0 && (
          <div className="bsim-line net">
            <span>실질 부담</span>
            <b>월 {wonText(sim.net)}</b>
          </div>
        )}
      </div>

      {sim.contentOnly ? (
        <div className="bsim-save value">지니TV 콘텐츠 혜택 포함 · 월 {wonText(sim.cost)} 추가</div>
      ) : (
        <div className="bsim-save">
          내 모바일 요금에서 매월 <b>{wonText(discount)}</b> 할인
          <span className="bsim-yr">· 연 {wonText(sim.yearSave)} 절감</span>
        </div>
      )}

      <div className="bsim-perks">{sim.perks.map((p) => <span key={p}>{p}</span>)}</div>
      <div className="bsim-note">※ 3년 약정 기준 · 설치비 별도 · 프로모션 제외</div>
    </div>
  );
}

// 🎁 장기·재약정 고객 특별 혜택 카드 (시뮬레이터 대신)
function BundleLoyalty({ card }) {
  return (
    <div className="bsim bloy">
      <div className="bsim-head">
        <span>🎁 {card.title}</span>
        <span className="bsim-tag">{card.tag}</span>
      </div>
      <div className="bsim-why"><span className="bsim-why-ic">💡</span>{card.why}</div>
      {card.status && (
        <div className="bloy-status">
          {card.status.map((s) => (
            <div key={s.k} className="bloy-srow"><span>{s.k}</span><b>{s.v}</b></div>
          ))}
        </div>
      )}
      {card.status && <div className="bloy-sub">연장 시 받을 수 있는 혜택</div>}
      <div className="bloy-list">
        {card.benefits.map((b) => (
          <div key={b.t} className="bloy-b"><span className="bloy-ic">{b.ic}</span><span>{b.t}</span></div>
        ))}
      </div>
      <div className="bsim-note">{card.note}</div>
    </div>
  );
}

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
        <span className="cc-live"><span className="cc-pulse" />통화중</span>
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

// 🎵 지니뮤직 플레이리스트 카드 목업 (kind: music-card)
function MusicCard({ playlist, desc }) {
  return (
    <div className="gm-card">
      <div className="gm-art">
        <span className="gm-note">🎵</span>
        <span className="gm-eq"><i /><i /><i /><i /></span>
      </div>
      <div className="gm-body">
        <div className="gm-brand">지니뮤직 · 추천 플레이리스트</div>
        <div className="gm-title">{playlist}</div>
        {desc && <div className="gm-desc">{desc}</div>}
        <div className="gm-controls"><span>⏮</span><span className="gm-play">▶</span><span>⏭</span></div>
      </div>
    </div>
  );
}

// 🏠 기가지니 음성 명령 + 홈IoT 기기 동작 목업 (kind: device-voice)
function DeviceVoice({ command, devices = [], desc }) {
  return (
    <div className="gv-card">
      <div className="gv-say">
        <span className="gv-mic">🎙️</span>
        <span className="gv-cmd">“{command}”</span>
      </div>
      <div className="gv-arrow">↓ 기가지니가 집안 환경을 세팅합니다</div>
      <div className="gv-devices">
        {devices.map((d, i) => <span key={i} className="gv-dev">{d}</span>)}
      </div>
      {desc && <div className="gv-desc">{desc}</div>}
    </div>
  );
}

// 🔗 옴니채널 컨텍스트 연속성 — 중앙 고객 Context 자산 DB가 모든 접점에 동일하게 공급
function OmniChannel({ intent }) {
  const channels = [
    { ic: '📱', label: '마이케이티 앱' },
    { ic: '📞', label: '고객센터 상담사' },
    { ic: '🏪', label: '오프라인 방문' },
  ];
  return (
    <div className="cscard omni">
      <div className="cscard-head"><span>🔗 옴니채널 컨텍스트 연속성</span><span className="cscard-tag omni">하나의 Context · 모든 접점</span></div>
      <div className="cscard-why">‘{intent}’ 의도가 <b>고객 Context 자산 DB</b>에 저장되어 모든 접점에서 동일하게 활용됩니다</div>
      <div className="omni-hub">
        <div className="omni-db">
          <span className="omni-db-ic">🗄️</span>
          <div className="omni-db-tx"><b>고객 Context 자산 DB</b><small>의도 · 상태 · 행동</small></div>
        </div>
        <div className="omni-conn"><span>모든 접점에서 동일 Context 활용</span></div>
        <div className="omni-chs">
          {channels.map((c) => (
            <div key={c.label} className="omni-ch"><span className="omni-ic">{c.ic}</span><b>{c.label}</b></div>
          ))}
        </div>
      </div>
      <div className="cscard-note">어느 채널이든 같은 고객 Context로 응대 — 채널 종속이 아닌 고객 종속</div>
    </div>
  );
}

// 📞 상담 전 셀프 해결 안내 — 상담 전 AI 사전 진단으로 셀프 해결 유도
function CallDeflection({ intent, selfText }) {
  return (
    <div className="cscard deflect">
      <div className="cscard-head"><span>📞 상담 전 셀프 해결 안내</span><span className="cscard-tag deflect">상담효율 ↑ · 비용 ↓</span></div>
      <div className="deflect-bubble"><span className="deflect-ava">🤖</span><span>혹시 ‘{intent}’ 때문에 연락하려 하셨나요?</span></div>
      {selfText && <div className="deflect-self"><span className="deflect-self-tag">셀프 해결</span>{selfText}</div>}
      <div className="cscard-note">✅ 셀프로 해결되면 상담 연결 불필요 — 상담 인입·대기시간 감소</div>
    </div>
  );
}

export default function ActionPanel({ actionsData, topN = [], reasoning = null, bundleProfile = null, scenarioId = null }) {
  const channels = actionsData?.channels || [];
  // 상담사 컨텍스트(call_center)는 마지막 행 전체 폭 — 앱 Push·AI Agent를 한 행에 배치
  const orderedChannels = [...channels].sort((a, b) => (a.id === 'call_center' ? 1 : 0) - (b.id === 'call_center' ? 1 : 0));
  const actionsMap = actionsData?.actions || {};

  const personaHistory = useSessionStore((s) => s.personaHistory) || {};
  // 이력 기반 개인화: 액션 텍스트의 {key}를 페르소나 이력으로 치환
  const interp = (s) => (typeof s === 'string'
    ? s.replace(/\{(\w+)\}/g, (m, k) => personaHistory[k] ?? HIST_DEFAULT[k] ?? m) : s);

  const best = topN.find((t) => actionsMap[t.intent_id]);
  const act = best ? actionsMap[best.intent_id] : null;
  // 이력 근거 칩: 매칭 액션에 쓰인 placeholder 중 페르소나 이력에 값이 있는 것
  const histKeys = act
    ? [...new Set((JSON.stringify(act).match(/\{(\w+)\}/g) || []).map((x) => x.slice(1, -1)))].filter((k) => personaHistory[k])
    : [];
  const histChip = histKeys.length ? histKeys.map((k) => personaHistory[k]).join(' · ') : null;
  // 결합 시나리오: 의도에 맞는 카드 — 신규/추가는 시뮬레이터, 재약정/장기는 특별혜택
  const card = bundleProfile ? bundleCardForIntent(bundleProfile, intentName(topN[0])) : null;
  // CS 시나리오: 옴니채널 컨텍스트 연속성 + 셀프 해결 안내 (의도 기반)
  const isCS = scenarioId === 'cs-myk-v3';
  const csIntent = intentName(topN[0]);
  const selfText = interp(act?.agent || act?.push || null);
  const deflectable = isCS && !/(해지|이탈|상담\s*연결)/.test(csIntent || '');

  return (
    <div className="action-panel">
      <h2>활용 예시</h2>

      {!act ? (
        <div className="ac-empty">상위 Intent에 매칭된 활용 예시가 없습니다. 행동을 선택하면 갱신됩니다.</div>
      ) : (
        <>
          <div className="ac-match">
            <span className="ac-rank">#{best.rank}</span>
            <span className="ac-iname">{intentName(best)}</span>
            <span className="ac-iid">{best.intent_id}</span>
            <span className="ac-prob">{(best.probability * 100).toFixed(1)}%</span>
          </div>

          {card?.kind === 'sim' && <BundleSim sim={card} />}
          {card?.kind === 'loyalty' && <BundleLoyalty card={card} />}

          {histChip && (
            <div className="ac-hist">📚 이력 기반 개인화 · <b>{histChip}</b> 반영</div>
          )}

          {act.business_value && (
            <div className="ac-biz">
              <span className="ac-biz-head">💼 비즈니스 임팩트</span>
              <span className="ac-biz-tags">
                <span className="ac-biz-tag">{act.business_value.tag}</span>
                {act.business_value.kpi && <span className="ac-biz-kpi">{act.business_value.kpi}</span>}
              </span>
              {act.business_value.note && <span className="ac-biz-note">{act.business_value.note}</span>}
            </div>
          )}

          <div className="ac-channels">
            {orderedChannels.map((c) => {
              const body = act[c.id];
              if (body == null) return null;
              const icon = c.icon || FALLBACK_ICON[c.id] || '•';
              // kind 기반 범용 렌더러 — 신규 채널은 데이터만 추가하면 동작 (시나리오 특화 코드 지양).
              // kind 미지정(CS·결합 등 기존 채널)은 채널 id로 fallback.
              const kind = c.kind
                || (c.id === 'push' ? 'phone-push'
                  : c.id === 'agent' ? 'chat-bubble'
                  : c.id === 'call_center' ? 'agent-console' : null);
              // CS 셀프 해결 AI Agent — AI Agent 채널에 셀프 해결 안내 통합
              const isSelfAgent = isCS && deflectable && (c.id === 'agent' || kind === 'chat-bubble');
              return (
                <div key={c.id} className={`ac-ch ch-${c.id} kind-${kind || 'text'}`}>
                  <div className="ac-ch-head">
                    <span className="ac-ch-icon">{isSelfAgent ? '🤖' : icon}</span>
                    <span className="ac-ch-name">{isSelfAgent ? '셀프 해결 AI Agent' : c.name}</span>
                    {isSelfAgent && <span className="ac-self-tag">상담효율 ↑ · 비용 ↓</span>}
                  </div>
                  {kind === 'phone-push' ? (
                    <>
                      {act.service && (
                        <div className="ac-service"><span className="ac-service-tag">추천 서비스</span>{interp(act.service)}</div>
                      )}
                      <PhonePush message={interp(body)} />
                    </>
                  ) : kind === 'chat-bubble' ? (
                    <>
                      <AgentBubble message={interp(body)} />
                      {isSelfAgent && (
                        <div className="ac-self-note">✅ 셀프로 해결되면 상담 연결 불필요 — 상담 인입·대기시간 감소</div>
                      )}
                    </>
                  ) : kind === 'agent-console' ? (
                    <AgentConsole
                      situation={interp((reasoning && reasoning.situation_text) || body.situation)}
                      guidance={interp(body.guidance)}
                    />
                  ) : kind === 'music-card' ? (
                    <MusicCard playlist={interp(body.playlist)} desc={interp(body.desc)} />
                  ) : kind === 'device-voice' ? (
                    <DeviceVoice command={interp(body.command)} devices={(body.devices || []).map(interp)} desc={interp(body.desc)} />
                  ) : typeof body === 'object' ? (
                    <AgentConsole situation={interp(body.situation)} guidance={interp(body.guidance)} />
                  ) : (
                    <div className="ac-msg">{interp(body)}</div>
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
        .ac-hist { margin: -0.5rem 0 1rem; padding: 0.4rem 0.7rem; font-size: 0.82rem; font-weight: 700;
                   color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px; }
        .ac-hist b { color: #b45309; }
        .ac-rank { font-weight: 800; color: var(--primary); }
        .ac-iname { font-weight: 700; font-size: 1.1rem; }
        .ac-iid { font-size: 0.75rem; color: var(--muted); }
        .ac-prob { margin-left: auto; font-weight: 800; color: var(--primary); }
        /* 비즈니스 임팩트 배너 */
        .ac-biz { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.7rem; margin-bottom: 1rem;
                  padding: 0.7rem 0.9rem; border-radius: 12px; background: #fafbfc;
                  border: 1px solid var(--border); border-left: 3px solid var(--kt-red); }
        .ac-biz-head { font-size: 0.82rem; font-weight: 800; color: var(--kt-red); }
        .ac-biz-tags { display: inline-flex; gap: 0.4rem; }
        .ac-biz-tag { font-size: 0.8rem; font-weight: 800; color: #fff; background: var(--kt-red);
                      padding: 0.15rem 0.6rem; border-radius: 999px; }
        .ac-biz-kpi { font-size: 0.8rem; font-weight: 800; color: #1d4ed8; background: #dbeafe;
                      padding: 0.15rem 0.6rem; border-radius: 999px; }
        .ac-biz-note { flex-basis: 100%; font-size: 0.86rem; color: #334155; line-height: 1.4; }

        /* 🧮 결합 시뮬레이터 카드 */
        .bsim { margin-bottom: 1rem; border: 1.5px solid var(--kt-red-border); border-radius: 16px; overflow: hidden;
                background: #fff; box-shadow: 0 6px 20px rgba(230,0,45,.08); }
        .bsim-head { display: flex; align-items: center; justify-content: space-between;
                     padding: 0.6rem 0.9rem; background: var(--kt-red-bg); font-weight: 800; color: var(--kt-red-dark); }
        .bsim-tag { font-size: 0.72rem; font-weight: 800; color: #fff; background: var(--kt-red);
                    padding: 0.12rem 0.55rem; border-radius: 999px; }
        .bsim-why { display: flex; align-items: center; gap: 0.45rem; margin: 0.7rem 0.9rem 0;
                    padding: 0.5rem 0.7rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
                    font-size: 0.86rem; font-weight: 700; color: #1e3a5f; }
        .bsim-why-ic { font-size: 1rem; }
        .bsim-calc { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.7rem 0.9rem; }
        .bsim-line { display: flex; justify-content: space-between; align-items: baseline; gap: 0.6rem;
                     font-size: 0.92rem; color: #334155; }
        .bsim-line em { font-style: normal; color: var(--muted); font-size: 0.78rem; font-weight: 600; }
        .bsim-line b { font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .bsim-line.disc b { color: var(--kt-red); }
        .bsim-line.net { border-top: 1px dashed var(--border); padding-top: 0.4rem; }
        .bsim-line.net b { font-size: 1.15rem; }
        .bsim-save { margin: 0 0.9rem; padding: 0.8rem 0.9rem; border-radius: 12px; text-align: center;
                     background: #ecfdf5; border: 1px solid #bbf7d0; color: #065f46; font-size: 1rem; font-weight: 800; }
        .bsim-save b { font-size: 1.7rem; font-weight: 900; color: #059669; font-variant-numeric: tabular-nums; }
        .bsim-save.value { background: #f5f3ff; border-color: #ddd6fe; color: #5b21b6; font-size: 0.95rem; }
        .bsim-yr { display: block; font-size: 0.85rem; font-weight: 700; color: #047857; margin-top: 0.15rem; }
        .bsim-note { padding: 0 0.9rem 0.9rem; font-size: 0.72rem; color: var(--muted); line-height: 1.4; }
        /* 장기·재약정 특별 혜택 카드 */
        .bsim.bloy .bsim-head { background: #fdf2f8; color: #9d174d; }
        .bsim.bloy .bsim-tag { background: #db2777; }
        .bloy-status { margin: 0.7rem 0.9rem 0; padding: 0.6rem 0.8rem; background: #f8fafc;
                       border: 1px solid var(--border); border-radius: 10px; display: flex; flex-direction: column; gap: 0.35rem; }
        .bloy-srow { display: flex; justify-content: space-between; gap: 0.6rem; font-size: 0.9rem; color: #475569; }
        .bloy-srow b { font-weight: 800; color: #0f172a; }
        .bloy-sub { padding: 0.7rem 0.9rem 0; font-size: 0.82rem; font-weight: 800; color: #9d174d; }
        .bloy-list { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.6rem 0.9rem 0.7rem; }
        .bloy-b { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.75rem;
                  background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 10px;
                  font-size: 0.92rem; font-weight: 700; color: #1f2937; }
        .bloy-ic { font-size: 1.15rem; flex: none; }

        /* CS — 옴니채널 / 셀프 해결 안내 카드 */
        .cscard { margin-bottom: 1rem; border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; background: #fff; }
        .cscard-head { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.9rem; font-weight: 800; }
        .cscard.omni .cscard-head { background: #eef2ff; color: #3730a3; }
        .cscard.deflect .cscard-head { background: #ecfeff; color: #155e75; }
        .cscard-tag { font-size: 0.72rem; font-weight: 800; color: #fff; padding: 0.12rem 0.55rem; border-radius: 999px; }
        .cscard-tag.omni { background: #4f46e5; }
        .cscard-tag.deflect { background: #0891b2; }
        .cscard-why { padding: 0.7rem 0.9rem 0; font-size: 0.9rem; color: #334155; }
        .cscard-why b { color: #0f172a; font-weight: 800; }
        .cscard-note { padding: 0.6rem 0.9rem 0.9rem; font-size: 0.78rem; color: var(--muted); line-height: 1.45; }
        /* 옴니채널 허브 — 중앙 Context DB → 3접점 동시 공급 */
        .omni-hub { padding: 0.8rem 0.9rem 0.2rem; }
        .omni-db { display: flex; align-items: center; justify-content: center; gap: 0.6rem;
                   max-width: 300px; margin: 0 auto; padding: 0.7rem 1rem;
                   background: linear-gradient(120deg,#eef2ff,#e0e7ff); border: 1.5px solid #c7d2fe; border-radius: 12px; }
        .omni-db-ic { font-size: 1.5rem; flex: none; }
        .omni-db-tx { display: flex; flex-direction: column; line-height: 1.25; }
        .omni-db-tx b { font-size: 0.95rem; font-weight: 800; color: #3730a3; }
        .omni-db-tx small { font-size: 0.74rem; color: #6366f1; }
        .omni-conn { position: relative; text-align: center; margin: 0.5rem 0; }
        .omni-conn::before { content: ''; position: absolute; left: 50%; top: -0.35rem; width: 2px; height: 0.5rem;
                             background: #a5b4fc; transform: translateX(-50%); }
        .omni-conn span { font-size: 0.74rem; font-weight: 700; color: #4f46e5; }
        .omni-chs { display: flex; gap: 0.4rem; }
        .omni-ch { flex: 1; min-width: 0; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0;
                   border-radius: 12px; padding: 0.6rem 0.4rem; display: flex; flex-direction: column; gap: 0.2rem;
                   border-top: 2px solid #a5b4fc; }
        .omni-ic { font-size: 1.4rem; }
        .omni-ch b { font-size: 0.82rem; color: #1e293b; }
        /* 셀프 해결 안내 */
        .deflect-bubble { display: flex; align-items: center; gap: 0.5rem; margin: 0.7rem 0.9rem 0;
                          background: #cffafe; border-radius: 12px 12px 12px 4px; padding: 0.6rem 0.8rem;
                          font-size: 0.95rem; font-weight: 700; color: #155e75; }
        .deflect-ava { font-size: 1.2rem; flex: none; }
        .deflect-self { display: flex; align-items: baseline; gap: 0.5rem; margin: 0.6rem 0.9rem 0;
                        font-size: 0.9rem; color: #1e293b; }
        .deflect-self-tag { font-size: 0.7rem; font-weight: 800; color: #0891b2; background: #ecfeff;
                            border: 1px solid #a5f3fc; border-radius: 5px; padding: 0.12rem 0.45rem; flex: none; }
        .bsim-perks { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0.7rem 0.9rem 0.9rem; }
        .bsim-perks span { font-size: 0.78rem; font-weight: 700; color: var(--kt-red-dark);
                           background: var(--kt-red-bg); border: 1px solid var(--kt-red-border);
                           border-radius: 999px; padding: 0.2rem 0.6rem; }

        .ac-channels { display: flex; flex-direction: column; gap: 0.9rem; }
        .ac-ch { border: 2px solid var(--border); border-radius: 14px; padding: 0.9rem 1rem; background: white;
                 border-left: 5px solid var(--border); }
        .ac-ch.ch-push        { border-left-color: #f59e0b; }
        .ac-ch.ch-call_center { border-left-color: #475569; }
        .ac-ch.ch-agent       { border-left-color: var(--primary); }
        .ac-ch.ch-genie_music { border-left-color: #e11d48; }
        .ac-ch.ch-gigagenie   { border-left-color: #7c3aed; }
        .ac-ch-head { display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.45rem; }
        .ac-ch-icon { font-size: 1.1rem; }
        .ac-ch-name { font-weight: 700; font-size: 0.95rem; }
        .ac-self-tag { font-size: 0.72rem; font-weight: 800; color: #fff; background: #0891b2;
                       padding: 0.12rem 0.55rem; border-radius: 999px; margin-left: auto; }
        .ac-self-note { margin-top: 0.5rem; font-size: 0.82rem; font-weight: 700; color: #155e75;
                        background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 0.4rem 0.6rem; }
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
        .cc-live { margin-left: auto; font-size: 0.68rem; font-weight: 800; color: #4ade80;
                   display: inline-flex; align-items: center; gap: 5px; }
        .cc-pulse { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; flex: none;
                    box-shadow: 0 0 0 0 rgba(34,197,94,.7); animation: cc-pulse 1.4s infinite; }
        @keyframes cc-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.7); transform: scale(1); }
          70%  { box-shadow: 0 0 0 7px rgba(34,197,94,0); transform: scale(1.15); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); transform: scale(1); }
        }
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

        /* 🎵 지니뮤직 플레이리스트 카드 */
        .gm-card { display: flex; gap: 0.8rem; align-items: center; margin-top: 0.3rem;
                   background: linear-gradient(135deg,#1e1b2e,#3b1d3a); border-radius: 14px; padding: 0.7rem 0.8rem; }
        .gm-art { position: relative; width: 58px; height: 58px; border-radius: 10px; flex: none;
                  background: linear-gradient(135deg,#e11d48,#9333ea); display: flex; align-items: center; justify-content: center; }
        .gm-note { font-size: 24px; }
        .gm-eq { position: absolute; bottom: 6px; right: 6px; display: flex; align-items: flex-end; gap: 2px; height: 14px; }
        .gm-eq i { width: 3px; background: rgba(255,255,255,.85); border-radius: 2px; animation: gm-eq 0.9s infinite ease-in-out; }
        .gm-eq i:nth-child(1){ height:6px; animation-delay:0s; }
        .gm-eq i:nth-child(2){ height:12px; animation-delay:.2s; }
        .gm-eq i:nth-child(3){ height:8px; animation-delay:.4s; }
        .gm-eq i:nth-child(4){ height:11px; animation-delay:.1s; }
        @keyframes gm-eq { 0%,100%{ transform: scaleY(.4);} 50%{ transform: scaleY(1);} }
        .gm-body { flex: 1; min-width: 0; }
        .gm-brand { font-size: 0.7rem; font-weight: 700; color: #f9a8d4; letter-spacing: .02em; }
        .gm-title { font-size: 1.05rem; font-weight: 800; color: #fff; margin: 0.1rem 0; }
        .gm-desc { font-size: 0.8rem; color: #cbd5e1; line-height: 1.4; }
        .gm-controls { display: flex; align-items: center; gap: 0.7rem; margin-top: 0.45rem; color: #e2e8f0; font-size: 0.85rem; }
        .gm-play { width: 26px; height: 26px; border-radius: 50%; background: #fff; color: #1e1b2e;
                   display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; }

        /* 🏠 기가지니 음성 명령 + 홈IoT */
        .gv-card { margin-top: 0.3rem; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 14px; padding: 0.8rem 0.9rem; }
        .gv-say { display: flex; align-items: center; gap: 0.5rem; }
        .gv-mic { width: 30px; height: 30px; border-radius: 50%; flex: none; background: #7c3aed; color: #fff;
                  display: inline-flex; align-items: center; justify-content: center; font-size: 0.95rem; }
        .gv-cmd { font-size: 1.02rem; font-weight: 800; color: #5b21b6; }
        .gv-arrow { font-size: 0.74rem; color: #7c3aed; font-weight: 700; margin: 0.5rem 0 0.4rem; }
        .gv-devices { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .gv-dev { font-size: 0.85rem; font-weight: 700; color: #4c1d95; background: #fff; border: 1px solid #ddd6fe;
                  border-radius: 999px; padding: 0.28rem 0.7rem; box-shadow: 0 1px 2px rgba(124,58,237,.1); }
        .gv-desc { font-size: 0.82rem; color: #475569; line-height: 1.45; margin-top: 0.5rem; }
      `}</style>
    </div>
  );
}
