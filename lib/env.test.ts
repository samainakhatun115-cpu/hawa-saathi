import { afterEach, describe, expect, it } from "vitest"
import { readGeminiKey, readServerEnv } from "@/lib/env"

const originalGemini = process.env.GEMINI_API_KEY
const originalGoogle = process.env.GOOGLE_API_KEY

afterEach(() => {
  if (originalGemini === undefined) delete process.env.GEMINI_API_KEY
  else process.env.GEMINI_API_KEY = originalGemini
  if (originalGoogle === undefined) delete process.env.GOOGLE_API_KEY
  else process.env.GOOGLE_API_KEY = originalGoogle
})

describe("readServerEnv", () => {
  it("trims values and ignores missing names", () => {
    process.env.GEMINI_API_KEY = "  abc  "
    expect(readServerEnv("GEMINI_API_KEY")).toBe("abc")
    expect(readServerEnv("DOES_NOT_EXIST")).toBe("")
  })
})

describe("readGeminiKey", () => {
  it("prefers GEMINI_API_KEY over GOOGLE_API_KEY", () => {
    process.env.GEMINI_API_KEY = "gemini-key"
    process.env.GOOGLE_API_KEY = "google-key"
    expect(readGeminiKey()).toBe("gemini-key")
  })

  it("falls back to GOOGLE_API_KEY", () => {
    delete process.env.GEMINI_API_KEY
    process.env.GOOGLE_API_KEY = "google-key"
    expect(readGeminiKey()).toBe("google-key")
  })
})
