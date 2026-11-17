import React from 'react';
import { chartScale, isNumber, money, num, reportConditions, reportRows, shortMoney } from '../utils/reportData';
import './PdfReportTemplate.css';

const GOLD = '#ad7600';
const NAVY = '#294453';
const NEGATIVE = '#a34e42';

function ReportHeader({ page, date, title, subtitle }) {
  return <header className="report-header">
    <div className="report-brand"><span className="report-brand-mark" /> 햇빛소득마을 수익 시뮬레이터</div>
    <div className="report-meta">{date} <span>·</span> {page === 1 ? '분석 요약' : '연도별 손익'}</div>
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </header>;
}
function ReportFooter({ page }) {
  return <footer className="report-footer"><span>햇빛소득마을 수익 시뮬레이터 · 참고용 분석자료</span><b>{String(page).padStart(2,'0')} / 02</b></footer>;
}
function SectionTitle({ index, children, note }) {
  return <div className="report-section-title"><div><span>{index}</span><h2>{children}</h2></div>{note && <small>{note}</small>}</div>;
}
function Metric({ label, value, detail, accent }) {
  return <div className={`report-metric${accent ? ' report-metric-accent' : ''}`}><div className="report-metric-label">{label}</div><strong>{value}</strong><small>{detail}</small></div>;
}
function ConditionGroup({ title, rows }) {
  return <div className="report-condition-group"><h3>{title}</h3><table><tbody>{rows.map(([label,value]) => <tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table></div>;
}
function LegendItem({ color, dashed, children }) {
  return <span className="report-legend-item"><i style={{ background: dashed ? 'none' : color, borderTop: dashed ? `2px dashed ${color}` : undefined }} />{children}</span>;
}

// SVG를 직접 구성해 숨겨진 PDF 전용 차트의 레이아웃/애니메이션 타이밍 문제를 제거한다.
function ReportChart({ rows, initialExpense, annual = false }) {
  const width = 702, height = 170, left = 70, right = 15, top = 8, bottom = 26;
  const plotW = width - left - right, plotH = height - top - bottom;
  const data = annual ? rows.filter(r => r.year !== '시작') : rows;
  const key = annual ? 'annualProfit' : 'cumProfit';
  const scale = chartScale([...data.map(r => r[key]), ...(annual ? [] : [initialExpense])]);
  const y = v => top + (scale.max - v) / (scale.max - scale.min) * plotH;
  const stride = plotW / Math.max(data.length, 1);
  const x = i => annual ? left + stride * (i + 0.5) : left + plotW * i / Math.max(data.length - 1, 1);
  const groups = [];
  data.forEach((r,i) => {
    if (!isNumber(r[key])) { if (groups.at(-1)?.length) groups.push([]); return; }
    if (!groups.length) groups.push([]);
    groups.at(-1).push([x(i),y(r[key])]);
  });
  const validGroups = groups.filter(g => g.length);
  const zero = y(0);
  return <div className="report-chart">
    <div className="report-chart-heading"><h3>{annual ? '연간 수익 추이' : '누적 수익 추이'}</h3><div className="report-legend">
      <LegendItem color={annual ? NAVY : GOLD}>{annual ? '연간 수익' : '누적 수익'}</LegendItem>
      {annual && data.some(r => r[key] < 0) && <LegendItem color={NEGATIVE}>손실</LegendItem>}
      {!annual && <LegendItem color={NAVY} dashed>초기 투자비</LegendItem>}
    </div></div>
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} fontFamily="Malgun Gothic, Noto Sans CJK KR, sans-serif" fontSize="11" aria-label={annual ? '연간 수익 그래프' : '누적 수익 그래프'}>
      {scale.ticks.map((tick,i) => <g key={i}><line x1={left} x2={width-right} y1={y(tick)} y2={y(tick)} stroke={tick === 0 ? '#8e9ba3' : '#e2e7e9'} strokeWidth={tick === 0 ? 1.2 : 1}/><text x={left-9} y={y(tick)+4} textAnchor="end" fill="#52616a">{num(tick / 10000, 2)}</text></g>)}
      {!annual && validGroups.map((points,i) => <g key={i}><polygon points={`${points[0][0]},${zero} ${points.map(p=>p.join(',')).join(' ')} ${points.at(-1)[0]},${zero}`} fill="#f7eac8" /><polyline points={points.map(p=>p.join(',')).join(' ')} fill="none" stroke={GOLD} strokeWidth="2.7" strokeLinejoin="round" strokeLinecap="round"/></g>)}
      {!annual && isNumber(initialExpense) && <line x1={left} x2={width-right} y1={y(initialExpense)} y2={y(initialExpense)} stroke={NAVY} strokeWidth="1.6" strokeDasharray="6 4"/>}
      {annual && data.map((r,i) => isNumber(r[key]) && <rect key={i} x={x(i)-stride*.31} y={Math.min(zero,y(r[key]))} width={stride*.62} height={Math.abs(zero-y(r[key]))} rx="1.5" fill={r[key]<0 ? NEGATIVE : NAVY}/>)}
      {data.map((r,i) => {
        const year = Number.parseInt(r.year,10);
        if (r.year !== '시작' && ![1,5,10,15,20].includes(year)) return null;
        if (!annual && year === 1) return null;
        return <text key={i} x={x(i)} y={height-7} textAnchor="middle" fill="#52616a">{r.year === '시작' ? '0' : `${year}년`}</text>;
      })}
    </svg>
  </div>;
}

export function PdfReportTemplate({ page1Ref, page2Ref, data }) {
  const { chartData = [], initialExpense, inputs = {}, yearResult } = data;
  const rows = reportRows(chartData);
  const cumulative = chartData.at(-1)?.cumProfit;
  const date = new Intl.DateTimeFormat('ko-KR', {year:'numeric',month:'2-digit',day:'2-digit', timeZone:'Asia/Seoul'}).format(new Date());
  const payback = /^\d+$/.test(String(yearResult)) ? `${yearResult}년차` : (yearResult === '수익실현불가' ? '20년 내 미회수' : String(yearResult ?? '—'));
  const total = key => rows.every(r => isNumber(r[key])) ? rows.reduce((sum,r)=>sum+r[key],0) : NaN;
  const numeric = (value) => <td className={value < 0 ? 'report-negative' : ''}>{num(value)}</td>;
  return <div className="report-export-host" aria-hidden="true">
    <div ref={page1Ref} className="report-page" data-report-page="1">
      <ReportHeader page={1} date={date} title="태양광 발전사업 수익 분석" subtitle="20년간 예상 발전 수익 및 투자비 회수 시뮬레이션" />
      <SectionTitle index="01">핵심 분석 결과</SectionTitle>
      <div className="report-metrics">
        <Metric label="초기 투자 비용" value={shortMoney(initialExpense)} detail={money(initialExpense)} />
        <Metric label="20년 누적 수익" value={shortMoney(cumulative)} detail={money(cumulative)} accent />
        <Metric label="투자비 회수 시점" value={payback} detail="누적 수익 ≥ 초기 투자비" />
      </div>
      <SectionTitle index="02">시뮬레이션 적용 조건</SectionTitle>
      <div className="report-conditions">{reportConditions(inputs).map(group => <ConditionGroup key={group.title} {...group}/>)}</div>
      <SectionTitle index="03" note="단위: 만원">예상 수익 추이</SectionTitle>
      <ReportChart rows={chartData} initialExpense={initialExpense}/>
      <ReportChart rows={chartData} annual/>
      <div className="report-note">※ 누적 수익은 운영비 및 대출 원리금 차감 후 연간 수익의 합계이며 초기 투자비는 별도입니다. 실제 사업조건 및 시장상황에 따라 결과가 달라질 수 있습니다.</div>
      <ReportFooter page={1}/>
    </div>
    <div ref={page2Ref} className="report-page" data-report-page="2">
      <ReportHeader page={2} date={date} title="연도별 손익 상세" subtitle="20년간 발전 수익, 운영 비용, 대출 원리금 및 수익 현황" />
      <SectionTitle index="04" note="단위: 원">연도별 손익계산서 요약</SectionTitle>
      <table className="report-results"><colgroup><col style={{width:'9%'}}/><col style={{width:'19%'}}/><col style={{width:'17%'}}/><col style={{width:'18%'}}/><col style={{width:'18%'}}/><col style={{width:'19%'}}/></colgroup>
        <thead><tr><th>연도</th><th>발전 수익</th><th>운영 비용</th><th>대출 원리금</th><th>당해 수익</th><th>누적 수익</th></tr></thead>
        <tbody>{rows.map((row,i) => <tr key={row.year} className={(i+1)%5===0 ? 'report-period-end' : ''}><th>{row.year}</th>{numeric(row.generationRevenue)}{numeric(row.maintenanceCost)}{numeric(row.debtService)}{numeric(row.annualProfit)}{numeric(row.cumProfit)}</tr>)}</tbody>
        <tfoot><tr><th>합계</th>{numeric(total('generationRevenue'))}{numeric(total('maintenanceCost'))}{numeric(total('debtService'))}{numeric(total('annualProfit'))}{numeric(cumulative)}</tr></tfoot>
      </table>
      <div className="report-method"><h3>산출 기준 및 유의사항</h3><p><b>당해 수익</b> = 발전 수익 − 운영 비용 − 대출 원리금</p><p><b>누적 수익</b> = 해당 연도까지의 당해 수익 합계 (초기 투자비 별도)</p><p>본 보고서는 입력된 가정값과 현재 시뮬레이터 계산식을 바탕으로 산출한 참고자료입니다. 일부 비용은 산출 조건에 따라 반영되지 않을 수 있습니다. 기타 비용 입력값은 현재 초기 투자비 계산식에 포함되지 않습니다.</p></div>
      <ReportFooter page={2}/>
    </div>
  </div>;
}
