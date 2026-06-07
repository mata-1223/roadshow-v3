// REST API 클라이언트
// dev: Vite proxy (BASE=''), prod: 환경변수 VITE_API_BASE 사용
const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export async function createSession() {
  const r = await fetch(`${BASE}/api/sessions`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to create session');
  return r.json();
}

export async function submitSurvey(sessionId, answers) {
  const r = await fetch(`${BASE}/api/sessions/${sessionId}/survey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!r.ok) throw new Error('Failed to submit survey');
  return r.json();
}

export async function getScenario(scenarioId = 'cs-myk-v3') {
  const r = await fetch(`${BASE}/api/scenarios/${scenarioId}`);
  if (!r.ok) throw new Error('Failed to load scenario');
  return r.json();
}

export async function getLatestIntents(sessionId, topN = 5) {
  const r = await fetch(`${BASE}/api/intents/latest?session_id=${sessionId}&top_n=${topN}`);
  if (!r.ok) throw new Error('Failed to get intents');
  return r.json();
}

export async function getIntentPositions(scenarioId = 'cs-myk-v3') {
  const r = await fetch(`${BASE}/api/scenarios/${scenarioId}/intent-positions`);
  if (!r.ok) throw new Error('Failed to load intent positions');
  return r.json();
}
