// Intent Taxonomy 팝업 — 해당 시나리오의 L1(대분류) → L2(중분류) → 개별 Intent 계층을 한눈에.
// L1/L2 개념이 낯선 참여자가 Top5·Vector Space의 레벨 차이를 이해하도록 돕는다.
import { useState } from 'react';

// Vector Space와 동일 색을 우선 쓰되(zoneColor), 없으면 L1 그룹 번호로 팔레트 부여
const L1_PALETTE = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#db2777'];
function paletteColor(id) {
  const m = String(id || '').match(/\d/);
  const g = m ? parseInt(m[0], 10) : 0;
  return g ? L1_PALETTE[(g - 1) % L1_PALETTE.length] : '#94a3b8';
}

// intents(flat) → [{ id, name, l2: [{ id, name, leaves: [{id,name}] }] }]
function buildTree(intents) {
  const l1Map = new Map();
  for (const it of intents) {
    if (!l1Map.has(it.L1_id)) l1Map.set(it.L1_id, { id: it.L1_id, name: it.L1_name, l2: new Map() });
    const l1 = l1Map.get(it.L1_id);
    if (!l1.l2.has(it.L2_id)) l1.l2.set(it.L2_id, { id: it.L2_id, name: it.L2_name, leaves: [] });
    const l2 = l1.l2.get(it.L2_id);
    // name이 L2_name과 다를 때만 개별 Intent(leaf)로 표시 — 같으면 L2가 곧 말단(직장인 시나리오)
    if (it.name && it.name !== it.L2_name) l2.leaves.push({ id: it.id, name: it.name });
  }
  return [...l1Map.values()].map((l1) => ({ ...l1, l2: [...l1.l2.values()] }));
}

export default function IntentTaxonomyModal({ intents, l1Zones, scenarioName }) {
  const [open, setOpen] = useState(false);
  if (!intents || intents.length === 0) return null;

  const zoneColor = {};
  (l1Zones || []).forEach((z) => { if (z && z.L1_id) zoneColor[z.L1_id] = z.color; });
  const colorOf = (id) => zoneColor[id] || paletteColor(id);

  const tree = buildTree(intents);
  const hasLeaves = tree.some((l1) => l1.l2.some((l2) => l2.leaves.length > 0));
  const l2Count = tree.reduce((s, l1) => s + l1.l2.length, 0);

  return (
    <span className="tax-wrap">
      <button type="button" className="tax-btn" onClick={() => setOpen(true)}>📂 Intent Taxonomy</button>
      {open && (
        <>
          <div className="tax-backdrop" onClick={() => setOpen(false)} />
          <div className="tax-modal" role="dialog">
            <button type="button" className="rx-close" onClick={() => setOpen(false)}>✕</button>
            <h2>Intent Taxonomy{scenarioName ? ` — ${scenarioName}` : ''}</h2>
            <p className="tax-intro">
              이 시나리오의 Intent는 <b>L1(대분류)</b> → <b>L2(중분류)</b>
              {hasLeaves ? <> → <b>개별 Intent</b></> : ''} 계층으로 정의됩니다.
              {' '}Top 5·Vector Space에 표시되는 항목은 이 체계의 최하위 Intent입니다.
            </p>
            <div className="tax-summary">
              L1 {tree.length}개 · L2 {l2Count}개{hasLeaves ? ` · Intent ${intents.length}개` : ''}
            </div>
            <div className="tax-tree">
              {tree.map((l1) => (
                <div key={l1.id} className="tax-l1">
                  <div className="tax-l1-head">
                    <span className="tax-dot" style={{ background: colorOf(l1.id) }} />
                    <span className="tax-l1-name">{l1.name}</span>
                    <span className="tax-l1-id">{l1.id}</span>
                  </div>
                  <div className="tax-l2-list">
                    {l1.l2.map((l2) => (
                      <div key={l2.id} className="tax-l2">
                        <div className="tax-l2-name">
                          <span className="tax-badge">L2</span>{l2.name}
                        </div>
                        {l2.leaves.length > 0 && (
                          <div className="tax-leaves">
                            {l2.leaves.map((lf) => (
                              <span key={lf.id} className="tax-leaf" title={lf.id}>{lf.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <style>{`
        .tax-wrap { display: inline-flex; }
        .tax-btn { font-size: 0.78rem; font-weight: 700; color: var(--primary); background: #eff6ff;
                   border: 1px solid #bfdbfe; border-bottom-width: 2px; border-radius: 8px; padding: 0.3rem 0.7rem;
                   cursor: pointer; white-space: nowrap; box-shadow: 0 2px 0 #bfdbfe, 0 2px 4px rgba(37,99,235,.12); }
        .tax-btn:hover { background: #dbeafe; }
        .tax-btn:active { transform: translateY(1px); box-shadow: 0 1px 0 #bfdbfe; }
        .tax-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.5); z-index: 190; }
        .tax-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 200;
                     width: min(880px, 94vw); max-height: 88vh; overflow: auto; text-align: left;
                     background: #fff; border-radius: 20px; padding: 1.6rem 1.9rem;
                     box-shadow: 0 30px 80px rgba(0,0,0,.45); }
        .tax-modal h2 { font-size: 1.45rem; margin: 0 0 0.5rem; }
        .tax-intro { font-size: 0.98rem; color: var(--fg); margin: 0 0 0.5rem; line-height: 1.55; }
        .tax-summary { font-size: 0.85rem; font-weight: 700; color: var(--muted);
                       background: #f1f5f9; border-radius: 8px; padding: 0.35rem 0.7rem; display: inline-block; margin-bottom: 1rem; }
        .tax-tree { display: flex; flex-direction: column; gap: 0.9rem; }
        .tax-l1 { border: 1px solid var(--border); border-radius: 12px; padding: 0.7rem 0.9rem; }
        .tax-l1-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .tax-dot { width: 12px; height: 12px; border-radius: 50%; flex: 0 0 auto; }
        .tax-l1-name { font-weight: 800; font-size: 1.05rem; }
        .tax-l1-id { font-size: 0.75rem; color: var(--muted); font-weight: 600; }
        .tax-l2-list { display: flex; flex-direction: column; gap: 0.45rem; padding-left: 1.1rem; border-left: 2px solid #e2e8f0; }
        .tax-l2-name { font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 0.45rem; }
        .tax-badge { font-size: 0.66rem; font-weight: 800; color: #475569; background: #e2e8f0;
                     border-radius: 4px; padding: 0.05rem 0.3rem; }
        .tax-leaves { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0.3rem 0 0.2rem 1.6rem; }
        .tax-leaf { font-size: 0.82rem; color: var(--fg); background: #f8fafc; border: 1px solid var(--border);
                    border-radius: 6px; padding: 0.15rem 0.5rem; }
        .tax-modal .rx-close { position: absolute; top: 0.9rem; right: 1rem; z-index: 1; width: 28px; height: 28px;
                    border: 1px solid var(--border); background: #fff; border-radius: 50%; cursor: pointer;
                    font-size: 0.9rem; color: var(--muted); line-height: 1; }
        .tax-modal .rx-close:hover { background: #f1f5f9; color: var(--fg); }
      `}</style>
    </span>
  );
}
