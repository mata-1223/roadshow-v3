// 상단 공통 바 — 연결 상태 + DB 조회 화면 이동. 세 화면(Welcome/Survey/Demo)에 일관 노출.
// connected: WS/시스템 연결 상태 (Demo는 실시간 WS 상태를 전달, 그 외 화면은 시스템 온라인=true).
import { Link } from 'react-router-dom';

export default function TopBar({ connected = true }) {
  return (
    <div className="container topbar">
      <span className={`tb-badge tb-ws ${connected ? 'on' : 'off'}`}>
        {connected ? '🟢 연결됨' : '🔴 연결 끊김'}
      </span>
      <Link to="/admin" className="tb-badge tb-db" target="_blank">📊 DB 조회 화면 ↗</Link>

      <style>{`
        .topbar { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.6rem; padding-bottom: 0.4rem; }
        .tb-badge { padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600;
                    background: #f1f5f9; color: var(--fg); }
        .tb-ws.off { color: #b91c1c; }
        .tb-db { text-decoration: none; }
        .tb-db:hover { background: #e2e8f0; }
      `}</style>
    </div>
  );
}
