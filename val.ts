export default async function(req: Request): Promise<Response> {
  const html = `
<!DOCTYPE html>
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
    select.input-base { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.5rem center; padding-right: 1.75rem; }
    .country-toggle { display: inline-flex; border-radius: 0.5rem; overflow: hidden; border: 1px solid #2d3748; }
    .country-toggle button { padding: 0.25rem 0.6rem; font-size: 0.875rem; background: #1e2535; color: #9ca3af; border: none; cursor: pointer; transition: all 0.15s; line-height: 1.4; }
    .country-toggle button.active { background: #6366f1; color: #fff; }
    .country-toggle button:not(.active):hover { background: #2d3748; }
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
          <p class="text-xs text-gray-500 leading-tight hidden sm:block" x-text="country === 'UK' ? 'UK job offer comparator · 2025/26' : 'US job offer comparator · 2024'"></p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Country toggle -->
        <div class="country-toggle">
          <button @click="country = 'UK'" :class="{ active: country === 'UK' }">🇬🇧</button>
          <button @click="country = 'US'" :class="{ active: country === 'US' }">🇺🇸</button>
        </div>

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

    <!-- US options bar -->
    <template x-if="country === 'US'">
      <div class="max-w-6xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 whitespace-nowrap">Filing status</label>
          <select x-model="filingStatus" class="input-base" style="width:auto;min-width:10rem">
            <option value="single">Single</option>
            <option value="mfj">Married Filing Jointly</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-xs text-gray-500 whitespace-nowrap">State</label>
          <select x-model="usState" class="input-base" style="width:auto;min-width:10rem">
            <template x-for="st in usStates" :key="st.code">
              <option :value="st.code" x-text="st.name"></option>
            </template>
          </select>
        </div>
      </div>
    </template>
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
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" x-text="country === 'UK' ? '£' : '$'"></span>
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

          <!-- Per-year breakdown table — UK -->
          <template x-if="country === 'UK' && offer.years.some(y => y.gross > 0)">
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

          <!-- Per-year breakdown table — US -->
          <template x-if="country === 'US' && offer.years.some(y => y.gross > 0)">
            <div class="border-t border-gray-800 pt-3">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-gray-600">
                    <th class="text-left pb-1">Yr</th>
                    <th class="text-right pb-1">Gross</th>
                    <th class="text-right pb-1 text-red-800">Fed</th>
                    <th class="text-right pb-1 text-purple-800">State</th>
                    <th class="text-right pb-1 text-orange-800">FICA</th>
                    <th class="text-right pb-1 text-green-700">Net</th>
                  </tr>
                </thead>
                <tbody>
                  <template x-for="row in calcOffer(offer)" :key="row.year">
                    <tr class="border-t border-gray-800/60">
                      <td class="py-1 text-gray-600" x-text="row.year"></td>
                      <td class="py-1 text-right text-gray-400" x-text="row.gross > 0 ? fmt(row.gross) : '—'"></td>
                      <td class="py-1 text-right text-red-500" x-text="row.gross > 0 ? fmt(row.federal) : '—'"></td>
                      <td class="py-1 text-right text-purple-500" x-text="row.gross > 0 ? fmt(row.state) : '—'"></td>
                      <td class="py-1 text-right text-orange-500" x-text="row.gross > 0 ? fmt(row.fica) : '—'"></td>
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

    <!-- ═══ EMPTY STATE — UK ═══ -->
    <template x-if="!hasData && country === 'UK'">
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

    <!-- ═══ EMPTY STATE — US ═══ -->
    <template x-if="!hasData && country === 'US'">
      <div class="text-center py-20">
        <div class="text-5xl mb-5">⚔️</div>
        <p class="text-xl font-semibold text-gray-400 mb-2">Enter some salaries to get started</p>
        <p class="text-sm text-gray-600 max-w-xs mx-auto">
          Type yearly gross salaries into each offer card — tax and take-home appear instantly.
          Add up to 4 offers, 5 years each.
        </p>
        <div class="mt-8 inline-flex flex-col items-start gap-1.5 bg-gray-900 rounded-xl px-5 py-4 text-left text-sm">
          <p class="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">2024 federal rates · <span x-text="filingStatus === 'single' ? 'Single' : 'Married Filing Jointly'"></span></p>
          <div class="flex gap-6 text-xs text-gray-500">
            <div>
              <p class="text-gray-400 font-medium mb-1">Federal Income Tax</p>
              <template x-if="filingStatus === 'single'">
                <div>
                  <p>10% → $11,600</p>
                  <p>12% → $47,150</p>
                  <p>22% → $100,525</p>
                  <p>24% → $191,950</p>
                  <p>32% → $243,725</p>
                  <p>35% → $609,350</p>
                  <p>37% → above</p>
                </div>
              </template>
              <template x-if="filingStatus === 'mfj'">
                <div>
                  <p>10% → $23,200</p>
                  <p>12% → $94,300</p>
                  <p>22% → $201,050</p>
                  <p>24% → $383,900</p>
                  <p>32% → $487,450</p>
                  <p>35% → $731,200</p>
                  <p>37% → above</p>
                </div>
              </template>
            </div>
            <div>
              <p class="text-gray-400 font-medium mb-1">FICA</p>
              <p>SS 6.2% → $168,600</p>
              <p>Medicare 1.45% all</p>
              <p>+0.9% above $200k</p>
              <p class="text-gray-600 mt-1">Std ded: <span x-text="filingStatus === 'single' ? '$14,600' : '$29,200'"></span></p>
            </div>
          </div>
        </div>
      </div>
    </template>

  </main>

  <!-- ═══ FOOTER ═══ -->
  <footer class="border-t border-gray-800/50 mt-12 py-5 text-center text-xs text-gray-700">
    <template x-if="country === 'UK'">
      <p>UK 2025/26 · England, Wales &amp; Northern Ireland · PAYE employed ·
      Income tax + employee NI · PA tapers above £100k ·
      No student loan / pension adjustments</p>
    </template>
    <template x-if="country === 'US'">
      <p>US 2024 federal + FICA + state tax · Standard deduction applied ·
      State tax uses single-filer brackets · Estimates only — not tax advice</p>
    </template>
    <p class="mt-2">
      <a href="https://github.com/rdyson/showdown" target="_blank" rel="noopener"
         class="text-gray-600 hover:text-gray-400 transition-colors">GitHub</a>
    </p>
  </footer>

  <!-- ═══ SCRIPT ═══ -->
  <script>
    // ── UK Tax calculation (2025/26 England/Wales/NI, PAYE employed) ─────────
    function calcUK(gross) {
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

    // ── US Tax calculation (2024 federal + FICA + state) ─────────────────────
    const US_FEDERAL = {
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

    // State tax brackets (2024, single filer)
    const US_STATE_TAX = {
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

    function calcBrackets(taxable, brackets) {
      let tax = 0;
      for (const [lo, hi, rate] of brackets) {
        if (taxable <= lo) break;
        tax += (Math.min(taxable, hi) - lo) * rate;
      }
      return tax;
    }

    function calcUS(gross, filingStatus, stateCode) {
      gross = Math.max(0, parseFloat(gross) || 0);
      if (gross === 0) return { gross: 0, federal: 0, state: 0, fica: 0, takeHome: 0 };

      // Federal income tax
      const fed = US_FEDERAL[filingStatus] || US_FEDERAL.single;
      const taxableIncome = Math.max(0, gross - fed.deduction);
      const federal = Math.round(calcBrackets(taxableIncome, fed.brackets));

      // FICA
      const ss = Math.min(gross, 168600) * 0.062;
      const medicare = gross * 0.0145 + Math.max(0, gross - 200000) * 0.009;
      const fica = Math.round(ss + medicare);

      // State tax
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

    // ── Alpine.js component ───────────────────────────────────────────────────
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    function showdown() {
      return {
        offers: [
          { name: 'Job A', color: COLORS[0], years: [{ gross: '' }] },
          { name: 'Job B', color: COLORS[1], years: [{ gross: '' }] },
        ],
        country: 'UK',
        filingStatus: 'single',
        usState: 'none',
        copied: false,
        _chart: null,

        get usStates() {
          return [
            { code: 'none', name: 'No state tax (FL, TX, WA, NV…)' },
            { code: 'CA', name: 'California' },
            { code: 'NY', name: 'New York' },
            { code: 'NJ', name: 'New Jersey' },
            { code: 'MA', name: 'Massachusetts' },
            { code: 'IL', name: 'Illinois' },
            { code: 'PA', name: 'Pennsylvania' },
            { code: 'CO', name: 'Colorado' },
            { code: 'GA', name: 'Georgia' },
            { code: 'NC', name: 'North Carolina' },
            { code: 'OH', name: 'Ohio' },
          ];
        },

        // ── Lifecycle ──────────────────────────────────────────────────────
        init() {
          this.loadFromHash();
          this.$nextTick(() => this._renderChart());

          this.$watch('offers', () => {
            this.saveToHash();
            this.$nextTick(() => this._renderChart());
          }, { deep: true });

          this.$watch('country', () => {
            this.saveToHash();
            this.$nextTick(() => this._renderChart());
          });
          this.$watch('filingStatus', () => {
            this.saveToHash();
            this.$nextTick(() => this._renderChart());
          });
          this.$watch('usState', () => {
            this.saveToHash();
            this.$nextTick(() => this._renderChart());
          });
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

          const sym = this.country === 'UK' ? '£' : '$';
          const locale = this.country === 'UK' ? 'en-GB' : 'en-US';
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
                    callback: v => sym + Math.round(v).toLocaleString(locale),
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
            history.replaceState(null, '', '#s=' + enc);
          } catch (_) {}
        },

        loadFromHash() {
          try {
            const hash = location.hash;
            if (!hash || hash.length < 3) return;

            // New format: #s=...
            if (hash.startsWith('#s=')) {
              const raw = hash.slice(3);
              const state = JSON.parse(decodeURIComponent(escape(atob(raw))));
              if (state.c) this.country = state.c;
              if (state.f) this.filingStatus = state.f;
              if (state.s) this.usState = state.s;
              if (Array.isArray(state.o) && state.o.length > 0) {
                this.offers = state.o.slice(0, 4).map((o, i) => ({
                  name: o.n || \`Job \${String.fromCharCode(65 + i)}\`,
                  color: COLORS[i % COLORS.length],
                  years: (Array.isArray(o.y) ? o.y : [0]).slice(0, 5).map(g => ({ gross: g || '' }))
                }));
              }
              return;
            }

            // Legacy format: #state=...
            if (hash.startsWith('#state=')) {
              const raw = hash.slice(7);
              const state = JSON.parse(decodeURIComponent(escape(atob(raw))));
              if (Array.isArray(state) && state.length > 0) {
                this.offers = state.slice(0, 4).map((o, i) => ({
                  name: o.n || \`Job \${String.fromCharCode(65 + i)}\`,
                  color: COLORS[i % COLORS.length],
                  years: (Array.isArray(o.y) ? o.y : [0]).slice(0, 5).map(g => ({ gross: g || '' }))
                }));
              }
            }
          } catch (_) {}
        },

        // ── Helpers ────────────────────────────────────────────────────────
        fmt(n) {
          if (this.country === 'US') return '$' + Math.round(n).toLocaleString('en-US');
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
