import { afterEach, describe, expect, it, vi } from "vitest"

const originalGemini = process.env.GEMINI_API_KEY
const originalGoogle = process.env.GOOGLE_API_KEY
const originalModel = process.env.GEMINI_MODEL

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = originalGemini
  if (originalGoogle === undefined) delete process.env.GOOGLE_API_KEY
  else process.env.GOOGLE_API_KEY = originalGoogle
  if (originalModel === undefined) delete process.env.GEMINI_MODEL
  else process.env.GEMINI_MODEL = originalModel
})

async function loadGemini() {
  vi.resetModules()
  return import("@/lib/gemini")
}

describe("generateJson", () => {
  it("throws 503 when no key is configured", async () => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GOOGLE_API_KEY
    const { generateJson } = await loadGemini()
    await expect(
      generateJson({ system: "s", user: "u", schema: {} }),
    ).rejects.toMatchObject({ status: 503, name: "GeminiError" })
  })

  it("returns parsed JSON from a successful generateContent call", async () => {
    process.env.GEMINI_API_KEY = "test-key"
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: '{"summary":"Stay in."}' }] } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    vi.stubGlobal("fetch", fetchImpl)
    const { generateJson } = await loadGemini()
    const result = await generateJson<{ summary: string }>({
      system: "s",
      user: "u",
      schema: {},
    })
    expect(result.model).toBe("gemini-3.5-flash-lite")
    expect(result.data.summary).toBe("Stay in.")
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string> | undefined
    expect(headers?.["x-goog-api-key"]).toBe("test-key")
  })

  it("maps AbortError to a 408 timeout", async () => {
    process.env.GEMINI_API_KEY = "test-key"
    const err = new Error("aborted")
    err.name = "AbortError"
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw err
    }))
    const { generateJson } = await loadGemini()
    await expect(generateJson({ system: "s", user: "u", schema: {} })).rejects.toMatchObject({
      name: "GeminiError",
      status: 408,
    })
  })

  it("does not try a second model after 429", async () => {
    process.env.GEMINI_API_KEY = "test-key"
    process.env.GEMINI_MODEL = "gemini-2.5-flash"
    const fetchImpl = vi.fn(async () => new Response("busy", { status: 429 }))
    vi.stubGlobal("fetch", fetchImpl)
    const { generateJson } = await loadGemini()
    await expect(generateJson({ system: "s", user: "u", schema: {} })).rejects.toMatchObject({
      status: 429,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
