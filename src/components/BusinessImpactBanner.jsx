// 비즈니스 임팩트 배너 — 현재 상위 Intent의 사업 효과(business_value)를 항상-보이는 영역에 노출.
// L3(actions[id].business_value) 데이터가 있으면 렌더, 없으면 null → 시나리오 특화 코드 없이 config-driven.
import { intentName } from '../utils/intent.js';

export default function BusinessImpactBanner({ topN = [], actionsData, reflected = false }) {
  const actionsMap = actionsData?.actions || {};
  // 상위에서부터 business_value가 정의된 첫 Intent를 선택 (활용 예시 매칭 규칙과 동일)
  const hit = topN.find((t) => actionsMap[t.intent_id]?.business_value);
  if (!hit) return null;
  const bv = actionsMap[hit.intent_id].business_value;

  return (
    <div className="biz-banner">
      <span className="biz-flag">🎯 {reflected ? '지금이 기회입니다' : '예상 사업 기회'}</span>
      <span className="biz-intent">‘{intentName(hit)}’</span>
      <span className="biz-tags">
        <span className="biz-tag">{bv.tag}</span>
        {bv.kpi && <span className="biz-kpi">{bv.kpi}</span>}
      </span>
      {bv.note && <span className="biz-note">{bv.note}</span>}

      <style>{`
        .biz-banner { display: flex; flex-wrap: wrap; align-items: center; gap: 0.45rem 0.6rem;
                      padding: 0.55rem 0.85rem; margin: 0.2rem 0 0.7rem; border-radius: 12px;
                      background: #fafbfc; border: 1px solid var(--border); border-left: 3px solid var(--kt-red); }
        .biz-flag { font-size: 0.82rem; font-weight: 800; color: var(--kt-red); }
        .biz-intent { font-size: 0.92rem; font-weight: 800; color: #0f172a; }
        .biz-tags { display: inline-flex; gap: 0.35rem; }
        .biz-tag { font-size: 0.78rem; font-weight: 800; color: #fff; background: var(--kt-red);
                   padding: 0.12rem 0.55rem; border-radius: 999px; }
        .biz-kpi { font-size: 0.78rem; font-weight: 800; color: #1d4ed8; background: #dbeafe;
                   padding: 0.12rem 0.55rem; border-radius: 999px; }
        .biz-note { font-size: 0.84rem; color: #334155; line-height: 1.35; }
      `}</style>
    </div>
  );
}
