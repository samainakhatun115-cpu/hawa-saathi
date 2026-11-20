import { describe, expect, it } from "vitest"
import { jsonBody, jsonError } from "@/lib/http"

describe("jsonBody", () => {
  it("sets Cache-Control: no-store", async () => {
    const response = jsonBody({ ok: true })
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    expect(await response.json()).toEqual({ ok: true })
  })
})

describe("jsonError", () => {
  it("returns the message and status", async () => {
    const response = jsonError("Send JSON.", 400)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: "Send JSON." })
  })
})
