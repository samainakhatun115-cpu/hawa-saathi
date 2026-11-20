import { DISCLAIMER, GEMINI_SYSTEM, userPrompt } from "@/lib/advisory-prompt"
import { GEMINI_ADVISORY_SCHEMA, type GeminiAdvisory } from "@/lib/advisory-schema"
import { CLIP_SUMMARY, CLIP_WHY } from "@/lib/constants"
import { decide } from "@/lib/decide"
import { generateJson } from "@/lib/gemini"
import { cleanList, clip } from "@/lib/text"
import type { Advisory, AdviseRequest, AirSnapshot, Decision } from "@/lib/types"

const MEDICAL_LINE = "Do not treat this as a medical diagnosis or an official CPCB bulletin."

export function lockedDecision(profile: AdviseRequest, snapshot: AirSnapshot) {
  return decide({
    persona: profile.persona,
    activity: profile.activity,
    duration: profile.duration,
    window: profile.window,
    snapshot,
  })
}

export function composeAdvisory(
  profile: AdviseRequest,
  snapshot: AirSnapshot,
  wording: GeminiAdvisory & { model: string },
): Advisory {
  const decision = lockedDecision(profile, snapshot)
  return {
    snapshot,
    decision,
    summary: clip(wording.summary, CLIP_SUMMARY) || decision.headline,
    why: clip(wording.why, CLIP_WHY) || decision.reasons[0] || "",
    dayPlan: cleanList(wording.dayPlan, decision.actions),
    whatNotToDo: cleanList(wording.whatNotToDo, defaultsNotToDo(decision)),
    disclaimer: DISCLAIMER,
    model: wording.model,
  }
}

export async function buildAdvisory(
  profile: AdviseRequest,
  snapshot: AirSnapshot,
): Promise<Advisory> {
  const decision = lockedDecision(profile, snapshot)
  const { data, model } = await generateJson<GeminiAdvisory>({
    system: GEMINI_SYSTEM,
    user: userPrompt(profile, snapshot, decision),
    schema: GEMINI_ADVISORY_SCHEMA,
  })
  return composeAdvisory(profile, snapshot, { ...data, model })
}

export function localAdvisory(profile: AdviseRequest, snapshot: AirSnapshot): Advisory {
  const decision = lockedDecision(profile, snapshot)
  return composeAdvisory(profile, snapshot, {
    summary: decision.headline,
    why: decision.reasons.join(" "),
    dayPlan: decision.actions,
    whatNotToDo: defaultsNotToDo(decision),
    model: "rules-engine",
  })
}

export function defaultsNotToDo(decision: Decision) {
  if (decision.verdict === "indoor" || decision.verdict === "limit") {
    return [
      MEDICAL_LINE,
      "Do not go for a long outdoor run or playground session.",
      "Do not burn trash or incense if you can avoid extra indoor smoke.",
    ]
  }
  return [
    MEDICAL_LINE,
    "Do not ignore tightness in the chest — that is a reason to go inside, not to push on.",
  ]
}
