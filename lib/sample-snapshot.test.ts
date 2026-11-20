import { describe, expect, it } from "vitest"
import { sampleSnapshot } from "@/lib/sample-snapshot"

describe("sampleSnapshot", () => {
  it("is labeled sample and keeps the requested city", () => {
    const snapshot = sampleSnapshot({
      cityId: "kolkata",
      cityName: "Kolkata",
      latitude: 22.57,
      longitude: 88.36,
    })
    expect(snapshot.source).toBe("sample")
    expect(snapshot.cityName).toBe("Kolkata")
    expect(snapshot.hourlyPm25.length).toBeGreaterThan(0)
    expect(snapshot.category).toBe("Very Poor")
  })
})
