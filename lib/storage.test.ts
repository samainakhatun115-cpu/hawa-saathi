import { afterEach, describe, expect, it, vi } from "vitest"
import { STORAGE_KEY, readProfile, writeProfile } from "@/lib/storage"
import { starterProfile } from "@/lib/validation"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("readProfile", () => {
  it("returns the starter profile when window is missing", () => {
    expect(readProfile()).toEqual(starterProfile())
  })

  it("sanitizes junk saved in localStorage", () => {
    const map = new Map<string, string>([[STORAGE_KEY, "{not json"]])
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => {
          map.set(key, value)
        },
      },
    })
    expect(readProfile()).toEqual(starterProfile())
  })
})

describe("writeProfile", () => {
  it("stores a JSON profile when window exists", () => {
    const map = new Map<string, string>()
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => {
          map.set(key, value)
        },
      },
    })
    const profile = { ...starterProfile(), persona: "elderly" as const }
    writeProfile(profile)
    expect(JSON.parse(map.get(STORAGE_KEY) ?? "{}").persona).toBe("elderly")
  })
})
