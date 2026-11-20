import { afterEach, describe, expect, it, vi } from "vitest"
import { withIstOffset } from "@/lib/open-meteo"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("withIstOffset", () => {
  it("tags Open-Meteo local times as IST so they are not treated as UTC", () => {
    expect(withIstOffset("2026-11-16T17:30")).toBe("2026-11-16T17:30:00+05:30")
    expect(new Date(withIstOffset("2026-11-16T17:30")).toISOString()).toBe(
      "2026-11-16T12:00:00.000Z",
    )
  })

  it("leaves already-offset timestamps alone", () => {
    expect(withIstOffset("2026-11-16T12:00:00.000Z")).toBe("2026-11-16T12:00:00.000Z")
    expect(withIstOffset("2026-11-16T17:30:00+05:30")).toBe("2026-11-16T17:30:00+05:30")
  })
})

describe("fetchAirSnapshot", () => {
  const location = {
    cityId: "karnal",
    cityName: "Karnal",
    latitude: 29.6857,
    longitude: 76.9905,
  }

  it("uses the labeled sample when Open-Meteo is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 503 })))
    const { fetchAirSnapshot } = await import("@/lib/open-meteo")
    const snapshot = await fetchAirSnapshot(location)
    expect(snapshot.source).toBe("sample")
    expect(snapshot.cityName).toBe("Karnal")
  })

  it("maps a live payload", async () => {
    vi.resetModules()
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            current: { time: "2026-11-20T08:00", pm2_5: 42, pm10: 70 },
            hourly: { time: ["2026-11-20T08:00"], pm2_5: [42] },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    )
    const { fetchAirSnapshot } = await import("@/lib/open-meteo")
    const snapshot = await fetchAirSnapshot(location)
    expect(snapshot.source).toBe("open-meteo")
    expect(snapshot.pm25).toBe(42)
    expect(snapshot.category).toBe("Satisfactory")
  })
})
