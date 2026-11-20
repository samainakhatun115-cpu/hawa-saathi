import { DISCLAIMER, GEMINI_SYSTEM, userPrompt } from "@/lib/advisory-prompt"
import { decide } from "@/lib/decide"
import { generateJson } from "@/lib/gemini"
import { cleanList, clip } from "@/lib/text"
import type { Advisory, AdviseRequest, AirSnapshot, Decision } from "@/lib/types"

type GeminiAdvisory = {
  summary: string
  why: string
  dayPlan: string[]
  whatNotToDo: string[]
}

const SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    why: { type: "STRING" },
    dayPlan: { type: "ARRAY", items: { type: "STRING" } },
    whatNotToDo: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summary", "why", "dayPlan", "whatNotToDo"],
}

function lockedDecision(profile: AdviseRequest, snapshot: AirSnapshot) {
  return decide({
    persona: profile.persona,
    activity: profile.activity,
    duration: profile.duration,
    window: profile.window,
    snapshot,
  })
}

export async function buildAdvisory(
  profile: AdviseRequest,
  snapshot: AirSnapshot,
): Promise<Advisory> {
  const decision = lockedDecision(profile, snapshot)
  const { data, model } = await generateJson<GeminiAdvisory>({
    system: GEMINI_SYSTEM,
    user: userPrompt(profile, snapshot, decision),
    schema: SCHEMA,
  })

  return {
    snapshot,
    decision,
    summary: clip(data.summary, 420) || decision.headline,
    why: clip(data.why, 500) || decision.reasons[0],
    dayPlan: cleanList(data.dayPlan, decision.actions),
    whatNotToDo: cleanList(data.whatNotToDo, defaultsNotToDo(decision)),
    disclaimer: DISCLAIMER,
    model,
  }
}

export function localAdvisory(profile: AdviseRequest, snapshot: AirSnapshot): Advisory {
  const decision = lockedDecision(profile, snapshot)
  return {
    snapshot,
    decision,
    summary: decision.headline,
    why: decision.reasons.join(" "),
    dayPlan: decision.actions,
    whatNotToDo: defaultsNotToDo(decision),
    disclaimer: DISCLAIMER,
    model: "rules-engine",
  }
}

export function defaultsNotToDo(decision: Decision) {
  if (decision.verdict === "indoor" || decision.verdict === "limit") {
    return [
      "Do not treat this as a medical diagnosis or an official CPCB bulletin.",
      "Do not go for a long outdoor run or playground session.",
      "Do not burn trash or incense if you can avoid extra indoor smoke.",
    ]
  }
  return [
    "Do not treat this as a medical diagnosis or an official CPCB bulletin.",
    "Do not ignore tightness in the chest — that is a reason to go inside, not to push on.",
  ]
}
