import { describe, expect, it } from "vitest"
import { withIstOffset } from "@/lib/open-meteo"

describe("withIstOffset", () => {
  it("tags Open-Meteo local times as IST so they are not treated as UTC", () => {
    expect(withIstOffset("2026-11-16T17:30")).toBe("2026-11-16T17:30:00+05:30")
    expect(new Date(withIstOffset("2026-11-16T17:30")).toISOString()).toBe(
      "2026-11-16T12:00:00.000Z",
    )
  })

  it("leaves already-offset timestamps alone", () => {
    expect(withIstOffset("2026-11-16T12:00:00.000Z")).toBe("2026-11-16T12:00:00.000Z")
    expect(withIstOffset("2026-11-16T17:30:00+05:30")).toBe("2026-11-16T17:30:00+05:30")
  })
})
