# Salary Showdown

> Compare job offer salary progressions year-by-year, with UK take-home pay calculated live. See cumulative totals, crossover points, and a chart — all in a single shareable URL.

## Target

- [x] Public (GitHub, shareable)

## Problem

When you're weighing up job offers, the numbers aren't obvious at a glance. "Job A pays £30k rising to £60k" vs "Job B pays £45k staying flat" — which earns more over 3 years? When do they cross over? And gross salary is a lie anyway — what do you actually take home after tax?

A spreadsheet works, but it's slow to build on mobile, ugly to share, and you have to manually maintain the tax logic. Salary Showdown is a tiny purpose-built tool: add offers, type salaries year by year, see everything instantly.

**Who it's for:** Anyone mid-interview who needs to quickly model "what if I took Job B instead?"

## Prior Art

- **Salary comparison spreadsheets** — fragile, manual, not mobile-friendly
- **HMRC tax calculators** — single salary at a time, no comparison view
- **Contractor UK / ListenToTaxman** — tax calculators, not multi-offer comparison tools

None of these do cumulative multi-offer comparison with a crossover chart.

## UK Tax Logic (2025/26 — England/Wales/NI, employed PAYE)

### Income Tax
| Band | Rate | Applies to |
|------|------|------------|
| Personal Allowance | 0% | First £12,570 |
| Basic | 20% | £12,571 – £50,270 |
| Higher | 40% | £50,271 – £125,140 |
| Additional | 45% | Above £125,140 |

> Note: Personal allowance tapers by £1 for every £2 earned over £100,000, reaching £0 at £125,140.

### National Insurance (Employee, Category A)
| Band | Rate | Applies to |
|------|------|------------|
| Below primary threshold | 0% | Up to £12,570/yr |
| Standard | 8% | £12,571 – £50,270/yr |
| Upper | 2% | Above £50,270/yr |

### v1 Scope
- England/Wales/NI only (Scotland has its own bands — add later if needed)
- Employed PAYE only — no self-employment, dividends, or pension contributions
- No student loan deductions in v1 (add Plan 1/2/5 as optional toggle later)

## Phases

### Phase 1: Ship it
Build and deploy the complete single-page app. No backend required.

**What gets built:**
- Add up to 4 job offers, each with a name
- Per offer: enter yearly salaries (1–5 years), add/remove rows dynamically
- Live calculation per year: gross, income tax, NI, net take-home
- Cumulative totals table: by year, per offer
- Crossover detection: "Job B overtakes Job A in Year 3"
- Line chart: cumulative take-home over time per offer (one line per job)
- Mobile-first layout — usable one-handed on a phone
- Shareable URL: state encoded in URL hash so you can share a link mid-interview

**Definition of done:**
- Deployed to Val Town (HTTP val serving the HTML)
- Works offline once loaded
- Passes a sanity check: £50k gross → ~£37,028 take-home (2025/26)
- Renders cleanly on iOS Safari / Android Chrome

- [ ] Done

## Stack

- **Primary:** Val Town HTTP val (TypeScript, deployed instantly, shareable URL)
- **UI reactivity:** Alpine.js (CDN, ~7kb, no build step, declarative bindings)
- **Charting:** uPlot (CDN, 45kb, fast canvas charts — or Chart.js if uPlot feels like overkill)
- **Styling:** Tailwind CSS via CDN play script (no build)
- **State persistence:** URL hash encoding (JSON → base64 → `#state=...`)
- **Language:** TypeScript (inline in Val Town, transpiled server-side)

### Why this stack?

**Val Town** is the interesting bit. It's on the "Want to Explore" list and this is a perfect use case:
- Write TypeScript in the browser, get a live URL instantly
- The entire app is one val — an HTTP handler that returns HTML
- Zero infra, zero CI, zero deploy pipeline — edit and it's live
- Interesting mental model: the server IS the source code, visible and forkable
- If Rob wants to share it, anyone can fork the val and customise it

**Alpine.js** keeps the UI reactive without a build step or a framework. Declarative `x-data`, `x-model`, `x-for` — the HTML _is_ the template. Feels more like writing HTML than writing components. Tiny, understood in an afternoon.

**uPlot** is a deliberately obscure choice for the chart — it's absurdly fast (canvas-based), tiny (45kb), and used in Grafana. Using it here is overkill but educational.

**Why not:**
- React/Next.js — too much for a one-day tool, requires a build pipeline
- SvelteKit — good choice but needs Vite + Node hosting; Val Town is more self-contained
- htmx — needs a server sending HTML fragments; the tax calc is pure client-side, no server round-trips needed
- Effect-TS — genuinely interesting but the calculation domain is simple enough that its complexity would obscure the logic rather than clarify it. Revisit for the Cashflow Planner (which has more complex stateful domain logic)

## Decisions

| Decision | Choice | Why | Date |
|----------|--------|-----|------|
| Deploy target | Val Town HTTP val | Novel, instant, shareable, on the "Want to Explore" list | 2026-03-05 |
| UI framework | Alpine.js | No build step, declarative, tiny, works inside a string template | 2026-03-05 |
| Chart library | uPlot | Small, fast, interesting alternative to Chart.js | 2026-03-05 |
| State sharing | URL hash (base64 JSON) | No backend, no DB, shareable link, works offline | 2026-03-05 |
| Tax scope | England/NI PAYE only | Covers the most common case; Scotland can be a toggle later | 2026-03-05 |

## What Makes It Better Than a Spreadsheet

| Spreadsheet | Salary Showdown |
|-------------|-----------------|
| Set up from scratch every time | Open URL, start typing |
| No built-in UK tax formula | Tax calculated correctly, always up to date |
| No crossover detection | "Job B overtakes Job A in Year 3" shown automatically |
| Hard to read on a phone | Mobile-first — designed for one-handed use |
| Share by emailing a file | Share a URL — state lives in the hash |
| Generic | Purpose-built for this exact problem |

## Open Questions

- [ ] Should we show employer NI costs too (useful if comparing contractor vs perm)? — Leave for v2
- [ ] Student loan toggle? Plan 1 / 2 / 5 thresholds are meaningful for a lot of people — easy add in v1.5
- [ ] Scotland tax bands toggle? Worth having if Rob's using it to compare Scottish vs London roles

## Status

**Current phase:** Phase 1 — not started
**Last updated:** 2026-03-05
