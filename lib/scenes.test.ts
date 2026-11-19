import { describe, expect, it } from "vitest"
import { applyScene, sceneFromProfile, SCENES } from "@/lib/scenes"
import { parseAdviseRequest } from "@/lib/validation"

describe("demo scenes", () => {
  it("every scene is a valid advise request with city coordinates", () => {
    for (const scene of SCENES) {
      const parsed = parseAdviseRequest(scene.profile)
      expect(parsed.ok, scene.id).toBe(true)
      if (!parsed.ok) continue
      expect(parsed.value.latitude).toBeTypeOf("number")
      expect(parsed.value.longitude).toBeTypeOf("number")
    }
  })

  it("applyScene fills coordinates from the city list", () => {
    const noida = applyScene("noida-walk")
    expect(noida?.persona).toBe("elderly")
    expect(noida?.cityId).toBe("noida")
    expect(noida?.latitude).toBeCloseTo(28.5355)
  })

  it("sceneFromProfile matches city + persona + activity", () => {
    const karnal = applyScene("karnal-school")
    expect(karnal && sceneFromProfile(karnal)).toBe("karnal-school")
  })
})
