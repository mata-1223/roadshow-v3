import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getScenario } from '../api/http.js';
import { useSessionStore } from '../store/sessionStore.js';
import { SCENARIOS } from '../constants/scenarios.js';
import SystemStatusPanel from '../components/SystemStatusPanel.jsx';
import DBViewerPanel from '../components/DBViewerPanel.jsx';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { setSession, setScenario, reset } = useSessionStore();
  const [busy, setBusy] = useState(false);

  async function start(scn) {
    if (!scn.active || busy) return;
    setBusy(true);
    try {
      reset();
      const { session_id, scenario_id } = await createSession(scn.id);
      setSession(session_id, scenario_id);
      const scenario = await getScenario(scenario_id);
      setScenario(scenario);
      navigate('/survey');
    } catch (e) {
      alert(`세션 생성 실패: ${e.message}`);
      setBusy(false);
    }
  }

  return (
    <div className="welcome-page">
      <div className="container welcome-grid">

        <div className="left-col">
          <div className="badge">AX Tech Connect 2026</div>
          <h1>초개인화 Context Engine</h1>
          <p className="lead">
            고객의 상태 정보와 실시간 행동을 기반으로<br />실시간 Intent를 추론하고, 고객 Context를 생성하여 상황에 맞는 활용 방안을 제안합니다.
          </p>
          <h3 className="pick">시나리오를 선택하세요</h3>
          <div className="cards">
            {SCENARIOS.map((scn) => (
              <button
                key={scn.key}
                className={`scenario-card ${scn.active ? '' : 'disabled'}`}
                onClick={() => start(scn)}
                disabled={!scn.active || busy}
              >
                <span className="scn-main">
                  <span className="scn-name">{scn.name}</span>
                  {scn.desc && <span className="scn-desc">{scn.desc}</span>}
                </span>
                {scn.active
                  ? <span className="scn-go">{busy ? '준비 중…' : '시작 →'}</span>
                  : <span className="scn-soon">준비 중</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="right-col">
          <SystemStatusPanel states={{ batch: 'idle', realtime: 'idle', infer: 'idle' }} />
          <DBViewerPanel tables={['sessions', 'event_log']} defaultTable="sessions" limit={5} title="DB 조회 — 적재 현황" />
          <p className="hint">시나리오를 선택하면 배치 → 실시간 → 추론 순으로 컴포넌트가 활성화됩니다.</p>
        </div>

      </div>

      <style>{`
        .welcome-page { min-height: 100vh; display: flex; align-items: center;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }
        .welcome-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: clamp(2rem, 4vw, 5rem); align-items: center;
          width: 100%; max-width: min(2200px, 94vw); margin: 0 auto; }
        .right-col { display: flex; flex-direction: column; gap: 1rem; }
        .badge { display: inline-block; background: #eff6ff; color: #1d4ed8;
          padding: 0.4rem 1rem; border-radius: 999px; font-weight: 600; font-size: 0.9rem; margin-bottom: 1.5rem; }
        h1 { font-size: clamp(2.5rem, 3.6vw, 4.2rem); margin-bottom: 1.25rem; }
        .lead { font-size: clamp(1.25rem, 1.7vw, 1.9rem); color: var(--fg); margin-bottom: 2.5rem; }
        .pick { color: var(--fg); font-size: clamp(1.15rem, 1.3vw, 1.5rem); margin-bottom: 1rem; }
        .cards { display: flex; flex-direction: column; gap: clamp(0.75rem, 1vw, 1.2rem); max-width: min(1040px, 100%); }
        .scenario-card { display: flex; align-items: center; justify-content: space-between;
          border: 2px solid var(--border); background: white; border-radius: 14px;
          padding: clamp(1.1rem, 1.5vw, 1.7rem) clamp(1.4rem, 2vw, 2.2rem); text-align: left; transition: all 0.15s; }
        .scenario-card:not(.disabled):hover { border-color: var(--primary); background: #f0f7ff;
          box-shadow: 0 4px 12px rgba(37,99,235,0.12); }
        .scenario-card.disabled { opacity: 0.5; cursor: not-allowed; }
        .scn-main { display: flex; flex-direction: column; gap: 0.3rem; }
        .scn-name { font-size: clamp(1.2rem, 1.4vw, 1.6rem); font-weight: 700; }
        .scn-desc { font-size: clamp(0.92rem, 1vw, 1.12rem); color: var(--muted); font-weight: 500; line-height: 1.4; }
        .scn-go { color: var(--primary); font-weight: 700; }
        .scn-soon { font-size: 0.85rem; color: var(--muted); background: #f1f5f9; padding: 0.2rem 0.6rem; border-radius: 999px; }
        .hint { color: var(--muted); font-size: 0.9rem; margin-top: 1rem; }
        @media (max-width: 1024px) { .welcome-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
