import { useEffect, useRef, useState } from 'react';

// 시나리오 ↔ 서사형 스토리보드 매핑 (public/*.html)
export const STORY_MAP = {
  'cs-myk-v3': [
    { label: '데이터 끊긴 그 순간, 먼저 채우는 AI', src: '/story-cs-fld-bnf.html' },
  ],
  'bundle-v3': [
    { label: '고객보다 먼저 찾는 결합 기회',       src: '/story-bundle-newlywed-v2.html?auto=1' },
    { label: '이삿짐도 아직 안 챙겼는데, 인터넷은 이미 준비 완료', src: '/story-bundle-move-v2.html?auto=1' },
  ],
  'worker-v3': [
    { label: '번아웃이 쌓인 하루, 회복을 먼저 건네는 AI', src: '/story-journey-evening.html?auto=1' },
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
