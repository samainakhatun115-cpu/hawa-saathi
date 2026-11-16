# Hawa Saathi

PromptWars Virtual **Challenge 6 — Urban Air Quality Assistant**.

A small assistant for people in Indian cities who need a straight answer: *go out, limit time, or stay in?* It reads nearby air, maps a CPCB-style band from PM2.5, then personalizes the wording for one persona.

**Chosen vertical:** household / sensitive groups in Indian cities — a parent of a school-age child, an older adult, someone with asthma, an outdoor or delivery worker, or a general adult. Default scene: a school-gate morning in Karnal.

Live use: pick a city (or share location), say who it is for and what they need to do, then tap **Should I go out?**

## Approach

1. **Numbers first.** Live PM2.5, PM10, ozone, NO₂, SO₂, and CO come from [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) (no API key). If that call fails, the app uses a **labeled sample snapshot** instead of inventing readings.
2. **A local rules engine locks the decision.** CPCB National AQI PM2.5 breakpoints (0–30 Good, 31–60 Satisfactory, 61–90 Moderate, 91–120 Poor, 121–250 Very Poor, 250+ Severe) produce a category and a 0–500 sub-index. Persona + activity + duration then map to `go` / `caution` / `limit` / `indoor` and a mask suggestion. Gemini cannot change that verdict.
3. **Gemini writes the words, not the science.** The server sends the locked numbers and verdict to Gemini (`gemini-3.5-flash`, `thinkingBudget: 0`) and asks for a short plan in plain English. If the key is missing or Gemini is slow, the same rules engine fills the plan so the app still works.
4. **Honest labels.** The CPCB-style band is an **estimate from PM2.5**, not an official CPCB / SAFAR station AQI. Advice is practical, not medical.

## How it works

```
Profile (city, persona, activity, duration, when)
        │
        ▼
Open-Meteo current + hourly PM2.5  ──on failure──► sample snapshot
        │
        ▼
CPCB-style category + rules engine (verdict, mask, better hours)
        │
        ▼
POST /api/advise  →  Gemini JSON  →  summary, day plan, what not to do
        │
        ▼
Screen: band, hourly strip, copy-to-clipboard plan
```

The Gemini API key is server-only (`GEMINI_API_KEY`). It is never sent to the browser and never prefixed with `NEXT_PUBLIC_`.

Profile fields are stored in `localStorage` (`hawa-saathi-profile-v1`) via `useSyncExternalStore`.

## Assumptions

- Open-Meteo PM2.5 is a useful **proxy** for local outdoor air. It is not a replacement for the nearest CPCB monitor.
- CPCB AQI is officially a 24-hour construct. This app applies those breakpoints to the **latest** PM2.5 so the answer can be used the same morning.
- Children, older adults, and people with asthma feel Moderate–Poor air sooner than healthy adults. Outdoor workers still have to work, so Severe air becomes “limit + N95”, not “quit the shift from an app”.
- Location is optional. Coordinates are used only to fetch nearby air.
- This is not a diagnosis, not a hospital triage tool, and not a government bulletin.

## Run locally

```bash
npm install
cp .env.example .env.local   # paste GEMINI_API_KEY
npm test
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127). Without a key, you still get a live (or sample) reading and a rules-engine plan.

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 43127 |
| `npm test` | Vitest: CPCB bands, persona decisions, validation, `/api/advise` |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

Deploy on Vercel. Add `GEMINI_API_KEY` in project settings. Optional: `GEMINI_MODEL` (default `gemini-3.5-flash`).

## Scoring notes

| Chip | What this repo does |
| --- | --- |
| Problem statement | One vertical, one decision, usable the same morning |
| Code quality | Typed modules, files kept short, named exports |
| Security | Server-only key, input clipping, security headers |
| Efficiency | 8s air timeout, 20s Gemini timeout, `thinkingBudget: 0`, no-store |
| Testing | Band edges, parent vs worker vs asthma, API fallback |
| Accessibility | Skip link, labels, live region, focusable controls, contrast bands |

## Stack

Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui (Base UI), Vitest 3, Gemini, Open-Meteo.
