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
    maintenanceCost: 0,
  });

  const expenseCalculation = (capacity) => {
    return (20.49 * capacity + 710.22) * 1000;
  };

  for (let year = 1; year <= 20; year++) {
    data.push({
      year: `${year}년차`,
      generationRevenue: Math.round(currentYearlyRevenue),
      maintenanceCost: Math.round(expenseCalculation(solarCapacity)),
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

  if (type == 1.5) {
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
