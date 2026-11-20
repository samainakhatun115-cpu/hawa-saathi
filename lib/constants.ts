/** Timeouts live in one place so the UI, air fetch, and Gemini stay in sync. */
export const ADVISE_CLIENT_TIMEOUT_MS = 18_000
export const GEO_TIMEOUT_MS = 8_000
export const GEO_MAXIMUM_AGE_MS = 300_000
/** Air fetch fails over to a labeled sample, so keep this short and give Gemini the rest of the 15s route budget. */
export const OPEN_METEO_TIMEOUT_MS = 4_000
export const GEMINI_TIMEOUT_MS = 10_000
/** Matches `export const maxDuration = 15` on POST /api/advise (must stay a numeric literal there). */
export const ROUTE_TIME_BUDGET_MS = 15_000

export const MAX_NOTES = 280
export const MAX_CITY_NAME = 80
export const CLIP_SUMMARY = 420
export const CLIP_WHY = 500
export const CLIP_LIST_ITEM = 180
export const MAX_PLAN_ITEMS = 5
export const HOURLY_FORECAST_HOURS = 24

export const GEMINI_SLOW_NOTICE =
  "The air numbers and go / stay-in decision are live. Gemini was slow, so the wording used the local rules engine."
