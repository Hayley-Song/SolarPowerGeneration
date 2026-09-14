import React, { useState } from 'react';
import * as Cal from './utils/calculators.js';
import ChartView from './components/ChartView';
import InputView from './components/InputView';
import leftIcon from './assets/leftIcon.svg';
import rightIcon from './assets/rightIcon.svg';

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
      <header className="relative overflow-hidden w-full rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-slate-800 mb-8">
      
      {/* 💡 [우측 모서리 걸침 아이콘] - absolute 배치로 모서리에 일부 잘려나가도록 위치 조정 */}
      <img
        src={rightIcon}
        alt=""
        aria-hidden="true"
        className="absolute -right-8 -bottom-10 w-44 h-44 md:w-56 md:h-56 object-contain opacity-20 pointer-events-none select-none transform rotate-12"
      />
      <div className="relative z-10 flex items-center justify-between gap-6">
        {/* 왼쪽 내용 영역 */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* 왼쪽 정돈된 로고 */}
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 p-2.5">
            <img
              src={leftIcon}
              alt=""
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          {/* 중앙 텍스트 */}
          <div className="flex flex-col">            
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">
              햇빛소득마을 수익 시뮬레이터
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 font-normal opacity-90 break-keep">
              햇빛소득마을의 20년간 수익을 시뮬레이팅합니다.
            </p>
          </div>
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
