import { describe, expect, it } from "vitest"
import { parseAdviseRequest, sanitizeProfile, starterProfile } from "@/lib/validation"

describe("parseAdviseRequest", () => {
  const valid = {
    cityId: "karnal",
    persona: "parent",
    activity: "school_run",
    duration: "under_30",
    window: "morning",
    notes: "walks to the gate",
  }

  it("accepts a complete city profile", () => {
    const parsed = parseAdviseRequest(valid)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.latitude).toBeCloseTo(29.6857)
      expect(parsed.value.notes).toBe("walks to the gate")
    }
  })

  it("rejects an unknown persona", () => {
    const parsed = parseAdviseRequest({ ...valid, persona: "alien" })
    expect(parsed.ok).toBe(false)
  })

  it("clips long notes", () => {
    const parsed = parseAdviseRequest({ ...valid, notes: "x".repeat(400) })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.value.notes).toHaveLength(280)
  })

  it("accepts custom coordinates without a known city", () => {
    const parsed = parseAdviseRequest({
      ...valid,
      cityId: "somewhere-else",
      latitude: 19.07,
      longitude: 72.87,
      cityName: "A terrace in Mumbai",
    })
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.cityId).toBe("custom")
      expect(parsed.value.latitude).toBe(19.07)
    }
  })

  it("rejects a body with neither city nor coordinates", () => {
    const parsed = parseAdviseRequest({
      persona: "adult",
      activity: "errands",
      duration: "under_30",
      window: "now",
      cityId: "not-a-city",
    })
    expect(parsed.ok).toBe(false)
  })
})

describe("sanitizeProfile", () => {
  it("falls back to the starter profile when localStorage is junk", () => {
    expect(sanitizeProfile({ persona: "alien" })).toEqual(starterProfile())
    expect(sanitizeProfile(null)).toEqual(starterProfile())
  })

  it("keeps a known city and persona", () => {
    const profile = sanitizeProfile({
      cityId: "noida",
      persona: "elderly",
      activity: "outdoor_exercise",
      duration: "one_hour",
      window: "morning",
      notes: "Daily park walk.",
    })
    expect(profile.cityId).toBe("noida")
    expect(profile.persona).toBe("elderly")
    expect(profile.latitude).toBeCloseTo(28.5355)
  })
})
