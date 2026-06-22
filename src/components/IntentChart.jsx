// Top-N Intent 차트 (Probability 바 + L1 색상 + Δ Probability·Rank Change 표시)
//
// 페이로드 양식 (서버 → 클라이언트):
//   probability / baseline_probability / delta_probability (0~1)
//   rank / baseline_rank / rank_change
//   intent_nm_ko / L1_id / L1_name / L2_name

import { useState } from 'react';
import { intentName } from '../utils/intent.js';
import ActionPanel from './ActionPanel.jsx';

const L1_COLOR = {
  'INT-1000': 'var(--l1-1000)',
  'INT-2000': 'var(--l1-2000)',
  'INT-3000': 'var(--l1-3000)',
  'INT-4000': 'var(--l1-4000)',
  'INT-5000': 'var(--l1-5000)',
  'INT-6000': 'var(--l1-6000)',
  'INT-7000': 'var(--l1-7000)',
};

// cs 외 시나리오(bundle: INT-B1000~, worker: INT-W100~)는 L1 그룹 번호로 팔레트 색 부여
const L1_PALETTE = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#db2777'];
function l1Color(id) {
  if (L1_COLOR[id]) return L1_COLOR[id];
  const m = String(id || '').match(/\d/);   // 그룹 첫 자리 (B1000→1, W200→2)
  const g = m ? parseInt(m[0], 10) : 0;
  return g ? L1_PALETTE[(g - 1) % L1_PALETTE.length] : '#94a3b8';
}

function DeltaBadge({ delta }) {
  if (delta === undefined || delta === null) return null;
  const v = Number(delta);
  if (Math.abs(v) < 0.0005) return null;
  const up = v > 0;
  return (
    <span className={`delta-badge ${up ? 'delta-up' : 'delta-down'}`}>
      {up ? '▲' : '▼'} {(Math.abs(v) * 100).toFixed(1)}%p
    </span>
  );
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

// 활용 예시 클릭 팝업 — 기존 ActionPanel 화면을 해당 Intent 기준으로 화면 중앙에 크게 표출.
// 대형 모달이라 컬럼 overflow에 잘리지 않도록 position:fixed. 버튼 클릭으로 열고 배경 클릭으로 닫음.
function ActionExample({ actionsData, intent, bundleProfile }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ax-wrap">
      <button type="button" className="ax-btn" onClick={() => setOpen(true)}>활용 예시</button>
      {open && (
        <>
          <div className="ax-backdrop" onClick={() => setOpen(false)} />
          <div className="ax-modal" role="dialog">
            <button type="button" className="rx-close" onClick={() => setOpen(false)}>✕</button>
            <ActionPanel actionsData={actionsData} topN={[intent]} reasoning={intent.reasoning} bundleProfile={bundleProfile} />
          </div>
        </>
      )}
    </div>
  );
}

export default function IntentChart({ topN, actionsData, l1Zones, bundleProfile = null }) {
  if (!topN || topN.length === 0) {
    return <div className="empty">결과 없음</div>;
  }
  const max = Math.max(...topN.map(pctOf));
  const actionsMap = actionsData?.actions || {};
  // Vector Space와 동일한 L1 색 사용 (l1_zones.color), 없으면 팔레트 fallback
  const zoneColor = {};
  (l1Zones || []).forEach((z) => { if (z && z.L1_id) zoneColor[z.L1_id] = z.color; });
  const colorOf = (id) => zoneColor[id] || l1Color(id);

  return (
    <div className="intent-chart">
      {topN.map((t) => {
        const p = pctOf(t);
        const baseP = basePctOf(t);
        // 최하위(leaf) Intent 위의 상위 분류를 모두 표기.
        //  · 직장인: leaf가 곧 L2 계층 → 위로 L1만 존재 → "L1: …"
        //  · CS·결합: leaf(최하위) 아래 L1·L2 모두 존재 → "L1: … / L2: …"
        const main = intentName(t);
        const leafIsL2 = main && main === t.L2_name;
        const crumbs = (leafIsL2
          ? [['L1', t.L1_name]]
          : [['L1', t.L1_name], ['L2', t.L2_name]]
        ).filter(([, v]) => v);
        return (
        <div key={t.intent_id} className="row">
          <div className="meta">
            <div className="rank">
              <div className="rank-num">#{t.rank}</div>
              <RankChange change={t.rank_change} />
            </div>
            <div className="info">
              <div className="name">
                <span className="dot" style={{ background: colorOf(t.L1_id), opacity: 0.8 }} />
                {main}
              </div>
              <div className="sub">
                <span className="id">{t.intent_id}</span>
                {crumbs.map(([lvl, v], i) => (
                  <span key={lvl} className="crumb">
                    {i > 0 && <span className="sep">/</span>}
                    <b style={lvl === 'L1' ? { color: colorOf(t.L1_id) } : undefined}>{lvl}</b>: {v}
                  </span>
                ))}
              </div>
            </div>
            {actionsMap[t.intent_id] && (
              <ActionExample actionsData={actionsData} intent={t} bundleProfile={bundleProfile} />
            )}
            <div className="score-block">
              <div className="score">{(p * 100).toFixed(1)}%</div>
              <DeltaBadge delta={deltaOf(t)} />
            </div>
          </div>
          <div className="bar">
            <div className="fill" style={{
              width: `${(p / Math.max(max, 0.001)) * 100}%`,
              background: colorOf(t.L1_id),
              opacity: 0.72,
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
        .intent-chart { display: flex; flex-direction: column; gap: 0.55rem; }
        .row { background: #f8fafc; border-radius: 12px; padding: 0.55rem 0.9rem; }
        .meta { display: flex; align-items: center; gap: 0.75rem; }
        .rank { width: 3rem; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
        .rank-num { font-weight: 800; font-size: 1.1rem; color: var(--muted); }
        .rank-change { font-size: 0.7rem; font-weight: 700; padding: 1px 4px; border-radius: 4px; }
        .rank-change.up { background: #dcfce7; color: #15803d; }
        .rank-change.down { background: #fee2e2; color: #b91c1c; }
        .info { flex: 1; }
        .name { font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .sub { color: var(--muted); font-size: 0.85rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.55rem; margin-top: 0.2rem; }
        .id { font-weight: 600; }
        .crumb { display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 600; }
        .crumb b { font-weight: 800; }
        .crumb .sep { color: var(--border); margin-right: 0.15rem; }
        .score-block { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .score { font-size: 1.3rem; font-weight: 700; color: var(--fg); }
        .delta-badge { font-size: 0.72rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; }
        .delta-badge.delta-up { background: #dcfce7; color: #15803d; }
        .delta-badge.delta-down { background: #fee2e2; color: #b91c1c; }
        .bar { margin-top: 0.5rem; height: 8px; background: white; border-radius: 999px; overflow: hidden; position: relative; }
        .fill { height: 100%; transition: width 0.5s ease-out; }
        .baseline-marker { position: absolute; top: -2px; width: 2px; height: 12px; background: rgba(15,23,42,0.5); }
        .empty { color: var(--muted); padding: 2rem; text-align: center; }
        /* 활용 예시 버튼 + 화면 중앙 대형 모달 (기존 ActionPanel 화면을 한눈에 크게) */
        .ax-wrap { position: relative; display: inline-flex; }
        .ax-btn { font-size: 0.74rem; font-weight: 700; color: var(--primary); background: #eff6ff;
                  border: 1px solid #bfdbfe; border-bottom-width: 2px; border-radius: 7px; padding: 0.28rem 0.6rem;
                  cursor: pointer; white-space: nowrap; box-shadow: 0 2px 0 #bfdbfe, 0 2px 4px rgba(37,99,235,.12); }
        .ax-btn:hover { background: #dbeafe; }
        .ax-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #bfdbfe; }
        .ax-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); z-index: 190; }
        .ax-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 200;
                    width: max-content; max-width: 96vw; max-height: 92vh; overflow: auto; text-align: left;
                    background: #fff; border-radius: 20px; padding: 1.6rem 1.9rem;
                    box-shadow: 0 30px 80px rgba(0,0,0,.45); }
        .ax-modal h2 { font-size: 1.55rem; margin: 0 0 0.4rem; }
        .ax-modal .caption { font-size: 1rem; margin-bottom: 1.25rem; max-width: 640px; }
        .ax-modal .ac-match { font-size: 1.15rem; padding: 0.8rem 1.1rem; margin-bottom: 1.25rem; }
        .ax-modal .ac-iname { font-size: 1.35rem; }
        /* 채널을 가로로 나열 → 넓고 낮게 (한눈에) */
        .ax-modal .ac-channels { flex-direction: row; flex-wrap: wrap; gap: 1.5rem; justify-content: center; align-items: stretch; }
        .ax-modal .ac-ch { width: 360px; flex: 0 0 auto; }
        .ax-modal .ac-ch.ch-call_center { width: 540px; }   /* 상담사 콘솔: 문구 길이 따라 자연스럽게 */
        .ax-modal .phone-push { width: 250px; }
        .ax-modal .pp-nmsg { font-size: 12.5px; }
        .ax-modal .ac-msg, .ax-modal .ab-msg { font-size: 1.06rem; }
        .ax-modal .ac-service { font-size: 1rem; }
        /* 모달 닫기 버튼 (활용 예시 모달 공용) */
        .rx-close { position: absolute; top: 0.8rem; right: 0.9rem; z-index: 1; width: 28px; height: 28px;
                    border: 1px solid var(--border); background: #fff; border-radius: 50%; cursor: pointer;
                    font-size: 0.9rem; color: var(--muted); line-height: 1; }
        .rx-close:hover { background: #f1f5f9; color: var(--fg); }
      `}</style>
    </div>
  );
}
