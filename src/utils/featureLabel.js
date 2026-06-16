// 배치 feature 키 → 한글 표시명. 명시 매핑 우선, 없으면 영문 접미사(Index/Score)만 한글화.
const MAP = {
  // 인구/프로필
  gender: '성별', age_group: '연령대', gender_age: '성별·연령', tenure_group: '가입 기간대',
  household_change: '가구 변화',
  // 요금/약정
  plan_tier: '요금제 등급', plan_bill_level: '요금제 금액대', monthly_bill_level: '월 요금 수준',
  contract_status: '약정 상태', non_mobile_cost_gap: '결합 비용 격차',
  // 사용/가족
  family_line_count: '가족 회선 수', subscribed_service_count: '가입 부가서비스 수',
  service_coverage_ratio: '서비스 커버리지 비율', content_view_mode: '콘텐츠 이용 형태',
  benefit_utilization: '혜택 활용도', dissatisfaction_factor: '불만 요인',
  // 직장인 설문 파생
  offwork_time: '퇴근 시간', overtime_freq: '야근 빈도', move_pattern: '퇴근 후 이동',
  weekend_out: '주말 외출', night_phone_usage: '야간 스마트폰 사용', social_contact: '사회적 접촉',
  // 영문 Index/Score 파생
  'Churn Risk Index': '이탈 위험 지수', 'Benefit Engagement Index': '혜택 참여 지수',
  'Benefit Optimization Index': '혜택 최적화 지수', 'Benefit Optimization Score': '혜택 최적화 점수',
  'Bundle Opportunity Index': '결합 기회 지수', 'Home Service Expansion Index': '홈 서비스 확장 지수',
  'Service Expansion Score': '서비스 확장 점수', 'Acquisition Score': '신규 획득 점수',
  'Retention Readiness Index': '유지 준비 지수', 'Retention Value Index': '유지 가치 지수',
  'Retention Value Score': '유지 가치 점수', 'Retention Score': '유지 점수',
  'Churn Defense Score': '이탈 방어 점수',
  'Isolation Tendency Index': '고립 성향 지수', 'Sleep Disturbance Index': '수면 방해 지수',
  'Burnout Deep Score': '번아웃 심화 점수', 'Recovery Motivation Score': '회복 동기 점수',
  'Fatigue Load Index': '피로 누적 지수', 'Digital Escape Score': '디지털 도피 점수',
};

export function featureLabel(name) {
  if (!name) return name;
  if (MAP[name]) return MAP[name];
  // Korean + 영문 접미사: "이탈 위험 Score" → "이탈 위험 점수", "고객 가치 Index" → "고객 가치 지수"
  return name.replace(/\s*Index$/, ' 지수').replace(/\s*Score$/, ' 점수');
}
