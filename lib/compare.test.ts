import { describe, expect, it } from "vitest"
import { localAdvisory } from "@/lib/advisory"
import { COMPARE_PERSONAS, comparePersona } from "@/lib/compare"
import { sampleSnapshot } from "@/lib/sample-snapshot"
import { starterProfile } from "@/lib/validation"

describe("comparePersona", () => {
  it("keeps the same reading and changes only the persona lock", () => {
    const snapshot = sampleSnapshot({
      cityId: "noida",
      cityName: "Noida",
      latitude: 28.5355,
      longitude: 77.391,
    })
    const advisory = localAdvisory(starterProfile(), snapshot)
    const worker = comparePersona(
      advisory,
      "outdoor_worker",
      "outdoor_work",
      "full_day",
      "morning",
    )
    expect(worker.verdict).not.toBe(advisory.decision.verdict)
    expect(COMPARE_PERSONAS).toContain("outdoor_worker")
  })
})
