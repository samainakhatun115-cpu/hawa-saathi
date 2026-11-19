import type { AirSnapshot } from "@/lib/types"

const GRACE_MS = 30 * 60 * 1000

/** Hours still ahead of the observation time, with a 30-minute grace window. */
export function upcomingHourly(snapshot: AirSnapshot) {
  if (snapshot.hourlyPm25.length === 0) return []
  const now = Date.parse(snapshot.observedAt)
  const upcoming = snapshot.hourlyPm25.filter((row) => {
    const time = Date.parse(row.hour)
    return Number.isFinite(time) && (!Number.isFinite(now) || time >= now - GRACE_MS)
  })
  return upcoming.length > 0 ? upcoming : snapshot.hourlyPm25
}
