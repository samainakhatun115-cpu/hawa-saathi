import { describe, expect, it } from "vitest"
import { verdictFor } from "@/lib/verdict"

describe("verdictFor", () => {
  it("is go for a healthy adult in Good air", () => {
    const result = verdictFor({
      persona: "adult",
      activity: "outdoor_exercise",
      duration: "one_hour",
      category: "Good",
    })
    expect(result).toMatchObject({ verdict: "go", mask: "none", sensitive: false })
  })

  it("limits a child's play in Moderate air and recommends a mask", () => {
    const result = verdictFor({
      persona: "parent",
      activity: "outdoor_exercise",
      duration: "one_hour",
      category: "Moderate",
    })
    expect(result.verdict).toBe("limit")
    expect(result.mask).toBe("recommended")
    expect(result.sensitive).toBe(true)
  })

  it("keeps an older adult indoors in Poor air", () => {
    const result = verdictFor({
      persona: "elderly",
      activity: "outdoor_exercise",
      duration: "one_hour",
      category: "Poor",
    })
    expect(result.verdict).toBe("indoor")
  })

  it("lets essential outdoor work continue in Severe air with an N95", () => {
    const result = verdictFor({
      persona: "outdoor_worker",
      activity: "outdoor_work",
      duration: "full_day",
      category: "Severe",
    })
    expect(result.verdict).toBe("limit")
    expect(result.mask).toBe("n95")
  })

  it("does not treat stay-home as an outdoor outing in Satisfactory air", () => {
    const result = verdictFor({
      persona: "asthma",
      activity: "stay_home",
      duration: "full_day",
      category: "Satisfactory",
    })
    expect(result.verdict).toBe("go")
  })

  it("asks a stay-home day to keep windows closed in Poor air", () => {
    const result = verdictFor({
      persona: "adult",
      activity: "stay_home",
      duration: "full_day",
      category: "Poor",
    })
    expect(result.verdict).toBe("indoor")
  })

  it("limits a healthy adult's errands in Poor air instead of forcing them indoors", () => {
    const result = verdictFor({
      persona: "adult",
      activity: "errands",
      duration: "under_30",
      category: "Poor",
    })
    expect(result.verdict).toBe("limit")
    expect(result.mask).toBe("recommended")
  })
})
