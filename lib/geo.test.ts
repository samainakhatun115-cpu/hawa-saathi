import { describe, expect, it } from "vitest"
import { locateProfile, type GeoApi } from "@/lib/geo"
import { starterProfile } from "@/lib/validation"

describe("locateProfile", () => {
  it("asks the user to pick a city when geolocation is missing", async () => {
    const result = await locateProfile(starterProfile(), undefined)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/cannot share location/i)
  })

  it("maps a successful fix to the nearest listed city", async () => {
    const geo: GeoApi = {
      getCurrentPosition(success) {
        success({ coords: { latitude: 28.54, longitude: 77.39 } })
      },
    }
    const result = await locateProfile(starterProfile(), geo)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.profile.cityId).toBe("noida")
      expect(result.profile.latitude).toBeCloseTo(28.54)
    }
  })

  it("explains a blocked permission", async () => {
    const geo: GeoApi = {
      getCurrentPosition(_success, error) {
        error?.()
      },
    }
    const result = await locateProfile(starterProfile(), geo)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/blocked/i)
  })
})
