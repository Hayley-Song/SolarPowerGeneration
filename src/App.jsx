import React, { useState } from 'react';
import * as Cal from './utils/calculators.js';
import ChartView from './components/ChartView';
import InputView from './components/InputView';
import leftIcon from '../assets/leftIcon.svg';
import rightIcon from '../assets/rightIcon.svg';

function App() {
  // 1. 입력 변수 상태(State) 선언
  const [solarCapacity, setSolarCapacity] = useState(300); // 태양광 발전 설비 용량 (기본 300kW)
  const [landCost, setLandCost] = useState(0); // 부지매입비 (기본 0원)
  const [region, setRegion] = useState('서울경기');
  const [daylightHours, setDaylightHours] = useState(3.5); // 일조 시간 (기본 3.5시간)
  const [installType, setInstallType] = useState('일반부지'); // 설치 유형 (기본 일반부지)
  const [recWeight, setRecWeight] = useState(1.2); // REC 가중치 (기본 1.2)
  const [SMP, setSMP] = useState(120);
  const [REC, setREC] = useState(72);
  const [loanRatio, setLoanRatio] = useState(85);

  // const [loanA, setLoanA] = useState(0);
  const [interestRateA, setInterestRateA] = useState(3.75);
  const [repaymentPlanA, setRepaymentPlanA] = useState('5년거치10년분할');
  const [loanB, setLoanB] = useState(0);
  const [interestRateB, setInterestRateB] = useState(0);
  const [repaymentPlanB, setRepaymentPlanB] = useState('원리금균등');
  const [loanPeriodB, setLoanPeriodB] = useState(0);

  const initialExpense = Cal.estimateCost(solarCapacity, installType) + landCost;
  let loanA = initialExpense * (loanRatio / 100);

  // const [viewMode, setViewMode] = useState('chart');
  const [showAdditional, setShowAdditional] = useState('닫기');

  const inputProps = {
    initialExpense,
    solarCapacity,
    landCost,
    region,
    daylightHours,
    installType,
    recWeight,
    SMP,
    REC,
    loanRatio,
    interestRateA,
    repaymentPlanA,
    loanB,
    interestRateB,
    repaymentPlanB,
    loanPeriodB,
    showAdditional,
    setSolarCapacity,
    setLandCost,
    setRegion,
    setDaylightHours,
    setInstallType,
    setRecWeight,
    setSMP,
    setREC,
    setLoanRatio,
    setInterestRateA,
    setRepaymentPlanA,
    setLoanB,
    setInterestRateB,
    setRepaymentPlanB,
    setLoanPeriodB,
    setShowAdditional,
  };

  let data = Cal.mergedData(
    Cal.calculateRevenue(solarCapacity, daylightHours, SMP, REC, recWeight),
    Cal.calculateLoanA(loanA, interestRateA, repaymentPlanA),
    Cal.calculateLoanB(loanB, loanPeriodB, interestRateB, repaymentPlanB),
  );

  let accProfit = 0;

  data = data.map((item) => {
    const annualProfit =
      (item.generationRevenue || 0) -
      (item.maintenanceCost || 0) -
      (item.interestAmountA || 0) -
      (item.principalA || 0) -
      (item.interestAmountB || 0) -
      (item.principalB || 0);
    accProfit += annualProfit;
    return {
      ...item,
      annualProfit: annualProfit,
      cumProfit: accProfit,
    };
  });

  const chartData = data;
  const cumulativeProfit = chartData[chartData.length - 1].cumProfit; // 20년 후 누적 수익액

  return (
    <div className="min-h-screen bg-mainBg text-mainText p-6 md:p-12">
      <header className="relative overflow-hidden w-full rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800/80 mb-8">
      {/* 💡 배경 은은한 빛 효과 (그라데이션 질감 살리기) */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4 md:gap-8">
        
        {/* 1. 왼쪽 아이콘 영역 */}
        <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 p-3 shadow-inner">
          <img 
            src={leftIcon} 
            alt="" 
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>

        {/* 2. 중앙 텍스트 타이틀 영역 */}
        <div className="flex-1 text-center min-w-0">
          {agencyName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              한국에너지공단
            </div>
          )}
          
          <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm truncate">
            햇빛소득마을 수익 시뮬레이터
          </h1>

          <p className="text-xs md:text-sm text-slate-300 mt-1.5 font-normal max-w-2xl mx-auto leading-relaxed opacity-90 break-keep">
            햇빛소득마을의 20년간 수익을 시뮬레이팅합니다.
          </p>
        </div>

        {/* 3. 오른쪽 아이콘 영역 */}
        <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 p-3 shadow-inner">
          <img 
            src={rightIcon} 
            alt="" 
            className="w-full h-full object-contain filter drop-shadow"
          />
        </div>

      </div>
    </header>

      {/* 대시보드 메인 레이아웃 */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <InputView data={ inputProps } />
        <ChartView data={{ chartData, initialExpense, cumulativeProfit }} />
      </main>
    </div>
  );
}

export default App;
