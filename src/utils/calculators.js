export function calculateLoanA(amount, rate, repaymentPlan) {
  const P = Number(amount);
  const r = Number(rate) / 100;
  let deptRemaining = P;
  let principalRepayment = 0;
  let interestAmount = 0;

  const data = [];

  data.push({
    year: '시작',
    interestAmountA: 0,
    principalA: 0,
  });

  for (let year = 1; year <= 20; year++) {
    if (repaymentPlan === '5년거치10년분할') {
      if (year <= 5) {
        interestAmount = P * r;
      } else if (year <= 15) {
        principalRepayment = P / 10;
        interestAmount = deptRemaining * r;
        deptRemaining -= P / 10;
      } else {
        principalRepayment = 0;
        interestAmount = 0;
      }
    } else {
      if (year <= 1) {
        interestAmount = P * r;
      } else {
        principalRepayment = P / 19;
        interestAmount = deptRemaining * r;
        deptRemaining -= P / 19;
      }
    }

    data.push({
      year: `${year}년차`,
      interestAmountA: Math.round(interestAmount),
      principalA: Math.round(principalRepayment),
    });
  }

  return data;
}

export function calculateLoanB(amount, period, rate, repaymentPlan) {
  const P = Number(amount);
  const r = Number(rate) / (12 * 100);
  const totalMonths = period * 12;
  let remaining = P;
  let yearlyInterestPayment = 0;
  let yearlyPricipalRepayment = 0;

  const data = [];

  data.push({
    year: '시작',
    interestA: 0,
    principalA: 0,
  });

  if (repaymentPlan === '원리금균등') {
    // 월 상환액 = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = Math.round(
      (P * r * Math.pow(1 + r, totalMonths)) /
        (Math.pow(1 + r, totalMonths) - 1),
    );

    for (let month = 1; month <= totalMonths; month++) {
      const interest = Math.round(remaining * r);
      let principal = monthlyPayment - interest;

      // 마지막 달 오차 보정
      if (month === totalMonths) {
        principal = remaining;
      }

      remaining -= principal;

      yearlyInterestPayment += interest;
      yearlyPricipalRepayment += principal;

      if (month % 12 == 0) {
        data.push({
          year: `${month / 12}년차`,
          interestAmountB: Math.round(yearlyInterestPayment),
          principalB: Math.round(yearlyPricipalRepayment),
        });

        yearlyInterestPayment = 0;
        yearlyPricipalRepayment = 0;
      }
    }
  }
  // 2. 원금균등상환
  else if (repaymentPlan === '원금균등') {
    const fixedPrincipal = Math.round(P / totalMonths);

    for (let month = 1; month <= totalMonths; month++) {
      const interest = Math.round(remaining * r);
      let principal = fixedPrincipal;

      // 마지막 달 오차 보정
      if (month === totalMonths) {
        principal = remaining;
      }

      remaining -= principal;

      yearlyInterestPayment += interest;
      yearlyPricipalRepayment += principal;

      if (month % 12 == 0) {
        data.push({
          year: `${month / 12}년차`,
          interestAmountB: Math.round(yearlyInterestPayment),
          principalB: Math.round(yearlyPricipalRepayment),
        });

        yearlyInterestPayment = 0;
        yearlyPricipalRepayment = 0;
      }
    }
  }
  // 3. 만기일시상환
  else if (repaymentPlan === '만기일시') {
    const monthlyInterest = Math.round(P * r);

    for (let month = 1; month <= totalMonths; month++) {
      const isLastMonth = month === totalMonths;
      const principal = isLastMonth ? P : 0;
      const interest = monthlyInterest;

      remaining = isLastMonth ? 0 : P;

      yearlyInterestPayment += interest;
      yearlyPricipalRepayment += principal;

      if (month % 12 == 0) {
        data.push({
          year: `${month / 12}년차`,
          interestAmountB: Math.round(yearlyInterestPayment),
          principalB: Math.round(yearlyPricipalRepayment),
        });
        yearlyInterestPayment = 0;
        yearlyPricipalRepayment = 0;
      }
    }
  }

  for (let year = period + 1; year <= 20; year++) {
    data.push({
      year: `${year}년차`,
      interestAmountB: 0,
      principalB: 0,
    });
  }

  return data;
}

export function calculateRevenue(
  solarCapacity,
  daylightHours,
  SMP,
  REC,
  recWeight,
) {
  const degradationRatio = [
    0.02, 0.005, 0.005, 0.005, 0.006, 0.006, 0.006, 0.006, 0.006, 0.006, 0.006,
    0.006, 0.006, 0.006, 0.006, 0.006, 0.0075, 0.0075, 0.0075, 0.0075, 0.0075,
  ];
  let yearlyRevenue =
    solarCapacity * daylightHours * 365 * (SMP + REC * recWeight);
  let currentYearlyRevenue = yearlyRevenue;

  const data = [];

  data.push({
    year: '시작',
    generationRevenue: 0,
    maintenanceCostA: 0,
    maintenanceCostB: 0,
    maintenanceCostC: 0,
    maintenanceCostD: 0,
  });

  const expenseCalculation = (capacity) => {
    return (20.49 * capacity + 710.22) * 1000;
  };

  // 전기안전관리비
  function expenseA(capacity) {
    const RANGES = [
      { min: 1501, value: 2032400 },
      { min: 1251, value: 1487600 },
      { min: 1001, value: 1236400 },
      { min: 901, value: 945200 },
      { min: 801, value: 814200 },
      { min: 701, value: 656300 },
      { min: 601, value: 542900 },
      { min: 501, value: 421900 },
      { min: 401, value: 319200 },
      { min: 301, value: 216100 },
      { min: 201, value: 141500 },
      { min: 101, value: 123700 },
      { min: 51, value: 108500 },
      { min: 0, value: 94900 },
    ];
    // 큰 값부터 비교하여 조건에 맞는 첫 번째 구간의 값을 반환
    const target = RANGES.find((range) => capacity >= range.min);
    return target ? target.value * 12 : 0; // 예외 처리(기본값)
  }
  // 보험료
  const expenseB = (capacity, tp) => {
    return parseInt(estimateCost(capacity, tp) * 0.005);
  };
  // 유지관리 비용
  const expenseC = (capacity) => {
    return capacity * 407 + 326300;
  };
  // 인버터 교체비용
  const expenseD = (capacity, tp, year) => {
    if (year % 10 === 0) {
      return parseInt(estimateCost(capacity, tp) * 0.07);
    }
    return 0;
  };

  for (let year = 1; year <= 20; year++) {
    const A = expenseA(solarCapacity);
    const B = expenseB(solarCapacity, recWeight);
    const C = expenseC(solarCapacity);
    const D = expenseD(solarCapacity, recWeight, year);

    data.push({
      year: `${year}년차`,
      generationRevenue: Math.round(currentYearlyRevenue),
      maintenanceCostA: A,
      maintenanceCostB: B,
      maintenanceCostC: C,
      maintenanceCostD: D,
      maintenanceCost: A + B + C + D,
    });
    currentYearlyRevenue =
      currentYearlyRevenue * (1 - degradationRatio[year - 1]);
  }
  return data;
}

export function estimateCost(capacity, type) {
  const x = capacity;
  const k = 0.1;
  const x_0 = 100;
  let a1, a2, b1, b2;
  let y1, y2;

  if (type == '건축물') {
    a1 = 0.847;
    b1 = 7.712;
    a2 = 1.005;
    b2 = 6.96;
  } else {
    a1 = 0.874;
    b1 = 7.773;
    a2 = 0.988;
    b2 = 7.16;
  }

  y1 = Math.exp(b1) * x ** a1 * (1 - 1 / (1 + Math.exp(-k * (x - x_0))));
  y2 = (Math.exp(b2) * x ** a2 * 1) / (1 + Math.exp(-k * (x - x_0)));

  return (y1 + y2) * 1000;
}

export function formatKoreanWon(value) {
  if (value === 0) return '0원';
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  const eok = Math.floor(absVal / 100000000);
  const man = Math.floor((absVal % 100000000) / 10000);

  let result = '';
  if (eok > 0) result += `${eok}억 `;
  if (man > 0) result += `${man.toLocaleString()}만`;
  result += ' 원';

  return isNegative ? `-${result}` : result;
}

export function mergedData(listA = [], listB = [], listC = []) {
  return listA.map((itemA) => {
    const itemB = listB.find((b) => b.year === itemA.year);
    const itemC = listC.find((c) => c.year === itemA.year);

    return {
      ...itemA,
      ...itemB,
      ...itemC,
    };
  });
}
