import { describe, expect, it } from "vitest"
import { applyCityId } from "@/lib/city-profile"
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
