import { describe, expect, it } from "vitest"
import { categoryTone, copyText, maskLabel, observedLabel, pollutantLabel } from "@/lib/format"
import { localAdvisory } from "@/lib/advisory"
import { sampleSnapshot } from "@/lib/sample-snapshot"
import { starterProfile } from "@/lib/validation"

const snapshot = sampleSnapshot({
  cityId: "karnal",
  cityName: "Karnal",
  latitude: 29.6857,
  longitude: 76.9905,
})

describe("pollutantLabel", () => {
  it("shows a dash when the reading is missing", () => {
    expect(pollutantLabel(null, "µg/m³")).toBe("—")
    expect(pollutantLabel(12.4, "µg/m³")).toBe("12 µg/m³")
  })
})

describe("maskLabel", () => {
  it("names each mask level in plain English", () => {
    expect(maskLabel("n95")).toMatch(/N95/)
    expect(maskLabel("recommended")).toMatch(/recommended/i)
    expect(maskLabel("optional")).toMatch(/optional/i)
    expect(maskLabel("none")).toMatch(/not needed/i)
  })
})

describe("categoryTone", () => {
  it("maps CPCB bands to CSS tone tokens", () => {
    expect(categoryTone("Good")).toBe("good")
    expect(categoryTone("Very Poor")).toBe("very-poor")
    expect(categoryTone("Severe")).toBe("severe")
  })
})

describe("copyText", () => {
  it("includes city, band, plan, and the medical disclaimer", () => {
    const advisory = localAdvisory(starterProfile(), snapshot)
    const text = copyText(advisory)
    expect(text).toMatch(/Hawa Saathi/)
    expect(text).toMatch(/Karnal/)
    expect(text).toMatch(/Do this:/)
    expect(text).toMatch(/not medical advice/i)
  })
})

describe("observedLabel", () => {
  it("labels sample snapshots as sample", () => {
    expect(observedLabel(snapshot)).toMatch(/sample snapshot/)
  })

  it("labels live Open-Meteo snapshots", () => {
    expect(observedLabel({ ...snapshot, source: "open-meteo" })).toMatch(/Open-Meteo/)
  })
})
