// Pure tax calculation functions extracted from Showdown index.html
// ES module exports for testing

export function calcUK(gross) {
  gross = Math.max(0, parseFloat(gross) || 0);
  if (gross === 0) return { gross: 0, tax: 0, ni: 0, takeHome: 0 };

  let pa = 12570;
  if (gross > 125140) {
    pa = 0;
  } else if (gross > 100000) {
    pa = Math.max(0, 12570 - Math.floor((gross - 100000) / 2));
  }

  let tax = 0;
  const itBands = [
    [0, pa, 0.00],
    [pa, 50270, 0.20],
    [50270, 125140, 0.40],
    [125140, Infinity, 0.45],
  ];
  for (const [lo, hi, rate] of itBands) {
    if (gross <= lo) break;
    tax += (Math.min(gross, hi) - lo) * rate;
  }

  let ni = 0;
  const niLo = 12570, niHi = 50270;
  if (gross > niLo) {
    ni += (Math.min(gross, niHi) - niLo) * 0.08;
    if (gross > niHi) ni += (gross - niHi) * 0.02;
  }

  const taxR = Math.round(tax);
  const niR = Math.round(ni);
  return { gross, tax: taxR, ni: niR, takeHome: gross - taxR - niR };
}

export const US_FEDERAL = {
  single: {
    deduction: 14600,
    brackets: [
      [0, 11600, 0.10],
      [11600, 47150, 0.12],
      [47150, 100525, 0.22],
      [100525, 191950, 0.24],
      [191950, 243725, 0.32],
      [243725, 609350, 0.35],
      [609350, Infinity, 0.37],
    ]
  },
  mfj: {
    deduction: 29200,
    brackets: [
      [0, 23200, 0.10],
      [23200, 94300, 0.12],
      [94300, 201050, 0.22],
      [201050, 383900, 0.24],
      [383900, 487450, 0.32],
      [487450, 731200, 0.35],
      [731200, Infinity, 0.37],
    ]
  }
};

export const US_STATE_TAX = {
  none: { name: 'No state tax', brackets: [] },
  CA: { name: 'California', brackets: [
    [0, 10412, 0.01], [10412, 24684, 0.02], [24684, 38959, 0.04],
    [38959, 54081, 0.06], [54081, 68350, 0.08], [68350, 349137, 0.093],
    [349137, 418961, 0.103], [418961, 698271, 0.113],
    [698271, 1000000, 0.123], [1000000, Infinity, 0.133]
  ]},
  NY: { name: 'New York', brackets: [
    [0, 8500, 0.04], [8500, 11700, 0.045], [11700, 13900, 0.0525],
    [13900, 80650, 0.055], [80650, 215400, 0.06], [215400, 1077550, 0.0685],
    [1077550, 5000000, 0.0965], [5000000, 25000000, 0.103], [25000000, Infinity, 0.109]
  ]},
  NJ: { name: 'New Jersey', brackets: [
    [0, 20000, 0.014], [20000, 35000, 0.0175], [35000, 40000, 0.035],
    [40000, 75000, 0.05525], [75000, 500000, 0.0637],
    [500000, 1000000, 0.0897], [1000000, Infinity, 0.1075]
  ]},
  MA: { name: 'Massachusetts', brackets: [
    [0, 1000000, 0.05], [1000000, Infinity, 0.09]
  ]},
  IL: { name: 'Illinois', flat: 0.0495 },
  PA: { name: 'Pennsylvania', flat: 0.0307 },
  CO: { name: 'Colorado', flat: 0.044 },
  GA: { name: 'Georgia', flat: 0.0549 },
  NC: { name: 'North Carolina', flat: 0.045 },
  OH: { name: 'Ohio', brackets: [
    [0, 26050, 0.00], [26050, 46100, 0.0275],
    [46100, 92150, 0.03688], [92150, 115300, 0.0375], [115300, Infinity, 0.0399]
  ]},
};

export function calcBrackets(taxable, brackets) {
  let tax = 0;
  for (const [lo, hi, rate] of brackets) {
    if (taxable <= lo) break;
    tax += (Math.min(taxable, hi) - lo) * rate;
  }
  return tax;
}

export function calcUS(gross, filingStatus, stateCode) {
  gross = Math.max(0, parseFloat(gross) || 0);
  if (gross === 0) return { gross: 0, federal: 0, state: 0, fica: 0, takeHome: 0 };

  const fed = US_FEDERAL[filingStatus] || US_FEDERAL.single;
  const taxableIncome = Math.max(0, gross - fed.deduction);
  const federal = Math.round(calcBrackets(taxableIncome, fed.brackets));

  const ss = Math.min(gross, 168600) * 0.062;
  const medicare = gross * 0.0145 + Math.max(0, gross - 200000) * 0.009;
  const fica = Math.round(ss + medicare);

  const stDef = US_STATE_TAX[stateCode] || US_STATE_TAX.none;
  let stateTax = 0;
  if (stDef.flat) {
    stateTax = gross * stDef.flat;
  } else if (stDef.brackets && stDef.brackets.length > 0) {
    stateTax = calcBrackets(gross, stDef.brackets);
  }
  stateTax = Math.round(stateTax);

  return { gross, federal, state: stateTax, fica, takeHome: gross - federal - stateTax - fica };
}

export const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
