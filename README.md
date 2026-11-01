# Mehfil — AI Celebration & Event Planner

Mehfil is a generative AI celebration and event planner built for [PromptWars Virtual Challenge 5](https://promptwars.in/promptwarsVirtual.html) (**Celebration & Event Planner** — weddings, birthdays, and community gatherings).

A host enters their event brief (event type, date, city, guest count, total budget in INR, dietary preference, indoor/outdoor setting, and custom notes). Mehfil uses **Google Gemini** (`gemini-3.6-flash` with automatic fallback to `gemini-3.5-flash`) to generate a structured, editable celebration plan across five interactive modules while preserving user-locked edits across AI refinements.

- **Live Deployment:** [https://mehfil-planner.vercel.app](https://mehfil-planner.vercel.app)
- **Demo Video:** [https://youtu.be/dTWfgk5rYD4](https://youtu.be/dTWfgk5rYD4)

---

## Problem Statement Alignment

Mehfil addresses every planning requirement of Challenge 5 with honest guardrails:

1. **Interactive Budget Planner (`components/budget-panel.tsx`)**
   - Generates itemized INR budget allocations tailored to the event type, guest count, and setting.
   - Calculates real-time planned spend, remaining balance, per-guest cost (`₹/guest`), and visual spend meter (`role="meter"`).
   - Flags an immediate **over-budget warning** with the exact rupee overrun whenever edited estimates exceed the host's cap.
   - All figures are explicitly labeled as **estimates**, never confirmed bookings.

2. **Prioritized Task Timeline & Countdown (`components/timeline-panel.tsx`)**
   - Generates dated preparation tasks sorted chronologically and by priority (`High`, `Medium`, `Low`).
   - Displays a live event countdown (`Today`, `Tomorrow`, `In N days`), completion progress (`X of Y tasks completed`), checkable task rows, and an inline form to add custom tasks.

3. **Safe Vendor Category Checklist (`components/vendor-panel.tsx`)**
   - Lists essential vendor categories (`Venue`, `Catering`, `Decor`, `Photographer`, `Cake`, `Sound or chairs`) with contextual guidance.
   - **Zero-hallucination guardrail:** Server-side normalization strips any AI-invented shop names or phone numbers. Hosts enter real contact names, phone numbers, quotes in INR, and booking statuses (`Pending`, `Quoted`, `Confirmed`), and can add or remove custom vendors.
   - Private contact names and phone numbers are never sent back to Gemini during plan refinement.

4. **Personalized Ideas & Non-Destructive AI Refinement (`components/ideas-panel.tsx`, `lib/merge.ts`)**
   - Generates tailored theme, menu, decor, and logistics ideas for the host's city, diet, and indoor/outdoor setting.
   - Includes one-click quick-refine prompts and a follow-up refinement form that revises the plan via Gemini while preserving `amountLocked` budget lines, `doneLocked` tasks, `detailsLocked` vendor records, and `locked` schedule rows.

5. **Editable Day-Of Schedule & Plan Export (`components/day-of-panel.tsx`, `components/plan-workspace.tsx`)**
   - Provides a 7-step hour-by-hour run sheet (`HH:MM` 24-hour input with 12-hour `AM/PM` display, moment title, and notes) clearly labeled as a suggested schedule.
   - Supports one-click **Copy summary** to export the entire plan as clean plain text for sharing, and persists state in browser `localStorage` via `useSyncExternalStore`.

---

## Architecture & Code Quality

The codebase is organized into small, single-responsibility TypeScript modules with strict static typing and zero `any`:

```text
├── app/
│   ├── api/plan/
│   │   ├── route.ts          # Server-only POST /api/plan handler with timeout & error mapping
│   │   └── route.test.ts     # API route unit & integration tests
│   ├── error.tsx             # Next.js App Router error boundary
│   ├── loading.tsx           # Next.js App Router loading skeleton
│   ├── layout.tsx            # Root layout & typography
│   └── page.tsx              # Home page with skip-to-workspace accessibility link
├── components/
│   ├── planner-app.tsx       # Top-level planner coordinator
│   ├── brief-form.tsx        # Validated event brief form
│   ├── plan-workspace.tsx    # Tabbed plan workspace & plain-text export
│   ├── budget-panel.tsx      # Editable budget lines, per-guest math & spend meter
│   ├── timeline-panel.tsx    # Sorted task checklist, progress tracker & custom task form
│   ├── vendor-panel.tsx      # Category-only vendor tracker & custom vendor controls
│   ├── ideas-panel.tsx       # Personalized ideas & follow-up refinement form
│   └── day-of-panel.tsx      # Editable hour-by-hour event-day schedule
├── hooks/
│   └── use-plan-store.ts     # External store hook syncing brief & plan with localStorage
└── lib/
    ├── types.ts              # Domain interfaces, union types, labels & validation limits
    ├── format.ts             # INR/date formatting, sanitization, budget & task math
    ├── sample-plan.ts        # Deterministic local sample plan & schedule generators
    ├── validation.ts         # Brief validation & Gemini output normalization
    ├── merge.ts              # Non-destructive O(n) refinement merging
    ├── storage.ts            # Safe localStorage & request payload parsers
    ├── gemini.ts             # Server-only Gemini API client with structured JSON schema
    ├── plan.ts               # Public barrel exports for planner domain modules
    └── plan.test.ts          # Domain unit test suite
```

---

## Evaluation Criteria Coverage

- **Security:** `GEMINI_API_KEY` is read exclusively on the server (`app/api/plan/route.ts`) and never exposed to client bundles. Request bodies are capped at 100 KB, all fields are strictly validated and control-character stripped (`cleanText`, `cleanMoney`, `cleanDate`), private vendor contacts are stripped before refinement prompts (`planForPrompt`), and HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control: no-store`) are enforced.
- **Efficiency:** Uses `gemini-3.6-flash` with `thinkingBudget: 0`, structured `responseSchema`, a 20-second `AbortSignal.timeout`, automatic retry/fallback to `gemini-3.5-flash` on `429`/`503`, and O(n) client state updates.
- **Accessibility:** Semantic landmarks, skip-to-workspace link, explicit `<Label htmlFor>` bindings, `aria-invalid` and `aria-describedby` field error associations, `role="meter"` for budget progress, and `aria-live="polite"` status announcements.
- **Testing:** Automated Vitest suite (`lib/plan.test.ts` and `app/api/plan/route.test.ts`) covering budget math, over-budget detection, chronological/priority task sorting, hallucinated contact stripping, refinement lock preservation, storage round-tripping, and API error codes (`400`, `503`, `200`).

---

## Local Setup

```bash
npm install
cp .env.example .env.local
```

Add your Gemini API key to `.env.local` as `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/apikey)). Never commit `.env.local` or prefix the variable with `NEXT_PUBLIC_`.

```bash
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

```bash
npm test
npm run lint
npm run build
```
