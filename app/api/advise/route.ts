import { buildAdvisory, localAdvisory } from "@/lib/advisory"
import { airQueryFor } from "@/lib/city-profile"
import { GEMINI_SLOW_NOTICE } from "@/lib/constants"
import { GeminiError } from "@/lib/gemini"
import { jsonBody, jsonError } from "@/lib/http"
import { fetchAirSnapshot } from "@/lib/open-meteo"
import { parseAdviseRequest } from "@/lib/validation"

/** Vercel requires a numeric literal here, not an imported constant. */
export const maxDuration = 15

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Send JSON.", 400)
  }

  const parsed = parseAdviseRequest(body)
  if (!parsed.ok) return jsonError(parsed.error, 400)

  const profile = parsed.value
  const snapshot = await fetchAirSnapshot(airQueryFor(profile))

  try {
    const advisory = await buildAdvisory(profile, snapshot)
    return jsonBody(advisory)
  } catch (error) {
    if (error instanceof GeminiError && (error.status === 401 || error.status === 403)) {
      return jsonError(error.message, error.status)
    }
    const notice =
      error instanceof GeminiError && error.status === 503 ? error.message : GEMINI_SLOW_NOTICE
    return jsonBody({ ...localAdvisory(profile, snapshot), fallback: true, notice })
  }
}
