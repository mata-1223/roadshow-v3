import { useEffect, useRef, useState } from 'react';

// 시나리오 ↔ 서사형 스토리보드 매핑 (public/*.html)
export const STORY_MAP = {
  'cs-myk-v3': [
    { label: '전화하기 전에 상담이 끝난다 · 장애 선제', src: '/story-cs-outage.html' },
    { label: '요금 불만, 말하기 전에 선제 해결',        src: '/story-scenarios.html?embed=1#B' },
    { label: '부모보다 먼저 아이를 챙긴다',            src: '/story-scenarios.html?embed=1#C' },
  ],
  'bundle-v3': [
    { label: '결혼하기도 전에 결합을 제안한다',        src: '/story-scenarios.html?embed=1#D' },
    { label: '이사 당일, 모든 통신이 이미 준비된다',   src: '/story-scenarios.html?embed=1#E' },
    { label: '가족 결합이 깨질 미래를 막는다',         src: '/story-scenarios.html?embed=1#F' },
  ],
  'worker-v3': [
    { label: '행동 여정 · 의도 적중 리빌 (퇴근→잠들기)', src: '/story-journey-evening.html?auto=1' },
    { label: '같은 고객, 연속 변화하는 의도',          src: '/story-same-customer.html' },
    { label: '앱 활동 추론 → 기가지니 선제 실행 (3종)', src: '/story-genie-modes.html' },
    { label: '동굴 모드 · 기가지니 (영상형)',          src: '/anim-demo.html' },
  ],
};

// 풀스크린 스토리 팝업 — 초기 화면(시나리오 선택)에서 시나리오 클릭 시 표시
export function StoryOverlay({ scenarioId, title, onClose, onStart }) {
  const stories = STORY_MAP[scenarioId] || [];
  const [idx, setIdx] = useState(0);
  const frameRef = useRef(null);

  // transform scale는 비트맵 확대라 흐려짐 → 동일 origin iframe 문서에 zoom 적용(재렌더, 선명)
  // 스토리 콘텐츠 기준 크기(아래) 대비 창(가용 영역) 비율로 zoom — 창에 맞춰 크고 선명하게
  const BASE_W = 1000;
  const BASE_H = 760;
  const fitZoom = () => {
    const f = frameRef.current;
    if (!f || !f.parentElement) return;
    let doc;
    try { doc = f.contentDocument; } catch { return; }
    if (!doc || !doc.documentElement) return;
    const availW = f.parentElement.clientWidth;
    const availH = f.parentElement.clientHeight;
    const z = Math.max(0.6, Math.min(availW / BASE_W, availH / BASE_H));
    doc.documentElement.style.zoom = String(z);
  };

  useEffect(() => {
    window.addEventListener('resize', fitZoom);
    return () => window.removeEventListener('resize', fitZoom);
  }, []);

  // 스토리(iframe) 하단 버튼 → 부모로 메시지 전달
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data === 'story-start-demo') { if (onStart) onStart(); }
      else if (e.data === 'story-close') { if (onClose) onClose(); }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [onStart, onClose]);

  if (!stories.length) return null;

  return (
    <div className="ps-overlay" onClick={(e) => { if (e.target.classList.contains('ps-overlay')) onClose(); }}>
      <div className="ps-bar">
        {title && <span className="ps-title">🎬 {title}</span>}
        <div className="ps-tabs">
          {stories.map((s, i) => (
            <button key={s.src} className={i === idx ? 'on' : ''} onClick={() => setIdx(i)}>{s.label}</button>
          ))}
        </div>
        <button className="ps-close" onClick={onClose}>✕ 닫기</button>
      </div>
      <div className="ps-stage">
        <iframe
          ref={frameRef}
          key={stories[idx].src}
          className="ps-frame"
          src={stories[idx].src}
          title={stories[idx].label}
          onLoad={fitZoom}
        />
      </div>

      <style>{`
        .ps-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(8,10,22,0.94);
                      display: flex; flex-direction: column; padding: 0.6rem 0.8rem; animation: psfade 0.2s ease; }
        @keyframes psfade { from { opacity: 0; } to { opacity: 1; } }
        .ps-bar { flex: none; display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
        .ps-title { flex: none; font-size: 0.95rem; font-weight: 800; color: #fff; }
        .ps-tabs { flex: 1; display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .ps-tabs button { font-size: 0.8rem; font-weight: 700; color: #cbd5e1; background: #1e293b;
                          border: 1px solid #334155; border-radius: 9px; padding: 0.4rem 0.7rem; cursor: pointer; }
        .ps-tabs button.on { color: #fff; background: #7c3aed; border-color: #a78bfa; }
        .ps-start { flex: none; font-size: 0.82rem; font-weight: 800; color: #fff; background: #2563eb;
                    border: none; border-radius: 9px; padding: 0.5rem 0.9rem; cursor: pointer; }
        .ps-start:hover { background: #1d4ed8; }
        .ps-close { flex: none; font-size: 0.85rem; font-weight: 800; color: #fff; background: #334155;
                    border: none; border-radius: 9px; padding: 0.5rem 0.9rem; cursor: pointer; }
        .ps-close:hover { background: #475569; }
        .ps-stage { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .ps-frame { width: 100%; height: 100%; border: none; border-radius: 14px; background: #0b1020;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
      `}</style>
    </div>
  );
}
