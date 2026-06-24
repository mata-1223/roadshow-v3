// Vector Space — 113개 Intent 좌표 + 고객 위치·이동 경로
//
// 입력: intent_positions(서버 fetch), allIntents(메타), topN, customerPosition,
//       baselinePosition, customerPath
// 좌표 범위 [-1, 1] → SVG viewBox로 변환

import { useMemo, useState } from 'react';
import { intentName } from '../utils/intent.js';
import { featureLabel } from '../utils/featureLabel.js';

const VIEW_W = 1040;       // 가로로 넓은 영역에 맞춰 wide aspect
const VIEW_H = 560;
const PAD    = 46;
const FIT_MARGIN = 0.05;   // 점이 가장자리에 붙지 않도록 둘 내부 여백 비율

export default function VectorSpace({
  intentPositions,    // { intent_id: {x, y, L1_id} }  - 서버에서 fetch
  l1Zones,            // [{ L1_id, L1_name, centroid:{x,y}, color }]
  allIntents,         // 메타 (이름·L1 등)
  topN,               // 현재 Top 5
  others,             // 기타 정보
  customerPosition,   // {x, y}
  baselinePosition,   // {x, y}
  customerPath,       // [{ts, behavior_id, position, isNavigateBack}]
}) {
  // intent meta map
  const intentMeta = useMemo(() => {
    const m = {};
    (allIntents || []).forEach((it) => { m[it.id] = it; });
    return m;
  }, [allIntents]);

  // 시나리오별 Intent 총수 (좌표 우선, 없으면 메타 기준)
  const intentCount = (intentPositions && Object.keys(intentPositions).length)
    || (allIntents ? allIntents.length : 0);

  // topN 매칭용
  const topMap = useMemo(() => {
    const m = {};
    (topN || []).forEach((t) => { m[t.intent_id] = t; });
    return m;
  }, [topN]);

  // L1 color lookup
  const l1Color = useMemo(() => {
    const m = {};
    (l1Zones || []).forEach((z) => { m[z.L1_id] = z.color; });
    return m;
  }, [l1Zones]);

  // 강조(Top5) 점 클릭 시 상세 카드로 표출할 intent
  const [selected, setSelected] = useState(null);

  if (!intentPositions || Object.keys(intentPositions).length === 0) {
    return (
      <div className="vector-space placeholder">
        <p>Vector Space 좌표 로딩 중…</p>
        <style>{`.placeholder { padding: 2rem; text-align: center; color: var(--muted); }`}</style>
      </div>
    );
  }

  // 실제 점 분포(bbox)를 캔버스에 가득 차게 매핑 → 중앙 쏠림·겹침 완화
  const xs = Object.values(intentPositions).map((p) => p.x);
  const ys = Object.values(intentPositions).map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const norm = (v, lo, hi) => (hi > lo ? (v - lo) / (hi - lo) : 0.5);
  const fit  = (t) => FIT_MARGIN + t * (1 - 2 * FIT_MARGIN);
  const toSvg = (p) => ({
    x: PAD + fit(norm(p.x, minX, maxX)) * (VIEW_W - 2 * PAD),
    y: PAD + fit(1 - norm(p.y, minY, maxY)) * (VIEW_H - 2 * PAD),  // y축 뒤집기
  });

  // SVG 좌표 변환
  const intentPoints = Object.entries(intentPositions).map(([id, pos]) => {
    const meta = intentMeta[id] || {};
    const inTop = id in topMap;
    const probability = topMap[id]?.probability ?? 0;
    return {
      id,
      name:        meta.name,
      L1_id:       pos.L1_id ?? meta.L1_id,
      svg:         toSvg(pos),
      inTop,
      probability,
    };
  });

  const customerSvg  = customerPosition  ? toSvg(customerPosition)  : null;
  const baselineSvg  = baselinePosition  ? toSvg(baselinePosition)  : null;
  const pathSvgPoints = (customerPath || []).map((node) => ({
    ...node,
    svg: toSvg(node.position),
  }));

  // L1 영역(클라우드): 각 L1 소속 점들의 퍼짐 정도로 반경 산정 → 색 영역으로 구획감 부여
  const zoneClouds = (l1Zones || []).map((zone) => {
    const c = toSvg(zone.centroid);
    const members = intentPoints.filter((pt) => pt.L1_id === zone.L1_id);
    let rad = 80;
    if (members.length) {
      const maxd = Math.max(...members.map((m) => Math.hypot(m.svg.x - c.x, m.svg.y - c.y)));
      rad = Math.min(175, Math.max(60, maxd + 28));
    }
    return { id: zone.L1_id, c, rad, color: zone.color };
  });

  return (
    <div className="vector-space">
      <div className="vs-header">
        <h3>Vector Space 시각화 ({intentCount}개 고객 의도)</h3>
      </div>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="vs-svg">
        <defs>
          <filter id="vs-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <marker id="vs-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#64748b" />
          </marker>
        </defs>

        {/* L1 영역 배경 (블러 처리한 색 구름) */}
        {zoneClouds.map((z) => (
          <circle key={z.id} cx={z.c.x} cy={z.c.y} r={z.rad}
                  fill={z.color} fillOpacity={0.1} filter="url(#vs-soft)" />
        ))}

        {/* L1 zone 라벨 */}
        {(l1Zones || []).map((zone) => {
          const c = toSvg(zone.centroid);
          const ly = Math.max(20, c.y - 70);   // 상단 클러스터 라벨이 잘리지 않도록 클램프
          return (
            <g key={zone.L1_id} transform={`translate(${c.x}, ${ly})`}>
              <text textAnchor="middle" className="vs-zone-label" style={{ fill: zone.color }}>
                {zone.L1_name}
              </text>
            </g>
          );
        })}

        {/* Intent 점 */}
        {intentPoints.map((pt) => {
          const color = l1Color[pt.L1_id] || '#94a3b8';
          const r = pt.inTop ? 6 + pt.probability * 90 : 3;
          const opacity = pt.inTop ? 0.9 : 0.28;
          return (
            <circle
              key={pt.id}
              cx={pt.svg.x} cy={pt.svg.y} r={r}
              fill={color}
              fillOpacity={opacity}
              stroke={pt.inTop ? '#0f172a' : 'none'}
              strokeWidth={pt.inTop ? 2 : 0}
              onClick={pt.inTop ? () => setSelected(pt.id) : undefined}
              style={{ transition: 'r 0.5s ease-out, fill-opacity 0.5s', cursor: pt.inTop ? 'pointer' : 'default' }}
            >
              <title>{`${pt.id} ${pt.name || ''}${pt.inTop ? ` (${(pt.probability * 100).toFixed(1)}%) · 클릭하면 상세` : ''}`}</title>
            </circle>
          );
        })}

        {/* Top N 라벨 */}
        {(topN || []).map((t) => {
          const pos = intentPositions[t.intent_id];
          if (!pos) return null;
          const svg = toSvg(pos);
          return (
            <g key={t.intent_id} transform={`translate(${svg.x}, ${svg.y + 32})`}
               onClick={() => setSelected(t.intent_id)} style={{ cursor: 'pointer' }}>
              <text textAnchor="middle" className="vs-top-label">{intentName(t)}</text>
            </g>
          );
        })}

        {/* 이동 경로: 연속 선분 */}
        {pathSvgPoints.length > 1 && pathSvgPoints.slice(1).map((node, i) => {
          const prev = pathSvgPoints[i].svg;
          const isBack = node.isNavigateBack;
          const ageFromEnd = pathSvgPoints.length - 2 - i;  // 0 = 가장 최근
          const alpha = Math.max(0.18, 1 - ageFromEnd * 0.18);
          return (
            <line
              key={i}
              x1={prev.x} y1={prev.y}
              x2={node.svg.x} y2={node.svg.y}
              stroke={isBack ? '#f97316' : '#0f172a'}
              strokeWidth={isBack ? 3 : 2.5}
              strokeOpacity={alpha}
              strokeDasharray={isBack ? '6 4' : 'none'}
            />
          );
        })}

        {/* baseline 위치 (회색 점선 원) */}
        {baselineSvg && customerSvg && (
          <>
            <circle
              cx={baselineSvg.x} cy={baselineSvg.y} r={10}
              fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3"
            />
            <line
              x1={baselineSvg.x} y1={baselineSvg.y}
              x2={customerSvg.x} y2={customerSvg.y}
              stroke="#64748b" strokeWidth={2} strokeDasharray="5 4" opacity={0.7}
              markerEnd="url(#vs-arrow)"
            />
          </>
        )}

        {/* customer 위치 (강조 + 펄스 링) */}
        {customerSvg && (
          <g style={{ transition: 'transform 0.6s ease-out' }}>
            <circle cx={customerSvg.x} cy={customerSvg.y} fill="#0f172a">
              <animate attributeName="r" values="18;36;18" dur="2.2s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.3;0;0.3" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={customerSvg.x} cy={customerSvg.y} r={18}
              fill="#0f172a"
              stroke="white" strokeWidth={3}
            />
            <text x={customerSvg.x} y={customerSvg.y - 30} textAnchor="middle" className="vs-customer-label">
              👤 고객
            </text>
          </g>
        )}
      </svg>

      <div className="vs-legend">
        {(l1Zones || []).map((zone) => (
          <span key={zone.L1_id} className="lg">
            <span className="dot" style={{ background: zone.color }} />
            {zone.L1_name}
          </span>
        ))}
        <span className="lg">
          <span className="dot dot-customer" />
          고객 위치 (가중 평균)
        </span>
        <span className="lg">
          <span className="dot dot-baseline" />
          baseline (행동 전)
        </span>
      </div>

      {/* 강조 Intent 상세 카드 — 클릭 시 표출 */}
      {selected && topMap[selected] && (() => {
        const t = topMap[selected];
        const meta = intentMeta[selected] || {};
        const feats = meta.features || [];
        const rsn = t.reasoning || {};
        const delta = (t.delta_probability ?? 0) * 100;
        return (
          <>
            <div className="vd-backdrop" onClick={() => setSelected(null)} />
            <div className="vd-card" role="dialog">
              <button type="button" className="vd-close" onClick={() => setSelected(null)}>✕</button>
              <div className="vd-head">
                <span className="vd-id">{selected}</span>
              </div>
              {t.intent_nm_ko && <div className="vd-name">{t.intent_nm_ko}</div>}
              <div className="vd-path">{t.L1_name}{t.L2_name ? ` · ${t.L2_name}` : ''}</div>
              <div className="vd-score">
                현재 <b>{(t.probability * 100).toFixed(1)}%</b>
                {Math.abs(delta) >= 0.05 && (
                  <span className={`vd-delta ${delta > 0 ? 'up' : 'down'}`}>
                    {' · '}기준 대비 {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%p
                  </span>
                )}
              </div>

              {feats.length > 0 && (
                <div className="vd-sec">
                  <div className="vd-sec-t">CORE FEATURES</div>
                  <div className="vd-chips">
                    {feats.map((f) => (
                      <span key={f} className="vd-chip">{featureLabel(f) || f}</span>
                    ))}
                  </div>
                </div>
              )}

              {rsn.situation_text && <div className="vd-situation">{rsn.situation_text}</div>}
            </div>
          </>
        );
      })()}

      <style>{`
        .vector-space { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 0.7rem; }
        .vs-header { margin-bottom: 0.35rem; }
        .vs-header h3 { margin: 0 0 0.15rem; }
        .vs-header p { color: var(--muted); margin: 0; font-size: 0.82rem; }
        .vs-svg { width: 100%; height: auto; max-height: min(42vh, 440px); }
        /* 라벨은 흰색 외곽선(halo)로 점·영역 위에서도 또렷하게 */
        .vs-zone-label { font-size: 19px; font-weight: 800; opacity: 0.9;
                         paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; }
        .vs-top-label { font-size: 15px; font-weight: 700; fill: #0f172a; pointer-events: none;
                        paint-order: stroke; stroke: #fff; stroke-width: 3.5px; stroke-linejoin: round; }
        .vs-customer-label { font-size: 17px; font-weight: 800; fill: #0f172a; pointer-events: none;
                             paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; }
        .vs-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.95rem; }
        .lg { display: flex; align-items: center; gap: 0.3rem; color: var(--muted); }
        .lg .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .lg .dot-customer { background: #0f172a; border: 2px solid white; box-shadow: 0 0 0 1px #0f172a; }
        .lg .dot-baseline { background: none; border: 2px dashed #94a3b8; }

        /* 강조 Intent 상세 카드 (다크 테마) */
        .vd-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); z-index: 190; }
        .vd-card { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 200;
                   width: min(560px, 92vw); max-height: 88vh; overflow: auto; text-align: left;
                   background: #1e293b; color: #e2e8f0; border-radius: 18px; padding: 1.5rem 1.7rem;
                   box-shadow: 0 30px 80px rgba(0,0,0,.5); }
        .vd-close { position: absolute; top: 0.9rem; right: 1rem; width: 28px; height: 28px;
                    border: 1px solid #475569; background: #334155; color: #cbd5e1; border-radius: 50%;
                    cursor: pointer; font-size: 0.9rem; line-height: 1; }
        .vd-close:hover { background: #475569; color: #fff; }
        .vd-head { display: flex; align-items: center; gap: 0.7rem; }
        .vd-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 1.3rem; font-weight: 800; letter-spacing: .02em; }
        .vd-name { font-size: 1.05rem; font-weight: 700; margin-top: 0.35rem; color: #f1f5f9; }
        .vd-path { font-size: 0.9rem; color: #94a3b8; margin-top: 0.15rem; }
        .vd-score { font-size: 0.95rem; color: #cbd5e1; margin-top: 0.65rem; }
        .vd-score b { color: #fff; font-size: 1.05rem; }
        .vd-delta { font-weight: 700; font-size: 0.85rem; }
        .vd-delta.up { color: #4ade80; }
        .vd-delta.down { color: #f87171; }
        .vd-sec { margin-top: 1.1rem; }
        .vd-sec-t { font-size: 0.72rem; font-weight: 800; letter-spacing: .08em; color: #64748b; margin-bottom: 0.5rem; }
        .vd-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .vd-chip { display: inline-flex; flex-direction: column; gap: 1px; align-items: flex-start;
                   background: #334155; border-radius: 7px; padding: 0.3rem 0.6rem; }
        .vd-chip-en { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.82rem; color: #cbd5e1; }
        .vd-chip-ko { font-size: 0.72rem; color: #94a3b8; }
        .vd-situation { margin-top: 1rem; font-size: 0.88rem; color: #cbd5e1; line-height: 1.55;
                        background: #0f172a; border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 0.6rem 0.8rem; }
      `}</style>
    </div>
  );
}
