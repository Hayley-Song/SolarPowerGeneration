import React, { useState } from 'react';
import * as Cal from './utils/calculators.js';
import ChartView from './components/ChartView';
import InputView from './components/InputView';
import leftIcon from './assets/leftIcon.svg';
import rightIcon from './assets/rightIcon.svg';
import FeaturedCard from './components/FeaturedCard.jsx';

function App() {
  const [additionalExpense, setAdditionalExpense] = useState(0); 
  const [solarCapacity, setSolarCapacity] = useState(300); 
  const [landCost, setLandCost] = useState(0); 
  const [region, setRegion] = useState('경상북도');
  const [daylightHours, setDaylightHours] = useState(3.46); 
  const [installType, setInstallType] = useState('일반부지'); 
  const [recWeight, setRecWeight] = useState(1.2); 
  const [SMP, setSMP] = useState(120);
  const [REC, setREC] = useState(72);
  const [loanRatio, setLoanRatio] = useState(85);

  const [interestRateA, setInterestRateA] = useState(3.75);
  const [repaymentPlanA, setRepaymentPlanA] = useState('5년거치10년분할');
  const [loanB, setLoanB] = useState(0);
  const [interestRateB, setInterestRateB] = useState(0);
  const [repaymentPlanB, setRepaymentPlanB] = useState('원리금균등');
  const [loanPeriodB, setLoanPeriodB] = useState(0);

  const initialExpense = Cal.estimateCost(solarCapacity, installType) + landCost;
  let loanA = initialExpense * (loanRatio / 100);

  const [showAdditional, setShowAdditional] = useState('닫기');

  const inputProps = {
    initialExpense,
    additionalExpense,
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
    setAdditionalExpense,
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

  const inputProps_export = {
    additionalExpense,
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
    loanPeriodB
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

  const yearResult =
    data
      .find((range) => initialExpense <= range.cumProfit)
      ?.year.slice(0, -1) ?? '수익실현불가';

  const chartData = data;

  const cumulativeProfit = chartData[chartData.length - 1].cumProfit

  return (
    <div className="min-h-screen bg-mainBg text-mainText p-6 md:p-12 pb-28 lg:pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 영역 */}
        <header className="relative overflow-hidden w-full rounded-2xl bg-primary text-white p-6 md:p-8 shadow-xl border border-white/10 mb-8">
          <img
            src={leftIcon}
            alt=""
            aria-hidden="true"
            className="absolute -left-8 -top-10 w-44 h-44 md:w-56 md:h-56 object-contain pointer-events-none select-none transform -rotate-12"
          />
          <img
            src={rightIcon}
            alt=""
            aria-hidden="true"
            className="absolute -right-8 -bottom-10 w-44 h-44 md:w-56 md:h-56 object-contain pointer-events-none select-none transform rotate-12"
          />
          <div className="relative z-10 flex items-center justify-center text-center min-h-[100px]">
            <div className="flex flex-col items-center">       
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                햇빛소득마을 수익 시뮬레이터
              </h1>
              <p className="text-xs md:text-sm text-white mt-2 font-normal opacity-90 break-keep max-w-xl">
                햇빛소득마을의 20년간 수익을 시뮬레이팅합니다.
              </p>
            </div>
          </div>
        </header>

        {/* 대시보드 메인 레이아웃 */}
        <main className="grid grid-cols-1 lg:grid-cols-3 items-start gap-6">
          
          {/* A 영역 (입력 폼): 스크롤 시 정상적으로 움직임 */}
          <div className="order-1 lg:order-1 lg:col-span-1">
            <InputView data={inputProps} />
          </div>

          {/* 오른쪽 영역 (B와 C): lg:sticky lg:top-6 추가하여 PC에서 스크롤 시 화면에 고정 */}
          <div className="order-2 lg:order-2 lg:col-span-2 flex flex-col gap-6 lg:sticky lg:top-6">
            
            {/* B 영역: 모바일에서는 하단 고정, PC에서는 오른쪽 상단 */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-md border-t border-stone-200 shadow-2xl lg:static lg:p-0 lg:bg-transparent lg:backdrop-blur-none lg:border-none lg:shadow-none">
              <div className="max-w-7xl mx-auto">
                <FeaturedCard data={{ initialExpense, cumulativeProfit, yearResult }} />
              </div>
            </div>

            {/* C 영역: 차트 및 리포트 */}
            <div>
              <ChartView data={{ chartData, initialExpense, yearResult, inputProps_export }} />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;