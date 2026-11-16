import { categoryRank, isSensitive } from "@/lib/aqi"
import type { Activity, AirSnapshot, Decision, Duration, Persona, TimeWindow } from "@/lib/types"

export function decide(input: {
  persona: Persona
  activity: Activity
  duration: Duration
  window: TimeWindow
  snapshot: AirSnapshot
}): Decision {
  const { persona, activity, duration, window, snapshot } = input
  const rank = categoryRank(snapshot.category)
  const sensitive = isSensitive(persona)
  const long = duration === "half_day" || duration === "full_day"
  const outdoor = activity !== "stay_home"
  const mustWork = activity === "outdoor_work" || persona === "outdoor_worker"
  const play = activity === "outdoor_exercise" || activity === "school_run"

  let verdict: Decision["verdict"] = "go"
  let mask: Decision["mask"] = "none"

  if (rank <= 1) {
    verdict = sensitive && play && long ? "caution" : "go"
    mask = sensitive && rank === 1 ? "optional" : "none"
  } else if (rank === 2) {
    verdict = sensitive && play ? "limit" : "caution"
    mask = sensitive || mustWork ? "recommended" : "optional"
  } else if (rank === 3) {
    verdict = mustWork ? "limit" : sensitive || play ? "indoor" : "limit"
    mask = "recommended"
  } else {
    verdict = mustWork ? "limit" : "indoor"
    mask = "n95"
  }

  if (activity === "stay_home" && rank >= 3) verdict = "indoor"
  if (!outdoor && rank <= 2) verdict = "go"

  const quieter = quieterHours(snapshot)
  const windows =
    quieter.length > 0
      ? quieter
      : ["No clearly cleaner hour in the next forecast — keep outdoor time short."]

  return {
    verdict,
    headline: headline(verdict, persona, activity, snapshot),
    reasons: reasons({ persona, activity, duration, window, snapshot, sensitive, long }),
    actions: actions({ verdict, mask, persona, activity, snapshot }),
    mask,
    windows,
    sensitive,
  }
}

function headline(
  verdict: Decision["verdict"],
  persona: Persona,
  activity: Activity,
  snapshot: AirSnapshot,
) {
  const who =
    persona === "parent"
      ? "for your child"
      : persona === "outdoor_worker"
        ? "for outdoor work"
        : "for you"
  const act =
    activity === "stay_home"
      ? "today"
      : activity.replaceAll("_", " ")
  if (verdict === "go") return `${snapshot.category} air ${who} — ${act} can go ahead.`
  if (verdict === "caution") return `${snapshot.category} air ${who} — go, but keep it short.`
  if (verdict === "limit") return `${snapshot.category} air ${who} — cut outdoor time.`
  return `${snapshot.category} air ${who} — stay indoors if you can.`
}

function reasons(input: {
  persona: Persona
  activity: Activity
  duration: Duration
  window: TimeWindow
  snapshot: AirSnapshot
  sensitive: boolean
  long: boolean
}) {
  const { snapshot, sensitive, long, activity, window } = input
  const out = [
    `PM2.5 is about ${Math.round(snapshot.pm25)} µg/m³, which maps to a CPCB-style ${snapshot.category} band (estimate, not an official station AQI).`,
  ]
  if (sensitive) {
    out.push("Children, older adults, and people with asthma feel this air sooner than healthy adults.")
  }
  if (long && activity !== "stay_home") {
    out.push("A longer stretch outdoors raises exposure even if the hour looks only moderately bad.")
  }
  if (window === "morning" && snapshot.category !== "Good") {
    out.push("Winter and post-harvest mornings in north India often trap pollution closer to the ground.")
  }
  if (snapshot.source === "sample") {
    out.push("Live air data was unavailable, so this uses a labeled sample snapshot.")
  }
  return out.slice(0, 4)
}

function actions(input: {
  verdict: Decision["verdict"]
  mask: Decision["mask"]
  persona: Persona
  activity: Activity
  snapshot: AirSnapshot
}) {
  const { verdict, mask, persona, activity } = input
  const items: string[] = []
  if (verdict === "indoor") {
    items.push("Keep windows closed during the worst hours. Use a room with fewer outdoor leaks if you can.")
    items.push("Move PE, play, and non-urgent errands indoors.")
  } else if (verdict === "limit") {
    items.push("Do only what cannot wait. Prefer the cleaner hours in the forecast strip.")
    items.push("Take breaks indoors. Avoid heavy breathing (running, shouting play) outdoors.")
  } else if (verdict === "caution") {
    items.push("Keep the outing shorter than planned. Choose a quieter street over a main road if you can.")
  } else {
    items.push("Air looks workable. Still rinse face and hands after a dusty commute.")
  }

  if (mask === "n95") items.push("If you must go out, wear a well-fitted N95/KN95. Cloth and loose surgical masks are not enough today.")
  else if (mask === "recommended") items.push("Wear a well-fitted mask outdoors, especially near traffic.")
  else if (mask === "optional") items.push("A mask is optional for a short trip, useful if you are near traffic or feel tightness.")

  if (persona === "parent") items.push("If the school has an indoor option, use it. Skip outdoor assembly when the band is Poor or worse.")
  if (persona === "outdoor_worker") items.push("Ask for indoor tasks or shorter shifts if the band is Poor or worse. Drink water; dust plus heat is harder work.")
  if (activity === "outdoor_exercise" && verdict !== "go") {
    items.push("Swap the outdoor run for indoor movement. Do not 'push through' Poor air.")
  }
  return items.slice(0, 5)
}

function quieterHours(snapshot: AirSnapshot): string[] {
  if (snapshot.hourlyPm25.length === 0) return []
  const now = Date.parse(snapshot.observedAt)
  const upcoming = snapshot.hourlyPm25.filter((row) => {
    const time = Date.parse(row.hour)
    return Number.isFinite(time) && (!Number.isFinite(now) || time >= now - 30 * 60 * 1000)
  })
  const pool = upcoming.length > 0 ? upcoming : snapshot.hourlyPm25
  const baseline = pool[0]?.pm25 ?? snapshot.pm25
  return [...pool]
    .sort((a, b) => a.pm25 - b.pm25)
    .filter((row) => row.pm25 + 5 < baseline)
    .slice(0, 3)
    .map((row) => {
      const hour = new Date(row.hour).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      })
      return `${hour} looks comparatively better (~${Math.round(row.pm25)} µg/m³ PM2.5).`
    })
}
