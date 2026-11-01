import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/api/plan/route"
import * as geminiModule from "@/lib/gemini"
import { buildSamplePlan, type Brief } from "@/lib/plan"

const validBrief: Brief = {
  eventType: "birthday",
  eventDate: "2026-11-24",
  city: "Karnal",
  guestCount: 30,
  budgetInr: 20000,
  diet: "vegetarian",
  venueStyle: "outdoor",
  wish: "Simple decorations and vegetarian food.",
}

const originalApiKey = process.env.GEMINI_API_KEY

afterEach(() => {
  vi.restoreAllMocks()
  if (originalApiKey === undefined) {
    delete process.env.GEMINI_API_KEY
  } else {
    process.env.GEMINI_API_KEY = originalApiKey
  }
})

describe("POST /api/plan", () => {
  it("returns 400 BAD_JSON when request body is malformed", async () => {
    const req = new Request("http://localhost/api/plan", {
      method: "POST",
      body: "{not-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("BAD_JSON")
  })

  it("returns 400 INVALID when brief fields fail validation", async () => {
    const req = new Request("http://localhost/api/plan", {
      method: "POST",
      body: JSON.stringify({ brief: { ...validBrief, city: "" } }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; errors?: { city?: string } }
    expect(body.error).toBe("INVALID")
    expect(body.errors?.city).toBeTruthy()
  })

  it("returns 503 NO_KEY when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY
    const req = new Request("http://localhost/api/plan", {
      method: "POST",
      body: JSON.stringify({ brief: validBrief, followUp: "", currentPlan: null }),
    })
    const res = await POST(req)
    expect(res.status).toBe(503)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("NO_KEY")
  })

  it("returns 200 with normalized Gemini plan and strips invented contacts", async () => {
    process.env.GEMINI_API_KEY = "test-server-key"
    vi.spyOn(geminiModule, "generateWithGemini").mockResolvedValueOnce({
      summary: "Outdoor birthday in Karnal.",
      budgetLines: [{ category: "Food", estimateInr: 9000, note: "Estimate" }],
      tasks: [{ title: "Book lawn", dueDate: "2026-11-10", priority: "high" }],
      vendors: [
        {
          category: "Catering",
          why: "Vegetarian menu.",
          contactName: "Hallucinated Shop",
          contactPhone: "9999999999",
        },
      ],
      ideas: [{ title: "Marigold canopy", detail: "Use local flowers." }],
      daySchedule: [
        { time: "17:00", moment: "Guests arrive", note: "Welcome drinks." },
      ],
    })

    const req = new Request("http://localhost/api/plan", {
      method: "POST",
      body: JSON.stringify({ brief: validBrief, followUp: "", currentPlan: null }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toContain("no-store")
    const body = (await res.json()) as { plan: ReturnType<typeof buildSamplePlan> }
    expect(body.plan.source).toBe("gemini")
    expect(body.plan.vendors[0]?.contactName).toBe("")
    expect(body.plan.vendors[0]?.contactPhone).toBe("")
    expect(body.plan.daySchedule[0]?.time).toBe("17:00")
  })

  it("returns 503 BUSY when Gemini upstream responds with 503", async () => {
    process.env.GEMINI_API_KEY = "test-server-key"
    vi.spyOn(geminiModule, "generateWithGemini").mockRejectedValueOnce(
      new Error("GEMINI_503"),
    )

    const req = new Request("http://localhost/api/plan", {
      method: "POST",
      body: JSON.stringify({ brief: validBrief, followUp: "", currentPlan: null }),
    })
    const res = await POST(req)
    expect(res.status).toBe(503)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe("BUSY")
  })
})
