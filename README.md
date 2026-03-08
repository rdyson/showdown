# ⚔️ Showdown

Compare job offer salary progressions side-by-side, with take-home pay calculated live.

**Live:** [showdown.run](https://showdown.run)

## What it does

- Add up to 4 job offers with year-by-year salaries
- 🇬🇧/🇺🇸 toggle — UK (2025/26) and US (2024) tax calculations
- US supports filing status (single / married filing jointly) and 10 state tax brackets
- Cumulative comparison table with the leader highlighted
- Crossover detection ("Job B overtakes Job A in Year 3")
- Line chart showing cumulative take-home over time
- Share via URL — the entire state is encoded in the hash

## Tech

Single self-contained HTML source file, with a generated Val Town deploy wrapper (`val.ts`). No backend.

- [Alpine.js](https://alpinejs.dev/) — reactive UI
- [Chart.js](https://www.chartjs.org/) — cumulative earnings chart
- [Tailwind CSS](https://tailwindcss.com/) — styling (CDN)
- URL hash state sharing (JSON → base64)

## Deploy to Val Town

`index.html` is the source of truth. `val.ts` is generated from it.

1. Install the Val Town CLI (`vt`) and authenticate
2. Create/clone your Val Town project locally (one-time)
3. In one terminal, sync local changes to Val Town:
   ```bash
   vt watch
   ```
4. Generate deploy file from source:
   ```bash
   npm run build:val
   ```
5. Edit [`index.html`](./index.html), then regenerate:
   ```bash
   npm run build:val
   ```

To verify no drift:

```bash
npm run check:val
```

## Custom domain (optional — Cloudflare Worker)

If you want your val served at your own domain, you can proxy it through a Cloudflare Worker for free (Cloudflare Workers free tier: 100,000 requests/day).

```
your-domain.com → Cloudflare Worker → val.run upstream
```

The Worker rewrites the `Host` header to match your val's `val.run` URL, which Val Town needs to route the request correctly. A plain DNS CNAME won't work because Val Town uses SNI routing on the full subdomain.

### Setup

1. Add your domain to [Cloudflare](https://dash.cloudflare.com) and point your registrar's nameservers at Cloudflare
2. In `worker.js`, confirm `UPSTREAM` matches your val's `web.val.run` URL
3. In `wrangler.toml`, set your domain in the `routes` array:
   ```toml
   routes = [
     { pattern = "your-domain.com", custom_domain = true }
   ]
   ```
4. In your Cloudflare account settings, note your **Account ID** and set it in `wrangler.toml`
5. Deploy:
   ```bash
   npx wrangler login
   npx wrangler deploy
   ```

To update the upstream URL, edit `UPSTREAM` in `worker.js` and redeploy.

### Automated deploy

If you've set up the CI pipeline (see below), the Worker is redeployed automatically on every push to `main` — no manual step needed.

## Run locally

```bash
python3 -m http.server 8080
# or
bash serve.sh
```

Open http://localhost:8080

## Tests

The tax calculation logic lives in `src/tax.js` as pure ES module functions. Tests cover real-world salary scenarios, bracket boundaries, edge cases, app logic, and worker proxy behavior.

```bash
npm install
npm test
```

For coverage:

```bash
npm run test:coverage
```

To run full local checks before deploy:

```bash
npm run check:val
npm test
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
