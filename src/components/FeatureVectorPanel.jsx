// 배치 feature vector — 설문 응답이 누적되며 실시간으로 채워지는 테이블.
//
// base feature는 survey.json의 option.features에 그대로 들어있으므로 백엔드 호출 없이
// 클라이언트에서 즉시 표시한다(완료/대기). 파생(Index/Score 등)은 builder가 필요하므로
// 제출 후 batchFeatures가 들어오면 채운다.
import { useMemo } from 'react';
import { featureLabel } from '../utils/featureLabel.js';

function fmt(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}

export default function FeatureVectorPanel({ survey, answers, batchFeatures }) {
  // base feature → 최초 정의 문항(qid) 매핑 (순서 보존)
  const { order, sourceQid, qById } = useMemo(() => {
    const sourceQid = {};
    const order = [];
    const qById = {};
    for (const q of survey?.questions || []) {
      qById[q.id] = q;
      for (const opt of q.options || []) {
        for (const fname of Object.keys(opt.features || {})) {
          if (!(fname in sourceQid)) {
            sourceQid[fname] = q.id;
            order.push(fname);
          }
        }
      }
    }
    return { order, sourceQid, qById };
  }, [survey]);

  function baseRow(fname) {
    const qid = qById[sourceQid[fname]] ? sourceQid[fname] : null;
    const code = qid ? answers[qid] : undefined;
    if (code == null) return { value: null, done: false, src: qid };
    const q = qById[qid];
    const opt = (q.options || []).find((o) => o.code === code);
    return { value: opt?.features?.[fname], done: true, src: qid };
  }

  // 파생 feature = batchFeatures 키 중 base에 없는 것
  const derived = useMemo(() => {
    if (!batchFeatures) return [];
    return Object.keys(batchFeatures).filter((k) => !(k in sourceQid));
  }, [batchFeatures, sourceQid]);

  const doneCount = order.filter((f) => baseRow(f).done).length;

  return (
    <div className="fv-panel">
      <div className="fv-head">
        <h3>배치 feature vector</h3>
        <span className="fv-count">{doneCount} / {order.length}</span>
      </div>
      <p className="fv-note">설문 응답마다 base feature 행이 실시간 갱신됩니다. 파생 feature는 제출 후 계산.</p>

      <div className="fv-table">
        <div className="fv-row fv-hd">
          <span>Feature</span><span>값</span><span>상태</span>
        </div>
        {order.map((fname) => {
          const r = baseRow(fname);
          return (
            <div key={fname} className={`fv-row ${r.done ? 'done' : 'wait'}`}>
              <span className="fv-name">{featureLabel(fname)}</span>
              <span className="fv-val">{fmt(r.value)}</span>
              <span className={`fv-badge ${r.done ? 'b-done' : 'b-wait'}`}>{r.done ? '완료' : '대기'}</span>
            </div>
          );
        })}

        {derived.length > 0 && (
          <>
            <div className="fv-sub">파생 feature (Index / Score)</div>
            {derived.map((fname) => (
              <div key={fname} className="fv-row done">
                <span className="fv-name">{featureLabel(fname)}</span>
                <span className="fv-val">{fmt(batchFeatures[fname])}</span>
                <span className="fv-badge b-done">완료</span>
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`
        .fv-panel { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem; }
        .fv-head { display: flex; align-items: baseline; justify-content: space-between; }
        .fv-head h3 { margin: 0; }
        .fv-count { font-weight: 700; color: var(--primary); }
        .fv-note { color: var(--muted); font-size: 0.82rem; margin: 0.4rem 0 1rem; }
        .fv-table { display: flex; flex-direction: column; gap: 0.3rem; max-height: 60vh; overflow-y: auto; }
        .fv-row { display: grid; grid-template-columns: 1fr auto 3.2rem; align-items: center; gap: 0.5rem;
                  padding: 0.45rem 0.6rem; border-radius: 8px; font-size: 0.9rem; }
        .fv-hd { color: var(--muted); font-weight: 700; font-size: 0.78rem; padding-bottom: 0.1rem; }
        .fv-row.done { background: #f0f7ff; }
        .fv-row.wait { background: #f8fafc; color: var(--muted); }
        .fv-name { font-weight: 500; }
        .fv-val { font-variant-numeric: tabular-nums; font-weight: 700; text-align: right; }
        .fv-badge { font-size: 0.7rem; font-weight: 700; text-align: center; padding: 1px 4px; border-radius: 4px; }
        .b-done { background: #dcfce7; color: #15803d; }
        .b-wait { background: #e2e8f0; color: #64748b; }
        .fv-sub { margin-top: 0.6rem; padding: 0.3rem 0.6rem; font-size: 0.78rem; font-weight: 700; color: var(--muted);
                  border-top: 1px dashed var(--border); }
      `}</style>
    </div>
  );
}
