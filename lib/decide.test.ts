import { describe, expect, it } from "vitest"
import { decide } from "@/lib/decide"
import { sampleSnapshot } from "@/lib/sample-snapshot"
import type { AirSnapshot, Persona } from "@/lib/types"
import { categoryFromPm25, cpcbPm25Index } from "@/lib/aqi"

function snap(pm25: number): AirSnapshot {
  const base = sampleSnapshot({
    cityId: "delhi",
    cityName: "Delhi",
    latitude: 28.61,
    longitude: 77.2,
  })
  return {
    ...base,
    pm25,
    category: categoryFromPm25(pm25),
    cpcbPm25Index: cpcbPm25Index(pm25),
    source: "open-meteo",
  }
}

function run(persona: Persona, activity: "school_run" | "outdoor_work" | "outdoor_exercise" | "stay_home" | "errands", pm25: number) {
  return decide({
    persona,
    activity,
    duration: "one_hour",
    window: "morning",
    snapshot: snap(pm25),
  })
}

describe("persona decisions", () => {
  it("lets a healthy adult go out in Good air", () => {
    const decision = run("adult", "outdoor_exercise", 18)
    expect(decision.verdict).toBe("go")
    expect(decision.mask).toBe("none")
  })

  it("limits a child's outdoor play in Moderate air", () => {
    expect(run("parent", "outdoor_exercise", 75).verdict).toBe("limit")
  })

  it("keeps a child indoors in Poor air", () => {
    const decision = run("parent", "school_run", 110)
    expect(decision.verdict).toBe("indoor")
    expect(decision.mask).toBe("recommended")
  })

  it("still allows essential outdoor work in Severe air, with an N95", () => {
    const decision = run("outdoor_worker", "outdoor_work", 320)
    expect(decision.verdict).toBe("limit")
    expect(decision.mask).toBe("n95")
  })

  it("asks people with asthma to stay in during Very Poor air", () => {
    expect(run("asthma", "errands", 180).verdict).toBe("indoor")
  })

  it("writes a stay-in headline the rules engine already decided", () => {
    const decision = run("parent", "school_run", 110)
    expect(decision.headline).toMatch(/stay indoors/i)
    expect(decision.reasons[0]).toMatch(/CPCB-style Poor/)
  })
})
