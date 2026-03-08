# ⚔️ Showdown

Compare job offer salary progressions side-by-side, with take-home pay calculated live.

**Live:** [showdown.rdyson.dev](https://showdown.rdyson.dev)

## What it does

- Add up to 4 job offers with year-by-year salaries
- 🇬🇧/🇺🇸 toggle — UK (2025/26) and US (2024) tax calculations
- US supports filing status (single / married filing jointly) and 10 state tax brackets
- Cumulative comparison table with the leader highlighted
- Crossover detection ("Job B overtakes Job A in Year 3")
- Line chart showing cumulative take-home over time
- Share via URL — the entire state is encoded in the hash

## Tech

Single self-contained HTML file. No build step, no backend.

- [Alpine.js](https://alpinejs.dev/) — reactive UI
- [Chart.js](https://www.chartjs.org/) — cumulative earnings chart
- [Tailwind CSS](https://tailwindcss.com/) — styling (CDN)
- URL hash state sharing (JSON → base64)

## Deploy to Val Town

1. Sign up at [val.town](https://val.town)
2. Click **New** → **HTTP**
3. Name it (e.g. `showdown`)
4. Copy the contents of [`val.ts`](./val.ts) into the editor
5. Click **Save**
6. Your app is live at the URL Val Town gives you

`val.ts` wraps `index.html` in a Val Town HTTP handler — it's the same app, just served as a Response.

## Custom domain (Cloudflare Worker)

`showdown.rdyson.dev` is proxied to the Val Town URL via a Cloudflare Worker, avoiding the need for a Val Town Pro account.

```
showdown.rdyson.dev → Cloudflare Worker → val.run upstream
```

Requires the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) and a Cloudflare account with the domain configured.

```bash
npx wrangler login
npx wrangler deploy
```

To update the upstream URL, edit `UPSTREAM` in `worker.js` and redeploy.

## Run locally

```bash
python3 -m http.server 8080
# or
bash serve.sh
```

Open http://localhost:8080

## Tests

The tax calculation logic lives in `src/tax.js` as pure ES module functions. 74 tests cover real-world salary scenarios, bracket boundaries, edge cases, and app logic.

```bash
npm install
npm test
```

For coverage:

```bash
npm run test:coverage
```

**What's tested:**

- UK tax: basic rate, higher rate, PA taper zone (£100k–£125,140), additional rate (45%), high earner edge cases
- US federal: all bracket boundaries, Single vs MFJ, Medicare surtax (correctly applied at $200k for Single, $250k for MFJ), SS wage cap
- US state tax: CA, NY, and flat-rate states (IL, PA etc.) vs no-state-tax
- App logic: crossover detection, cumulative totals, leader tracking, URL hash round-trip, legacy hash format
- Edge cases: zero gross, null/blank input, negative values, 4 jobs × 5 years

`src/tax.js` has 100% line, branch, and function coverage.

## License

MIT
