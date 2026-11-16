import { decide } from "@/lib/decide"
import { generateJson } from "@/lib/gemini"
import type { Advisory, AdviseRequest, AirSnapshot, Decision } from "@/lib/types"
import { ACTIVITIES, DURATIONS, PERSONAS, VERDICTS, WINDOWS } from "@/lib/types"

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

export async function buildAdvisory(
  profile: AdviseRequest,
  snapshot: AirSnapshot,
): Promise<Advisory> {
  const decision = decide({
    persona: profile.persona,
    activity: profile.activity,
    duration: profile.duration,
    window: profile.window,
    snapshot,
  })

  const { data, model } = await generateJson<GeminiAdvisory>({
    system: SYSTEM,
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
  const decision = decide({
    persona: profile.persona,
    activity: profile.activity,
    duration: profile.duration,
    window: profile.window,
    snapshot,
  })
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

function defaultsNotToDo(decision: Decision) {
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

function cleanList(value: string[] | undefined, fallback: string[]) {
  const cleaned = (value ?? [])
    .map((item) => clip(item, 180))
    .filter((item) => item.length > 0)
    .slice(0, 5)
  return cleaned.length > 0 ? cleaned : fallback
}

function clip(value: string | undefined, max: number) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max)
}

function userPrompt(profile: AdviseRequest, snapshot: AirSnapshot, decision: Decision) {
  return [
    `City: ${snapshot.cityName} (${snapshot.latitude.toFixed(3)}, ${snapshot.longitude.toFixed(3)})`,
    `Air source: ${snapshot.source}`,
    `Observed: ${snapshot.observedAt}`,
    `PM2.5: ${snapshot.pm25} µg/m³`,
    `PM10: ${snapshot.pm10} µg/m³`,
    `CPCB-style PM2.5 index (estimate): ${snapshot.cpcbPm25Index} (${snapshot.category})`,
    `Persona: ${PERSONAS[profile.persona]}`,
    `Activity: ${ACTIVITIES[profile.activity]}`,
    `Duration: ${DURATIONS[profile.duration]}`,
    `When: ${WINDOWS[profile.window]}`,
    `Notes from the user: ${profile.notes || "none"}`,
    `Locked verdict from the rules engine: ${VERDICTS[decision.verdict]}`,
    `Locked headline: ${decision.headline}`,
    `Mask: ${decision.mask}`,
    `Better hours: ${decision.windows.join(" | ") || "none"}`,
    `Reasons: ${decision.reasons.join(" ")}`,
    `Actions already decided: ${decision.actions.join(" ")}`,
  ].join("\n")
}

const SYSTEM = `You write short, practical air-quality advice for people in Indian cities.
You are not a doctor. Never diagnose. Never invent pollutant numbers, AQI, or city names.
Use only the numbers and the locked verdict in the user message.
Write in plain English a Class 10 student can follow. No emojis. No medical claims.
summary: 2 sentences, what to do right now.
why: 2 sentences, grounded in the given PM2.5 and persona.
dayPlan: 3 to 5 concrete steps for the next few hours.
whatNotToDo: 2 to 4 things to skip.
Mention that the CPCB-style band is an estimate from PM2.5, not an official station AQI.`

const DISCLAIMER =
  "This is practical guidance, not medical advice and not an official CPCB / SAFAR bulletin. The air band is estimated from PM2.5 (Open-Meteo or a labeled sample), not a live government station AQI."
