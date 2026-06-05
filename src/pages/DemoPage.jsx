import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore.js';
import { createWebSocket } from '../api/websocket.js';
import IntentChart from '../components/IntentChart.jsx';
import BehaviorPanel from '../components/BehaviorPanel.jsx';
import VectorSpace from '../components/VectorSpace.jsx';

export default function DemoPage() {
  const navigate = useNavigate();
  const { sessionId, scenario, topN, setTopN, stage, setStage } = useSessionStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);
  const [ackPending, setAckPending] = useState(false);
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sessionId) { navigate('/'); return; }
    const ws = createWebSocket(sessionId, {
      SESSION_READY: () => setWsReady(true),
      EVENT_ACK:     () => {},
      INTENT_UPDATE: (msg) => {
        setTopN(msg.top_n);
        setStage(msg.stage);
        setAckPending(false);
      },
      error: (e)     => console.error('WS error', e),
      close: ()      => setWsReady(false),
    });
    wsRef.current = ws;
    return () => ws.close();
  }, [sessionId]);

  if (!scenario) return null;
  const allIntents = scenario.intents.intents;
  const steps = scenario.behaviors.steps;
  const currentStep = steps[stepIndex];
  const finished = stepIndex >= steps.length;

  function handleBehaviorSelect(b) {
    if (ackPending || !wsReady) return;
    setSelectedBehaviors([...selectedBehaviors, { step: currentStep.step, behavior: b }]);
    setAckPending(true);
    wsRef.current.sendBehavior(b.id, b.event_type, b.entity);
    // 다음 스텝으로 즉시 이동 (서버 응답은 차트에만 반영)
    setStepIndex(stepIndex + 1);
  }

  function handleReset() {
    if (wsRef.current) wsRef.current.close();
    navigate('/');
  }

  return (
    <div className="demo-page">
      <div className="container demo-grid">

        <div className="left-col">
          <div className="badges">
            <span className="badge stage">{stage}</span>
            <span className="badge ws">{wsReady ? '🟢 연결됨' : '🔴 연결 끊김'}</span>
            <span className="badge step">행동 {stepIndex} / {steps.length}</span>
            <Link to="/admin" className="badge admin-link" target="_blank">📊 DB 조회</Link>
          </div>

          <h2>Intent — 실시간 Top 5</h2>
          <p className="caption">전체 116개 Intent 중 상위 5개만 노출</p>
          <IntentChart topN={topN} />

          {finished && (
            <div className="final-panel">
              <h3>✅ 시연 완료</h3>
              <p>모든 행동이 누적되어 최종 Intent 분포가 산출됐어요.</p>
              <button className="btn" onClick={handleReset}>다시 시작</button>
            </div>
          )}
        </div>

        <div className="right-col">
          <h2>행동 선택지</h2>
          <p className="caption">모든 사용자에게 동일 노출</p>

          {!finished ? (
            <>
              <BehaviorPanel
                stepBlock={currentStep}
                onSelect={handleBehaviorSelect}
                disabled={ackPending}
              />
              <div style={{ marginTop: '1.5rem' }}>
                <VectorSpace allIntents={allIntents} topN={topN} />
              </div>
            </>
          ) : (
            <div className="history">
              <h3>선택 이력</h3>
              <ol>
                {selectedBehaviors.map((s, i) => (
                  <li key={i}>
                    <span className="hstep">Step {s.step}</span>
                    <span className="hid">{s.behavior.id}</span>
                    <span className="hname">{s.behavior.name}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .demo-page { min-height: 100vh; }
        .demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding-top: 2rem; }
        .badges { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
        .badge { padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
        .stage { background: #eff6ff; color: var(--primary); }
        .ws { background: #f1f5f9; }
        .step { background: #fef3c7; color: #92400e; }
        .admin-link { background: #f1f5f9; text-decoration: none; color: var(--fg); }
        .admin-link:hover { background: #e2e8f0; }
        .caption { color: var(--muted); margin: 0 0 1rem; }
        .final-panel { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 16px; padding: 1.5rem; margin-top: 1.5rem; }
        .final-panel h3 { color: #16a34a; }
        .history { background: white; border: 2px solid var(--border); border-radius: 12px; padding: 1rem 1.5rem; }
        .history ol { padding-left: 0; list-style: none; }
        .history li { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
        .history li:last-child { border-bottom: none; }
        .hstep { background: var(--primary); color: white; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.85rem; font-weight: 700; }
        .hid { font-weight: 700; color: var(--muted); }
        .hname { font-weight: 600; }
        @media (max-width: 1024px) { .demo-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
