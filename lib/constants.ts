/** Timeouts live in one place so the UI, air fetch, and Gemini stay in sync. */
export const ADVISE_CLIENT_TIMEOUT_MS = 18_000
export const GEO_TIMEOUT_MS = 8_000
export const GEO_MAXIMUM_AGE_MS = 300_000
export const OPEN_METEO_TIMEOUT_MS = 8_000
export const GEMINI_TIMEOUT_MS = 7_000

export const MAX_NOTES = 280
export const MAX_CITY_NAME = 80
export const CLIP_SUMMARY = 420
export const CLIP_WHY = 500
export const CLIP_LIST_ITEM = 180
export const MAX_PLAN_ITEMS = 5
export const HOURLY_FORECAST_HOURS = 24

export const GEMINI_SLOW_NOTICE =
  "The air numbers and go / stay-in decision are live. Gemini was slow, so the wording used the local rules engine."
