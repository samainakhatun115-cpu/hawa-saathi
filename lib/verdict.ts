import { RANK_MODERATE, RANK_POOR, RANK_SATISFACTORY, categoryRank, isSensitive } from "@/lib/aqi"
import type { Activity, AqiCategory, Duration, MaskAdvice, Persona, Verdict } from "@/lib/types"

export type VerdictInput = {
  persona: Persona
  activity: Activity
  duration: Duration
  category: AqiCategory
}

export type VerdictResult = {
  verdict: Verdict
  mask: MaskAdvice
  sensitive: boolean
}

type BandContext = {
  rank: number
  sensitive: boolean
  long: boolean
  outdoor: boolean
  mustWork: boolean
  play: boolean
}

/**
 * Lock go / caution / limit / indoor from the CPCB-style band plus who and what.
 * Gemini never sees this until after it is decided.
 *
 * - Good / Satisfactory: go, unless a sensitive person has long outdoor play
 * - Moderate: caution, or limit for sensitive play
 * - Poor: indoor for sensitive people and play; limit for essential outdoor work
 * - Very Poor / Severe: indoor, except essential outdoor work → limit + N95
 * - stay_home is never treated as an outdoor outing when the band is Moderate or better
 */
export function verdictFor(input: VerdictInput): VerdictResult {
  const ctx = bandContext(input)
  const outdoor = outdoorBand(ctx)
  if (ctx.outdoor) return outdoor
  return {
    ...outdoor,
    verdict: ctx.rank >= RANK_POOR ? "indoor" : "go",
  }
}

function bandContext(input: VerdictInput): BandContext {
  return {
    rank: categoryRank(input.category),
    sensitive: isSensitive(input.persona),
    long: input.duration === "half_day" || input.duration === "full_day",
    outdoor: input.activity !== "stay_home",
    mustWork: input.activity === "outdoor_work" || input.persona === "outdoor_worker",
    play: input.activity === "outdoor_exercise" || input.activity === "school_run",
  }
}

function outdoorBand(ctx: BandContext): VerdictResult {
  if (ctx.rank <= RANK_SATISFACTORY) {
    return {
      verdict: ctx.sensitive && ctx.play && ctx.long ? "caution" : "go",
      mask: ctx.sensitive && ctx.rank === RANK_SATISFACTORY ? "optional" : "none",
      sensitive: ctx.sensitive,
    }
  }
  if (ctx.rank === RANK_MODERATE) {
    return {
      verdict: ctx.sensitive && ctx.play ? "limit" : "caution",
      mask: ctx.sensitive || ctx.mustWork ? "recommended" : "optional",
      sensitive: ctx.sensitive,
    }
  }
  if (ctx.rank === RANK_POOR) {
    return {
      verdict: (ctx.sensitive || ctx.play) && !ctx.mustWork ? "indoor" : "limit",
      mask: "recommended",
      sensitive: ctx.sensitive,
    }
  }
  return {
    verdict: ctx.mustWork ? "limit" : "indoor",
    mask: "n95",
    sensitive: ctx.sensitive,
  }
}
