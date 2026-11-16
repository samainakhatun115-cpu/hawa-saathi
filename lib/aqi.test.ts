import { describe, expect, it } from "vitest"
import { categoryFromPm25, categoryRank, cpcbPm25Index, isSensitive } from "@/lib/aqi"

describe("CPCB-style PM2.5 bands", () => {
  it("maps the official breakpoint edges", () => {
    expect(categoryFromPm25(0)).toBe("Good")
    expect(categoryFromPm25(30)).toBe("Good")
    expect(categoryFromPm25(31)).toBe("Satisfactory")
    expect(categoryFromPm25(60)).toBe("Satisfactory")
    expect(categoryFromPm25(61)).toBe("Moderate")
    expect(categoryFromPm25(90)).toBe("Moderate")
    expect(categoryFromPm25(91)).toBe("Poor")
    expect(categoryFromPm25(120)).toBe("Poor")
    expect(categoryFromPm25(121)).toBe("Very Poor")
    expect(categoryFromPm25(250)).toBe("Very Poor")
    expect(categoryFromPm25(251)).toBe("Severe")
  })

  it("keeps the sub-index inside 0–500", () => {
    expect(cpcbPm25Index(0)).toBe(0)
    expect(cpcbPm25Index(30)).toBe(50)
    expect(cpcbPm25Index(15)).toBeGreaterThan(0)
    expect(cpcbPm25Index(15)).toBeLessThan(50)
    expect(cpcbPm25Index(500)).toBe(500)
    expect(cpcbPm25Index(-4)).toBe(0)
  })

  it("ranks worse air higher", () => {
    expect(categoryRank("Severe")).toBeGreaterThan(categoryRank("Good"))
  })

  it("treats parent, elderly, and asthma as sensitive", () => {
    expect(isSensitive("parent")).toBe(true)
    expect(isSensitive("adult")).toBe(false)
    expect(isSensitive("outdoor_worker")).toBe(false)
  })
})
