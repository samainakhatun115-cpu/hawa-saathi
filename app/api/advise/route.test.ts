import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/open-meteo", () => ({
  fetchAirSnapshot: vi.fn(async () => ({
    cityId: "karnal",
    cityName: "Karnal",
    latitude: 29.6857,
    longitude: 76.9905,
    observedAt: "2026-11-16T12:00:00.000Z",
    source: "open-meteo",
    pm25: 112,
    pm10: 180,
    ozone: 40,
    no2: 30,
    so2: 8,
    co: 500,
    europeanAqi: 70,
    usAqi: 180,
    cpcbPm25Index: 260,
    category: "Poor",
    hourlyPm25: [],
  })),
}))

vi.mock("@/lib/gemini", async () => {
  const actual = await vi.importActual<typeof import("@/lib/gemini")>("@/lib/gemini")
  return {
    ...actual,
    generateJson: vi.fn(),
  }
})

import { POST } from "@/app/api/advise/route"
import { generateJson, GeminiError } from "@/lib/gemini"

const generate = vi.mocked(generateJson)

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/advise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
}

const profile = {
  cityId: "karnal",
  persona: "parent",
  activity: "school_run",
  duration: "under_30",
  window: "morning",
  notes: "",
}

describe("POST /api/advise", () => {
  beforeEach(() => {
    generate.mockReset()
  })

  it("returns 400 for an incomplete profile", async () => {
    const response = await post({ persona: "parent" })
    expect(response.status).toBe(400)
  })

  it("returns a Gemini advisory with the locked Poor verdict", async () => {
    generate.mockResolvedValue({
      data: {
        summary: "Keep the school run short.",
        why: "PM2.5 is in the Poor band.",
        dayPlan: ["Walk the shortest route.", "Wear a mask."],
        whatNotToDo: ["Do not linger in the playground."],
      },
      model: "gemini-3.6-flash",
    })
    const response = await post(profile)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.decision.verdict).toBe("indoor")
    expect(json.snapshot.category).toBe("Poor")
    expect(json.summary).toContain("school run")
    expect(json.disclaimer).toMatch(/not medical advice/i)
  })

  it("falls back to the rules engine when the Gemini key is missing", async () => {
    generate.mockRejectedValue(new GeminiError("Add GEMINI_API_KEY", 503))
    const response = await post(profile)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.model).toBe("rules-engine")
    expect(json.fallback).toBe(true)
    expect(json.decision.verdict).toBe("indoor")
  })

  it("falls back to the rules engine when Gemini times out", async () => {
    generate.mockRejectedValue(new GeminiError("Gemini timed out.", 408))
    const response = await post(profile)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.model).toBe("rules-engine")
    expect(json.fallback).toBe(true)
    expect(json.notice).toMatch(/local rules engine/i)
  })
})
