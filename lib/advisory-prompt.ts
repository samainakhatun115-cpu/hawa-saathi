import type { AdviseRequest, AirSnapshot, Decision } from "@/lib/types"
import { ACTIVITIES, DURATIONS, PERSONAS, VERDICTS, WINDOWS } from "@/lib/types"

export const DISCLAIMER =
  "This is practical guidance, not medical advice and not an official CPCB / SAFAR bulletin. The air band is estimated from PM2.5 (Open-Meteo or a labeled sample), not a live government station AQI."

export const GEMINI_SYSTEM = `You write short, practical air-quality advice for people in Indian cities.
You are not a doctor. Never diagnose. Never invent pollutant numbers, AQI, or city names.
Use only the numbers and the locked verdict in the user message.
Write in plain English a Class 10 student can follow. No emojis. No medical claims.
summary: 2 sentences, what to do right now.
why: 2 sentences, grounded in the given PM2.5 and persona.
dayPlan: 3 to 5 concrete steps for the next few hours.
whatNotToDo: 2 to 4 things to skip.
Mention that the CPCB-style band is an estimate from PM2.5, not an official station AQI.`

export function userPrompt(profile: AdviseRequest, snapshot: AirSnapshot, decision: Decision) {
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
