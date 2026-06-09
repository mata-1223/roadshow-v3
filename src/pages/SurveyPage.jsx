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
  // 새 survey.json은 block 필드(objective_fact/usage_behavior/behavioral_history/usage_context),
  // 옛 양식은 type 필드(static/behavioral) — 둘 다 지원
  const isStatic = (q) => q.type === 'static' || q.block === 'objective_fact';
  const staticQs     = questions.filter(isStatic);
  const behavioralQs = questions.filter((q) => !isStatic(q));
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const ready = answered === total;

  async function handleSubmit() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await submitSurvey(sessionId, answers);
      setSurveyAnswers(answers);
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

          <QuestionGroup title="고객 상태 정보" subtitle={`${staticQs.length}문항`} questions={staticQs} answers={answers} setAnswers={setAnswers} />
          <QuestionGroup title="사용 행동·이력·맥락" subtitle={`${behavioralQs.length}문항`} questions={behavioralQs} answers={answers} setAnswers={setAnswers} />

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
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
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

function QuestionGroup({ title, subtitle, questions, answers, setAnswers }) {
  return (
    <section className="group">
      <h3>{title} <span>{subtitle}</span></h3>
      {questions.map((q) => (
        <QuestionCard key={q.id} q={q}
          selected={answers[q.id]}
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

function QuestionCard({ q, selected, onSelect }) {
  return (
    <div className="qcard">
      <div className="qhead">
        <span className="qid">{q.id}</span>
        <span className="qtext">{q.question}</span>
        <span className="qdim">{q.dimension}</span>
      </div>
      <div className="qopts">
        {q.options.map((o) => (
          <button key={o.code} className={`qopt ${selected === o.code ? 'on' : ''}`}
                  onClick={() => onSelect(o.code)}>
            <span className="qopt-code">{o.code}</span>
            <span className="qopt-label">{o.label}</span>
          </button>
        ))}
      </div>
      <style>{`
        .qcard { background: white; border: 2px solid var(--border); border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
        .qhead { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
        .qid { background: #f1f5f9; color: var(--muted); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem; }
        .qtext { flex: 1; font-weight: 600; }
        .qdim { color: var(--muted); font-size: 0.85rem; }
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
