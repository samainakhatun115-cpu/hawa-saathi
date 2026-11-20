import { describe, expect, it } from "vitest"
import {
  ADVISE_CLIENT_TIMEOUT_MS,
  GEMINI_TIMEOUT_MS,
  OPEN_METEO_TIMEOUT_MS,
  ROUTE_TIME_BUDGET_MS,
} from "@/lib/constants"

describe("timeouts", () => {
  it("keeps Gemini plus air fetch inside the route and browser abort windows", () => {
    const serverBudget = GEMINI_TIMEOUT_MS + OPEN_METEO_TIMEOUT_MS
    expect(serverBudget).toBeLessThanOrEqual(ROUTE_TIME_BUDGET_MS)
    expect(serverBudget).toBeLessThanOrEqual(ADVISE_CLIENT_TIMEOUT_MS)
    expect(GEMINI_TIMEOUT_MS).toBeGreaterThan(OPEN_METEO_TIMEOUT_MS)
  })
})
