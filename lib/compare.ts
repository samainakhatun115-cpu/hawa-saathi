import { decide } from "@/lib/decide"
import type { Activity, Advisory, Decision, Duration, Persona, TimeWindow } from "@/lib/types"

export const COMPARE_PERSONAS: Persona[] = ["elderly", "asthma", "parent", "outdoor_worker", "adult"]

/** Re-run only the local rules on an existing reading. Gemini is not called. */
export function comparePersona(
  advisory: Advisory,
  persona: Persona,
  activity: Activity,
  duration: Duration,
  timeWindow: TimeWindow,
): Decision {
  return decide({
    persona,
    activity,
    duration,
    window: timeWindow,
    snapshot: advisory.snapshot,
  })
}
