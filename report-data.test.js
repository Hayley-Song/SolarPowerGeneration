import test from 'node:test';
import assert from 'node:assert/strict';
import { chartScale, reportConditions, reportRows, shortMoney } from '../src/utils/reportData.js';

test('보고서에는 1~20년차만 남기고 원리금 비용을 정확히 합산한다', () => {
  const rows = reportRows([{ year:'시작', annualProfit:0 }, { year:'1년차', interestAmountA:10, principalA:20, interestAmountB:3, principalB:4, annualProfit:63 }, { year:'2년차', annualProfit:40 }]);
  assert.equal(rows.length,2);
  assert.equal(rows[0].debtService,37);
  assert.equal(rows[0].annualProfit,63);
  assert.equal(rows[1].debtService,0);
});
test('차트 축은 손실·0·초기투자비 모두 포함한다', () => {
  for (const values of [[-320, 0, 490, 1100], [-300,-10], [0,0], [NaN,undefined]]) {
    const s=chartScale(values);
    assert.ok(s.min <= 0 && s.max >= 0 && s.max > s.min);
    assert.ok(values.filter(Number.isFinite).every(v => v >= s.min && v <= s.max));
    assert.ok(s.ticks.length >= 2 && s.ticks.length < 10);
  }
});
test('실제 입력값을 한글 단위로 변환하고 0과 미확인 값을 구분한다', () => {
  const conditions = reportConditions({ solarCapacity:100, region:'경상북도', installType:'건축물', daylightHours:3.46, loanB:0, additionalExpense:5000000 });
  const entries = Object.fromEntries(conditions.flatMap(g=>g.rows));
  assert.equal(entries['설비 용량'],'100 kW');
  assert.equal(entries['일평균 발전시간'],'3.46 h');
  assert.equal(entries['추가 대출금'],'0원');
  assert.equal(entries.SMP,'—');
  assert.equal(entries['기타 비용 (계산 미반영)'],'5,000,000원');
  assert.equal(shortMoney(-123450000),'−1억 2,345만 원');
});
