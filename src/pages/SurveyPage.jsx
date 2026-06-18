import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSurvey } from '../api/http.js';
import { useSessionStore } from '../store/sessionStore.js';
import SystemStatusPanel from '../components/SystemStatusPanel.jsx';
import FeatureVectorPanel from '../components/FeatureVectorPanel.jsx';

export default function SurveyPage() {
  const navigate = useNavigate();
  const { sessionId, scenario, batchFeatures, setSurveyAnswers, setStage, setBatchFeatures, applyInitialResult } = useSessionStore();
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sessionId) navigate('/');
  }, [sessionId, navigate]);

  if (!scenario) return null;
  const questions = scenario.survey.questions;
  // 조건부 문항(show_if): 특정 문항 응답에 따라 노출. 예) Q9는 Q5=인터넷/IPTV 포함일 때만
  const isVisible = (q) => {
    const c = q.show_if;
    if (!c) return true;
    return (c.in || []).includes(answers[c.qid]);
  };
  // 조건 미충족 조건부 문항은 '잠금' 상태로 자리는 유지(번호 점프·갑작스런 등장 방지), 완료 판정에서만 제외
  const isLocked = (q) => !!q.show_if && !isVisible(q);
  // 새 survey.json은 block 필드(objective_fact/usage_behavior/behavioral_history/usage_context),
  // 옛 양식은 type 필드(static/behavioral) — 둘 다 지원
  const isStatic = (q) => q.type === 'static' || q.block === 'objective_fact';
  const staticQs      = questions.filter(isStatic);
  const behavioralQs  = questions.filter((q) => !isStatic(q));   // 잠금 문항 포함 렌더
  const answerableQs  = questions.filter((q) => !isLocked(q));   // 완료 판정 대상
  const total = answerableQs.length;
  const answered = answerableQs.filter((q) => answers[q.id] != null).length;
  const ready = answered === total;

  async function handleSubmit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      // 응답 가능한 문항만 제출 + 잠긴 조건부 문항은 hidden_default 코드로 보정
      const effective = {};
      answerableQs.forEach((q) => { if (answers[q.id] != null) effective[q.id] = answers[q.id]; });
      questions.forEach((q) => {
        if (isLocked(q) && q.hidden_default != null) effective[q.id] = q.hidden_default;
      });
      const res = await submitSurvey(sessionId, effective);
      setSurveyAnswers(effective);
      setStage(res.stage);
      setBatchFeatures(res.batch_features);
      applyInitialResult({
        top_n:             res.top_n,
        others:            res.others,
        all_probabilities: res.all_probabilities,
        stage:             res.stage,
        computed_at:       new Date().toISOString(),
      });
      navigate('/demo');
    } catch (e) {
      alert(`설문 제출 실패: ${e.message}`);
      setBusy(false);
    }
  }

  return (
    <div className="survey-page">
      <div className="container survey-grid">

        <div className="left-col">
          <div className="header">
            <h2>설문 {total}문항</h2>
            <div className="progress">
              <span>{answered} / {total}</span>
              <div className="bar"><div className="fill" style={{ width: `${(answered / total) * 100}%` }} /></div>
            </div>
          </div>

          <div className="stage-guide">
            🧩 고객의 <b>상태 정보</b>를 입력하는 단계입니다. 이 응답만으로 먼저 <b>Base Intent</b>(행동 전 추론)가 만들어집니다.
            <span className="stage-note">※ 실제 운영 시에는 <b>KFM·SGI 등 실제 고객 상태·과거 행동 데이터</b>를 활용하는 단계로, 본 시연에서는 이를 <b>설문 응답으로 대체</b>합니다.</span>
          </div>

          <QuestionGroup title="고객 상태 정보" subtitle={`${staticQs.length}문항`} questions={staticQs} answers={answers} setAnswers={setAnswers} isLocked={isLocked} />
          <QuestionGroup title="사용 행동·이력·맥락" subtitle={`${behavioralQs.length}문항`} questions={behavioralQs} answers={answers} setAnswers={setAnswers} isLocked={isLocked} />

          <div className="submit-bar">
            <button className="btn btn-primary submit" disabled={!ready || busy} onClick={handleSubmit}>
              {busy ? '처리 중...' : ready ? '제출하고 결과 보기 →' : `${total - answered}문항 남음`}
            </button>
          </div>
        </div>

        <div className="right-col">
          <SystemStatusPanel states={{ batch: 'active', realtime: 'idle', infer: 'idle' }} />
          <FeatureVectorPanel survey={scenario.survey} answers={answers} batchFeatures={batchFeatures} />
        </div>

      </div>

      <style>{`
        .survey-page { min-height: 100vh; padding: 1rem 0; }
        .survey-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; align-items: start; }
        .right-col { position: sticky; top: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .stage-guide { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px;
                       padding: 0.8rem 1.1rem; margin-bottom: 2rem; font-size: 0.95rem; color: #1e3a5f; line-height: 1.5; }
        .stage-note { display: block; margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px dashed #bfdbfe;
                      font-size: 0.85rem; color: #5b7290; }
        .progress { display: flex; align-items: center; gap: 1rem; font-weight: 600; }
        .progress .bar { width: 240px; height: 8px; background: var(--border); border-radius: 999px; overflow: hidden; }
        .progress .fill { height: 100%; background: var(--primary); transition: width 0.3s; }
        .submit-bar { position: sticky; bottom: 0; background: white; padding: 1.5rem 0; margin-top: 2rem;
                      border-top: 2px solid var(--border); display: flex; justify-content: center; }
        .submit { font-size: 1.2rem; padding: 1rem 2rem; min-width: 320px; }
        @media (max-width: 1024px) { .survey-grid { grid-template-columns: 1fr; } .right-col { position: static; } }
      `}</style>
    </div>
  );
}

function QuestionGroup({ title, subtitle, questions, answers, setAnswers, isLocked }) {
  return (
    <section className="group">
      <h3>{title} <span>{subtitle}</span></h3>
      {questions.map((q) => (
        <QuestionCard key={q.id} q={q}
          selected={answers[q.id]}
          locked={isLocked ? isLocked(q) : false}
          onSelect={(code) => setAnswers({ ...answers, [q.id]: code })} />
      ))}
      <style>{`
        .group { margin-bottom: 2.5rem; }
        .group h3 { font-size: 1.4rem; color: var(--fg); margin-bottom: 1rem; }
        .group h3 span { color: var(--muted); font-weight: 500; margin-left: 0.5rem; font-size: 1rem; }
      `}</style>
    </section>
  );
}

function QuestionCard({ q, selected, onSelect, locked }) {
  return (
    <div className={`qcard ${locked ? 'locked' : ''}`}>
      <div className="qhead">
        <span className="qid">{q.id}</span>
        <span className="qtextwrap">
          <span className="qtext">{q.question}</span>
          {q.realdata_source && (
            <span className="qinfo">
              <button type="button" className="qinfo-btn" aria-label="실제 데이터 활용 예상">ⓘ</button>
              <span className="qinfo-pop">
                실제 고객 데이터 활용 시<br />
                <b>{q.realdata_source}</b><br />
                활용 가능 예상
              </span>
            </span>
          )}
        </span>
        <span className="qdim">{q.dimension}</span>
      </div>
      {locked ? (
        <div className="qlocked">🔒 {q.locked_hint || '위 응답에 따라 활성화되는 문항입니다.'}</div>
      ) : (
        <div className="qopts">
          {q.options.map((o) => (
            <button key={o.code} className={`qopt ${selected === o.code ? 'on' : ''}`}
                    onClick={() => onSelect(o.code)}>
              <span className="qopt-code">{o.code}</span>
              <span className="qopt-label">{o.label}</span>
            </button>
          ))}
        </div>
      )}
      <style>{`
        .qcard { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
        .qcard.locked { background: #f8fafc; border-style: dashed; opacity: 0.7; }
        .qhead { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .qid { background: #f1f5f9; color: var(--muted); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem; }
        .qtextwrap { flex: 1; display: flex; align-items: center; gap: 0.4rem; }
        .qtext { font-weight: 600; }
        .qdim { color: var(--muted); font-size: 0.85rem; }
        .qinfo { position: relative; display: inline-flex; }
        .qinfo-btn { border: none; background: none; padding: 0; cursor: pointer; line-height: 1;
                     font-size: 1.05rem; color: var(--primary); opacity: 0.7;
                     display: inline-flex; align-items: center; }
        .qinfo:hover .qinfo-btn { opacity: 1; }
        .qinfo-pop { display: none; position: absolute; top: 145%; left: 0; z-index: 31;
                     width: max-content; white-space: nowrap;
                     background: #1e293b; color: #e2e8f0; font-size: 0.8rem; font-weight: 500; line-height: 1.55;
                     padding: 0.6rem 0.8rem; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.35); text-align: left; }
        .qinfo:hover .qinfo-pop { display: block; }
        .qinfo-pop b { color: #fff; }
        .qlocked { color: var(--muted); font-size: 0.9rem; padding: 0.3rem 0; }
        .qopts { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .qopt { display: flex; align-items: center; gap: 0.5rem; border: 2px solid var(--border); background: white;
                padding: 0.6rem 1rem; border-radius: 10px; font-size: 0.95rem; }
        .qopt:hover { border-color: var(--primary); }
        .qopt.on { border-color: var(--primary); background: #eff6ff; color: var(--primary); font-weight: 600; }
        .qopt-code { font-weight: 700; color: var(--muted); }
        .qopt.on .qopt-code { color: var(--primary); }
      `}</style>
    </div>
  );
}
