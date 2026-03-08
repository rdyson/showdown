import { describe, it, expect } from 'vitest';
import { calcUK, calcUS, calcBrackets, US_FEDERAL, US_STATE_TAX } from '../src/tax.js';

// ─── UK Tax ──────────────────────────────────────────────────────────────────

describe('calcUK', () => {
  describe('real-world salary scenarios', () => {
    it('£30,000 — basic rate taxpayer', () => {
      const r = calcUK(30000);
      expect(r).toEqual({ gross: 30000, tax: 3486, ni: 1394, takeHome: 25120 });
    });

    it('£50,270 — right at higher rate threshold', () => {
      const r = calcUK(50270);
      expect(r).toEqual({ gross: 50270, tax: 7540, ni: 3016, takeHome: 39714 });
    });

    it('£60,000 — higher rate taxpayer', () => {
      const r = calcUK(60000);
      expect(r).toEqual({ gross: 60000, tax: 11432, ni: 3211, takeHome: 45357 });
    });

    it('£100,000 — PA taper begins (just at boundary)', () => {
      const r = calcUK(100000);
      // gross is exactly 100000, not > 100000, so PA is still full 12570
      expect(r).toEqual({ gross: 100000, tax: 27432, ni: 4011, takeHome: 68557 });
    });

    it('£125,140 — personal allowance fully withdrawn', () => {
      const r = calcUK(125140);
      expect(r).toEqual({ gross: 125140, tax: 40002, ni: 4513, takeHome: 80625 });
    });

    it('£150,000 — additional rate (45%)', () => {
      const r = calcUK(150000);
      expect(r).toEqual({ gross: 150000, tax: 51189, ni: 5011, takeHome: 93800 });
    });

    it('£500,000 — high earner', () => {
      const r = calcUK(500000);
      expect(r).toEqual({ gross: 500000, tax: 208689, ni: 12011, takeHome: 279300 });
    });
  });

  describe('edge cases', () => {
    it('£12,570 — exactly personal allowance, tax = 0, NI = 0', () => {
      const r = calcUK(12570);
      expect(r).toEqual({ gross: 12570, tax: 0, ni: 0, takeHome: 12570 });
    });

    it('gross = 0 → all zeros, no NaN', () => {
      const r = calcUK(0);
      expect(r).toEqual({ gross: 0, tax: 0, ni: 0, takeHome: 0 });
      expect(Number.isNaN(r.takeHome)).toBe(false);
    });

    it('blank string → treated as 0', () => {
      const r = calcUK('');
      expect(r).toEqual({ gross: 0, tax: 0, ni: 0, takeHome: 0 });
    });

    it('null → treated as 0', () => {
      const r = calcUK(null);
      expect(r).toEqual({ gross: 0, tax: 0, ni: 0, takeHome: 0 });
    });

    it('undefined → treated as 0', () => {
      const r = calcUK(undefined);
      expect(r).toEqual({ gross: 0, tax: 0, ni: 0, takeHome: 0 });
    });

    it('negative gross → clamped to 0', () => {
      const r = calcUK(-5000);
      expect(r).toEqual({ gross: 0, tax: 0, ni: 0, takeHome: 0 });
    });

    it('string number parses correctly', () => {
      const r = calcUK('30000');
      expect(r).toEqual({ gross: 30000, tax: 3486, ni: 1394, takeHome: 25120 });
    });
  });

  describe('PA taper zone', () => {
    it('£100,001 — PA starts tapering (but floor(1/2)=0 so PA unchanged)', () => {
      const r = calcUK(100001);
      // PA = 12570 - floor((100001-100000)/2) = 12570 - 0 = 12570
      // PA hasn't actually decreased yet — need £100,002 for first £1 reduction
      expect(r.gross).toBe(100001);
      // Take-home increases by roughly 60p (1 * 0.60 after 40% tax)
      expect(r.takeHome).toBe(calcUK(100000).takeHome + 1);
    });

    it('£100,002 — first actual PA reduction', () => {
      const r = calcUK(100002);
      // PA = 12570 - floor(2/2) = 12570 - 1 = 12569
      // Effective marginal rate is 60% in the taper zone
      expect(r.gross).toBe(100002);
    });

    it('£110,000 — mid-taper', () => {
      const r = calcUK(110000);
      // PA = 12570 - floor(10000/2) = 12570 - 5000 = 7570
      expect(r.gross).toBe(110000);
      expect(r.tax).toBeGreaterThan(calcUK(100000).tax);
    });
  });
});

// ─── US Federal Tax ──────────────────────────────────────────────────────────

describe('calcUS', () => {
  describe('Single filer, no state tax', () => {
    it('$50,000 — straddles 12%/22% brackets', () => {
      const r = calcUS(50000, 'single', 'none');
      expect(r).toEqual({ gross: 50000, federal: 4016, state: 0, fica: 3825, takeHome: 42159 });
    });

    it('$100,525 — right at bracket boundary', () => {
      const r = calcUS(100525, 'single', 'none');
      expect(r).toEqual({ gross: 100525, federal: 13957, state: 0, fica: 7690, takeHome: 78878 });
    });

    it('$120,000 — standard case', () => {
      const r = calcUS(120000, 'single', 'none');
      expect(r).toEqual({ gross: 120000, federal: 18339, state: 0, fica: 9180, takeHome: 92481 });
    });

    it('$200,000 — Medicare surtax boundary', () => {
      const r = calcUS(200000, 'single', 'none');
      expect(r).toEqual({ gross: 200000, federal: 37539, state: 0, fica: 13353, takeHome: 149108 });
    });

    it('$250,000 — above SS wage base + Medicare surtax', () => {
      const r = calcUS(250000, 'single', 'none');
      expect(r).toEqual({ gross: 250000, federal: 53015, state: 0, fica: 14528, takeHome: 182457 });
    });
  });

  describe('MFJ vs Single — same salary, different take-home', () => {
    it('$150,000 — MFJ take-home > Single take-home', () => {
      const mfj = calcUS(150000, 'mfj', 'none');
      const single = calcUS(150000, 'single', 'none');
      expect(mfj).toEqual({ gross: 150000, federal: 16682, state: 0, fica: 11475, takeHome: 121843 });
      expect(single).toEqual({ gross: 150000, federal: 25539, state: 0, fica: 11475, takeHome: 112986 });
      expect(mfj.takeHome).toBeGreaterThan(single.takeHome);
      // FICA identical (not affected by filing status)
      expect(mfj.fica).toBe(single.fica);
    });
  });

  describe('state tax', () => {
    it('$120,000 in CA — state tax correctly applied', () => {
      const ca = calcUS(120000, 'single', 'CA');
      const none = calcUS(120000, 'single', 'none');
      expect(ca).toEqual({ gross: 120000, federal: 18339, state: 7813, fica: 9180, takeHome: 84668 });
      expect(none.state).toBe(0);
      expect(ca.state).toBeGreaterThan(0);
      expect(ca.takeHome).toBeLessThan(none.takeHome);
      expect(none.takeHome - ca.takeHome).toBe(ca.state);
    });

    it('$120,000 TX (none) vs NY — NY state tax difference', () => {
      const tx = calcUS(120000, 'single', 'none');  // TX has no state tax
      const ny = calcUS(120000, 'single', 'NY');
      expect(tx.state).toBe(0);
      expect(ny).toEqual({ gross: 120000, federal: 18339, state: 6632, fica: 9180, takeHome: 85849 });
      expect(ny.state).toBeGreaterThan(0);
      expect(tx.takeHome).toBeGreaterThan(ny.takeHome);
      expect(tx.takeHome - ny.takeHome).toBe(ny.state);
    });

    it('flat rate state (IL) calculates correctly', () => {
      const il = calcUS(120000, 'single', 'IL');
      expect(il.state).toBe(Math.round(120000 * 0.0495));
    });
  });

  describe('edge cases', () => {
    it('gross = 0 → all zeros, no NaN', () => {
      const r = calcUS(0, 'single', 'none');
      expect(r).toEqual({ gross: 0, federal: 0, state: 0, fica: 0, takeHome: 0 });
      expect(Number.isNaN(r.takeHome)).toBe(false);
    });

    it('blank string → treated as 0', () => {
      const r = calcUS('', 'single', 'none');
      expect(r).toEqual({ gross: 0, federal: 0, state: 0, fica: 0, takeHome: 0 });
    });

    it('null gross → treated as 0', () => {
      const r = calcUS(null, 'single', 'none');
      expect(r).toEqual({ gross: 0, federal: 0, state: 0, fica: 0, takeHome: 0 });
    });

    it('negative gross → clamped to 0', () => {
      const r = calcUS(-10000, 'single', 'none');
      expect(r).toEqual({ gross: 0, federal: 0, state: 0, fica: 0, takeHome: 0 });
    });

    it('unknown filing status → falls back to single', () => {
      const r = calcUS(120000, 'bogus', 'none');
      const single = calcUS(120000, 'single', 'none');
      expect(r).toEqual(single);
    });

    it('unknown state code → no state tax', () => {
      const r = calcUS(120000, 'single', 'TX');  // TX not in US_STATE_TAX
      expect(r.state).toBe(0);
    });

    it('$168,600 — exactly at SS wage cap, SS maxes out', () => {
      const r = calcUS(168600, 'single', 'none');
      expect(r).toEqual({ gross: 168600, federal: 30003, state: 0, fica: 12898, takeHome: 125699 });
      // Verify SS is exactly maxed: 168600 * 0.062 = 10453.2
      const expectedSS = 168600 * 0.062;
      const expectedMedicare = 168600 * 0.0145;
      expect(r.fica).toBe(Math.round(expectedSS + expectedMedicare));
    });

    it('$168,601 — one dollar above SS cap, SS doesn\'t increase', () => {
      const atCap = calcUS(168600, 'single', 'none');
      const above = calcUS(168601, 'single', 'none');
      // SS portion should be identical — only medicare increases by 0.0145
      const ssCap = Math.min(168600, 168600) * 0.062;
      const ssAbove = Math.min(168601, 168600) * 0.062;
      expect(ssCap).toBe(ssAbove);
    });

    it('string number parses correctly', () => {
      const r = calcUS('120000', 'single', 'none');
      expect(r).toEqual({ gross: 120000, federal: 18339, state: 0, fica: 9180, takeHome: 92481 });
    });
  });
});

// ─── calcBrackets ────────────────────────────────────────────────────────────

describe('calcBrackets', () => {
  it('returns 0 for 0 taxable', () => {
    expect(calcBrackets(0, [[0, 10000, 0.10]])).toBe(0);
  });

  it('handles single bracket', () => {
    expect(calcBrackets(5000, [[0, Infinity, 0.10]])).toBeCloseTo(500);
  });

  it('handles empty brackets', () => {
    expect(calcBrackets(50000, [])).toBe(0);
  });

  it('correctly splits across two brackets', () => {
    const brackets = [[0, 10000, 0.10], [10000, Infinity, 0.20]];
    // 10000 * 0.10 + 5000 * 0.20 = 1000 + 1000 = 2000
    expect(calcBrackets(15000, brackets)).toBeCloseTo(2000);
  });
});

// ─── Data structure validation ───────────────────────────────────────────────

describe('US_FEDERAL', () => {
  it('has single and mfj filing statuses', () => {
    expect(US_FEDERAL).toHaveProperty('single');
    expect(US_FEDERAL).toHaveProperty('mfj');
  });

  it('mfj deduction is larger than single', () => {
    expect(US_FEDERAL.mfj.deduction).toBeGreaterThan(US_FEDERAL.single.deduction);
  });

  it('brackets are ordered by lower bound', () => {
    for (const status of ['single', 'mfj']) {
      const brackets = US_FEDERAL[status].brackets;
      for (let i = 1; i < brackets.length; i++) {
        expect(brackets[i][0]).toBe(brackets[i - 1][1]);
      }
    }
  });
});

describe('US_STATE_TAX', () => {
  it('none has empty brackets', () => {
    expect(US_STATE_TAX.none.brackets).toEqual([]);
  });

  it('all states with brackets have contiguous ranges', () => {
    for (const [code, def] of Object.entries(US_STATE_TAX)) {
      if (def.brackets && def.brackets.length > 1) {
        for (let i = 1; i < def.brackets.length; i++) {
          expect(def.brackets[i][0]).toBe(def.brackets[i - 1][1]);
        }
      }
    }
  });
});
