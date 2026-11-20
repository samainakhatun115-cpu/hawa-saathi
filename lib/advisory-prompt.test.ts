import { describe, expect, it } from "vitest"
import { GEMINI_SYSTEM, userPrompt } from "@/lib/advisory-prompt"
import { decide } from "@/lib/decide"
import { sampleSnapshot } from "@/lib/sample-snapshot"
import { starterProfile } from "@/lib/validation"

describe("Gemini prompt", () => {
  it("forbids diagnosis and invented numbers", () => {
    expect(GEMINI_SYSTEM).toMatch(/not a doctor/i)
    expect(GEMINI_SYSTEM).toMatch(/never invent/i)
  })

  it("sends the locked verdict, not a blank to fill in", () => {
    const profile = starterProfile()
    const snapshot = sampleSnapshot({
      cityId: "karnal",
      cityName: "Karnal",
      latitude: 29.6857,
      longitude: 76.9905,
    })
    const decision = decide({
      persona: profile.persona,
      activity: profile.activity,
      duration: profile.duration,
      window: profile.window,
      snapshot,
    })
    const prompt = userPrompt(profile, snapshot, decision)
    expect(prompt).toMatch(/Locked verdict/)
    expect(prompt).toContain(decision.headline)
    expect(prompt).toMatch(/Karnal/)
  })
})
