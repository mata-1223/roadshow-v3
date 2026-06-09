// 설문 응답 요약 — 고객이 제출한 설문 답변(배치 컨텍스트의 원천)을 상담사 관점으로 요약.
// scenario.survey 문항 + 저장된 answers(qid → code)를 차원(dimension) 기준으로 나열한다.

export default function SurveySummaryPanel({ survey, answers = {}, title = '설문 응답 요약' }) {
  const questions = survey?.questions || [];
  const rows = questions.map((q) => {
    const opt = (q.options || []).find((o) => o.code === answers[q.id]);
    return { id: q.id, dim: q.dimension || q.id, label: opt?.label ?? '—', answered: !!opt };
  });
  const answeredCount = rows.filter((r) => r.answered).length;

  return (
    <div className="ss-panel">
      <div className="ss-head">
        <h3>{title}</h3>
        <span className="ss-count">{answeredCount} / {rows.length}</span>
      </div>
      <div className="ss-list">
        {rows.map((r) => (
          <div key={r.id} className="ss-row">
            <span className="ss-dim">{r.dim}</span>
            <span className="ss-val">{r.label}</span>
          </div>
        ))}
      </div>
      <style>{`
        .ss-panel { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem; }
        .ss-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 0.75rem; }
        .ss-head h3 { margin: 0; }
        .ss-count { font-weight: 700; color: var(--primary); }
        .ss-list { display: flex; flex-direction: column; gap: 0.2rem; max-height: 40vh; overflow-y: auto; }
        .ss-row { display: grid; grid-template-columns: 7rem 1fr; gap: 0.6rem; align-items: baseline;
                  padding: 0.4rem 0.6rem; border-radius: 8px; }
        .ss-row:nth-child(odd) { background: #f8fafc; }
        .ss-dim { font-size: 0.8rem; color: var(--muted); font-weight: 600; }
        .ss-val { font-size: 0.92rem; font-weight: 600; }
      `}</style>
    </div>
  );
}
