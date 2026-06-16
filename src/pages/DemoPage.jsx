import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore.js';
import { createWebSocket } from '../api/websocket.js';
import { getIntentPositions } from '../api/http.js';
import IntentChart from '../components/IntentChart.jsx';
import BehaviorPanel from '../components/BehaviorPanel.jsx';
import VectorSpace from '../components/VectorSpace.jsx';
import SystemStatusPanel from '../components/SystemStatusPanel.jsx';
import DBViewerPanel from '../components/DBViewerPanel.jsx';
import SurveySummaryPanel from '../components/SurveySummaryPanel.jsx';

export default function DemoPage() {
  const navigate = useNavigate();
  const {
    sessionId, scenarioId, scenario, surveyAnswers,
    topN, others, stage,
    intentPositions, l1Zones,
    customerPosition, baselinePosition, customerPath,
    applyIntentUpdate, setIntentPositions,
  } = useSessionStore();

  // 2단계 트리 상태
  const [mode, setMode]         = useState('step1');     // step1 | step2 | ended
  const [parent, setParent]     = useState(null);        // Step 2의 부모 1-X
  const [history, setHistory]   = useState([]);          // [{seq, behavior}]
  const [ackPending, setAckPending] = useState(false);
  const [wsReady, setWsReady]   = useState(false);
  const wsRef = useRef(null);

  // Vector Space 좌표 사전 fetch
  useEffect(() => {
    if (intentPositions || !scenarioId) return;
    getIntentPositions(scenarioId)
      .then((data) => {
        const posMap = {};
        (data.intents || []).forEach((p) => {
          posMap[p.intent_id] = { x: p.x, y: p.y, L1_id: p.L1_id };
        });
        setIntentPositions(posMap, data.l1_zones || []);
      })
      .catch((e) => console.error('Failed to load intent positions', e));
  }, [scenarioId, intentPositions, setIntentPositions]);

  useEffect(() => {
    if (!sessionId) { navigate('/'); return; }
    const ws = createWebSocket(sessionId, {
      SESSION_READY: () => setWsReady(true),
      EVENT_ACK:     () => {},
      INTENT_UPDATE: (msg) => {
        applyIntentUpdate(msg);
        setAckPending(false);
      },
      error: (e)     => console.error('WS error', e),
      close: ()      => setWsReady(false),
    });
    wsRef.current = ws;
    return () => ws.close();
  }, [sessionId]);

  const behaviorsData = scenario?.behaviors || {};
  const isSingleSelect = behaviorsData.structure === 'single-select';

  // 단일 선택 시나리오(직장인)는 시작 모드를 'single'로
  useEffect(() => {
    if (isSingleSelect) setMode('single');
  }, [isSingleSelect]);

  if (!scenario) return null;
  const step1Block = behaviorsData.step1;
  const step2Block = behaviorsData.step2;
  const allIntents = scenario.intents?.intents || [];

  function handleSelect(b) {
    if (ackPending || !wsReady || mode === 'ended') return;

    setAckPending(true);
    wsRef.current.sendBehavior(b.id, b.event_type, b.entity);
    setHistory([...history, { seq: history.length + 1, behavior: b, from: mode, parent }]);

    // 다음 모드 결정
    if (b.event_type === 'app_exit') {
      setMode('ended');
      setParent(null);
      // app_exit은 서버가 INTENT_UPDATE를 보내지 않으므로 ackPending을 직접 해제
      setTimeout(() => setAckPending(false), 200);
    } else if (b.event_type === 'navigate_back') {
      setMode('step1');
      setParent(null);
    } else if (mode === 'step1') {
      // 1-X 클릭 → step 2 (해당 섹션 진입)
      setMode('step2');
      setParent(b.id);
    }
    // 2-X 클릭 → step2 유지: 섹션 내에서 연속 행동 가능. 메인 메뉴 복귀는 BACK으로.
  }

  function handleReset() {
    if (wsRef.current) wsRef.current.close();
    navigate('/');
  }

  return (
    <div className="demo-page">
      <div className="container">
        <div className="badges">
          <span className="badge stage">{stage}</span>
          <span className="badge ws">{wsReady ? '🟢 연결됨' : '🔴 연결 끊김'}</span>
          <span className="badge step">행동 누적 {history.length}회</span>
          <Link to="/admin" className="badge admin-link" target="_blank">📊 DB 전체 보기 ↗</Link>
        </div>
      </div>

      <div className="container demo-grid">

        {/* ── 좌 · 입력 (시스템 구성 + 행동 + 설문) ──────────── */}
        <div className="col col-input">
          <SystemStatusPanel states={{ batch: 'done', realtime: 'active', infer: 'active' }} />

          <div className="behavior-block">
            <h2>행동 선택지</h2>
            <p className="caption">
              {mode === 'single'  && `앱을 선택하세요 (${behaviorsData?.apps?.length ?? ''}개 중 · 반복 선택할수록 의도가 또렷해집니다)`}
              {mode === 'step1'   && `Step 1: ${step1Block?.behaviors?.length ?? ''}개 상위 메뉴 중 선택`}
              {mode === 'step2'   && 'Step 2: 섹션 내 행동 선택 (연속 선택 가능 · 뒤로가기로 메뉴 복귀)'}
              {mode === 'ended'   && '시연 종료'}
            </p>

            {mode !== 'ended' ? (
              <BehaviorPanel
                mode={mode}
                step1Block={step1Block}
                step2Block={step2Block}
                appsBlock={behaviorsData}
                parent={parent}
                onSelect={handleSelect}
                disabled={ackPending}
              />
            ) : null}

            {mode === 'ended' && (
              <div className="final-panel">
                <h3>👋 고객이 앱을 이탈했습니다</h3>
                <p>이 시점의 Intent 분포·고객 위치가 최종 상태로 보존됩니다.</p>
                <button className="btn" onClick={handleReset}>다시 시작</button>
              </div>
            )}

            {history.length > 0 && (
              <details className="history">
                <summary>행동 이력 ({history.length}회)</summary>
                <ol>
                  {history.map((h) => (
                    <li key={h.seq}>
                      <span className="hstep">{h.from === 'step1' ? 'S1' : 'S2'}</span>
                      <span className="hid">{h.behavior.id}</span>
                      <span className="hname">{h.behavior.name}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </div>

          <SurveySummaryPanel survey={scenario.survey} answers={surveyAnswers} />
        </div>

        {/* ── 중 · 추론 (Intent + Vector + DB) ──────────────── */}
        <div className="col col-infer">
          <h2>Intent — 실시간 Top 5</h2>
          <p className="caption">{allIntents.length}개 Intent 중 분포 상위 5개 · 각 행의 <b>[추론 이유]</b>·<b>[활용 예시]</b> 버튼을 클릭하면 상세가 표시됩니다</p>
          <IntentChart topN={topN} actionsData={scenario.actions} l1Zones={l1Zones} />

          {others && (
            <div className="others-row">
              <span className="others-label">기타 (n={others.count})</span>
              <span className="others-val">{(others.probability * 100).toFixed(1)}%</span>
              {others.delta_probability !== undefined && Math.abs(others.delta_probability) >= 0.001 && (
                <span className={`others-delta ${others.delta_probability > 0 ? 'up' : 'down'}`}>
                  {others.delta_probability > 0 ? '▲' : '▼'} {(Math.abs(others.delta_probability) * 100).toFixed(1)}%p
                </span>
              )}
            </div>
          )}

          <div style={{ marginTop: '0.9rem' }}>
            <VectorSpace
              intentPositions={intentPositions}
              l1Zones={l1Zones}
              allIntents={allIntents}
              topN={topN}
              others={others}
              customerPosition={customerPosition}
              baselinePosition={baselinePosition}
              customerPath={customerPath}
            />
          </div>

          <div style={{ marginTop: '0.9rem' }}>
            <DBViewerPanel sessionId={sessionId} />
          </div>
        </div>

      </div>

      <style>{`
        .demo-page { height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
        .demo-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1.35fr;
                     gap: clamp(0.8rem, 1.3vw, 1.4rem); padding-top: 0.5rem; padding-bottom: 0.5rem; align-items: stretch; }
        .col { min-width: 0; height: 100%; }
        .col-input { display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; padding-right: 0.3rem; }
        .col-infer { overflow-y: auto; padding-right: 0.3rem; }
        .behavior-block h2 { margin-bottom: 0.25rem; }
        .badges { display: flex; gap: 0.5rem; margin-bottom: 0; flex-wrap: wrap; padding-top: 0.6rem; padding-bottom: 0.4rem; }
        .badge { padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
        .stage { background: #eff6ff; color: var(--primary); }
        .ws { background: #f1f5f9; }
        .step { background: #fef3c7; color: #92400e; }
        .admin-link { background: #f1f5f9; text-decoration: none; color: var(--fg); }
        .admin-link:hover { background: #e2e8f0; }
        .caption { color: var(--muted); margin: 0 0 0.6rem; font-size: 0.9rem; }
        .others-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; padding: 0.5rem 1rem;
                      background: #f1f5f9; border-radius: 8px; font-size: 0.9rem; }
        .others-label { color: var(--muted); }
        .others-val { font-weight: 700; }
        .others-delta { padding: 1px 6px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; }
        .others-delta.up { background: #dcfce7; color: #15803d; }
        .others-delta.down { background: #fee2e2; color: #b91c1c; }
        .final-panel { background: #f3f4f6; border: 2px solid #6b7280; border-radius: 16px; padding: 1.5rem; margin-top: 1.5rem; }
        .final-panel h3 { color: #374151; }
        .history { margin-top: 1.5rem; background: white; border: 2px solid var(--border); border-radius: 12px; padding: 1rem 1.5rem; }
        .history summary { font-weight: 600; cursor: pointer; color: var(--muted); }
        .history ol { padding-left: 0; list-style: none; margin: 0.75rem 0 0; max-height: 200px; overflow-y: auto; }
        .history li { display: flex; align-items: center; gap: 0.75rem; padding: 0.3rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
        .history li:last-child { border-bottom: none; }
        .hstep { background: var(--primary); color: white; padding: 0.1rem 0.45rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
        .hid { font-weight: 700; color: var(--muted); }
        .hname { font-weight: 500; }
        @media (max-width: 1400px) { .demo-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 1024px) { .demo-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
