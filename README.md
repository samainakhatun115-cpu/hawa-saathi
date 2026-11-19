# Hawa Saathi

PromptWars Virtual **Challenge 6 — Urban Air Quality Assistant**.

A small assistant for people in Indian cities who need a straight answer: *go out, limit time, or stay in?* It reads nearby air, maps a CPCB-style band from PM2.5, then personalizes the wording for one persona.

**Chosen vertical:** household / sensitive groups in Indian cities — a parent of a school-age child, an older adult (60+), someone with asthma, an outdoor or delivery worker, or a general adult.

Live use: tap a scene (Karnal school run, Noida 60+ walk, Kolkata asthma commute) to fill the form and read the air, or fill the form yourself and tap **Should I go out?**

## Approach

1. **Numbers first.** Live PM2.5, PM10, ozone, NO₂, SO₂, and CO come from [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) (no API key). If that call fails, the app uses a **labeled sample snapshot** instead of inventing readings.
2. **A local rules engine locks the decision.** `lib/verdict.ts` applies CPCB National AQI PM2.5 breakpoints (0–30 Good, 31–60 Satisfactory, 61–90 Moderate, 91–120 Poor, 121–250 Very Poor, 250+ Severe) plus persona and activity. Gemini cannot change that verdict.
3. **Gemini writes the words, not the science.** `POST /api/advise` sends the locked numbers and verdict to Gemini (`gemini-3.5-flash-lite`) for a short plan. If the key is missing or Gemini is slow (7s), the same rules engine fills the plan so the air reading still appears.
4. **Honest labels.** The CPCB-style band is an **estimate from PM2.5**, not an official CPCB / SAFAR station AQI. Advice is practical, not medical.

## How it works

```
Profile (city, persona, activity, duration, when)
        │
        ▼
Open-Meteo current + hourly PM2.5  ──on failure──► sample snapshot
        │
        ▼
lib/verdict.ts  →  go / caution / limit / indoor + mask
        │
        ▼
POST /api/advise  →  Gemini JSON  →  summary, day plan, what not to do
        │
        ▼
Screen: band, hourly strip, locked-rules card, compare-personas, copy
```

The Gemini API key is server-only (`GEMINI_API_KEY`). It is never sent to the browser and never prefixed with `NEXT_PUBLIC_`.

## Layout

| Path | Role |
| --- | --- |
| `lib/verdict.ts` | Pure go/stay lock |
| `lib/decide-copy.ts` | Headlines, reasons, actions |
| `lib/decide.ts` | Verdict + copy + quieter hours |
| `lib/hours.ts` | Upcoming forecast hours |
| `lib/aqi.ts` | CPCB-style PM2.5 index |
| `lib/open-meteo.ts` | Live air, IST timestamps |
| `lib/gemini.ts` | Server-only generateContent |
| `lib/advisory.ts` | Merge locked decision with Gemini wording |
| `lib/validation.ts` | Request parse + localStorage sanitize |
| `app/api/advise/route.ts` | POST, no-store, 15s maxDuration |
| `components/scene-chips.tsx` | One-tap demo scenes (auto-reads the air) |
| `components/locked-rules.tsx` | Shows what Gemini is not allowed to change |
| `components/compare-personas.tsx` | Same reading, other persona, no extra Gemini call |

## Assumptions

- Open-Meteo PM2.5 is a useful **proxy** for local outdoor air. It is not a replacement for the nearest CPCB monitor.
- CPCB AQI is officially a 24-hour construct. This app applies those breakpoints to the **latest** PM2.5 so the answer can be used the same morning.
- Children, older adults, and people with asthma feel Moderate–Poor air sooner than healthy adults. Outdoor workers still have to work, so Severe air becomes “limit + N95”, not “quit the shift from an app”.
- Location is optional. Coordinates are used only to fetch nearby air.
- This is not a diagnosis, not a hospital triage tool, and not a government bulletin.

## Run locally

```bash
npm install
cp .env.example .env.local
npm test
npm run dev
```

Without a key, you still get a live (or sample) reading and a rules-engine plan.

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 43127 |
| `npm test` | Vitest: CPCB bands, verdict matrix, scenes, hours, validation, `/api/advise` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

Deploy on Vercel. Add `GEMINI_API_KEY` in project settings. Optional: `GEMINI_MODEL` (default `gemini-3.5-flash-lite`).
