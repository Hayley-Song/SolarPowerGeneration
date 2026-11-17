import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { formatKoreanWon } from '../utils/calculators';
import React, { useState, useRef } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { PdfReportTemplate } from './PdfReportTemplate';
import { exportToPdf } from '../utils/pdfExporter';


export default function ChartView({ data }) {
  const { chartData, initialExpense, yearResult, inputProps_export: inputs = {} } = data;
  const [viewMode, setViewMode] = useState('누적');
  const [isExporting, setIsExporting] = useState(false);
  
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      await exportToPdf(page1Ref, page2Ref);
    } catch (error) {
      alert('PDF 리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="lg:col-span-2 flex flex-col gap-6 sticky top-6 h-fit">

      {/* 상단 탭 전환 버튼 */}
      <div className="flex justify-between items-center mb-0 border-b border-stone-100 pb-0">
        <h2 className="text-xl font-bold text-mainText">
          {viewMode === '누적' ? '📈 누적 수익' : '📅 연도별 수익'}
        </h2>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('누적')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === '누적'
                ? 'bg-primary text-white shadow-sm'
                : 'text-mainText hover:text-stone-900'
            }`}
          >
            누적 수익
          </button>
          <button
            onClick={() => setViewMode('연도별')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === '연도별'
                ? 'bg-primary text-white shadow-sm'
                : 'text-mainText hover:text-stone-900'
            }`}
          >
            연도별 수익
          </button>
        </div>
      </div>

      {viewMode === '누적' ? (
        <CumulativeView data={{ chartData, initialExpense }} />
      ) : (
        <YearlyView data={{ chartData, initialExpense }} />
      )}

      {/* 분리된 PDF 템플릿 컴포넌트 장착 */}
      <PdfReportTemplate
        page1Ref={page1Ref}
        page2Ref={page2Ref}
        data={{ chartData, initialExpense, inputs, yearResult }}
      />
      
      <div className="flex justify-end">
        <button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl shadow-md hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? 'PDF 생성 중...' : '📄 PDF 리포트 다운로드'}
        </button>
      </div>

      <p className="text-xs text-slate-500 text-left mt-2">
        ※ 본 시뮬레이터는 입력된 가정값을 바탕으로 태양광 발전사업의 예상 수익과 비용을 산출하는 참고용 계산 도구입니다.
        <br />
        ※ 시뮬레이터의 적용조건은 실제 사업조건 및 시장상황에 따라 달라질 수 있으며 발생되는 비용의 일부는 시뮬레이터의 산출조건에 따라 반영되지 않을 수 있습니다.
      </p>
    </section>
  );
}

function CumulativeView({ data }) {
  const { chartData, initialExpense } = data;
  const [selectedYear, setSelectedYear] = useState(null);
  const selectedYearData = chartData?.find(
    (item) => item.year === selectedYear,
  );

  return (
    <div className="flex gap-4 w-full items-start">
      <div
        className={`bg-white p-6 rounded-2xl border shadow-2xl h-[400px] transition-all duration-300 min-w-0 select-none [&_*]:outline-none ${
          selectedYear ? 'w-full lg:w-2/3' : 'w-full'
        }`}
      >
        <div className="flex justify-between items-center w-full mb-4">
          <h3 className="text-sm text-mainText">
            누적 수익 그래프(단위 : 천 원)
          </h3>
          <span className="text-sm text-mainText">
            총 누적 수익 :{' '}
            {formatKoreanWon(chartData[chartData.length - 1].cumProfit)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onClick={(e) => {
              if (!e) return;
              const targetYear =
                e.activePayload?.[0]?.payload?.year || e.activeLabel;
              if (targetYear) {
                setSelectedYear(targetYear);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffbb00" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ffbb00" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              opacity={0.5}
            />
            <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => `${(v / 1000).toLocaleString()}`}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...props}
                  initialExpense={initialExpense}
                  unit="천 원"
                />
              )}
            />
            <Area
              type="monotone"
              dataKey="cumProfit"
              stroke="#ffbb00"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
            <ReferenceLine
              y={initialExpense}
              stroke="#475569"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{
                value: '초기투자비용',
                fill: '#475569',
                fontSize: 14,
                position: 'insideBottomLeft',
                dy: -5,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {selectedYear && (
        <SelectedYearWindow data={{ selectedYear, setSelectedYear, selectedYearData }} />
      )}
    </div>
  );
}

function YearlyView({ data }) {
  const { chartData, initialExpense } = data;
  const [selectedYear, setSelectedYear] = useState(null);
  const selectedYearData = chartData?.find(
    (item) => item.year === selectedYear,
  );

  return (
    <div className="flex gap-4 w-full items-start">
      <div
        className={`bg-white p-6 rounded-2xl border shadow-2xl h-[400px] transition-all duration-300 min-w-0 select-none [&_*]:outline-none ${
          selectedYear ? 'w-full lg:w-2/3' : 'w-full'
        }`}
      >
        <div className="flex justify-between items-center w-full mb-4">
          <h3 className="text-sm text-mainText">
            연도별 수익 그래프(단위 : 천 원)
          </h3>
          <span className="text-sm text-mainText">
            총 누적 수익 :{' '}
            {formatKoreanWon(chartData[chartData.length - 1].cumProfit)}
          </span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onClick={(e) => {
              if (!e) return;
              const targetYear =
                e.activePayload?.[0]?.payload?.year || e.activeLabel;
              if (targetYear) {
                setSelectedYear(targetYear);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              opacity={0.5}
            />
            <XAxis dataKey="year" stroke="#64748b" fontSize={11} />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => `${(v / 1000).toLocaleString()}`}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...props}
                  initialExpense={initialExpense}
                  unit="천 원"
                />
              )}
            />
            <Legend />
            <Bar
              dataKey="annualProfit"
              name="연간 수익"
              stackId="a"
              fill="#ffbb00"
            />
            <Bar
              dataKey={(entry) =>
                (entry.generationRevenue || 0) - (entry.annualProfit || 0)
              }
              name="연간 비용"
              stackId="a"
              fill="#475569"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {selectedYear && (
        <SelectedYearWindow data={{ selectedYear, setSelectedYear, selectedYearData }} />
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, initialExpense }) => {
  if (active && payload && payload.length) {
    const currentData = payload[0].payload;
    const investmentReturn = parseInt(currentData.cumProfit - initialExpense);

    return (
      <div className="bg-white p-3 border border-stone-200 rounded-xl shadow-lg text-xs space-y-1.5">
        <p className="font-bold text-stone-800 border-b border-stone-100 pb-1">
          📌 {label} 상세 정보
        </p>
        <p className={`font-semibold ${currentData.cumProfit >= 0 ? 'mainText' : 'text-rose-400'}`}>
          누적 수익: {currentData.cumProfit?.toLocaleString()}원
        </p>
        <p className={`font-semibold ${currentData.annualProfit >= 0 ? 'mainText' : 'text-rose-400'}`}>
          당해 수익: {currentData.annualProfit?.toLocaleString()}원
        </p>
        <p className={`font-semibold ${investmentReturn >= 0 ? 'mainText' : 'text-rose-400'}`}>
          투자 수익: {investmentReturn?.toLocaleString()}원
        </p>
      </div>
    );
  }
  return null;
};

function SelectedYearWindow({ data }) {
  const { selectedYear, setSelectedYear, selectedYearData } = data;

  return (
    <div className="w-full lg:w-1/2 bg-white p-6 rounded-2xl border shadow-2xl flex flex-col justify-between transition-all duration-300">
      <div>
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
          <h4 className="text-base font-bold text-mainText">
            {selectedYear} 손익계산서
          </h4>
          <button
            onClick={() => setSelectedYear(null)}
            className="text-slate-400 hover:text-mainText font-bold p-1"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
 
        <div className="overflow-x-auto select-none [&_*]:outline-none">
          <table className="w-full text-sm text-left text-textMain">
            <tbody className="text-textMain">
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 text-textMain font-bold">
                  <div className="inline-flex items-center">
                    <span>발전 수익</span>
                    <InfoTooltip 
                      text="※ (SMP + REC × REC가중치) × 설비용량(kW) × 일평균 발전시간(h/일) × 365일" 
                      position="bottom" 
                    />
                  </div>
                </td>
                <td className="py-1.5 px-3 text-right text-textMain font-semibold">
                  {selectedYearData.generationRevenue?.toLocaleString()}원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 text-textMain font-bold">
                  운영 비용
                </td>
                <td className="py-1.5 px-3 text-right text-blue-700 font-semibold">
                  {(selectedYearData.maintenanceCost || 0).toLocaleString()} 원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  <div className="inline-flex items-center">
                    <span>전기안전관리비</span>
                    <InfoTooltip text="※ 한국전기안전공사 전기안전관리대행 수수료 기준(기준연도: 2026년)을 적용" />
                  </div>
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(selectedYearData.maintenanceCostA || 0).toLocaleString()} 원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  <div className="inline-flex items-center">
                    <span>보험료</span>
                    <InfoTooltip text="※ 설비가액의 0.5%를 적용" />
                  </div>
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(selectedYearData.maintenanceCostB || 0).toLocaleString()} 원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  유지관리 비용
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(selectedYearData.maintenanceCostC || 0).toLocaleString()} 원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  <div className="inline-flex items-center">
                    <span>인버터 교체비용</span>
                    <InfoTooltip text="※ 설비가액의 7%를 적용, 10년마다 발생" />
                  </div>
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(selectedYearData.maintenanceCostD || 0).toLocaleString()} 원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 text-textMain font-bold">
                  대출 상환
                </td>
                <td className="py-1.5 px-3 text-right text-blue-700 font-semibold">
                  {(
                    (selectedYearData.interestAmountA || 0) +
                    (selectedYearData.interestAmountB || 0) +
                    (selectedYearData.principalA || 0) +
                    (selectedYearData.principalB || 0)
                  ).toLocaleString()} 원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  원금 상환
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    (selectedYearData.principalA || 0) +
                    (selectedYearData.principalB || 0)
                  ).toLocaleString()} 원
                </td>
              </tr>
              <tr className="hover:bg-slate-500/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  이자 비용
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    (selectedYearData.interestAmountA || 0) +
                    (selectedYearData.interestAmountB || 0)
                  ).toLocaleString()} 원
                </td>
              </tr>
              <tr className="border-t-2 border-slate-600 bg-slate-800/80 font-bold">
                <td className="py-2.5 px-3 text-white">예상 수익</td>
                <td className="py-2.5 px-3 text-right text-yellow-400">
                  {selectedYearData.annualProfit?.toLocaleString()}원
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

