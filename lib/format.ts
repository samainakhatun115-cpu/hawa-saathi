import { VERDICTS, type Advisory, type AirSnapshot, type Decision } from "@/lib/types"

export function pollutantLabel(value: number | null, unit: string) {
  if (value === null || !Number.isFinite(value)) return "—"
  return `${Math.round(value)} ${unit}`
}

export function copyText(advisory: Advisory): string {
  const { snapshot, decision } = advisory
  const lines = [
    `Hawa Saathi — ${snapshot.cityName}`,
    `${VERDICTS[decision.verdict]} · ${snapshot.category} (PM2.5 ~${Math.round(snapshot.pm25)} µg/m³)`,
    advisory.summary,
    "",
    "Do this:",
    ...advisory.dayPlan.map((item) => `• ${item}`),
    "",
    "Avoid:",
    ...advisory.whatNotToDo.map((item) => `• ${item}`),
    "",
    advisory.disclaimer,
  ]
  return lines.join("\n")
}

export function observedLabel(snapshot: AirSnapshot) {
  const time = new Date(snapshot.observedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  })
  const source =
    snapshot.source === "open-meteo" ? "Open-Meteo estimate" : "sample snapshot (live air unavailable)"
  return `${time} IST · ${source}`
}

export function maskLabel(mask: Decision["mask"]) {
  if (mask === "n95") return "N95 / KN95 if you go out"
  if (mask === "recommended") return "Mask recommended outdoors"
  if (mask === "optional") return "Mask optional"
  return "Mask not needed for a short trip"
}

export function categoryTone(category: AirSnapshot["category"]) {
  if (category === "Good") return "good"
  if (category === "Satisfactory") return "ok"
  if (category === "Moderate") return "watch"
  if (category === "Poor") return "poor"
  if (category === "Very Poor") return "very-poor"
  return "severe"
}
