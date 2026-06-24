// 데모 진행 스텝퍼 — 시연 흐름에서 지금 어느 단계인지 상단에 항상 표시.
//   1. 시나리오 선택
//   2. 고객 상태 입력  /  3. 파생 변수 생성            (고객 상태 단계)
//   4. 의도 추론 /  5. 실시간 행동 반영 추론      (의도 추론 단계)
// 각 화면(Welcome=1 / Survey=2 / Demo=4|5)에서 current(1~5)만 넘기면 됨.
const STEPS = [
  { n: 1, label: '시나리오 선택',        desc: '시연 시작',          group: '' },
  { n: 2, label: '고객 상태 입력',        desc: '설문 응답',          group: '고객 상태' },
  { n: 3, label: '파생 변수 생성',        desc: 'Index·Score 계산',   group: '고객 상태' },
  { n: 4, label: '의도 추론',     desc: '고객 상태 기반',      group: '의도 추론' },
  { n: 5, label: '실시간 의도 갱신',  desc: '상태 + 실시간 행동',  group: '의도 추론' },
];

export default function DemoStepper({ current = 1 }) {
  return (
    <div className="container stepper">
      {STEPS.map((s, i) => {
        const state = current === s.n ? 'active' : current > s.n ? 'done' : 'todo';
        // 그룹(고객 상태 / 의도 추론)의 첫 단계 앞에 묶음 라벨 표시
        const groupStart = s.group && s.group !== (STEPS[i - 1]?.group || '');
        return (
          <div key={s.n} className={`sp ${state} ${groupStart ? 'gstart' : ''}`}>
            {groupStart && <span className="sp-group">{s.group}</span>}
            <span className="sp-num">{state === 'done' ? '✓' : s.n}</span>
            <span className="sp-tx">
              <b>{s.label}</b>
              <small>{s.desc}</small>
            </span>
            {i < STEPS.length - 1 && <span className="sp-line" />}
          </div>
        );
      })}

      <style>{`
        .stepper { display: flex; align-items: center; gap: 0; padding: 1.5rem 0 0.6rem; }
        .sp { position: relative; display: flex; align-items: center; gap: 0.55rem; flex: 1; min-width: 0; opacity: 0.5; }
        .sp.active, .sp.done { opacity: 1; }
        /* 그룹(고객 상태 / 의도 추론) 묶음 라벨 + 시작 구분 */
        .sp-group { position: absolute; top: -1.25rem; left: 0; font-size: 0.7rem; font-weight: 800;
                    color: var(--muted); letter-spacing: 0.03em; white-space: nowrap; }
        .sp.gstart { margin-left: 0.9rem; padding-left: 0.9rem; border-left: 1px dashed var(--border); }
        .sp-num { flex: none; width: 30px; height: 30px; border-radius: 50%; display: inline-flex;
                  align-items: center; justify-content: center; font-weight: 800; font-size: 0.92rem;
                  background: #e2e8f0; color: #64748b; border: 2px solid transparent; }
        .sp.active .sp-num { background: var(--primary); color: #fff;
                             box-shadow: 0 0 0 4px rgba(37,99,235,.18); }
        .sp.done .sp-num { background: #eff6ff; color: var(--primary); border-color: var(--primary); }
        .sp-tx { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
        .sp-tx b { font-size: 0.95rem; font-weight: 700; color: var(--fg); white-space: nowrap; }
        .sp.todo .sp-tx b { color: var(--muted); }
        .sp-tx small { font-size: 0.72rem; color: var(--muted); white-space: nowrap; }
        .sp-line { flex: 1; height: 2px; min-width: 1.2rem; margin: 0 0.6rem; border-radius: 2px; background: var(--border); }
        .sp.done .sp-line { background: var(--primary); opacity: 0.5; }
        @media (max-width: 900px) { .sp-tx small { display: none; } }
      `}</style>
    </div>
  );
}
