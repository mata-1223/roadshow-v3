// REST API 클라이언트
// dev: Vite proxy (BASE=''), prod: 환경변수 VITE_API_BASE 사용
import { DEFAULT_SCENARIO_ID } from '../constants/scenarios.js';

const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export async function createSession(scenarioId) {
  const r = await fetch(`${BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenarioId ? { scenario_id: scenarioId } : {}),
  });
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

export async function getScenario(scenarioId = DEFAULT_SCENARIO_ID) {
  const r = await fetch(`${BASE}/api/scenarios/${scenarioId}`);
  if (!r.ok) throw new Error('Failed to load scenario');
  return r.json();
}

export async function getIntentPositions(scenarioId = DEFAULT_SCENARIO_ID) {
  const r = await fetch(`${BASE}/api/scenarios/${scenarioId}/intent-positions`);
  if (!r.ok) throw new Error('Failed to load intent positions');
  return r.json();
}
