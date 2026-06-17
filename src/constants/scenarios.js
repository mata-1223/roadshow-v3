// 시연 시나리오 단일 소스
export const SCENARIOS = [
  { key: 'cs',     id: 'cs-myk-v3', name: 'CS · 고객센터 상담',   tag: 'CS',    active: true,
    desc: '고객의 CS 업무 관련 의도를 마이케이티 앱 내에서 실시간 추론' },
  { key: 'bundle', id: 'bundle-v3', name: '결합 고객 Life cycle', tag: '결합',   active: true,
    desc: '모바일 가입 고객의 결합 확대/유지/해지 관련 의도를 마이케이티 앱 내에서 실시간 추론' },
  { key: 'worker', id: 'worker-v3', name: '번아웃 직장인',         tag: '직장인', active: true,
    desc: '직장인의 번아웃·회복 등 라이프 의도를 앱 사용 행동으로 추론' },
];

export const DEFAULT_SCENARIO_ID = 'cs-myk-v3';
