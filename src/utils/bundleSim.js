// 결합 시뮬레이터 — KT 공개 요금(3년 약정) + 총액결합할인 중심.
// "나를 위한 혜택": 내가 이미 내는 모바일 요금에서 할인(총액결합할인)되며, 그 할인액은
// 내 요금대(plan_tier) 응답으로 결정된다. + 감지된 상황(이사·영상)으로 '왜 나에게'를 제시.
//
// 출처: KT 공개 요금 대표값(3년 약정 기준, 프로모션 제외, 설치비 별도).
//   인터넷 500M 33,000 · 1G 38,500 · 인터넷500M+베이직TV 결합 44,000
//   총액결합할인(인터넷+모바일): 모바일 2.2~6.5만 5,500 / 6.5~10.9만 11,000 / …최대 33,110

const INTERNET_500 = 33000;            // 인터넷 500M 월정액(3년 약정)
const NET_TV_500 = 44000;              // 인터넷500M + 베이직TV 결합 월정액(3년 약정)
const TV_ADD = NET_TV_500 - INTERNET_500; // 지니TV 결합 증분 = 11,000
const FAMILY_DISCOUNT = 33110;         // 프리미엄 가족결합 총액결합할인(최대)
// 총액결합할인 — 모바일 요금대(plan_tier) 기준. 실제 KT 구간을 데모용으로 단순화.
const BUNDLE_DISCOUNT = { 1: 5500, 2: 5500, 3: 11000, 4: 11000 };

export function wonText(n) {
  return '₩' + Math.round(n).toLocaleString('ko-KR');
}

function answerLabel(survey, answers, featureName) {
  for (const q of survey?.questions || []) {
    const code = answers?.[q.id];
    if (code == null) continue;
    const opt = (q.options || []).find((o) => o.code === code);
    if (opt && opt.features && featureName in opt.features) return opt.label;
  }
  return null;
}

// 고객 프로파일(설문 feature값) — 한 번 계산해 모든 의도에 재사용
export function bundleProfile(features, survey, answers) {
  if (!features || features.plan_tier == null) return null;
  const pt = features.plan_tier;
  return {
    mobileLabel: answerLabel(survey, answers, 'plan_tier'),
    discount: BUNDLE_DISCOUNT[pt] ?? 5500,
    moved: (features.household_change ?? 0) > 0,        // 이사·독립
    heavyVideo: (features.content_view_mode ?? 0) >= 3, // 영상 자주
    tenureLabel: answerLabel(survey, answers, 'tenure_group'),
    tenureLong: (features.tenure_group ?? 0) >= 3,      // 3년 이상 장기
    contractCode: features.contract_status ?? 0,
    contractLabel: answerLabel(survey, answers, 'contract_status'),
    contractExpiring: (features.contract_status ?? 0) === 3, // 약정 만료 예정
    serviceLabel: answerLabel(survey, answers, 'subscribed_service_count'), // 현재 구성
    hasInternet: (features.has_internet ?? 0) === 1,
    hasIptv: (features.has_iptv ?? 0) === 1,
  };
}

const NOTE = '※ 대상·혜택은 고객 등급·약정 상태에 따라 상이';
const NOTE_PRICE = '※ 3년 약정 · 설치비 별도 · 프로모션 제외';

// 결합 가입 시 받는 혜택 (미결합 고객 또는 신규 가입 의도) — 총액결합할인 기반
function joinCard(profile, opts = {}) {
  return {
    title: opts.title || '결합 가입 시 받는 혜택',
    tag: opts.tag || '신규 결합',
    why: opts.why || '모바일만 이용 중이세요 — 결합하면 매월 할인과 가입 혜택을 받을 수 있어요',
    benefits: [
      { ic: '💰', t: `모바일 요금 매월 ${wonText(profile.discount)} 할인 (${profile.mobileLabel || '요금대'} 기준)` },
      { ic: '🎁', t: '신규 가입 사은품 · 지니TV 쿠폰 5천원×6' },
      { ic: '🔒', t: '결합 약정 할인 + 멤버십 전용 혜택' },
    ], note: NOTE_PRICE,
  };
}

// 의도별 결합 카드 — 고객의 실제 결합 여부(has_internet/has_iptv)에 따라 분기
export function bundleCardForIntent(profile, name) {
  if (!profile) return null;
  const n = name || '';
  const isBundled = profile.hasInternet || profile.hasIptv; // 실제 결합 여부
  const tenure = profile.tenureLabel || '오랜 기간';

  // 약정 상태·연장 혜택 — 현재 구성 + 약정 잔여 + 연장 혜택
  if (n.includes('연장') || n.includes('약정 상태') || (n.includes('약정') && !n.includes('재약정'))) {
    const why = profile.contractExpiring
      ? '약정 만료가 가까워요 — 지금 연장하면 혜택이 가장 커요'
      : profile.contractCode === 1
        ? '지금 약정이 없으세요 — 약정하면 결합 할인이 더 커집니다'
        : '고객님 약정 현황과 연장 시 받을 수 있는 혜택이에요';
    return {
      kind: 'loyalty',
      title: isBundled ? '내 결합 약정 현황 · 연장 혜택' : '내 약정 현황 · 연장 혜택',
      tag: profile.contractExpiring ? '연장 적기' : '약정 현황',
      why,
      status: [
        { k: isBundled ? '현재 결합' : '현재 이용', v: profile.serviceLabel || '—' },
        { k: '이용 기간', v: profile.tenureLabel || '—' },
        { k: '약정 상태', v: profile.contractLabel || '—' },
      ],
      benefits: [
        { ic: '🔒', t: '연장 시 결합 할인 유지 + 추가 할인' },
        { ic: '📱', t: '기기변경 지원금 우대' },
        { ic: '🎁', t: '연장 사은품 · 데이터 쿠폰' },
      ], note: NOTE,
    };
  }
  // 재약정
  if (n.includes('재약정')) {
    return {
      kind: 'loyalty',
      title: '고객님 맞춤 재약정 혜택', tag: profile.contractExpiring ? '약정 만료 예정' : '재약정 적기',
      why: profile.contractExpiring
        ? '약정 만료가 가까워요 — 지금 재약정하면 고객님 혜택이 가장 커집니다'
        : `${tenure} 함께해주신 고객님 약정에 맞춘 재약정 전용 혜택`,
      benefits: [
        { ic: '📱', t: '재약정 시 단말 지원금 우대' },
        { ic: '🔒', t: '결합 할인 유지 + 재약정 추가 할인' },
        { ic: '🎁', t: '재약정 사은품 · 데이터 쿠폰' },
      ], note: NOTE,
    };
  }
  // 장기 고객 (이용기간 기반 — 결합 여부 무관)
  if (n.includes('장기')) {
    return {
      kind: 'loyalty',
      title: '고객님만을 위한 장기 혜택', tag: profile.tenureLong ? `${tenure} 함께` : '장기 고객',
      why: profile.tenureLong
        ? `벌써 ${tenure}째 KT와 함께해주신 고객님 — 그 시간에 보답하는 전용 혜택이에요`
        : `${tenure} 함께해주신 고객님께 드리는 감사 혜택`,
      benefits: [
        { ic: '👑', t: '고객님 멤버십 VIP 등급 상향' },
        { ic: '💝', t: '장기고객 감사 할인 · 데이터 쿠폰' },
        { ic: '📱', t: '기기변경 시 지원 우대' },
      ], note: NOTE,
    };
  }
  // 신규/가입 혜택 → 결합 가입 시 받는 혜택
  if (n.includes('가입')) {
    return {
      kind: 'loyalty',
      ...joinCard(profile, isBundled
        ? { title: '추가 결합 가입 혜택', tag: '추가 결합', why: '결합을 더하면 받을 수 있는 추가 혜택이에요' }
        : {}),
    };
  }
  // 현재혜택/미사용/추가/유지 — 결합 중이면 '내가 받는 혜택', 미결합이면 '결합 시 혜택'
  if (n.includes('현재 결합 혜택') || n.includes('미사용') || n.includes('추가 결합 할인') || n.includes('유지')) {
    if (isBundled) {
      return {
        kind: 'loyalty',
        title: '내가 받고 있는 결합 혜택', tag: '이미 결합 중',
        why: `${tenure} 결합으로 함께해주신 고객님 — 놓치고 계신 혜택은 없는지 챙겨드릴게요`,
        status: [
          { k: '현재 결합', v: profile.serviceLabel || '결합 이용 중' },
          { k: '이용 기간', v: profile.tenureLabel || '—' },
        ],
        benefits: [
          { ic: '🔍', t: '미사용 결합 혜택 활성화' },
          { ic: '➕', t: '추가 결합 할인 여지 확인' },
          { ic: '🎁', t: '멤버십·제휴 전용 혜택' },
        ], note: NOTE,
      };
    }
    return {
      kind: 'loyalty',
      ...joinCard(profile, { title: '결합 시 받을 수 있는 혜택', tag: '결합 전', why: '아직 결합 전이에요 — 결합하면 이런 혜택을 받을 수 있어요' }),
    };
  }
  // 확장(인터넷/IPTV/통합/가족/결합 상품·가능) → 시뮬레이터
  const sim = simForIntent(profile, name);
  if (sim) return { kind: 'sim', ...sim };
  return null;
}

// 의도명 → 추가 서비스 셋
function addSetForIntent(name) {
  const n = name || '';
  if (n.includes('가족 회선') || n.includes('가족 결합')) return 'family';
  const hasNet = n.includes('인터넷');
  const hasTv = n.includes('IPTV') || n.includes('지니TV') || n.includes('TV');
  if (n.includes('통합') || (hasNet && hasTv)) return 'both';
  if (hasTv) return 'tv';
  if (hasNet) return 'net';
  if (n.includes('결합 상품') || n.includes('결합 가능')) return 'both';
  return null;
}

// 의도별 시뮬레이션 (프로파일 + 의도명)
export function simForIntent(profile, name) {
  if (!profile) return null;
  const set = addSetForIntent(name);
  if (!set) return null;
  const d = profile.discount;

  if (set === 'family') {
    return {
      services: ['가족 회선 결합'],
      why: '가족 회선을 묶으면 가구 전체 통신비가 줄어듭니다',
      cost: null, discount: FAMILY_DISCOUNT, net: null,
      mobileLabel: profile.mobileLabel, yearSave: FAMILY_DISCOUNT * 12,
      perks: ['가족 데이터 공유', '회선당 결합 할인'],
    };
  }
  if (set === 'tv') {
    // 지니TV는 콘텐츠 가치 중심(추가 총액할인 없음 — 인터넷이 할인 주체)
    return {
      services: ['지니TV'],
      why: profile.heavyVideo ? '영상을 자주 시청 → 지니TV로 콘텐츠 강화' : '지니TV로 홈 엔터테인먼트 추가',
      cost: TV_ADD, discount: 0, net: TV_ADD,
      mobileLabel: profile.mobileLabel, yearSave: 0,
      perks: ['지니TV 쿠폰 5천원×6', '넷플릭스/유튜브 초이스'],
      contentOnly: true,
    };
  }
  // net / both — 총액결합할인이 모바일 요금에 적용
  const cost = set === 'both' ? NET_TV_500 : INTERNET_500;
  const services = set === 'both' ? ['인터넷 500M', '지니TV'] : ['인터넷 500M'];
  const why = profile.moved
    ? `이사·독립 감지 → 새 집 ${set === 'both' ? '인터넷+TV' : '인터넷'}이 필요한 시점`
    : (set === 'both' && profile.heavyVideo)
      ? '영상을 자주 시청 → 인터넷+지니TV 결합 적합'
      : '인터넷을 결합해 모바일 요금까지 할인';
  return {
    services, why, cost, discount: d, net: cost - d,
    mobileLabel: profile.mobileLabel, yearSave: d * 12,
    perks: set === 'both'
      ? ['모바일 요금 할인', '지니TV 쿠폰 5천원×6', '넷플릭스 선택']
      : ['모바일 요금 할인', 'WiFi 공유기 포함'],
  };
}
