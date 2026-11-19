import { describe, expect, it } from "vitest"
import { quieterHours } from "@/lib/decide-copy"
import { upcomingHourly } from "@/lib/hours"
import { sampleSnapshot } from "@/lib/sample-snapshot"
import type { AirSnapshot } from "@/lib/types"

function snapshotWithHours(hours: Array<{ hour: string; pm25: number }>): AirSnapshot {
  const base = sampleSnapshot({
    cityId: "delhi",
    cityName: "Delhi",
    latitude: 28.61,
    longitude: 77.2,
  })
  return {
    ...base,
    observedAt: "2026-11-19T06:00:00+05:30",
    pm25: hours[0]?.pm25 ?? base.pm25,
    hourlyPm25: hours.map((row) => ({
      hour: row.hour,
      pm25: row.pm25,
      category: "Moderate",
    })),
  }
}

describe("upcomingHourly", () => {
  it("drops hours that already passed the observation time", () => {
    const snapshot = snapshotWithHours([
      { hour: "2026-11-19T04:00:00+05:30", pm25: 90 },
      { hour: "2026-11-19T07:00:00+05:30", pm25: 70 },
      { hour: "2026-11-19T09:00:00+05:30", pm25: 60 },
    ])
    expect(upcomingHourly(snapshot).map((row) => row.hour)).toEqual([
      "2026-11-19T07:00:00+05:30",
      "2026-11-19T09:00:00+05:30",
    ])
  })
})

describe("quieterHours", () => {
  it("points at later hours that are clearly cleaner than now", () => {
    const snapshot = snapshotWithHours([
      { hour: "2026-11-19T07:00:00+05:30", pm25: 140 },
      { hour: "2026-11-19T10:00:00+05:30", pm25: 90 },
      { hour: "2026-11-19T16:00:00+05:30", pm25: 70 },
    ])
    const windows = quieterHours(snapshot)
    expect(windows.length).toBeGreaterThan(0)
    expect(windows.join(" ")).toMatch(/70/)
  })

  it("returns nothing when the forecast is empty", () => {
    const snapshot = snapshotWithHours([])
    expect(quieterHours(snapshot)).toEqual([])
  })
})
