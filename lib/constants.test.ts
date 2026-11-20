import { describe, expect, it } from "vitest"
import {
  ADVISE_CLIENT_TIMEOUT_MS,
  GEMINI_TIMEOUT_MS,
  OPEN_METEO_TIMEOUT_MS,
} from "@/lib/constants"

describe("timeouts", () => {
  it("keeps Gemini plus air fetch inside the browser abort window", () => {
    expect(GEMINI_TIMEOUT_MS + OPEN_METEO_TIMEOUT_MS).toBeLessThanOrEqual(ADVISE_CLIENT_TIMEOUT_MS)
  })
})
