import { beforeEach, describe, expect, it, vi } from "vitest"
import { buildAdvisory, composeAdvisory, defaultsNotToDo, localAdvisory } from "@/lib/advisory"
import { DISCLAIMER } from "@/lib/advisory-prompt"
import { sampleSnapshot } from "@/lib/sample-snapshot"
import { starterProfile } from "@/lib/validation"

vi.mock("@/lib/gemini", () => ({
  generateJson: vi.fn(),
}))

import { generateJson } from "@/lib/gemini"

const generate = vi.mocked(generateJson)

beforeEach(() => {
  generate.mockReset()
})

const snapshot = sampleSnapshot({
  cityId: "karnal",
  cityName: "Karnal",
  latitude: 29.6857,
  longitude: 76.9905,
})

describe("composeAdvisory", () => {
  it("keeps the locked decision and clips Gemini wording", () => {
    const advisory = composeAdvisory(starterProfile(), snapshot, {
      summary: "  Stay home.  ",
      why: "PM2.5 is high.",
      dayPlan: ["Close windows."],
      whatNotToDo: ["Do not jog outdoors."],
      model: "gemini-3.5-flash-lite",
    })
    expect(advisory.decision.verdict).toBe("indoor")
    expect(advisory.summary).toBe("Stay home.")
    expect(advisory.model).toBe("gemini-3.5-flash-lite")
    expect(advisory.disclaimer).toBe(DISCLAIMER)
  })

  it("falls back to the rules-engine copy when Gemini sends blanks", () => {
    const advisory = composeAdvisory(starterProfile(), snapshot, {
      summary: "   ",
      why: "",
      dayPlan: ["", "  "],
      whatNotToDo: [],
      model: "gemini-3.5-flash-lite",
    })
    expect(advisory.summary).toBe(advisory.decision.headline)
    expect(advisory.dayPlan).toEqual(advisory.decision.actions)
    expect(advisory.whatNotToDo[0]).toMatch(/medical diagnosis/i)
  })
})

describe("localAdvisory", () => {
  it("labels the model as the rules engine", () => {
    const advisory = localAdvisory(starterProfile(), snapshot)
    expect(advisory.model).toBe("rules-engine")
    expect(advisory.decision.verdict).toBe("indoor")
    expect(advisory.summary).toBe(advisory.decision.headline)
  })
})

describe("buildAdvisory", () => {
  it("asks Gemini for wording after the verdict is locked", async () => {
    generate.mockResolvedValue({
      data: {
        summary: "Keep the school run indoor-side.",
        why: "Poor band.",
        dayPlan: ["Shortest route."],
        whatNotToDo: ["No playground linger."],
      },
      model: "gemini-3.5-flash-lite",
    })
    const advisory = await buildAdvisory(starterProfile(), snapshot)
    expect(generate).toHaveBeenCalled()
    expect(advisory.summary).toMatch(/school run/)
    expect(advisory.decision.verdict).toBe("indoor")
  })
})

describe("defaultsNotToDo", () => {
  it("warns against outdoor play when the lock is indoor", () => {
    const advisory = localAdvisory(starterProfile(), snapshot)
    expect(defaultsNotToDo(advisory.decision).join(" ")).toMatch(/playground/)
  })

  it("uses the lighter skip list when going out is allowed", () => {
    const good = {
      ...snapshot,
      pm25: 12,
      category: "Good" as const,
      cpcbPm25Index: 20,
      source: "open-meteo" as const,
    }
    const advisory = localAdvisory(
      { ...starterProfile(), persona: "adult", activity: "errands" },
      good,
    )
    expect(advisory.decision.verdict).toBe("go")
    expect(defaultsNotToDo(advisory.decision).join(" ")).toMatch(/tightness in the chest/)
  })
})
