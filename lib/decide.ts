import { actions, headline, quieterHours, reasons } from "@/lib/decide-copy"
import type { Activity, AirSnapshot, Decision, Duration, Persona, TimeWindow } from "@/lib/types"
import { verdictFor } from "@/lib/verdict"

export function decide(input: {
  persona: Persona
  activity: Activity
  duration: Duration
  window: TimeWindow
  snapshot: AirSnapshot
}): Decision {
  const { persona, activity, duration, window, snapshot } = input
  const locked = verdictFor({
    persona,
    activity,
    duration,
    category: snapshot.category,
  })
  const quieter = quieterHours(snapshot)
  const windows =
    quieter.length > 0
      ? quieter
      : ["No clearly cleaner hour in the next forecast — keep outdoor time short."]

  return {
    verdict: locked.verdict,
    headline: headline(locked.verdict, persona, activity, snapshot),
    reasons: reasons({
      activity,
      duration,
      window,
      snapshot,
      sensitive: locked.sensitive,
      long: duration === "half_day" || duration === "full_day",
    }),
    actions: actions({
      verdict: locked.verdict,
      mask: locked.mask,
      persona,
      activity,
    }),
    mask: locked.mask,
    windows,
    sensitive: locked.sensitive,
  }
}
