import { describe, expect, it } from "vitest"
import { actions, headline, reasons } from "@/lib/decide-copy"
import { sampleSnapshot } from "@/lib/sample-snapshot"

const snapshot = sampleSnapshot({
  cityId: "delhi",
  cityName: "Delhi",
  latitude: 28.6139,
  longitude: 77.209,
})

describe("headline", () => {
  it("names the child for a parent and indoor lock", () => {
    expect(headline("indoor", "parent", "school_run", snapshot)).toMatch(/for your child/)
    expect(headline("indoor", "parent", "school_run", snapshot)).toMatch(/stay indoors/i)
  })

  it("treats stay-home as today, not an outdoor outing", () => {
    expect(headline("go", "adult", "stay_home", snapshot)).toMatch(/today/)
  })
})

describe("reasons", () => {
  it("labels a sample snapshot and morning haze", () => {
    const lines = reasons({
      activity: "school_run",
      duration: "one_hour",
      window: "morning",
      snapshot,
      sensitive: true,
      long: false,
    })
    expect(lines.join(" ")).toMatch(/sample snapshot/)
    expect(lines.join(" ")).toMatch(/Children, older adults/)
  })
})

describe("actions", () => {
  it("asks outdoor workers for shorter shifts when air is bad", () => {
    const items = actions({
      verdict: "limit",
      mask: "n95",
      persona: "outdoor_worker",
      activity: "outdoor_work",
    })
    expect(items.join(" ")).toMatch(/N95/)
    expect(items.join(" ")).toMatch(/shorter shifts/)
  })
})
