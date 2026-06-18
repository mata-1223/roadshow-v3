// 2단계 트리 행동 패널 (Step 1: 상위 메뉴 6개 / Step 2: Step1별 하위 3개 + BACK + EXIT)

export default function BehaviorPanel({
  mode,         // "step1" | "step2" | "single"
  step1Block,   // { question, behaviors: [...6개] }
  step2Block,   // { question, by_parent, common }
  appsBlock,    // 단일 선택: { question, apps: [...10개] }
  parent,       // 현재 Step 2의 부모 1-X
  onSelect,
  disabled,
}) {
  // single-select (직장인: 10개 앱 중 하나 선택, 반복 가능)
  if (mode === 'single') {
    if (!appsBlock) return null;
    return (
      <div className="behavior-panel">
        <div className="step-head">
          <div className="step-num single">앱 선택</div>
          <div className="step-q">{appsBlock.question}</div>
        </div>
        <div className="app-grid">
          {appsBlock.apps.map((a) => (
            <button key={a.id} className="appbtn" disabled={disabled} onClick={() => onSelect(a)}>
              <span className="app-icon">{a.icon}</span>
              <span className="app-apps">{a.examples}</span>
              <span className="app-cat">{a.name}</span>
            </button>
          ))}
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  // step1
  if (mode === 'step1') {
    if (!step1Block) return null;
    return (
      <div className="behavior-panel">
        <div className="step-head">
          <div className="step-num step1">Step 1</div>
          <div className="step-q">{step1Block.question}</div>
        </div>
        <div className="behavior-grid">
          {step1Block.behaviors.map((b) => (
            <BehaviorButton key={b.id} b={b} disabled={disabled} onSelect={onSelect} />
          ))}
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  // step2
  if (mode === 'step2') {
    if (!step2Block || !parent) return null;
    const items = step2Block.by_parent?.[parent] || [];
    const common = step2Block.common || [];
    return (
      <div className="behavior-panel">
        <div className="step-head">
          <div className="step-num step2">Step 2</div>
          <div className="step-q">
            {step2Block.question}
            <span className="parent-hint"> · 상위: {parent}</span>
          </div>
        </div>
        <div className="behavior-grid">
          {items.map((b) => (
            <BehaviorButton key={b.id} b={b} disabled={disabled} onSelect={onSelect} />
          ))}
        </div>
        <div className="aux-row">
          {common.map((b) => (
            <BehaviorButton key={b.id} b={b} disabled={disabled} onSelect={onSelect}
                            variant={b.id === 'EXIT' ? 'exit' : 'back'} />
          ))}
        </div>
        <style>{STYLES}</style>
      </div>
    );
  }

  return null;
}

function BehaviorButton({ b, disabled, onSelect, variant }) {
  const cls = `bbtn ${variant || ''}`;
  return (
    <button className={cls} disabled={disabled} onClick={() => onSelect(b)}>
      <span className="bid">{b.id}</span>
      <span className="bname">{b.icon && <span className="bemoji">{b.icon}</span>}{b.name}</span>
      <span className="bevent">{b.event_type}</span>
    </button>
  );
}

const STYLES = `
  .behavior-panel { background: #fafbfc; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem; }
  .step-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
  .step-num { color: white; padding: 0.25rem 0.75rem; border-radius: 8px; font-weight: 700; }
  .step-num.step1 { background: var(--primary); }
  .step-num.step2 { background: #16a34a; }
  .step-num.single { background: #7c3aed; }
  .app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.7rem; }
  .appbtn { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; padding: 0.9rem 0.6rem;
            background: white; border: 2px solid var(--border); border-radius: 12px; text-align: center; }
  .appbtn:hover:not(:disabled) { border-color: #7c3aed; background: #f5f3ff; }
  .appbtn:disabled { opacity: 0.4; cursor: not-allowed; }
  .app-icon { font-size: 1.7rem; line-height: 1; }
  .app-apps { font-weight: 700; font-size: 0.9rem; line-height: 1.25; color: #1e293b; }
  .app-cat { font-size: 0.74rem; color: var(--muted); font-weight: 600; }
  .step-q { font-weight: 600; }
  .parent-hint { color: var(--muted); font-weight: 500; margin-left: 0.5rem; font-size: 0.9rem; }
  .behavior-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
  .aux-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--border); }
  .bbtn { display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-start; padding: 0.9rem 1rem;
          background: white; border: 2px solid var(--border); border-radius: 10px; text-align: left; }
  .bbtn:hover:not(:disabled) { border-color: var(--primary); background: #eff6ff; }
  .bbtn.back { background: #fff7ed; border-color: #fed7aa; }
  .bbtn.back:hover:not(:disabled) { border-color: #f97316; background: #ffedd5; }
  .bbtn.exit { background: #fef2f2; border-color: #fecaca; }
  .bbtn.exit:hover:not(:disabled) { border-color: #ef4444; background: #fee2e2; }
  .bid { font-weight: 700; font-size: 0.8rem; opacity: 0.7; }
  .bname { font-weight: 600; }
  .bemoji { font-size: 1.15rem; margin-right: 0.4rem; }
  .bevent { font-size: 0.75rem; color: var(--muted); }
  .bbtn:disabled { opacity: 0.4; cursor: not-allowed; }
`;
