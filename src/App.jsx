import React, { useState } from 'react';
import * as Cal from './utils/calculators.js';
import ChartView from './components/ChartView';
import InputView from './components/InputView';

function App() {
  // 1. 입력 변수 상태(State) 선언
  const [solarCapacity, setSolarCapacity] = useState(300); // 태양광 발전 설비 용량 (기본 300kW)
  const [landCost, setLandCost] = useState(0); // 부지매입비 (기본 0원)
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

  const initialExpense = Cal.estimateCost(solarCapacity, recWeight) + landCost;
  let loanA = initialExpense * (loanRatio / 100);

  // const [viewMode, setViewMode] = useState('chart');
  const [showAdditional, setShowAdditional] = useState('닫기');

  const inputProps = {
    initialExpense,
    solarCapacity,
    landCost,
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
      {/* 타이틀 및 헤더 */}
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-primary mb-2">
          햇빛소득마을 수익 시뮬레이터
        </h1>
        <p className="mainText text-sm md:text-base">
          햇빛소득마을의 20년간 수익을 시뮬레이팅합니다.
        </p>
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
