// 시스템 구성 — 배치 / 실시간 / 추론 3단계의 상태 표시.
// 화면 단계에 따라 각 컴포넌트가 어떤 상태인지 보여주는 시연 연출용 패널.
//   [1] 시작 : 모두 대기(idle)
//   [2] 설문 : 배치 활성(active)
//   [3] 행동 : 배치 완료(done) + 실시간·추론 활성(active)
//
// states: { batch, realtime, infer } 각 값은 'idle' | 'active' | 'done'

import { useState } from 'react';

const STAGES = [
  { key: 'batch',    label: '배치',   desc: 'Batch Context' },
  { key: 'realtime', label: '실시간', desc: 'Real-time Context' },
  { key: 'infer',    label: '추론',   desc: 'Intent Inference' },
];

const STATE_LABEL = { idle: '대기', active: '활성', done: '완료' };

export default function SystemStatusPanel({ states = {}, title = '시스템 구성' }) {
  const [showFlow, setShowFlow] = useState(false);
  return (
    <div className="sys-panel">
      <div className="sys-head">
        <h3 className="sys-title">{title}</h3>
        <button type="button" className="sys-flow-btn" onClick={() => setShowFlow(true)}>🔎 전체 흐름도</button>
      </div>
      {showFlow && (
        <>
          <div className="sys-flow-bd" onClick={() => setShowFlow(false)} />
          <div className="sys-flow-modal" role="dialog">
            <button type="button" className="sys-flow-close" onClick={() => setShowFlow(false)}>✕</button>
            <img src="/hpce-flow.png" alt="HPCE 전체 흐름도" className="sys-flow-img" />
          </div>
        </>
      )}
      <div className="sys-row">
        {STAGES.map((s) => {
          const st = states[s.key] || 'idle';
          return (
            <div key={s.key} className={`sys-box ${st}`}>
              <span className="sys-dot" />
              <span className="sys-label">{s.label}</span>
              <span className="sys-desc">{s.desc}</span>
              <span className="sys-state">{STATE_LABEL[st]}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        .sys-panel { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem; }
        .sys-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; gap: 0.5rem; }
        .sys-title { margin: 0; }
        .sys-flow-btn { font-size: 0.8rem; font-weight: 700; color: var(--primary); background: #eff6ff;
                        border: 1px solid #bfdbfe; border-bottom-width: 2px; border-radius: 8px; padding: 0.3rem 0.7rem;
                        cursor: pointer; white-space: nowrap; }
        .sys-flow-btn:hover { background: #dbeafe; }
        .sys-flow-bd { position: fixed; inset: 0; background: rgba(15,23,42,.6); z-index: 300; }
        .sys-flow-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 301;
                          background: #fff; border-radius: 16px; padding: 1rem; box-shadow: 0 30px 80px rgba(0,0,0,.5);
                          max-width: 96vw; max-height: 94vh; }
        .sys-flow-img { display: block; width: min(1280px, 92vw); max-height: 88vh; object-fit: contain; border-radius: 8px; }
        .sys-flow-close { position: absolute; top: 0.6rem; right: 0.7rem; width: 30px; height: 30px;
                          border: 1px solid var(--border); background: #fff; border-radius: 50%; cursor: pointer;
                          font-size: 0.95rem; color: var(--muted); line-height: 1; }
        .sys-flow-close:hover { background: #f1f5f9; color: var(--fg); }
        .sys-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
        .sys-box {
          position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 0.15rem;
          padding: 0.7rem 0.8rem; border: 2px solid var(--border); border-radius: 12px;
          background: #f8fafc; transition: all 0.2s;
        }
        .sys-box.active { border-color: var(--primary); background: #eff6ff; }
        .sys-box.done   { border-color: #16a34a; background: #f0fdf4; }
        .sys-dot { width: 9px; height: 9px; border-radius: 999px; background: #cbd5e1; margin-bottom: 0.2rem; }
        .sys-box.active .sys-dot { background: var(--primary); animation: sys-pulse 1.4s infinite; }
        .sys-box.done   .sys-dot { background: #16a34a; }
        @keyframes sys-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(37,99,235,.55); transform: scale(1); }
          70%  { box-shadow: 0 0 0 7px rgba(37,99,235,0); transform: scale(1.25); }
          100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); transform: scale(1); }
        }
        .sys-label { font-weight: 700; font-size: 1.05rem; }
        .sys-desc { font-size: 0.72rem; color: var(--muted); }
        .sys-state {
          position: absolute; top: 0.6rem; right: 0.7rem;
          font-size: 0.7rem; font-weight: 700; color: var(--muted);
        }
        .sys-box.active .sys-state { color: var(--primary); }
        .sys-box.done   .sys-state { color: #16a34a; }
      `}</style>
    </div>
  );
}
