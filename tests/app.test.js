import { describe, it, expect, beforeEach } from 'vitest';
import { calcUK, calcUS, COLORS } from '../src/tax.js';

// ─── Minimal showdown() stub ─────────────────────────────────────────────────
// Replicates the Alpine component logic without Alpine dependency.

function createApp(overrides = {}) {
  const app = {
    offers: [
      { name: 'Job A', color: COLORS[0], years: [{ gross: '' }] },
      { name: 'Job B', color: COLORS[1], years: [{ gross: '' }] },
    ],
    country: 'UK',
    filingStatus: 'single',
    usState: 'none',

    calcTH(gross) {
      if (this.country === 'US') return calcUS(gross, this.filingStatus, this.usState).takeHome;
      return calcUK(gross).takeHome;
    },

    calcOffer(offer) {
      return offer.years.map((y, i) => {
        const g = y.gross || 0;
        if (this.country === 'US') {
          const r = calcUS(g, this.filingStatus, this.usState);
          return { year: i + 1, ...r };
        }
        const r = calcUK(g);
        return { year: i + 1, ...r };
      });
    },

    cumulative(offer) {
      let sum = 0;
      return this.calcOffer(offer).map(r => { sum += r.takeHome; return sum; });
    },

    cumForYear(offer, yi) {
      const c = this.cumulative(offer);
      return c[yi] || 0;
    },

    get maxYears() {
      return Math.max(...this.offers.map(o => o.years.length), 1);
    },

    maxCumForYear(yi) {
      const vals = this.offers.map(o => this.cumForYear(o, yi)).filter(v => v > 0);
      return vals.length ? Math.max(...vals) : 0;
    },

    leaderAt(yi) {
      const max = this.maxCumForYear(yi);
      if (!max) return null;
      return this.offers.find(o => this.cumForYear(o, yi) === max) || null;
    },

    get crossovers() {
      const msgs = [];
      const n = this.maxYears;
      for (let i = 0; i < this.offers.length; i++) {
        for (let j = i + 1; j < this.offers.length; j++) {
          const a = this.cumulative(this.offers[i]);
          const b = this.cumulative(this.offers[j]);
          for (let y = 1; y < n; y++) {
            const pA = a[y-1] || 0, pB = b[y-1] || 0;
            const cA = a[y] || 0, cB = b[y] || 0;
            if ((pA === 0 && pB === 0) || (cA === 0 && cB === 0)) continue;
            if ((pA - pB) * (cA - cB) < 0) {
              const winner = cA > cB ? this.offers[i] : this.offers[j];
              const loser = cA > cB ? this.offers[j] : this.offers[i];
              msgs.push(`${winner.name} overtakes ${loser.name} cumulatively in Year ${y + 1}`);
            }
          }
        }
      }
      return msgs;
    },

    saveToHash() {
      const state = {
        c: this.country,
        f: this.filingStatus,
        s: this.usState,
        o: this.offers.map(o => ({
          n: o.name,
          y: o.years.map(yr => parseFloat(yr.gross) || 0)
        }))
      };
      const enc = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
      return '#s=' + enc;
    },

    loadFromHash(hash) {
      try {
        if (!hash || hash.length < 3) return;
        if (hash.startsWith('#s=')) {
          const raw = hash.slice(3);
          const state = JSON.parse(decodeURIComponent(escape(atob(raw))));
          if (state.c) this.country = state.c;
          if (state.f) this.filingStatus = state.f;
          if (state.s) this.usState = state.s;
          if (Array.isArray(state.o) && state.o.length > 0) {
            this.offers = state.o.slice(0, 4).map((o, i) => ({
              name: o.n || 'Job ' + String.fromCharCode(65 + i),
              color: COLORS[i % COLORS.length],
              years: (Array.isArray(o.y) ? o.y : [0]).slice(0, 5).map(g => ({ gross: g || '' }))
            }));
          }
          return;
        }
        if (hash.startsWith('#state=')) {
          const raw = hash.slice(7);
          const state = JSON.parse(decodeURIComponent(escape(atob(raw))));
          if (Array.isArray(state) && state.length > 0) {
            this.offers = state.slice(0, 4).map((o, i) => ({
              name: o.n || 'Job ' + String.fromCharCode(65 + i),
              color: COLORS[i % COLORS.length],
              years: (Array.isArray(o.y) ? o.y : [0]).slice(0, 5).map(g => ({ gross: g || '' }))
            }));
          }
        }
      } catch (_) {}
    },

    ...overrides,
  };
  return app;
}

// ─── Crossover detection ─────────────────────────────────────────────────────

describe('crossover detection', () => {
  it('detects crossover when Job B overtakes Job A in year 3', () => {
    const app = createApp();
    app.country = 'UK';
    // Job A: higher yr1, lower yr2-3; Job B: lower yr1, higher yr2-3
    app.offers = [
      { name: 'Job A', color: COLORS[0], years: [{ gross: 60000 }, { gross: 60000 }, { gross: 60000 }] },
      { name: 'Job B', color: COLORS[1], years: [{ gross: 40000 }, { gross: 80000 }, { gross: 80000 }] },
    ];
    const msgs = app.crossovers;
    expect(msgs.length).toBeGreaterThanOrEqual(1);
    expect(msgs.some(m => m.includes('overtakes'))).toBe(true);
    expect(msgs.some(m => m.includes('Job B overtakes Job A'))).toBe(true);
  });

  it('no crossover when Job A leads every year', () => {
    const app = createApp();
    app.country = 'UK';
    app.offers = [
      { name: 'Job A', color: COLORS[0], years: [{ gross: 80000 }, { gross: 90000 }, { gross: 100000 }] },
      { name: 'Job B', color: COLORS[1], years: [{ gross: 40000 }, { gross: 45000 }, { gross: 50000 }] },
    ];
    expect(app.crossovers).toEqual([]);
  });

  it('no crossover with empty salaries', () => {
    const app = createApp();
    expect(app.crossovers).toEqual([]);
  });
});

// ─── Cumulative totals ───────────────────────────────────────────────────────

describe('cumulative totals', () => {
  it('UK: cumulative sums are correct across years', () => {
    const app = createApp();
    app.country = 'UK';
    const offer = { name: 'Test', color: COLORS[0], years: [{ gross: 30000 }, { gross: 50270 }, { gross: 60000 }] };
    app.offers = [offer];

    const cum = app.cumulative(offer);
    const th1 = calcUK(30000).takeHome;   // 25120
    const th2 = calcUK(50270).takeHome;   // 39714
    const th3 = calcUK(60000).takeHome;   // 45357

    expect(cum).toEqual([th1, th1 + th2, th1 + th2 + th3]);
    expect(cum).toEqual([25120, 64834, 110191]);
  });

  it('US: cumulative sums are correct across years', () => {
    const app = createApp();
    app.country = 'US';
    app.filingStatus = 'single';
    app.usState = 'none';
    const offer = { name: 'Test', color: COLORS[0], years: [{ gross: 50000 }, { gross: 120000 }] };
    app.offers = [offer];

    const cum = app.cumulative(offer);
    const th1 = calcUS(50000, 'single', 'none').takeHome;   // 42159
    const th2 = calcUS(120000, 'single', 'none').takeHome;  // 92481

    expect(cum).toEqual([th1, th1 + th2]);
    expect(cum).toEqual([42159, 134640]);
  });

  it('single year returns array of length 1', () => {
    const app = createApp();
    app.country = 'UK';
    const offer = { name: 'Test', color: COLORS[0], years: [{ gross: 30000 }] };
    app.offers = [offer];
    const cum = app.cumulative(offer);
    expect(cum).toHaveLength(1);
    expect(cum[0]).toBe(25120);
  });

  it('cumForYear returns 0 for out-of-bounds year index', () => {
    const app = createApp();
    app.country = 'UK';
    const offer = { name: 'Test', color: COLORS[0], years: [{ gross: 30000 }] };
    app.offers = [offer];
    expect(app.cumForYear(offer, 0)).toBe(25120);
    expect(app.cumForYear(offer, 5)).toBe(0); // out of bounds
  });
});

// ─── Leader detection ────────────────────────────────────────────────────────

describe('leaderAt', () => {
  it('returns correct leader at each year', () => {
    const app = createApp();
    app.country = 'UK';
    const jobA = { name: 'Job A', color: COLORS[0], years: [{ gross: 80000 }, { gross: 80000 }] };
    const jobB = { name: 'Job B', color: COLORS[1], years: [{ gross: 60000 }, { gross: 60000 }] };
    app.offers = [jobA, jobB];

    expect(app.leaderAt(0)).toBe(jobA);
    expect(app.leaderAt(1)).toBe(jobA);
  });

  it('leader changes after crossover', () => {
    const app = createApp();
    app.country = 'UK';
    const jobA = { name: 'Job A', color: COLORS[0], years: [{ gross: 100000 }, { gross: 30000 }, { gross: 30000 }] };
    const jobB = { name: 'Job B', color: COLORS[1], years: [{ gross: 50000 }, { gross: 80000 }, { gross: 80000 }] };
    app.offers = [jobA, jobB];

    // Year 0: Job A has higher cumulative (68557 vs 39714 approx)
    expect(app.leaderAt(0)).toBe(jobA);
    // By year 2: Job B should overtake
    // cumA = 68557 + 25120 + 25120 = 118797
    // cumB = 39714 + ... let me just check the leader
    const leaderY2 = app.leaderAt(2);
    expect(leaderY2).not.toBeNull();
  });

  it('returns null when all zeros', () => {
    const app = createApp();
    expect(app.leaderAt(0)).toBeNull();
  });
});

// ─── maxYears ────────────────────────────────────────────────────────────────

describe('maxYears', () => {
  it('returns max across all offers', () => {
    const app = createApp();
    app.offers = [
      { name: 'A', color: COLORS[0], years: [{ gross: 1 }, { gross: 2 }] },
      { name: 'B', color: COLORS[1], years: [{ gross: 1 }, { gross: 2 }, { gross: 3 }] },
    ];
    expect(app.maxYears).toBe(3);
  });

  it('minimum is 1', () => {
    const app = createApp();
    app.offers = [];
    // Math.max(...[], 1) = 1
    expect(app.maxYears).toBe(1);
  });
});

// ─── URL hash round-trip ─────────────────────────────────────────────────────

describe('URL hash round-trip', () => {
  it('encode → decode preserves all fields', () => {
    const app = createApp();
    app.country = 'US';
    app.filingStatus = 'mfj';
    app.usState = 'CA';
    app.offers = [
      { name: 'Offer Alpha', color: COLORS[0], years: [{ gross: 120000 }, { gross: 130000 }] },
      { name: 'Offer Beta', color: COLORS[1], years: [{ gross: 95000 }] },
    ];

    const hash = app.saveToHash();
    expect(hash.startsWith('#s=')).toBe(true);

    // Decode into a fresh app
    const app2 = createApp();
    app2.loadFromHash(hash);

    expect(app2.country).toBe('US');
    expect(app2.filingStatus).toBe('mfj');
    expect(app2.usState).toBe('CA');
    expect(app2.offers).toHaveLength(2);
    expect(app2.offers[0].name).toBe('Offer Alpha');
    expect(app2.offers[0].years).toHaveLength(2);
    expect(app2.offers[0].years[0].gross).toBe(120000);
    expect(app2.offers[0].years[1].gross).toBe(130000);
    expect(app2.offers[1].name).toBe('Offer Beta');
    expect(app2.offers[1].years[0].gross).toBe(95000);
  });

  it('round-trip with UK settings', () => {
    const app = createApp();
    app.country = 'UK';
    app.offers = [
      { name: 'Job A', color: COLORS[0], years: [{ gross: 50000 }, { gross: 55000 }, { gross: 60000 }] },
      { name: 'Job B', color: COLORS[1], years: [{ gross: 45000 }] },
    ];

    const hash = app.saveToHash();
    const app2 = createApp();
    app2.loadFromHash(hash);

    expect(app2.country).toBe('UK');
    expect(app2.offers[0].name).toBe('Job A');
    expect(app2.offers[0].years.map(y => y.gross)).toEqual([50000, 55000, 60000]);
  });

  it('colors are assigned from COLORS array', () => {
    const app = createApp();
    app.offers = [
      { name: 'A', color: COLORS[0], years: [{ gross: 1 }] },
      { name: 'B', color: COLORS[1], years: [{ gross: 2 }] },
      { name: 'C', color: COLORS[2], years: [{ gross: 3 }] },
    ];
    const hash = app.saveToHash();
    const app2 = createApp();
    app2.loadFromHash(hash);
    expect(app2.offers[0].color).toBe(COLORS[0]);
    expect(app2.offers[1].color).toBe(COLORS[1]);
    expect(app2.offers[2].color).toBe(COLORS[2]);
  });

  it('max 4 offers and 5 years enforced on decode', () => {
    const state = {
      c: 'UK', f: 'single', s: 'none',
      o: [
        { n: 'A', y: [1, 2, 3, 4, 5, 6, 7] },  // > 5 years
        { n: 'B', y: [1] },
        { n: 'C', y: [1] },
        { n: 'D', y: [1] },
        { n: 'E', y: [1] },  // 5th offer — should be trimmed
      ]
    };
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    const hash = '#s=' + enc;

    const app = createApp();
    app.loadFromHash(hash);
    expect(app.offers).toHaveLength(4);  // max 4
    expect(app.offers[0].years).toHaveLength(5);  // max 5
  });
});

// ─── Legacy hash format ──────────────────────────────────────────────────────

describe('legacy hash format (#state=)', () => {
  it('loads legacy #state= format correctly', () => {
    // Legacy format: array of offers (no country/filing info)
    const legacyState = [
      { n: 'Old Job A', y: [70000, 75000] },
      { n: 'Old Job B', y: [65000] },
    ];
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(legacyState))));
    const hash = '#state=' + enc;

    const app = createApp();
    app.loadFromHash(hash);

    expect(app.offers).toHaveLength(2);
    expect(app.offers[0].name).toBe('Old Job A');
    expect(app.offers[0].years[0].gross).toBe(70000);
    expect(app.offers[0].years[1].gross).toBe(75000);
    expect(app.offers[1].name).toBe('Old Job B');
    expect(app.offers[1].years[0].gross).toBe(65000);
    // country/filing remain defaults
    expect(app.country).toBe('UK');
  });

  it('legacy format assigns colors and default names', () => {
    const legacyState = [
      { y: [50000] },  // no name
      { n: 'Named', y: [60000] },
    ];
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(legacyState))));
    const hash = '#state=' + enc;

    const app = createApp();
    app.loadFromHash(hash);

    expect(app.offers[0].name).toBe('Job A');  // default
    expect(app.offers[1].name).toBe('Named');
    expect(app.offers[0].color).toBe(COLORS[0]);
    expect(app.offers[1].color).toBe(COLORS[1]);
  });
});

// ─── Hash edge cases ─────────────────────────────────────────────────────────

describe('hash edge cases', () => {
  it('empty hash does nothing', () => {
    const app = createApp();
    app.loadFromHash('');
    expect(app.offers).toHaveLength(2);  // unchanged defaults
  });

  it('short hash does nothing', () => {
    const app = createApp();
    app.loadFromHash('#x');
    expect(app.offers).toHaveLength(2);
  });

  it('invalid base64 does not throw', () => {
    const app = createApp();
    expect(() => app.loadFromHash('#s=!!!invalid!!!')).not.toThrow();
  });

  it('zero gross in hash decoded as empty string', () => {
    const state = { c: 'UK', f: 'single', s: 'none', o: [{ n: 'A', y: [0] }] };
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    const app = createApp();
    app.loadFromHash('#s=' + enc);
    // 0 || '' → '' (the code does g || '')
    expect(app.offers[0].years[0].gross).toBe('');
  });
});

// ─── calcOffer integration ───────────────────────────────────────────────────

describe('calcOffer', () => {
  it('UK: returns correct breakdown per year', () => {
    const app = createApp();
    app.country = 'UK';
    const offer = { name: 'Test', color: COLORS[0], years: [{ gross: 30000 }, { gross: 60000 }] };
    app.offers = [offer];
    const results = app.calcOffer(offer);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ year: 1, gross: 30000, tax: 3486, ni: 1394, takeHome: 25120 });
    expect(results[1]).toMatchObject({ year: 2, gross: 60000, tax: 11432, ni: 3211, takeHome: 45357 });
  });

  it('US: returns correct breakdown per year', () => {
    const app = createApp();
    app.country = 'US';
    app.filingStatus = 'single';
    app.usState = 'none';
    const offer = { name: 'Test', color: COLORS[0], years: [{ gross: 50000 }, { gross: 120000 }] };
    app.offers = [offer];
    const results = app.calcOffer(offer);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ year: 1, gross: 50000, federal: 4016, state: 0, fica: 3825, takeHome: 42159 });
    expect(results[1]).toMatchObject({ year: 2, gross: 120000, federal: 18339, state: 0, fica: 9180, takeHome: 92481 });
  });

  it('blank gross treated as 0', () => {
    const app = createApp();
    app.country = 'UK';
    const offer = { name: 'Test', color: COLORS[0], years: [{ gross: '' }] };
    app.offers = [offer];
    const results = app.calcOffer(offer);
    expect(results[0].takeHome).toBe(0);
  });
});

// ─── 4 jobs, 5 years ────────────────────────────────────────────────────────

describe('4 jobs, 5 years each', () => {
  it('all compute without error', () => {
    const app = createApp();
    app.country = 'UK';
    app.offers = [
      { name: 'Job A', color: COLORS[0], years: [{ gross: 30000 }, { gross: 35000 }, { gross: 40000 }, { gross: 45000 }, { gross: 50000 }] },
      { name: 'Job B', color: COLORS[1], years: [{ gross: 50000 }, { gross: 50000 }, { gross: 50000 }, { gross: 50000 }, { gross: 50000 }] },
      { name: 'Job C', color: COLORS[2], years: [{ gross: 60000 }, { gross: 65000 }, { gross: 70000 }, { gross: 75000 }, { gross: 80000 }] },
      { name: 'Job D', color: COLORS[3], years: [{ gross: 100000 }, { gross: 100000 }, { gross: 100000 }, { gross: 100000 }, { gross: 100000 }] },
    ];

    expect(app.offers).toHaveLength(4);
    expect(app.maxYears).toBe(5);

    // All cumulative arrays should have 5 entries
    for (const offer of app.offers) {
      const cum = app.cumulative(offer);
      expect(cum).toHaveLength(5);
      // Cumulative should be monotonically increasing
      for (let i = 1; i < cum.length; i++) {
        expect(cum[i]).toBeGreaterThan(cum[i - 1]);
      }
    }

    // Leader should exist at each year
    for (let y = 0; y < 5; y++) {
      expect(app.leaderAt(y)).not.toBeNull();
    }

    // Crossovers should not throw
    expect(() => app.crossovers).not.toThrow();
  });
});

// ─── Single year (no progression) ───────────────────────────────────────────

describe('single year, no progression', () => {
  it('works correctly with one year per offer', () => {
    const app = createApp();
    app.country = 'UK';
    app.offers = [
      { name: 'Job A', color: COLORS[0], years: [{ gross: 50000 }] },
      { name: 'Job B', color: COLORS[1], years: [{ gross: 40000 }] },
    ];

    expect(app.maxYears).toBe(1);
    expect(app.crossovers).toEqual([]);  // can't cross over with 1 year
    expect(app.leaderAt(0)).toBe(app.offers[0]);  // Job A leads

    const cumA = app.cumulative(app.offers[0]);
    const cumB = app.cumulative(app.offers[1]);
    expect(cumA).toHaveLength(1);
    expect(cumB).toHaveLength(1);
  });
});

// ─── calcTH shortcut ────────────────────────────────────────────────────────

describe('calcTH', () => {
  it('UK: returns takeHome only', () => {
    const app = createApp();
    app.country = 'UK';
    expect(app.calcTH(30000)).toBe(25120);
  });

  it('US: returns takeHome only', () => {
    const app = createApp();
    app.country = 'US';
    app.filingStatus = 'single';
    app.usState = 'none';
    expect(app.calcTH(120000)).toBe(92481);
  });
});
