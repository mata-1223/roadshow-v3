// Vector Space 시각화 (L1 카테고리 기반 수동 좌표 + Score 크기)
// 회의 우려: "vector space에 표현된 결과가 타당하게 나올지" → 백업 옵션으로 수동 배치 사용
import { useEffect, useMemo, useState } from 'react';

const L1_COLORS = {
  'INT-1000': '#3b82f6',
  'INT-2000': '#10b981',
  'INT-3000': '#eab308',
  'INT-4000': '#a855f7',
  'INT-5000': '#ef4444',
  'INT-6000': '#f97316',
  'INT-7000': '#475569',
};

const L1_NAMES = {
  'INT-1000': 'My 정보 조회',
  'INT-2000': '상품 탐색/가입',
  'INT-3000': '셀프처리',
  'INT-4000': '혜택/프로모션',
  'INT-5000': '문제 해결/상담',
  'INT-6000': '관계/공유',
  'INT-7000': '이탈/전환',
};

// L1 카테고리별 중심 좌표 (반지름 320 원 위에 7개 분포)
const L1_CENTERS = (() => {
  const ids = Object.keys(L1_COLORS);
  const cx = 400, cy = 300, R = 220;
  const out = {};
  ids.forEach((id, i) => {
    const angle = -Math.PI / 2 + (i / ids.length) * 2 * Math.PI;
    out[id] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  return out;
})();

// Intent의 안정적 좌표를 결정 (L1 중심 주변 jitter)
function computeIntentPositions(intents) {
  const grouped = {};
  intents.forEach((it) => {
    grouped[it.L1_id] = grouped[it.L1_id] || [];
    grouped[it.L1_id].push(it);
  });

  const positions = {};
  Object.entries(grouped).forEach(([l1id, list]) => {
    const center = L1_CENTERS[l1id];
    const n = list.length;
    list.forEach((it, i) => {
      const ang = (i / n) * 2 * Math.PI;
      const r = 50 + (i % 3) * 18;
      positions[it.id] = {
        x: center.x + r * Math.cos(ang),
        y: center.y + r * Math.sin(ang),
      };
    });
  });
  return positions;
}

export default function VectorSpace({ allIntents, topN }) {
  // Top-N 점수를 빠르게 매칭하기 위한 맵
  const scoreMap = useMemo(() => {
    const m = {};
    (topN || []).forEach((t) => { m[t.intent_id] = t; });
    return m;
  }, [topN]);

  // 좌표 계산 (한 번만)
  const positions = useMemo(
    () => computeIntentPositions(allIntents || []),
    [allIntents]
  );

  return (
    <div className="vector-space">
      <div className="vs-header">
        <h3>Vector Space — 116개 Intent</h3>
        <p>L1 카테고리 기반 좌표. Top 5는 강조 표시.</p>
      </div>

      <svg viewBox="0 0 800 600" className="vs-svg">
        {/* L1 카테고리 라벨 */}
        {Object.entries(L1_CENTERS).map(([id, c]) => (
          <g key={id} transform={`translate(${c.x}, ${c.y - 100})`}>
            <text textAnchor="middle" className="vs-label" style={{ fill: L1_COLORS[id] }}>
              {L1_NAMES[id]}
            </text>
          </g>
        ))}

        {/* 모든 Intent 점 */}
        {(allIntents || []).map((it) => {
          const pos = positions[it.id];
          if (!pos) return null;
          const score = scoreMap[it.id]?.final_score ?? 0;
          const isTop = it.id in scoreMap;
          const r = isTop ? 6 + score * 14 : 3;
          const color = L1_COLORS[it.L1_id] || '#94a3b8';
          return (
            <circle
              key={it.id}
              cx={pos.x} cy={pos.y} r={r}
              fill={color}
              fillOpacity={isTop ? 0.85 : 0.25}
              stroke={isTop ? '#0f172a' : 'none'}
              strokeWidth={isTop ? 2 : 0}
              style={{ transition: 'r 0.5s, fill-opacity 0.5s' }}
            >
              <title>{`${it.id} ${it.name}${isTop ? ` (Score: ${score.toFixed(2)})` : ''}`}</title>
            </circle>
          );
        })}

        {/* Top-N 라벨 */}
        {(topN || []).map((t) => {
          const pos = positions[t.intent_id];
          if (!pos) return null;
          return (
            <g key={t.intent_id} transform={`translate(${pos.x}, ${pos.y + 30})`}>
              <text textAnchor="middle" className="vs-top-label">
                {t.intent_name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="vs-legend">
        {Object.entries(L1_NAMES).map(([id, name]) => (
          <span key={id} className="lg">
            <span className="dot" style={{ background: L1_COLORS[id] }} />
            {name}
          </span>
        ))}
      </div>

      <style>{`
        .vector-space { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1rem; }
        .vs-header { margin-bottom: 0.5rem; }
        .vs-header p { color: var(--muted); margin: 0; font-size: 0.85rem; }
        .vs-svg { width: 100%; height: auto; max-height: 480px; }
        .vs-label { font-size: 14px; font-weight: 700; }
        .vs-top-label { font-size: 11px; font-weight: 600; fill: #0f172a; pointer-events: none; }
        .vs-legend { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.8rem; }
        .lg { display: flex; align-items: center; gap: 0.3rem; color: var(--muted); }
        .lg .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
      `}</style>
    </div>
  );
}
