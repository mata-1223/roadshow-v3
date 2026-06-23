import { useState } from 'react';

// 시나리오 ↔ 서사형 스토리보드 매핑 (public/*.html)
const STORY_MAP = {
  'cs-myk-v3': [
    { label: '전화하기 전에 상담이 끝난다 · 장애 선제', src: '/story-cs-outage.html' },
    { label: '화나기 직전의 감정을 읽는다',            src: '/story-scenarios.html?embed=1#B' },
    { label: '부모보다 먼저 아이를 챙긴다',            src: '/story-scenarios.html?embed=1#C' },
  ],
  'bundle-v3': [
    { label: '결혼하기도 전에 결합을 제안한다',        src: '/story-scenarios.html?embed=1#D' },
    { label: '이사 당일, 모든 통신이 이미 준비된다',   src: '/story-scenarios.html?embed=1#E' },
    { label: '가족 결합이 깨질 미래를 막는다',         src: '/story-scenarios.html?embed=1#F' },
  ],
  'worker-v3': [
    { label: '같은 고객, 연속 변화하는 의도',          src: '/story-same-customer.html' },
    { label: '앱 활동 추론 → 기가지니 선제 실행 (3종)', src: '/story-genie-modes.html' },
    { label: '동굴 모드 · 기가지니 (영상형)',          src: '/anim-demo.html' },
  ],
};

export default function ProactiveStory({ scenarioId }) {
  const stories = STORY_MAP[scenarioId] || [];
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (!stories.length) return null;

  const launch = (i) => { setIdx(i); setOpen(true); };

  return (
    <div className="pstory">
      <div className="ps-head">🎬 이 의도가 실제로는 이렇게 펼쳐집니다</div>
      <div className="ps-sub">
        엔진이 추론한 의도가 고객의 <b>실제 일상</b>에서 어떻게 <b>선제 대응</b>으로 이어지는지 — 스토리로 확인하세요.
      </div>
      <div className="ps-list">
        {stories.map((s, i) => (
          <button key={s.src} className="ps-btn" onClick={() => launch(i)}>▶ {s.label}</button>
        ))}
      </div>

      {open && (
        <div className="ps-overlay" onClick={(e) => { if (e.target.classList.contains('ps-overlay')) setOpen(false); }}>
          <div className="ps-bar">
            <div className="ps-tabs">
              {stories.map((s, i) => (
                <button key={s.src} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)}>{s.label}</button>
              ))}
            </div>
            <button className="ps-close" onClick={() => setOpen(false)}>✕ 닫기</button>
          </div>
          <iframe key={stories[idx].src} className="ps-frame" src={stories[idx].src} title={stories[idx].label} />
        </div>
      )}

      <style>{`
        .pstory { margin-top: 0.9rem; background: linear-gradient(135deg, #2a2350, #1e1b3a);
                  border: 1px solid #4c3a8a; border-radius: 14px; padding: 0.9rem 1rem; color: #fff; }
        .ps-head { font-weight: 800; font-size: 1.02rem; }
        .ps-sub { font-size: 0.82rem; color: #c4b5fd; margin: 0.25rem 0 0.7rem; }
        .ps-sub b { color: #fff; }
        .ps-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .ps-btn { font-size: 0.82rem; font-weight: 700; color: #fff; background: rgba(124,58,237,0.85);
                  border: 1px solid #a78bfa; border-radius: 10px; padding: 0.45rem 0.7rem; cursor: pointer;
                  transition: all 0.15s; }
        .ps-btn:hover { background: #7c3aed; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.5); }

        .ps-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(8,10,22,0.92);
                      display: flex; flex-direction: column; align-items: center; padding: 1.2rem;
                      animation: psfade 0.2s ease; }
        @keyframes psfade { from { opacity: 0; } to { opacity: 1; } }
        .ps-bar { width: 100%; max-width: 1100px; display: flex; align-items: center; gap: 0.6rem;
                  margin-bottom: 0.8rem; }
        .ps-tabs { flex: 1; display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .ps-tabs button { font-size: 0.8rem; font-weight: 700; color: #cbd5e1; background: #1e293b;
                          border: 1px solid #334155; border-radius: 9px; padding: 0.4rem 0.7rem; cursor: pointer; }
        .ps-tabs button.on { color: #fff; background: #7c3aed; border-color: #a78bfa; }
        .ps-close { font-size: 0.85rem; font-weight: 800; color: #fff; background: #334155;
                    border: none; border-radius: 9px; padding: 0.5rem 0.9rem; cursor: pointer; flex: none; }
        .ps-close:hover { background: #475569; }
        .ps-frame { flex: 1; width: 100%; max-width: 1100px; border: none; border-radius: 14px;
                    background: #0b1020; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
}
