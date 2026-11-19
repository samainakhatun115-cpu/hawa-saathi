import { categoryRank, isSensitive } from "@/lib/aqi"
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
  const rank = categoryRank(input.category)
  const sensitive = isSensitive(input.persona)
  const long = input.duration === "half_day" || input.duration === "full_day"
  const outdoor = input.activity !== "stay_home"
  const mustWork = input.activity === "outdoor_work" || input.persona === "outdoor_worker"
  const play = input.activity === "outdoor_exercise" || input.activity === "school_run"

  let verdict: Verdict = "go"
  let mask: MaskAdvice = "none"

  if (rank <= 1) {
    verdict = sensitive && play && long ? "caution" : "go"
    mask = sensitive && rank === 1 ? "optional" : "none"
  } else if (rank === 2) {
    verdict = sensitive && play ? "limit" : "caution"
    mask = sensitive || mustWork ? "recommended" : "optional"
  } else if (rank === 3) {
    verdict = (sensitive || play) && !mustWork ? "indoor" : "limit"
    mask = "recommended"
  } else {
    verdict = mustWork ? "limit" : "indoor"
    mask = "n95"
  }

  if (input.activity === "stay_home" && rank >= 3) verdict = "indoor"
  if (!outdoor && rank <= 2) verdict = "go"

  return { verdict, mask, sensitive }
}
