import { buildAdvisory, localAdvisory } from "@/lib/advisory"
import { findCity } from "@/lib/cities"
import { GeminiError } from "@/lib/gemini"
import { fetchAirSnapshot } from "@/lib/open-meteo"
import { parseAdviseRequest } from "@/lib/validation"

export const maxDuration = 30

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
  const city = findCity(profile.cityId)
  const snapshot = await fetchAirSnapshot({
    cityId: profile.cityId,
    cityName: city?.name ?? profile.cityName ?? "Your location",
    latitude: profile.latitude ?? city?.latitude ?? 28.6139,
    longitude: profile.longitude ?? city?.longitude ?? 77.209,
  })

  try {
    const advisory = await buildAdvisory(profile, snapshot)
    return Response.json(advisory, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof GeminiError && (error.status === 401 || error.status === 403)) {
      return jsonError(error.message, error.status)
    }
    const notice =
      error instanceof GeminiError
        ? error.message
        : "Gemini took too long, so this plan used the local rules engine."
    return Response.json(
      { ...localAdvisory(profile, snapshot), fallback: true, notice },
      { headers: { "Cache-Control": "no-store" } },
    )
  }
}

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } })
}
