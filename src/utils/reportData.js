// 보고서 표시 전용. 시뮬레이터 계산 결과 자체는 변경하지 않는다.
export const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
export const num = (value, digits = 0) => isNumber(value)
  ? value.toLocaleString('ko-KR', { maximumFractionDigits: digits }) : '—';
export const withUnit = (value, unit, digits = 0) => isNumber(value) ? `${num(value, digits)}${unit}` : '—';
const text = (value) => value == null || value === '' ? '—' : String(value);
export const money = (value) => withUnit(value, '원');
export function shortMoney(value) {
  if (!isNumber(value)) return '—';
  const n = Math.abs(Math.round(value));
  if (n < 10000) return money(value);
  const eok = Math.floor(n / 100000000);
  const man = Math.floor(n % 100000000 / 10000);
  const result = [eok ? `${num(eok)}억` : '', man ? `${num(man)}만` : ''].filter(Boolean).join(' ');
  return `${value < 0 ? '−' : ''}${result} 원`;
}
export function reportRows(chartData = []) {
  return chartData.filter(row => row.year !== '시작').map(row => {
    const amounts = ['interestAmountA','principalA','interestAmountB','principalB'].map(key => row[key] ?? 0);
    return { ...row, debtService: amounts.every(isNumber) ? amounts.reduce((a,b) => a+b,0) : NaN };
  });
}
export function reportConditions(inputs = {}) {
  return [
    { title: '설치·발전 조건', rows: [
      ['설비 용량', withUnit(inputs.solarCapacity, ' kW', 2)],
      ['설치 지역', text(inputs.region)],
      ['설치 분류', text(inputs.installType)],
      ['일평균 발전시간', withUnit(inputs.daylightHours, ' h', 2)],
      ['SMP', withUnit(inputs.SMP, ' 원/kWh', 2)],
      ['REC', withUnit(inputs.REC, ' 원/kWh', 2)],
      ['REC 가중치', num(inputs.recWeight, 2)],
      ['부지매입비', money(inputs.landCost)],
    ] },
    { title: '투자·금융 조건', rows: [
      ['햇빛소득 대출 비중', withUnit(inputs.loanRatio, '%', 2)],
      ['햇빛소득 대출 금리', withUnit(inputs.interestRateA, '%', 2)],
      ['햇빛소득 상환 방식', text(inputs.repaymentPlanA)],
      ['추가 대출금', money(inputs.loanB)],
      ['추가 대출 기간', withUnit(inputs.loanPeriodB, '년')],
      ['추가 대출 금리', withUnit(inputs.interestRateB, '%', 2)],
      ['추가 대출 상환 방식', text(inputs.repaymentPlanB)],
      ['기타 비용 (계산 미반영)', money(inputs.additionalExpense)],
    ] },
  ];
}
// 축에 0과 모든 유효 데이터 (초기투자비 포함)를 넣어 음수도 잘리지 않게 한다.
export function chartScale(values, tickTarget = 4) {
  const valid = values.filter(isNumber);
  const low = Math.min(0, ...valid), high = Math.max(0, ...valid);
  const rough = (high - low || 1) / tickTarget;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const step = ([1, 2, 2.5, 5, 10].find(v => v >= normalized) || 10) * magnitude;
  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step || step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  return { min, max, ticks };
}
