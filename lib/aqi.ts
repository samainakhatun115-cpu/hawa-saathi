import { CATEGORIES, type AqiCategory, type Persona } from "@/lib/types"

/**
 * CPCB National Ambient Air Quality Index uses 24-hour PM2.5 sub-index
 * breakpoints. Live station AQI is official; this is an estimate from the
 * latest PM2.5 reading so the app can still give a local, labeled band.
 * Source: CPCB NAQI (PM2.5 µg/m³): 0-30, 31-60, 61-90, 91-120, 121-250, 250+.
 */
const PM25_BREAKS = [
  { high: 30, iLow: 0, iHigh: 50, category: "Good" as const },
  { high: 60, iLow: 51, iHigh: 100, category: "Satisfactory" as const },
  { high: 90, iLow: 101, iHigh: 200, category: "Moderate" as const },
  { high: 120, iLow: 201, iHigh: 300, category: "Poor" as const },
  { high: 250, iLow: 301, iHigh: 400, category: "Very Poor" as const },
  { high: Number.POSITIVE_INFINITY, iLow: 401, iHigh: 500, category: "Severe" as const },
]

const PM25_LOWS = [0, 31, 61, 91, 121, 251]

export function categoryFromPm25(pm25: number): AqiCategory {
  if (!Number.isFinite(pm25) || pm25 < 0) return "Good"
  const band = PM25_BREAKS.find((row) => pm25 <= row.high)
  return band?.category ?? "Severe"
}

export function cpcbPm25Index(pm25: number): number {
  if (!Number.isFinite(pm25) || pm25 < 0) return 0
  const clamped = Math.min(pm25, 500)
  const bandIndex = PM25_BREAKS.findIndex((row) => clamped <= row.high)
  const i = bandIndex === -1 ? PM25_BREAKS.length - 1 : bandIndex
  const { iLow, iHigh, high } = PM25_BREAKS[i]
  const bpLow = PM25_LOWS[i]
  const bpHigh = Number.isFinite(high) ? high : 500
  const index = ((iHigh - iLow) / (bpHigh - bpLow)) * (clamped - bpLow) + iLow
  return Math.round(Math.min(500, Math.max(0, index)))
}

export const RANK_GOOD = CATEGORIES.indexOf("Good")
export const RANK_SATISFACTORY = CATEGORIES.indexOf("Satisfactory")
export const RANK_MODERATE = CATEGORIES.indexOf("Moderate")
export const RANK_POOR = CATEGORIES.indexOf("Poor")

export function categoryRank(category: AqiCategory): number {
  return CATEGORIES.indexOf(category)
}

export function isSensitive(persona: Persona): boolean {
  return persona === "parent" || persona === "elderly" || persona === "asthma"
}
