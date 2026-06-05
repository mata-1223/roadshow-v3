import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  sessionId:    null,
  scenarioId:   null,
  scenario:     null,
  surveyAnswers: {},
  stage:        'initial',
  topN:         [],
  batchFeatures: null,

  setSession:        (sid, scid) => set({ sessionId: sid, scenarioId: scid }),
  setScenario:       (s)         => set({ scenario: s }),
  setSurveyAnswers:  (a)         => set({ surveyAnswers: a }),
  setStage:          (s)         => set({ stage: s }),
  setTopN:           (t)         => set({ topN: t }),
  setBatchFeatures:  (f)         => set({ batchFeatures: f }),

  reset: () => set({
    sessionId: null, scenarioId: null, scenario: null,
    surveyAnswers: {}, stage: 'initial', topN: [], batchFeatures: null,
  }),
}));
