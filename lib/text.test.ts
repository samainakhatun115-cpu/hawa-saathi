import { describe, expect, it } from "vitest"
import { cleanList, clip } from "@/lib/text"

describe("clip", () => {
  it("trims, collapses spaces, and cuts to max", () => {
    expect(clip("  keep   the child  indoors  ", 16)).toBe("keep the child i")
  })
})

describe("cleanList", () => {
  it("falls back when Gemini sends empty strings", () => {
    expect(cleanList(["", "  "], ["Wear a mask."])).toEqual(["Wear a mask."])
  })

  it("keeps at most five non-empty lines", () => {
    const lines = ["a", "b", "c", "d", "e", "f"]
    expect(cleanList(lines, ["fallback"])).toEqual(["a", "b", "c", "d", "e"])
  })
})
