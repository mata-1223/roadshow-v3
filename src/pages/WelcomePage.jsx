import { useNavigate } from 'react-router-dom';
import { createSession, getScenario } from '../api/http.js';
import { useSessionStore } from '../store/sessionStore.js';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { setSession, setScenario, reset } = useSessionStore();

  async function start() {
    reset();
    const { session_id, scenario_id } = await createSession();
    setSession(session_id, scenario_id);
    const scn = await getScenario(scenario_id);
    setScenario(scn);
    navigate('/survey');
  }

  return (
    <div className="welcome-page">
      <div className="container welcome-content">
        <div className="badge">AX Tech Connect 2026</div>
        <h1>초개인화 Context Engine</h1>
        <p className="lead">
          고객의 상태 정보와 MyKT 앱 행동을 기반으로<br></br>실시간 Intent를 추론하고, 상황에 맞는 활용 방안을 제안합니다.
        </p>
        <p className="sub">
          116개 Intent 전체에 대해 실시간 추론
        </p>

        <button className="btn btn-primary cta" onClick={start}>
          시작하기 →
        </button>

      </div>
      <style>{`
        .welcome-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }
        .welcome-content { text-align: center; max-width: 800px; }
        .badge {
          display: inline-block;
          background: #eff6ff; color: #1d4ed8;
          padding: 0.4rem 1rem; border-radius: 999px;
          font-weight: 600; font-size: 0.9rem;
          margin-bottom: 2rem;
        }
        h1 { font-size: 3.5rem; margin-bottom: 1.5rem; }
        .lead { font-size: 1.5rem; color: var(--fg); margin-bottom: 0.5rem; }
        .sub  { font-size: 1.1rem; color: var(--muted); margin-bottom: 3rem; }
        .cta {
          font-size: 1.3rem; padding: 1.25rem 2.5rem;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
      `}</style>
    </div>
  );
}
