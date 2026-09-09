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
import React, { useState } from 'react';

export default function ChartView({ data }) {
  const { chartData, initialExpense, cumulativeProfit } = data;
  const [viewMode, setViewMode] = useState('누적');
  const yearResult =
    chartData
      .find((range) => initialExpense <= range.cumProfit)
      ?.year.slice(0, -1) ?? '수익실현불가';

  return (
    <section className="lg:col-span-2 flex flex-col gap-6 sticky top-6 h-fit">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary p-5 rounded-2xl border">
          <p className="text-xs mainText uppercase tracking-wider mb-1">
            초기투자비용
          </p>
          <p className="text-2xl font-black text-mainText">
            {formatKoreanWon(initialExpense)}
          </p>
        </div>
        <div className="bg-primary p-5 rounded-2xl border">
          <p className="text-xs mainText uppercase tracking-wider mb-1">
            예상 투자비용 회수 기간
          </p>
          <p className="text-2xl font-black text-mainText">{yearResult}</p>
        </div>
      </div>

      {/* 상단 탭 전환 버튼 */}
      <div className="flex justify-between items-center mb-0 border-b border-stone-100 pb-0">
        <h2 className="text-xl font-bold text-mainText">
          {viewMode === '누적' ? '📈 누적 수익' : '📄 연도별 수익'}
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

      {/* 💡 차트 및 상세 패널을 감싸는 Flex 컨테이너 추가 */}
      {viewMode === '누적' ? (
        <CumulativeView data={{ chartData, initialExpense }} />
      ) : (
        <YearlyView data={{ chartData, initialExpense }} />
      )}
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
      {/* 메인 차트 영역 (min-w-0 추가로 ResponsiveContainer 반응형 동작 보장) */}
      <div
        className={`bg-mainBg p-6 rounded-2xl border shadow-2xl h-[400px] transition-all duration-300 min-w-0 select-none [&_*]:outline-none ${
          selectedYear ? 'w-full lg:w-2/3' : 'w-full'
        }`}
      >
        <div className="flex justify-between items-center w-full mb-4">
          {/* 왼쪽 정렬 텍스트 (메인 제목) */}
          <h3 className="text-sm text-mainText">
            누적 수익 그래프(단위 : 천 원)
          </h3>

          {/* 오른쪽 정렬 텍스트 (단위, 부연 설명 등) */}
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
              // 1. activePayload에서 연도 추출 시도 (막대 직접 클릭 시)
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
                  {...props} // active, payload, label 자동 전달
                  initialExpense={initialExpense} // 💡 특정 데이터 1
                  unit="천 원" // 💡 특정 데이터 2
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
      <selectedYearWindow data={ selectedYear,
        setSelectedYear,
        selectedYearData,
      } />
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
      {/* 메인 차트 영역 (min-w-0 추가로 ResponsiveContainer 반응형 동작 보장) */}
      <div
        className={`bg-mainBg p-6 rounded-2xl border shadow-2xl h-[400px] transition-all duration-300 min-w-0 select-none [&_*]:outline-none ${
          selectedYear ? 'w-full lg:w-2/3' : 'w-full'
        }`}
      >
        <div className="flex justify-between items-center w-full mb-4">
          {/* 왼쪽 정렬 텍스트 (메인 제목) */}
          <h3 className="text-sm text-mainText">
            연도별 수익 그래프(단위 : 천 원)
          </h3>

          {/* 오른쪽 정렬 텍스트 (단위, 부연 설명 등) */}
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
              // 1. activePayload에서 연도 추출 시도 (막대 직접 클릭 시)
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
                  {...props} // active, payload, label 자동 전달
                  initialExpense={initialExpense} // 💡 특정 데이터 1
                  unit="천 원" // 💡 특정 데이터 2
                />
              )}
            />
            <Legend />

            {/* 💡 stackId를 동일한 값("a")으로 맞추면 위로 쌓입니다. */}
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
              radius={[3, 3, 0, 0]} // 맨 위 막대에만 상단 라운드 적용
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 우측 상세 수익 데이터 패널 (손익계산서 형태) */}
      {selectedYear && (
        <div className="w-full lg:w-1/2 bg-mainBg p-6 rounded-2xl border shadow-2xl flex flex-col justify-between transition-all duration-300">
          <div>
            {/* 헤더 영역 */}
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

            {/* 손익계산서 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-textMain">
                <tbody className="text-textMain">
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 text-textMain font-bold">
                      발전 수익
                    </td>
                    <td className="py-1.5 px-3 text-right text-textMain font-semibold">
                      {selectedYearData.generationRevenue?.toLocaleString()}원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 text-textMain font-bold">
                      운영 비용
                    </td>
                    <td className="py-1.5 px-3 text-right text-blue-700 font-semibold">
                      {(selectedYearData.maintenanceCost || 0).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 pl-6 text-textMain">
                      전기안전관리비
                    </td>
                    <td className="py-1.5 px-3 text-right text-textMain">
                      {(
                        selectedYearData.maintenanceCostA || 0
                      ).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 pl-6 text-textMain">보험료</td>
                    <td className="py-1.5 px-3 text-right text-textMain">
                      {(
                        selectedYearData.maintenanceCostB || 0
                      ).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 pl-6 text-textMain">
                      유지관리 비용
                    </td>
                    <td className="py-1.5 px-3 text-right text-textMain">
                      {(
                        selectedYearData.maintenanceCostC || 0
                      ).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 pl-6 text-textMain">
                      인버터 교체비용
                    </td>
                    <td className="py-1.5 px-3 text-right text-textMain">
                      {(
                        selectedYearData.maintenanceCostD || 0
                      ).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 text-textMain font-bold">
                      대출 상환
                    </td>
                    <td className="py-1.5 px-3 text-right text-blue-700 font-semibold">
                      {(
                        (selectedYearData.interestAmountA || 0) +
                        (selectedYearData.interestAmountB || 0) +
                        (selectedYearData.principalA || 0) +
                        (selectedYearData.principalB || 0)
                      ).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 pl-6 text-textMain">
                      원금 상환
                    </td>
                    <td className="py-1.5 px-3 text-right text-textMain">
                      {(
                        (selectedYearData.principalA || 0) +
                        (selectedYearData.principalB || 0)
                      ).toLocaleString()}
                      원
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20">
                    <td className="py-1.5 px-3 pl-6 text-textMain">
                      이자 비용
                    </td>
                    <td className="py-1.5 px-3 text-right text-textMain">
                      {(
                        (selectedYearData.interestAmountA || 0) +
                        (selectedYearData.interestAmountB || 0)
                      ).toLocaleString()}
                      원
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

          <p className="text-xs text-slate-500 text-center mt-2">
            * 예상값 어쩌구 책임 안 짐 어쩌구
          </p>
        </div>
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
        <p
          className={`font-semibold ${
            currentData.cumProfit >= 0 ? 'mainText' : 'text-rose-400'
          }`}
        >
          누적 수익: {currentData.cumProfit?.toLocaleString()}원
        </p>
        <p
          className={`font-semibold ${
            currentData.annualProfit >= 0 ? 'mainText' : 'text-rose-400'
          }`}
        >
          당해 수익: {currentData.annualProfit?.toLocaleString()}원
        </p>
        <p
          className={`font-semibold ${
            investmentReturn >= 0 ? 'mainText' : 'text-rose-400'
          }`}
        >
          투자 수익: {investmentReturn?.toLocaleString()}원
        </p>
      </div>
    );
  }
  return null;
};

function selectedYearWindow({ data }) {
  const {
    selectedYear,
    setSelectedYear,
    selectedYearData,
  } = data;
         
  {selectedYear && (
    <div className="w-full lg:w-1/2 bg-mainBg p-6 rounded-2xl border shadow-2xl flex flex-col justify-between transition-all duration-300">
      <div>
        {/* 헤더 영역 */}
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

        {/* 손익계산서 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-textMain">
            <tbody className="text-textMain">
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 text-textMain font-bold">
                  발전 수익
                </td>
                <td className="py-1.5 px-3 text-right text-textMain font-semibold">
                  {selectedYearData.generationRevenue?.toLocaleString()}원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 text-textMain font-bold">
                  운영 비용
                </td>
                <td className="py-1.5 px-3 text-right text-blue-700 font-semibold">
                  {(selectedYearData.maintenanceCost || 0).toLocaleString()}
                  원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  전기안전관리비
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    selectedYearData.maintenanceCostA || 0
                  ).toLocaleString()}
                  원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">보험료</td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    selectedYearData.maintenanceCostB || 0
                  ).toLocaleString()}
                  원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  유지관리 비용
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    selectedYearData.maintenanceCostC || 0
                  ).toLocaleString()}
                  원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  인버터 교체비용
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    selectedYearData.maintenanceCostD || 0
                  ).toLocaleString()}
                  원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 text-textMain font-bold">
                  대출 상환
                </td>
                <td className="py-1.5 px-3 text-right text-blue-700 font-semibold">
                  {(
                    (selectedYearData.interestAmountA || 0) +
                    (selectedYearData.interestAmountB || 0) +
                    (selectedYearData.principalA || 0) +
                    (selectedYearData.principalB || 0)
                  ).toLocaleString()}
                  원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  원금 상환
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    (selectedYearData.principalA || 0) +
                    (selectedYearData.principalB || 0)
                  ).toLocaleString()}
                  원
                </td>
              </tr>
              <tr className="hover:bg-slate-800/20">
                <td className="py-1.5 px-3 pl-6 text-textMain">
                  이자 비용
                </td>
                <td className="py-1.5 px-3 text-right text-textMain">
                  {(
                    (selectedYearData.interestAmountA || 0) +
                    (selectedYearData.interestAmountB || 0)
                  ).toLocaleString()}
                  원
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

      <p className="text-xs text-slate-500 text-center mt-2">
        * 예상값 어쩌구 책임 안 짐 어쩌구
      </p>
    </div>
  )}
};
