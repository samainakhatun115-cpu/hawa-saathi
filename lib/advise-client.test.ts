import { describe, expect, it, vi } from "vitest"
import { requestAdvisory, requestBodyFor } from "@/lib/advise-client"
import { starterProfile } from "@/lib/validation"

describe("requestBodyFor", () => {
  it("fills Karnal coordinates from the city list", () => {
    const body = requestBodyFor({ ...starterProfile(), latitude: undefined, longitude: undefined })
    expect(body.cityName).toBe("Karnal")
    expect(body.latitude).toBeCloseTo(29.6857)
    expect(body.longitude).toBeCloseTo(76.9905)
  })
})

describe("requestAdvisory", () => {
  it("returns the advisory when the route succeeds", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ summary: "Stay in.", notice: "ok", decision: { verdict: "indoor" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch
    const result = await requestAdvisory(starterProfile(), fetchImpl)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.advisory.summary).toBe("Stay in.")
      expect(result.notice).toBe("ok")
    }
  })

  it("surfaces a route error without throwing", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: "Send JSON." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    ) as unknown as typeof fetch
    const result = await requestAdvisory(starterProfile(), fetchImpl)
    expect(result).toEqual({ ok: false, error: "Send JSON." })
  })

  it("maps abort to a retry message", async () => {
    const err = new Error("aborted")
    err.name = "AbortError"
    const fetchImpl = vi.fn(async () => {
      throw err
    }) as unknown as typeof fetch
    const result = await requestAdvisory(starterProfile(), fetchImpl)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.timedOut).toBe(true)
      expect(result.error).toMatch(/too long/i)
    }
  })
})
