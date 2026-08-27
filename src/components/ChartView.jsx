import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { formatKoreanWon } from '../utils/calculators';

export default function ReportView({ data }) {
  const { chartData, initialExpense, cumulativeProfit } = data;

  return (
    <section className="lg:col-span-2 flex flex-col gap-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-primary p-5 rounded-2xl border ">
          <p className="text-xs mainText uppercase tracking-wider mb-1">
            소요자금
          </p>
          <p className="text-2xl font-black text-mainText">
            {formatKoreanWon(initialExpense)}
          </p>
        </div>
        <div className="bg-primary p-5 rounded-2xl border ">
          <p className="text-xs mainText uppercase tracking-wider mb-1">
            월 평균 수익
          </p>
          <p
            className={`text-2xl font-black ${cumulativeProfit >= 0 ? 'mainText' : 'text-rose-400'}`}
            // className={`text-2xl font-black ${1 >= 0 ? 'mainText' : 'text-rose-400'}`}
          >
            {formatKoreanWon(cumulativeProfit / (12 * 20))}
          </p>
        </div>
      </div>

      {/* 메인 차트 영역 */}
      <div className="bg-mainBg p-6 rounded-2xl border shadow-2xl h-[400px]">
        <h3 className="text-sm mainText mb-4">연차별 누적 수익 흐름 그래프</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
              tickFormatter={(v) => `${v.toLocaleString()}`}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
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
                value: '',
                fill: '#94a3b8',
                fontSize: 10,
                position: 'bottom',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // 💡 payload[0].payload 안에 해당 연도의 전체 데이터 객체가 들어있습니다.
    const currentData = payload[0].payload;

    return (
      <div className="bg-white p-3 border border-stone-200 rounded-xl shadow-lg text-xs space-y-1.5">
        <p className="font-bold text-stone-800 border-b border-stone-100 pb-1">
          📌 {label} 상세 정보
        </p>

        <p className="text-emerald-600 font-semibold">
          누적 수익: {currentData.cumProfit?.toLocaleString()}원
        </p>

        <p className="text-emerald-600 font-semibold">
          당해 수익: {currentData.annualProfit?.toLocaleString()}원
        </p>
        <p className="text-stone-600">
          당해 이자:{' '}
          {(
            currentData.interestAmountA + currentData.interestAmountB
          )?.toLocaleString()}
          원
        </p>
        <p className="text-stone-600">
          당해 원금:{' '}
          {(currentData.principalA + currentData.principalB)?.toLocaleString()}
          원
        </p>
      </div>
    );
  }
  return null;
};
