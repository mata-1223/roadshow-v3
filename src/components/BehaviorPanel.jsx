// Step별 행동 선택지 패널 (모두에게 동일하게 노출)
export default function BehaviorPanel({ stepBlock, onSelect, selectedId, disabled }) {
  if (!stepBlock) return null;

  return (
    <div className="behavior-panel">
      <div className="step-head">
        <div className="step-num">Step {stepBlock.step}</div>
        <div className="step-q">{stepBlock.question}</div>
      </div>
      <div className="behavior-grid">
        {stepBlock.behaviors.map((b) => (
          <button
            key={b.id}
            className={`bbtn ${selectedId === b.id ? 'sel' : ''}`}
            disabled={disabled}
            onClick={() => onSelect(b)}
          >
            <span className="bid">{b.id}</span>
            <span className="bname">{b.name}</span>
            <span className="bevent">{b.event_type}</span>
          </button>
        ))}
      </div>
      <style>{`
        .behavior-panel { background: #fafbfc; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem; }
        .step-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .step-num { background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 8px; font-weight: 700; }
        .step-q { font-weight: 600; }
        .behavior-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
        .bbtn { display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-start; padding: 0.9rem 1rem;
                background: white; border: 2px solid var(--border); border-radius: 10px; text-align: left; }
        .bbtn:hover:not(:disabled) { border-color: var(--primary); background: #eff6ff; }
        .bbtn.sel { border-color: var(--primary); background: var(--primary); color: white; }
        .bid { font-weight: 700; font-size: 0.8rem; opacity: 0.7; }
        .bname { font-weight: 600; }
        .bevent { font-size: 0.75rem; color: var(--muted); }
        .bbtn.sel .bevent, .bbtn.sel .bid { color: rgba(255,255,255,0.8); }
        .bbtn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
