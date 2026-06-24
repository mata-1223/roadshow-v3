// 분석 서사 오버레이 — 설문 제출 후 "입력 → 즉시 출력"이 아니라
//   ① 데이터 적재  →  ② 분석 지표 생성(Index/Score 계산)  →  ③ 의도 추론
// 3단계를 시각적으로 연출해 "실제 데이터가 분석되는" 느낌을 준다.
// 핵심: ②에서 '고객이 직접 입력하지 않은' 분석 지표를 엔진이 만들어냄을 강조 → passthrough 느낌 제거.
// 시나리오 무관(범용): survey + 응답 + 추론 결과만으로 동작.
import { Fragment, useEffect, useMemo, useState } from 'react';
import { featureLabel } from '../utils/featureLabel.js';
import { intentName } from '../utils/intent.js';

const STEP_MS = 1400;

function fmt(v) {
  if (v == null) return '—';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === 'boolean') return v ? '1' : '0';
  return String(v);
}

export default function AnalysisOverlay({ survey, answers, result, onDone, onStep }) {
  const [step, setStep] = useState(0); // 0,1,2 진행 → 3 완료(CTA)
  const [showAllRows, setShowAllRows] = useState(false); // 적재 응답 6건 초과분 펼침
  const [selFeat, setSelFeat] = useState(null); // 산식 표시 중인 분석 지표
  const trace = result?.feature_trace || {};    // 분석 지표별 산출 근거

  // 내부 단계 → 상단 글로벌 스텝퍼 단계 동기화 (적재=2, 파생변수=3, 의도 추론=4)
  useEffect(() => {
    if (onStep) onStep(2 + Math.min(step, 2));
  }, [step, onStep]);

  // base feature 이름 집합 (survey option.features) → 파생 feature 판별용
  const { baseNames, answeredRows } = useMemo(() => {
    const baseNames = new Set();
    const answeredRows = [];
    for (const q of survey?.questions || []) {
      const code = answers?.[q.id];
      if (code != null) {
        const opt = (q.options || []).find((o) => o.code === code);
        answeredRows.push({ qid: q.id, code, label: opt?.label || '' });
      }
      for (const opt of q.options || []) {
        for (const fname of Object.keys(opt.features || {})) baseNames.add(fname);
      }
    }
    return { baseNames, answeredRows };
  }, [survey, answers]);

  // 파생 feature = batch_features 키 중 base에 없는 것 (= 고객이 입력하지 않은 계산값)
  // 표출은 지수(Index)·점수(Score)만 — 증감률·중간 프록시 등 다른 성격 변수는 숨김
  const isIndexScore = (k) => /Index|Score|지수|점수/.test(k);
  const derived = useMemo(() => {
    const bf = result?.batch_features || {};
    return Object.keys(bf)
      .filter((k) => !baseNames.has(k) && isIndexScore(k))
      .map((k) => ({ name: k, value: bf[k] }));
  }, [result, baseNames]);

  const topN = result?.top_n || [];

  useEffect(() => {
    if (step >= 3) return undefined;
    const id = setTimeout(() => setStep((s) => Math.min(s + 1, 3)), STEP_MS);
    return () => clearTimeout(id);
  }, [step]);

  const STEPS = [
    { icon: '📥', title: '데이터 적재', desc: '고객 데이터 테이블에 적재' },
    { icon: '⚙️', title: '분석 지표 생성', desc: '분석 지표(Index·Score) 계산' },
    { icon: '🧠', title: '의도 추론', desc: '의도 도출' },
  ];

  return (
    <div className="ao-backdrop" onClick={() => setStep(3)}>
      <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ao-stepper">
          {STEPS.map((s, i) => (
            <Fragment key={i}>
              <div className={`ao-step ${step > i ? 'done' : step === i ? 'active' : ''}`}>
                <span className="ao-step-ic">{s.icon}</span>
                <span className="ao-step-tx"><b>{s.title}</b></span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={`ao-step-arrow ${step > i ? 'done' : ''}`}>→</span>
              )}
            </Fragment>
          ))}
        </div>

        <div className="ao-stage">
          {/* ① 데이터 적재 */}
          <div className={`ao-card ${step >= 0 ? 'show' : ''}`}>
            <div className="ao-card-h">📥 설문 응답 {answeredRows.length}건이 시연용 임시 DB에 적재됩니다. <small className="ao-tmp">(* 시연 종료 후 DB 삭제 예정)</small></div>
            <div className="ao-rows">
              {(showAllRows ? answeredRows : answeredRows.slice(0, 6)).map((r) => (
                <div key={r.qid} className="ao-row">
                  <span className="ao-qid">{r.qid}</span>
                  <span className="ao-code">{r.code}</span>
                  <span className="ao-lab">{r.label}</span>
                </div>
              ))}
              {answeredRows.length > 6 && (
                <button type="button" className="ao-more" onClick={() => setShowAllRows((v) => !v)}>
                  {showAllRows ? '접기 ▴' : `+${answeredRows.length - 6}건 더보기 ▾`}
                </button>
              )}
            </div>
          </div>

          {/* ② 분석 지표 생성 */}
          {step >= 1 && (
            <div className="ao-card show ao-hl">
              <div className="ao-card-h">⚙️ 고객 기본 상태 변수를 조합하여 <b>분석 지표</b>를 계산합니다</div>
              <div className="ao-feats">
                {derived.length === 0 && <span className="ao-none">분석 지표 없음</span>}
                {derived.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    className={`ao-feat ${selFeat === f.name ? 'on' : ''} ${trace[f.name] ? 'clickable' : ''}`}
                    onClick={() => trace[f.name] && setSelFeat((p) => (p === f.name ? null : f.name))}
                  >
                    <span className="ao-feat-n">{featureLabel(f.name)}</span>
                    <span className="ao-feat-v">{fmt(f.value)}</span>
                  </button>
                ))}
              </div>
              <div className="ao-hint">↑ 고객 기본 상태 변수를 조합하여 <b>분석 지표 생성</b> · <span className="ao-hint-click">변수를 클릭하면 산식이 표시됩니다</span></div>

              {selFeat && trace[selFeat] && (
                <div className="ao-trace">
                  <div className="ao-trace-h">
                    <b>{featureLabel(selFeat)}</b>
                    <span className="ao-trace-eq">= {fmt(trace[selFeat].value)}</span>
                    {trace[selFeat].clamp && (
                      <span className="ao-trace-clamp">범위 {trace[selFeat].clamp[0]}~{trace[selFeat].clamp[1]}</span>
                    )}
                  </div>
                  <div className="ao-trace-rows">
                    {trace[selFeat].terms.map((t, i) => (
                      <div key={i} className="ao-trace-row">
                        <span className="ao-trace-ref">
                          {featureLabel(t.ref)}
                          <em>{t.ref_answer != null ? `: ${t.ref_answer}` : `(=${fmt(t.ref_value)})`}</em>
                        </span>
                        <span className="ao-trace-op">{t.weight != null ? `× ${t.weight}` : '점수 환산'}</span>
                        <span className="ao-trace-ctb">+{fmt(t.contribution)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ao-trace-note">
                    {trace[selFeat].kind === 'weighted_sum'
                      ? '상위 지수들의 가중 합으로 계산됩니다.'
                      : '입력값을 점수로 환산해 합산합니다.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ③ 의도 추론 */}
          {step >= 2 && (
            <div className="ao-card show">
              <div className="ao-card-h">🧠 고객 상태 분석을 통해 <b>의도</b>를 추론합니다</div>
              <div className="ao-intents">
                {topN.slice(0, 3).map((t, i) => (
                  <div key={t.intent_id} className={`ao-int ${i === 0 ? 'top' : ''}`}>
                    <span className="ao-int-rank">#{i + 1}</span>
                    <span className="ao-int-name">{intentName(t)}</span>
                    <span className="ao-int-prob">{(t.probability * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ao-foot">
          {step < 3 ? (
            <span className="ao-analyzing">
              <span className="ao-spin" />
              {[
                `고객 응답 ${answeredRows.length}건을 데이터 테이블에 적재하고 있어요`,
                '응답을 조합해 분석 지표(Index·Score)를 계산하고 있어요',
                '계산된 특성으로 고객의 의도를 추론하고 있어요',
              ][Math.min(step, 2)]}
              <span className="ao-dots"><span /><span /><span /></span>
            </span>
          ) : (
            <button className="btn btn-primary ao-cta" onClick={onDone}>결과 보기 →</button>
          )}
        </div>
      </div>

      <style>{`
        .ao-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,.55); z-index: 400;
                       display: flex; align-items: center; justify-content: center; }
        .ao-modal { background: #fff; border-radius: 20px; padding: 1.6rem 1.8rem; width: min(720px, 94vw);
                    max-height: 92vh; overflow: auto; box-shadow: 0 30px 80px rgba(0,0,0,.45); }
        .ao-stepper { display: flex; align-items: center; justify-content: center; gap: 0.7rem; margin-bottom: 1.3rem; flex-wrap: wrap; }
        .ao-step { flex: none; display: flex; align-items: center; gap: 0.5rem; opacity: 0.4;
                   transition: opacity .3s; }
        .ao-step.active, .ao-step.done { opacity: 1; }
        .ao-step-ic { width: 34px; height: 34px; border-radius: 50%; flex: none; display: inline-flex;
                      align-items: center; justify-content: center; font-size: 1rem; background: #f1f5f9; }
        .ao-step.active .ao-step-ic { background: #dbeafe; animation: ao-pulse 1.2s infinite; }
        .ao-step.done .ao-step-ic { background: #dcfce7; }
        @keyframes ao-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(37,99,235,.5);} 60%{ box-shadow:0 0 0 8px rgba(37,99,235,0);} }
        .ao-step-tx { display: flex; flex-direction: column; line-height: 1.2; }
        .ao-step-tx b { font-size: 0.9rem; }
        .ao-step-tx small { font-size: 0.72rem; color: var(--muted); }
        .ao-step-arrow { flex: none; font-size: 1.1rem; font-weight: 800; color: #cbd5e1; padding: 0 0.2rem; transition: color 0.3s; }
        .ao-step-arrow.done { color: #16a34a; }
        .ao-stage { display: flex; flex-direction: column; gap: 0.8rem; min-height: 220px; }
        .ao-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 0.9rem 1rem;
                   opacity: 0; transform: translateY(6px); transition: opacity .35s, transform .35s; }
        .ao-card.show { opacity: 1; transform: none; }
        .ao-hl { background: #fff7ed; border-color: #fed7aa; }
        .ao-card-h { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.6rem; }
        .ao-tmp { font-weight: 600; font-size: 0.78rem; color: var(--muted); }
        .ao-card-h b { color: #c2410c; }
        .ao-rows { display: flex; flex-direction: column; gap: 0.25rem; }
        .ao-row { display: grid; grid-template-columns: 3rem 2rem 1fr; gap: 0.5rem; align-items: center;
                  font-size: 0.85rem; padding: 0.25rem 0.5rem; background: #fff; border-radius: 7px;
                  animation: ao-in .3s ease-out; }
        @keyframes ao-in { from{ opacity:0; transform: translateX(-6px);} to{ opacity:1; } }
        .ao-qid { font-weight: 700; color: var(--muted); }
        .ao-code { font-weight: 800; color: var(--primary); text-align: center; }
        .ao-lab { color: #334155; }
        .ao-more { font-size: 0.8rem; font-weight: 700; color: var(--primary); background: #eff6ff;
                   border: 1px solid #bfdbfe; border-radius: 7px; padding: 0.3rem 0.7rem; cursor: pointer;
                   align-self: flex-start; margin-top: 0.1rem; }
        .ao-more:hover { background: #dbeafe; }
        .ao-feats { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .ao-feat { display: inline-flex; align-items: center; gap: 0.4rem; background: #fff; border: 1px solid #fed7aa;
                   border-radius: 999px; padding: 0.3rem 0.7rem; animation: ao-pop .35s ease-out; }
        @keyframes ao-pop { from{ opacity:0; transform: scale(.9);} to{ opacity:1; transform: scale(1);} }
        .ao-feat.clickable { cursor: pointer; }
        .ao-feat.clickable:hover { border-color: #fb923c; box-shadow: 0 2px 6px rgba(234,88,12,.18); }
        .ao-feat.on { border-color: #ea580c; background: #fff7ed; box-shadow: 0 0 0 2px rgba(234,88,12,.18); }
        .ao-feat-n { font-size: 0.82rem; font-weight: 600; color: #9a3412; }
        .ao-feat-v { font-size: 0.85rem; font-weight: 800; color: #c2410c; font-variant-numeric: tabular-nums; }
        .ao-none { color: var(--muted); font-size: 0.85rem; }
        .ao-hint { margin-top: 0.6rem; font-size: 0.8rem; color: #9a3412; }
        .ao-hint b { color: #c2410c; }
        .ao-hint-click { color: #c2410c; font-weight: 700; }

        /* 분석 지표 산식 팝오버 */
        .ao-trace { margin-top: 0.7rem; background: #fff; border: 1px solid #fed7aa; border-radius: 10px;
                    padding: 0.7rem 0.8rem; animation: ao-pop .25s ease-out; }
        .ao-trace-h { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.5rem; }
        .ao-trace-h b { font-size: 0.95rem; color: #9a3412; }
        .ao-trace-eq { font-size: 0.95rem; font-weight: 800; color: #c2410c; font-variant-numeric: tabular-nums; }
        .ao-trace-clamp { font-size: 0.72rem; font-weight: 700; color: #9a3412; background: #ffedd5;
                          padding: 0.1rem 0.45rem; border-radius: 5px; }
        .ao-trace-rows { display: flex; flex-direction: column; gap: 0.25rem; }
        .ao-trace-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 0.6rem;
                        font-size: 0.85rem; padding: 0.28rem 0.5rem; background: #fffbf7; border-radius: 7px; }
        .ao-trace-ref { color: #1e293b; font-weight: 600; }
        .ao-trace-ref em { color: #c2410c; font-style: normal; font-weight: 700; margin-left: 0.3rem;
                           font-variant-numeric: tabular-nums; }
        .ao-trace-op { color: var(--muted); font-size: 0.78rem; font-weight: 700; white-space: nowrap; }
        .ao-trace-ctb { font-weight: 800; color: #c2410c; font-variant-numeric: tabular-nums; }
        .ao-trace-note { margin-top: 0.55rem; font-size: 0.78rem; color: #9a3412; }
        .ao-intents { display: flex; flex-direction: column; gap: 0.35rem; }
        .ao-int { display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.7rem; background: #fff;
                  border: 1px solid #e2e8f0; border-radius: 9px; font-size: 0.9rem; animation: ao-in .3s ease-out; }
        .ao-int.top { border-color: var(--primary); background: #eff6ff; }
        .ao-int-rank { font-weight: 800; color: var(--muted); }
        .ao-int.top .ao-int-rank { color: var(--primary); }
        .ao-int-name { font-weight: 700; flex: 1; }
        .ao-int-prob { font-weight: 800; color: var(--primary); }
        .ao-foot { display: flex; justify-content: center; margin-top: 1.3rem; }
        .ao-analyzing { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--primary); font-weight: 700; }
        .ao-analyzing small { color: #94a3b8; font-weight: 500; }
        .ao-dots { display: inline-flex; gap: 3px; margin-left: 1px; }
        .ao-dots span { width: 4px; height: 4px; border-radius: 50%; background: var(--primary);
                        animation: ao-dot 1.2s infinite ease-in-out; }
        .ao-dots span:nth-child(2) { animation-delay: .2s; }
        .ao-dots span:nth-child(3) { animation-delay: .4s; }
        @keyframes ao-dot { 0%,80%,100% { opacity: .3; transform: translateY(0); }
                            40% { opacity: 1; transform: translateY(-2px); } }
        .ao-spin { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-top-color: var(--primary);
                   border-radius: 50%; animation: ao-rot .7s linear infinite; }
        @keyframes ao-rot { to { transform: rotate(360deg); } }
        .ao-cta { font-size: 1.1rem; padding: 0.8rem 2.2rem; }
      `}</style>
    </div>
  );
}
