import { describe, expect, it } from "vitest"
import { airQueryFor, applyCityId } from "@/lib/city-profile"
import { starterProfile } from "@/lib/validation"

describe("applyCityId", () => {
  it("replaces Karnal's pin when the user picks Kolkata", () => {
    const next = applyCityId(starterProfile(), "kolkata")
    expect(next.cityId).toBe("kolkata")
    expect(next.cityName).toBe("Kolkata")
    expect(next.latitude).toBeCloseTo(22.5726)
    expect(next.longitude).toBeCloseTo(88.3639)
  })
})

describe("airQueryFor", () => {
  it("uses the selected city pin", () => {
    const query = airQueryFor(starterProfile())
    expect(query.cityName).toBe("Karnal")
    expect(query.latitude).toBeCloseTo(29.6857)
  })

  it("falls back to Delhi when city and coordinates are missing", () => {
    const query = airQueryFor({
      ...starterProfile(),
      cityId: "custom",
      cityName: undefined,
      latitude: undefined,
      longitude: undefined,
    })
    expect(query.cityName).toBe("Your location")
    expect(query.latitude).toBeCloseTo(28.6139)
    expect(query.longitude).toBeCloseTo(77.209)
  })
})
