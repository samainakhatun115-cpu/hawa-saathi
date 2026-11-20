import { describe, expect, it } from "vitest"
import { GeminiError, errorForGeminiStatus, isFatalGeminiError } from "@/lib/gemini-error"
import { modelCandidates, parseGeminiJson, textFromGeminiPayload } from "@/lib/gemini-parse"

describe("modelCandidates", () => {
  it("keeps the primary model once even if extra repeats it", () => {
    expect(modelCandidates("gemini-3.5-flash-lite", "gemini-3.5-flash-lite")).toEqual([
      "gemini-3.5-flash-lite",
    ])
  })

  it("adds a distinct fallback model", () => {
    expect(modelCandidates("gemini-3.5-flash-lite", "gemini-2.5-flash")).toEqual([
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
    ])
  })
})

describe("textFromGeminiPayload", () => {
  it("joins candidate parts", () => {
    expect(
      textFromGeminiPayload({
        candidates: [{ content: { parts: [{ text: '{"a":' }, { text: "1}" }] } }],
      }),
    ).toBe('{"a":1}')
  })

  it("returns empty text for junk payloads", () => {
    expect(textFromGeminiPayload(null)).toBe("")
    expect(textFromGeminiPayload({})).toBe("")
  })
})

describe("parseGeminiJson", () => {
  it("parses object JSON", () => {
    expect(parseGeminiJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 })
  })

  it("throws GeminiError when the model did not return JSON", () => {
    expect(() => parseGeminiJson("not json")).toThrow(GeminiError)
  })
})

describe("Gemini HTTP mapping", () => {
  it("maps 429 to a busy error that should not retry another model", () => {
    const error = errorForGeminiStatus(429)
    expect(error.status).toBe(429)
    expect(error.message).toMatch(/busy/i)
    expect(isFatalGeminiError(error)).toBe(true)
  })

  it("maps 401 to a rejected key", () => {
    const error = errorForGeminiStatus(401)
    expect(error.message).toMatch(/rejected/i)
    expect(isFatalGeminiError(error)).toBe(true)
  })

  it("retries invalid JSON because it has no HTTP status", () => {
    expect(isFatalGeminiError(new GeminiError("Gemini returned text that was not valid JSON."))).toBe(
      false,
    )
  })
})
