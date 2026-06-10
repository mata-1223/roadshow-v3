// Vector Space — 113개 Intent 좌표 + 고객 위치·이동 경로
//
// 입력: intent_positions(서버 fetch), allIntents(메타), topN, customerPosition,
//       baselinePosition, customerPath
// 좌표 범위 [-1, 1] → SVG viewBox로 변환

import { useMemo } from 'react';

const VIEW_W = 800;
const VIEW_H = 600;
const PAD    = 40;

// [-1, 1] 좌표를 SVG 좌표로 변환 (y축 뒤집기: -1=하단)
function toSvg(p) {
  const x = PAD + ((p.x + 1) / 2) * (VIEW_W - 2 * PAD);
  const y = PAD + ((1 - p.y) / 2) * (VIEW_H - 2 * PAD);
  return { x, y };
}

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

  if (!intentPositions || Object.keys(intentPositions).length === 0) {
    return (
      <div className="vector-space placeholder">
        <p>Vector Space 좌표 로딩 중…</p>
        <style>{`.placeholder { padding: 2rem; text-align: center; color: var(--muted); }`}</style>
      </div>
    );
  }

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

  return (
    <div className="vector-space">
      <div className="vs-header">
        <h3>Vector Space — {intentCount}개 Intent</h3>
        <p>고객 위치는 {intentCount}개 정규화 분포의 가중 평균. 행동마다 이동 경로 누적.</p>
      </div>

      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="vs-svg">
        {/* L1 zone 라벨 */}
        {(l1Zones || []).map((zone) => {
          const c = toSvg(zone.centroid);
          return (
            <g key={zone.L1_id} transform={`translate(${c.x}, ${c.y - 90})`}>
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
              style={{ transition: 'r 0.5s ease-out, fill-opacity 0.5s' }}
            >
              <title>{`${pt.id} ${pt.name || ''}${pt.inTop ? ` (${(pt.probability * 100).toFixed(1)}%)` : ''}`}</title>
            </circle>
          );
        })}

        {/* Top N 라벨 */}
        {(topN || []).map((t) => {
          const pos = intentPositions[t.intent_id];
          if (!pos) return null;
          const svg = toSvg(pos);
          return (
            <g key={t.intent_id} transform={`translate(${svg.x}, ${svg.y + 32})`}>
              <text textAnchor="middle" className="vs-top-label">{t.intent_nm_ko || t.intent_name}</text>
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
              stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6}
            />
          </>
        )}

        {/* customer 위치 (강조) */}
        {customerSvg && (
          <g style={{ transition: 'transform 0.6s ease-out' }}>
            <circle
              cx={customerSvg.x} cy={customerSvg.y} r={18}
              fill="#0f172a"
              stroke="white" strokeWidth={3}
            />
            <text x={customerSvg.x} y={customerSvg.y - 28} textAnchor="middle" className="vs-customer-label">
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

      <style>{`
        .vector-space { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1rem; }
        .vs-header { margin-bottom: 0.5rem; }
        .vs-header h3 { margin: 0 0 0.2rem; }
        .vs-header p { color: var(--muted); margin: 0; font-size: 0.85rem; }
        .vs-svg { width: 100%; height: auto; max-height: 540px; }
        .vs-zone-label { font-size: 14px; font-weight: 700; opacity: 0.75; }
        .vs-top-label { font-size: 11px; font-weight: 600; fill: #0f172a; pointer-events: none; }
        .vs-customer-label { font-size: 12px; font-weight: 700; fill: #0f172a; pointer-events: none; }
        .vs-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.8rem; }
        .lg { display: flex; align-items: center; gap: 0.3rem; color: var(--muted); }
        .lg .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
        .lg .dot-customer { background: #0f172a; border: 2px solid white; box-shadow: 0 0 0 1px #0f172a; }
        .lg .dot-baseline { background: none; border: 2px dashed #94a3b8; }
      `}</style>
    </div>
  );
}
