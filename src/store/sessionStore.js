import { create } from 'zustand';

// ── Vector Space helpers ────────────────────────────────────
function weightedCenter(allProbs, posMap, key) {
  let x = 0, y = 0, totalW = 0;
  for (const [intent_id, pos] of Object.entries(posMap)) {
    const w = allProbs[intent_id]?.[key];
    if (!w) continue;
    x += w * pos.x;
    y += w * pos.y;
    totalW += w;
  }
  if (totalW === 0) return { x: 0, y: 0 };
  return { x: x / totalW, y: y / totalW };
}

export const useSessionStore = create((set, get) => ({
  sessionId:     null,
  scenarioId:    null,
  scenario:      null,
  surveyAnswers: {},
  stage:         'initial',
  topN:          [],
  others:        null,
  batchFeatures: null,

  // Vector Space 상태
  intentPositions:    null,           // { intent_id → {x, y} }
  l1Zones:            [],             // l1_zones from intent_positions.json
  customerPosition:   null,           // {x, y}
  baselinePosition:   null,           // {x, y}
  customerPath:       [],             // [{ ts, behavior_id, position, isNavigateBack }]

  setSession:        (sid, scid) => set({ sessionId: sid, scenarioId: scid }),
  setScenario:       (s)         => set({ scenario: s }),
  setSurveyAnswers:  (a)         => set({ surveyAnswers: a }),
  setStage:          (s)         => set({ stage: s }),
  setBatchFeatures:  (f)         => set({ batchFeatures: f }),

  // INTENT_UPDATE 한 번에 모두 갱신
  applyIntentUpdate: (msg) => {
    const state = get();
    const positions = state.intentPositions;
    let updates = {
      topN:   msg.top_n,
      others: msg.others ?? null,
      stage:  msg.stage ?? state.stage,
    };

    if (positions && msg.all_probabilities) {
      const cur = weightedCenter(msg.all_probabilities, positions, 'p');
      const base = weightedCenter(msg.all_probabilities, positions, 'p0');
      updates.customerPosition = cur;
      updates.baselinePosition = base;
      updates.customerPath = [
        ...state.customerPath,
        {
          ts:             msg.computed_at,
          behavior_id:    msg.behavior_id ?? 'initial',
          position:       cur,
          isNavigateBack: msg.behavior_id === 'BACK',
        },
      ];
    }
    set(updates);
  },

  // 설문 제출 결과 (initial)도 같은 메커니즘으로 적용
  applyInitialResult: (msg) => get().applyIntentUpdate({ ...msg, behavior_id: 'initial' }),

  setIntentPositions: (positions, l1Zones) => set({
    intentPositions: positions,
    l1Zones,
  }),

  reset: () => set({
    sessionId: null, scenarioId: null, scenario: null,
    surveyAnswers: {}, stage: 'initial', topN: [], others: null, batchFeatures: null,
    customerPosition: null, baselinePosition: null, customerPath: [],
    intentPositions: null, l1Zones: [],   // 시나리오 전환 시 좌표 재로딩되도록 초기화
  }),
}));
