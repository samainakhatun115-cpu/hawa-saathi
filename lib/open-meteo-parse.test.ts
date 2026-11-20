import { describe, expect, it } from "vitest"
import { finiteOrNull, snapshotFromOpenMeteo, withIstOffset } from "@/lib/open-meteo-parse"

const karnal = {
  cityId: "karnal",
  cityName: "Karnal",
  latitude: 29.6857,
  longitude: 76.9905,
}

describe("snapshotFromOpenMeteo", () => {
  it("maps current PM2.5, CPCB band, and hourly rows", () => {
    const snapshot = snapshotFromOpenMeteo(karnal, {
      current: {
        time: "2026-11-20T18:30",
        pm2_5: 152,
        pm10: 153,
        ozone: 61,
        nitrogen_dioxide: 133,
        sulphur_dioxide: 75,
        carbon_monoxide: 3074,
        us_aqi: 222,
      },
      hourly: {
        time: ["2026-11-20T18:00", "2026-11-20T19:00"],
        pm2_5: [152, null],
      },
    })
    expect(snapshot).not.toBeNull()
    if (!snapshot) return
    expect(snapshot.source).toBe("open-meteo")
    expect(snapshot.pm25).toBe(152)
    expect(snapshot.category).toBe("Very Poor")
    expect(snapshot.observedAt).toBe("2026-11-20T18:30:00+05:30")
    expect(snapshot.hourlyPm25).toHaveLength(1)
    expect(snapshot.no2).toBe(133)
    expect(snapshot.usAqi).toBe(222)
  })

  it("returns null when PM2.5 is missing", () => {
    expect(snapshotFromOpenMeteo(karnal, { current: { pm10: 80 } })).toBeNull()
    expect(snapshotFromOpenMeteo(karnal, null)).toBeNull()
  })
})

describe("finiteOrNull", () => {
  it("keeps finite numbers and drops the rest", () => {
    expect(finiteOrNull(12)).toBe(12)
    expect(finiteOrNull(Number.NaN)).toBeNull()
    expect(finiteOrNull("12")).toBeNull()
  })
})

describe("withIstOffset", () => {
  it("tags Open-Meteo local times as IST so they are not treated as UTC", () => {
    expect(withIstOffset("2026-11-16T17:30")).toBe("2026-11-16T17:30:00+05:30")
  })
})
