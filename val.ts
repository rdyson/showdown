export default async function(req: Request): Promise<Response> {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Showdown — Job Offer Comparator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            surface: '#0f1117',
            card: '#161b27',
          }
        }
      }
    }
  </script>
  <script defer src="https://unpkg.com/alpinejs@3.14.1/dist/cdn.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
  <style>
    [x-cloak] { display: none !important; }
    body { background: #0f1117; }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    .offer-card { background: #161b27; }
    .input-base {
      background: #1e2535;
      border: 1px solid #2d3748;
      color: #e2e8f0;
      border-radius: 0.5rem;
      padding: 0.4rem 0.75rem;
      width: 100%;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s;
    }
    .input-base:focus { border-color: #6366f1; }
    .input-base::placeholder { color: #4a5568; }
    .table-head { background: #1a2030; }
  </style>
</head>
<body class="text-gray-100 min-h-screen antialiased" x-data="showdown()" x-cloak>

  <!-- ═══ HEADER ═══ -->
  <header class="sticky top-0 z-20 bg-opacity-95 backdrop-blur border-b border-gray-800" style="background:#0f1117ee">
    <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-2xl leading-none">⚔️</span>
        <div>
          <h1 class="text-xl font-bold tracking-tight leading-none">Showdown</h1>
          <p class="text-xs text-gray-500 leading-tight hidden sm:block">UK job offer comparator · 2025/26</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Share -->
        <button @click="copyShareUrl()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
          :class="copied ? 'bg-green-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'">
          <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
          </svg>
          <span x-text="copied ? '✓ Copied' : 'Share'"></span>
        </button>

        <!-- Add Offer -->
        <button @click="addOffer()" x-show="offers.length < 4"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
          </svg>
          <span class="hidden sm:inline">Add offer</span>
          <span class="sm:hidden">+</span>
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-6xl mx-auto px-4 py-6 space-y-8">

    <!-- ═══ OFFER CARDS ═══ -->
    <div class="grid gap-4"
      :class="{
        'grid-cols-1 max-w-md': offers.length === 1,
        'grid-cols-1 sm:grid-cols-2': offers.length === 2,
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': offers.length === 3,
        'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4': offers.length === 4
      }">

      <template x-for="(offer, oi) in offers" :key="oi">
        <div class="offer-card rounded-2xl border p-4 space-y-3"
          :style="\`border-color: \${offer.color}50\`">

          <!-- Card header -->
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="\`background:\${offer.color}\`"></span>
            <input x-model="offer.name" type="text" placeholder="Job name"
              class="flex-1 bg-transparent font-semibold text-base border-0 border-b border-transparent
                     hover:border-gray-700 focus:border-indigo-500 focus:outline-none transition-colors min-w-0 py-0.5" />
            <button @click="removeOffer(oi)" x-show="offers.length > 1"
              class="p-1 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0" title="Remove offer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Salary rows -->
          <div class="space-y-2">
            <template x-for="(yr, yi) in offer.years" :key="yi">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 w-10 flex-shrink-0 text-right" x-text="\`Yr \${yi+1}\`"></span>

                <!-- Salary input -->
                <div class="relative flex-1">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">£</span>
                  <input type="number" x-model.number="yr.gross" placeholder="0"
                    class="input-base pl-6 pr-2" min="0" step="1000"
                    @input="offer._changed = true" />
                </div>

                <!-- Live take-home -->
                <div class="w-20 text-right flex-shrink-0">
                  <template x-if="yr.gross > 0">
                    <div>
                      <div class="text-xs font-semibold text-green-400" x-text="fmt(calcTH(yr.gross))"></div>
                      <div class="text-xs text-gray-600">net/yr</div>
                    </div>
                  </template>
                </div>

                <!-- Remove year -->
                <button @click="removeYear(oi, yi)" x-show="offer.years.length > 1"
                  class="p-1 text-gray-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
                  </svg>
                </button>
              </div>
            </template>
          </div>

          <!-- Add year button -->
          <button @click="addYear(oi)" x-show="offer.years.length < 5"
            class="w-full py-1.5 text-xs text-gray-600 hover:text-gray-400 border border-dashed
                   border-gray-700 hover:border-gray-600 rounded-lg transition-all">
            + add year
          </button>

          <!-- Per-year breakdown table -->
          <template x-if="offer.years.some(y => y.gross > 0)">
            <div class="border-t border-gray-800 pt-3">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-gray-600">
                    <th class="text-left pb-1">Yr</th>
                    <th class="text-right pb-1">Gross</th>
                    <th class="text-right pb-1 text-red-800">Tax</th>
                    <th class="text-right pb-1 text-orange-800">NI</th>
                    <th class="text-right pb-1 text-green-700">Net</th>
                  </tr>
                </thead>
                <tbody>
                  <template x-for="row in calcOffer(offer)" :key="row.year">
                    <tr class="border-t border-gray-800/60">
                      <td class="py-1 text-gray-600" x-text="row.year"></td>
                      <td class="py-1 text-right text-gray-400" x-text="row.gross > 0 ? fmt(row.gross) : '—'"></td>
                      <td class="py-1 text-right text-red-500" x-text="row.gross > 0 ? fmt(row.tax) : '—'"></td>
                      <td class="py-1 text-right text-orange-500" x-text="row.gross > 0 ? fmt(row.ni) : '—'"></td>
                      <td class="py-1 text-right text-green-400 font-semibold" x-text="row.gross > 0 ? fmt(row.takeHome) : '—'"></td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </template>

        </div>
      </template>
    </div>

    <!-- ═══ COMPARISON SECTION (only when data exists) ═══ -->
    <template x-if="hasData">
      <section class="space-y-5">

        <h2 class="text-lg font-semibold text-gray-200">Cumulative Take-Home</h2>

        <!-- Crossover alerts -->
        <template x-if="crossovers.length > 0">
          <div class="flex flex-col sm:flex-row flex-wrap gap-2">
            <template x-for="msg in crossovers" :key="msg">
              <div class="flex items-start gap-2 px-3 py-2 rounded-xl text-sm
                          bg-yellow-950/50 border border-yellow-800/40 text-yellow-300">
                <span class="text-base leading-none mt-0.5">🔀</span>
                <span x-text="msg"></span>
              </div>
            </template>
          </div>
        </template>

        <!-- No crossover note -->
        <template x-if="crossovers.length === 0 && offers.length > 1 && hasData">
          <p class="text-sm text-gray-600">No crossovers detected — one offer leads throughout.</p>
        </template>

        <!-- Cumulative table -->
        <div class="overflow-x-auto rounded-2xl border border-gray-800">
          <table class="w-full text-sm min-w-[400px]">
            <thead>
              <tr class="table-head">
                <th class="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Year</th>
                <template x-for="(offer, oi) in offers" :key="oi">
                  <th class="text-right px-4 py-3 text-sm font-semibold"
                    :style="\`color: \${offer.color}\`" x-text="offer.name"></th>
                </template>
                <th class="text-right px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Leader</th>
              </tr>
            </thead>
            <tbody>
              <template x-for="(_, yi) in Array.from({length: maxYears})" :key="yi">
                <tr class="border-t border-gray-800 hover:bg-white/[0.02] transition-colors">
                  <td class="px-4 py-3 text-gray-500 text-sm" x-text="\`Year \${yi+1}\`"></td>

                  <template x-for="(offer, oi) in offers" :key="oi">
                    <td class="px-4 py-3 text-right font-semibold text-sm"
                      :class="cumForYear(offer, yi) > 0 && cumForYear(offer, yi) === maxCumForYear(yi) ? 'text-green-400' : 'text-gray-400'"
                      x-text="cumForYear(offer, yi) > 0 ? fmt(cumForYear(offer, yi)) : '—'">
                    </td>
                  </template>

                  <td class="px-4 py-3 text-right">
                    <template x-if="leaderAt(yi)">
                      <span class="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
                        :style="\`background: \${leaderAt(yi).color}22; color: \${leaderAt(yi).color}\`"
                        x-text="leaderAt(yi).name">
                      </span>
                    </template>
                    <template x-if="!leaderAt(yi)">
                      <span class="text-gray-700">—</span>
                    </template>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Chart -->
        <div class="rounded-2xl border border-gray-800 p-4" style="background:#161b27">
          <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Cumulative take-home by year</p>
          <div class="h-64 sm:h-72">
            <canvas id="chart"></canvas>
          </div>
        </div>

      </section>
    </template>

    <!-- ═══ EMPTY STATE ═══ -->
    <template x-if="!hasData">
      <div class="text-center py-20">
        <div class="text-5xl mb-5">⚔️</div>
        <p class="text-xl font-semibold text-gray-400 mb-2">Enter some salaries to get started</p>
        <p class="text-sm text-gray-600 max-w-xs mx-auto">
          Type yearly gross salaries into each offer card — tax and take-home appear instantly.
          Add up to 4 offers, 5 years each.
        </p>
        <div class="mt-8 inline-flex flex-col items-start gap-1.5 bg-gray-900 rounded-xl px-5 py-4 text-left text-sm">
          <p class="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">2025/26 rates used</p>
          <div class="flex gap-6 text-xs text-gray-500">
            <div>
              <p class="text-gray-400 font-medium mb-1">Income Tax</p>
              <p>0% → £12,570</p>
              <p>20% → £50,270</p>
              <p>40% → £125,140</p>
              <p>45% → above</p>
            </div>
            <div>
              <p class="text-gray-400 font-medium mb-1">NI (Employee)</p>
              <p>0% → £12,570</p>
              <p>8% → £50,270</p>
              <p>2% → above</p>
              <p class="text-gray-600 mt-1">PA tapers £100k+</p>
            </div>
          </div>
        </div>
      </div>
    </template>

  </main>

  <!-- ═══ FOOTER ═══ -->
  <footer class="border-t border-gray-800/50 mt-12 py-5 text-center text-xs text-gray-700">
    UK 2025/26 · England, Wales & Northern Ireland · PAYE employed ·
    Income tax + employee NI · PA tapers above £100k ·
    No student loan / pension adjustments
  </footer>

  <!-- ═══ SCRIPT ═══ -->
  <script>
    // ── Tax calculation (2025/26 England/Wales/NI, PAYE employed) ────────────
    function calcTaxNI(gross) {
      gross = Math.max(0, parseFloat(gross) || 0);
      if (gross === 0) return { gross: 0, tax: 0, ni: 0, takeHome: 0 };

      // Personal allowance — tapers £1 per £2 over £100k, zero at £125,140
      let pa = 12570;
      if (gross > 125140) {
        pa = 0;
      } else if (gross > 100000) {
        pa = Math.max(0, 12570 - Math.floor((gross - 100000) / 2));
      }

      // Income tax (progressive bands)
      // When pa=0 (tapered away), band [0,0,0%] adds nothing; [0,50270,20%] taxes all from £0.
      let tax = 0;
      const itBands = [
        [0,      pa,       0.00],
        [pa,     50270,    0.20],
        [50270,  125140,   0.40],
        [125140, Infinity, 0.45],
      ];
      for (const [lo, hi, rate] of itBands) {
        if (gross <= lo) break;
        tax += (Math.min(gross, hi) - lo) * rate;
      }

      // Employee NI (Category A)
      let ni = 0;
      const niLo = 12570, niHi = 50270;
      if (gross > niLo) {
        ni += (Math.min(gross, niHi) - niLo) * 0.08;
        if (gross > niHi) ni += (gross - niHi) * 0.02;
      }

      const taxR = Math.round(tax);
      const niR  = Math.round(ni);
      return { gross, tax: taxR, ni: niR, takeHome: gross - taxR - niR };
    }

    // ── Alpine.js component ───────────────────────────────────────────────────
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    function showdown() {
      return {
        offers: [
          { name: 'Job A', color: COLORS[0], years: [{ gross: '' }] },
          { name: 'Job B', color: COLORS[1], years: [{ gross: '' }] },
        ],
        copied: false,
        _chart: null,

        // ── Lifecycle ──────────────────────────────────────────────────────
        init() {
          this.loadFromHash();
          this.$nextTick(() => this._renderChart());

          this.$watch('offers', () => {
            this.saveToHash();
            this.$nextTick(() => this._renderChart());
          }, { deep: true });
        },

        // ── Offer management ───────────────────────────────────────────────
        addOffer() {
          if (this.offers.length >= 4) return;
          this.offers.push({
            name: \`Job \${String.fromCharCode(65 + this.offers.length)}\`,
            color: COLORS[this.offers.length],
            years: [{ gross: '' }]
          });
        },
        removeOffer(i) { this.offers.splice(i, 1); },

        addYear(oi) {
          if (this.offers[oi].years.length >= 5) return;
          this.offers[oi].years.push({ gross: '' });
        },
        removeYear(oi, yi) {
          if (this.offers[oi].years.length <= 1) return;
          this.offers[oi].years.splice(yi, 1);
        },

        // ── Calculations ───────────────────────────────────────────────────
        calcTH(gross) { return calcTaxNI(gross).takeHome; },

        calcOffer(offer) {
          return offer.years.map((y, i) => ({
            year: i + 1,
            ...calcTaxNI(y.gross || 0)
          }));
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
                const cA = a[y]   || 0, cB = b[y]   || 0;
                if ((pA === 0 && pB === 0) || (cA === 0 && cB === 0)) continue;
                if ((pA - pB) * (cA - cB) < 0) {
                  const winner = cA > cB ? this.offers[i] : this.offers[j];
                  const loser  = cA > cB ? this.offers[j] : this.offers[i];
                  msgs.push(\`\${winner.name} overtakes \${loser.name} cumulatively in Year \${y + 1}\`);
                }
              }
            }
          }
          return msgs;
        },

        get hasData() {
          return this.offers.some(o => o.years.some(y => parseFloat(y.gross) > 0));
        },

        // ── Chart ──────────────────────────────────────────────────────────
        _renderChart() {
          const el = document.getElementById('chart');
          if (!el) return;
          if (this._chart) { this._chart.destroy(); this._chart = null; }
          if (!this.hasData) return;

          const labels = Array.from({ length: this.maxYears }, (_, i) => \`Year \${i + 1}\`);
          const datasets = this.offers
            .filter(o => o.years.some(y => parseFloat(y.gross) > 0))
            .map(offer => ({
              label: offer.name,
              data: Array.from({ length: this.maxYears }, (_, yi) => this.cumForYear(offer, yi) || null),
              borderColor: offer.color,
              backgroundColor: offer.color + '18',
              pointBackgroundColor: offer.color,
              pointBorderColor: '#161b27',
              pointBorderWidth: 2,
              tension: 0.35,
              fill: false,
              pointRadius: 5,
              pointHoverRadius: 7,
              borderWidth: 2.5,
              spanGaps: false,
            }));

          Chart.defaults.color = '#6b7280';
          this._chart = new Chart(el, {
            type: 'line',
            data: { labels, datasets },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: {
                  labels: { color: '#d1d5db', usePointStyle: true, pointStyleWidth: 8, font: { size: 12 } }
                },
                tooltip: {
                  backgroundColor: '#1e2535',
                  borderColor: '#374151',
                  borderWidth: 1,
                  titleColor: '#9ca3af',
                  bodyColor: '#e5e7eb',
                  callbacks: {
                    label: ctx => \` \${ctx.dataset.label}: \${ctx.parsed.y != null ? this.fmt(ctx.parsed.y) : '—'}\`,
                  }
                }
              },
              scales: {
                x: {
                  grid: { color: '#1e2535' },
                  ticks: { color: '#6b7280' },
                  border: { color: '#374151' },
                },
                y: {
                  grid: { color: '#1e2535' },
                  ticks: {
                    color: '#6b7280',
                    callback: v => '£' + Math.round(v).toLocaleString('en-GB'),
                  },
                  border: { color: '#374151' },
                }
              }
            }
          });
        },

        // ── State persistence ──────────────────────────────────────────────
        saveToHash() {
          try {
            const state = this.offers.map(o => ({
              n: o.name,
              y: o.years.map(yr => parseFloat(yr.gross) || 0)
            }));
            const enc = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
            history.replaceState(null, '', '#state=' + enc);
          } catch (_) {}
        },

        loadFromHash() {
          try {
            const raw = location.hash.replace(/^#state=/, '');
            if (!raw) return;
            const state = JSON.parse(decodeURIComponent(escape(atob(raw))));
            if (!Array.isArray(state) || state.length === 0) return;
            this.offers = state.slice(0, 4).map((o, i) => ({
              name: o.n || \`Job \${String.fromCharCode(65 + i)}\`,
              color: COLORS[i % COLORS.length],
              years: (Array.isArray(o.y) ? o.y : [0]).slice(0, 5).map(g => ({ gross: g || '' }))
            }));
          } catch (_) {}
        },

        // ── Helpers ────────────────────────────────────────────────────────
        fmt(n) {
          return '£' + Math.round(n).toLocaleString('en-GB');
        },

        async copyShareUrl() {
          try { await navigator.clipboard.writeText(location.href); } catch (_) {}
          this.copied = true;
          setTimeout(() => (this.copied = false), 2500);
        },
      };
    }
  </script>

</body>
</html>
`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
