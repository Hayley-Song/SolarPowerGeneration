// 초기 검토용 면적 환산 가정. 실제 설계 기준은 아님.
export const AREA_PER_KW = { land: 13.2, roof: 6.6 };
export const TYPE_LABEL = { land: '일반부지', roof: '건축물' };
export function estimateCapacity(area, perKw) {
  return Number.isFinite(area) && area > 0 && Number.isFinite(perKw) && perKw > 0
    ? Math.floor(area / perKw) : 0;
}
export function regionFromAddress(address = '', pnu = '') {
  const prefixes = [
    [/^(서울|경기|인천)/, '서울경기'], [/^(충북|충청북)/, '충청북도'],
    [/^(충남|충청남|대전|세종)/, '충청남도'], [/^강원/, '강원도'],
    [/^(전북|전라북)/, '전라북도'], [/^(전남|전라남|광주)/, '전라남도'],
    [/^(경북|경상북|대구)/, '경상북도'], [/^(경남|경상남|부산|울산)/, '경상남도'], [/^제주/, '제주도'],
  ];
  const map = {'11':'서울경기','28':'서울경기','41':'서울경기','51':'강원도','42':'강원도','43':'충청북도','44':'충청남도','30':'충청남도','36':'충청남도','45':'전라북도','52':'전라북도','46':'전라남도','29':'전라남도','27':'경상북도','47':'경상북도','26':'경상남도','31':'경상남도','48':'경상남도','50':'제주도'};
  return prefixes.find(([re]) => re.test(address.trim()))?.[1] || map[String(pnu).slice(0,2)] || null;
}
