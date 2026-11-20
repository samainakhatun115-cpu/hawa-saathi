import { describe, expect, it } from "vitest"
import { CITY_ITEMS, fallbackCity, findCity, nearestCity } from "@/lib/cities"

describe("findCity", () => {
  it("finds Karnal and ignores unknown ids", () => {
    expect(findCity("karnal")?.name).toBe("Karnal")
    expect(findCity("not-a-city")).toBeUndefined()
  })
})

describe("fallbackCity", () => {
  it("is Delhi", () => {
    expect(fallbackCity().id).toBe("delhi")
  })
})

describe("nearestCity", () => {
  it("pins a Noida coordinate to Noida, not Delhi", () => {
    expect(nearestCity(28.5355, 77.391).id).toBe("noida")
  })
})

describe("CITY_ITEMS", () => {
  it("labels cities with their state", () => {
    expect(CITY_ITEMS.karnal).toMatch(/Haryana/)
  })
})
