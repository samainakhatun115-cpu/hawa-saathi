import { upcomingHourly } from "@/lib/hours"
import type { Activity, AirSnapshot, Decision, Duration, MaskAdvice, Persona, TimeWindow } from "@/lib/types"

export function headline(
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
  const act = activity === "stay_home" ? "today" : activity.replaceAll("_", " ")
  if (verdict === "go") return `${snapshot.category} air ${who} — ${act} can go ahead.`
  if (verdict === "caution") return `${snapshot.category} air ${who} — go, but keep it short.`
  if (verdict === "limit") return `${snapshot.category} air ${who} — cut outdoor time.`
  return `${snapshot.category} air ${who} — stay indoors if you can.`
}

export function reasons(input: {
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

export function actions(input: {
  verdict: Decision["verdict"]
  mask: MaskAdvice
  persona: Persona
  activity: Activity
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

  if (mask === "n95") {
    items.push("If you must go out, wear a well-fitted N95/KN95. Cloth and loose surgical masks are not enough today.")
  } else if (mask === "recommended") {
    items.push("Wear a well-fitted mask outdoors, especially near traffic.")
  } else if (mask === "optional") {
    items.push("A mask is optional for a short trip, useful if you are near traffic or feel tightness.")
  }

  if (persona === "parent") {
    items.push("If the school has an indoor option, use it. Skip outdoor assembly when the band is Poor or worse.")
  }
  if (persona === "outdoor_worker") {
    items.push("Ask for indoor tasks or shorter shifts if the band is Poor or worse. Drink water; dust plus heat is harder work.")
  }
  if (activity === "outdoor_exercise" && verdict !== "go") {
    items.push("Swap the outdoor run for indoor movement. Do not 'push through' Poor air.")
  }
  return items.slice(0, 5)
}

export function quieterHours(snapshot: AirSnapshot): string[] {
  const pool = upcomingHourly(snapshot)
  if (pool.length === 0) return []
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
