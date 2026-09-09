import React, { useState } from 'react';
import * as Cal from './utils/calculators.js';

export default function InputView({ data }) {
  const {
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
  } = data;

  return (
    {/* 대시보드 메인 레이아웃 */}
    <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 왼쪽: 슬라이더 컨트롤러 */}
      <section className="bg-cardBg p-6 rounded-2xl border shadow-2xl flex flex-col gap-6">
        <h2 className="text-lg font-bold mainText border-b pb-3 mb-2">
          변수 설정
        </h2>

        {/* SMP, REC */}
        {/* 💡 입력창 2개를 나란히 세우는 컨테이너 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 첫 번째 입력창: SMP */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-stone-600">
              SMP(원/kWh)
            </label>
            <div className="relative">
              <input
                type="number"
                value={SMP}
                onChange={(e) => setSMP(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                placeholder="120"
              />
            </div>
          </div>

          {/* 두 번째 입력창: REC */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-semibold text-stone-600">
              REC(원/kWh)
            </label>
            <div className="relative">
              <input
                type="number"
                value={REC}
                onChange={(e) => setREC(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                placeholder="72"
              />
            </div>
          </div>
        </div>

        {/* 태양광 발전 설비 용량 */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-mainText">설비 용량</span>
            <span className="font-bold mainText">
              {solarCapacity.toLocaleString()}kW
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="10"
            value={solarCapacity}
            onChange={(e) => setSolarCapacity(Number(e.target.value))}
            className="w-full h-2 bg-subcolor rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* 부지매입비 */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-mainText">부지매입비</span>
            <span className="font-bold mainText">
              {(landCost / 10000).toLocaleString()}만 원
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100000000"
            step="5000000"
            value={landCost}
            onChange={(e) => setLandCost(Number(e.target.value))}
            className="w-full h-2 bg-subcolor rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-mainText font-medium">지역</label>
            <select
              value={daylightHours}
              onChange={(e) => setDaylightHours(Number(e.target.value))}
              className="w-full bg-mainBg border rounded-xl px-4 py-2.5 text-mainText focus:outline-none focus:border-mainText cursor-pointer font-medium transition-all"
            >
              <option value="3.54">서울경기</option>
              <option value="3.57">충청북도</option>
              <option value="3.69">충청남도</option>
              <option value="3.54">강원도</option>
              <option value="3.69">전라북도</option>
              <option value="3.79">전라남도</option>
              <option value="3.65">경상북도</option>
              <option value="3.75">경상남도</option>
              <option value="3.54">제주도</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-mainText font-medium">
              일조량
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="2.0"
                max="5.0"
                value={daylightHours}
                onChange={(e) => setDaylightHours(Number(e.target.value))}
                title="일조량 반영을 위해 사용되는 옵션입니다."
                className="w-full bg-mainBg border rounded-xl px-4 py-2.5 text-mainText focus:outline-none focus:border-mainText cursor-pointer font-medium transition-all"
                placeholder={daylightHours}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-mainText font-medium">분류</label>
            <select
              value={installType}
              onChange={(e) => {
                setInstallType(e.target.value);
                setRecWeight(e.target.value === '건축물' ? 1.5 : 1.2);
              }}
              title="REC 가중치 반영을 위해 사용되는 옵션입니다."
              className="w-full bg-mainBg border rounded-xl px-4 py-2.5 text-mainText focus:outline-none focus:border-mainText cursor-pointer font-medium transition-all"
            >
              <option value="일반부지">일반부지</option>
              <option value="건축물">건축물</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-mainText font-medium">
              REC 가중치
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="2"
                value={recWeight}
                onChange={(e) => setRecWeight(Number(e.target.value))}
                className="w-full bg-mainBg border rounded-xl px-4 py-2.5 text-mainText focus:outline-none focus:border-mainText cursor-pointer font-medium transition-all"
                placeholder={installType === '건축물' ? 1.5 : 1.2}
              />
            </div>
          </div>
        </div>

        {/* 상환 방식 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm text-mainText font-medium">
            상환 방식
          </label>
          <select
            value={repaymentPlanA}
            onChange={(e) => setRepaymentPlanA(e.target.value)}
            className="w-full bg-mainBg border rounded-xl px-4 py-2.5 text-mainText focus:outline-none focus:border-mainText cursor-pointer font-medium transition-all"
          >
            <option value="5년거치10년분할">5년 거치 10년 분할상환</option>
            <option value="1년거치19년분할">1년 거치 19년 분할상환</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-mainText">햇빛소득 대출 비중</span>
            <span className="font-bold mainText">{loanRatio}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="85"
            step="5"
            value={loanRatio}
            onChange={(e) => setLoanRatio(Number(e.target.value))}
            className="w-full h-2 bg-subcolor rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-mainText">자기 자본</span>
            <span className="text-mainText font-bold">
              {Cal.formatKoreanWon(
                (initialExpense * (100 - loanRatio)) / 100 - loanB,
              )}
            </span>
          </div>
        </div>

        {/* ⚙️ 상세설정 토글 버튼 */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdditional(!showAdditional)} // 클릭할 때마다 true <-> false 반전
            className="w-full py-2 px-4 bg-mainBg hover:bg-stone-200 text-mainText font-medium text-xs rounded-xl flex items-center justify-between transition-colors"
          >
            <span className="flex items-center gap-1.5">대출 추가 입력</span>
            <span>{showAdditional ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* 🔓 showAdditional 상태가 true일 때만 열리는 상세설정 영역 */}
        {showAdditional && (
          <div className="p-4 bg-cardBg border border-outline-none rounded-xl space-y-4 animate-fadeIn">
            <h4 className="text-xs font-bold text-mainText border-b border-outline-none pb-2">
              상환 정보 추가 입력
            </h4>

            {/* 대출금액 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-mainText">
                <span>대출금액</span>
                <span className="font-semibold text-mainText">
                  {Cal.formatKoreanWon(loanB)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={(initialExpense * (100 - loanRatio)) / 100}
                step="5000000"
                value={loanB}
                onChange={(e) => setLoanB(Number(e.target.value))}
                className="w-full h-2 bg-subcolor rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* 대출기간 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-mainText">
                <span>대출기간(년)</span>
                <span className="font-semibold text-mainText">
                  {loanPeriodB}년
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={loanPeriodB}
                onChange={(e) => setLoanPeriodB(Number(e.target.value))}
                className="w-full h-2 bg-subcolor rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* 대출금리 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-mainText">
                <span>대출금리[%]</span>
                <span className="font-semibold text-mainText">
                  {interestRateB}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={interestRateB}
                onChange={(e) => setInterestRateB(Number(e.target.value))}
                className="w-full h-2 bg-subcolor rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex bg-stone-100 p-1 rounded-lg">
              <button
                onClick={() => setRepaymentPlanB('원리금균등')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  repaymentPlanB === '원리금균등'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                원리금균등
              </button>
              <button
                onClick={() => setRepaymentPlanB('원금균등')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  repaymentPlanB === '원금균등'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                원금균등
              </button>
              <button
                onClick={() => setRepaymentPlanB('만기일시')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  repaymentPlanB === '만기일시'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                만기일시
              </button>
            </div>
          </div>
        )}
      </section>

      <ChartView data={{ chartData, initialExpense, cumulativeProfit }} />
    </main>
}
