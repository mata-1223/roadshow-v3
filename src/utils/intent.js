// intent 표시명: 한글명 우선, 없으면 영문/빈문자 (모든 패널 공통)
export const intentName = (t) => t?.intent_nm_ko ?? t?.intent_name ?? '';
