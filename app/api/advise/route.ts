import { buildAdvisory, localAdvisory } from "@/lib/advisory"
import { findCity } from "@/lib/cities"
import { GeminiError } from "@/lib/gemini"
import { fetchAirSnapshot } from "@/lib/open-meteo"
import { parseAdviseRequest } from "@/lib/validation"

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
    if (error instanceof GeminiError && error.status === 503) {
      return Response.json(
        { ...localAdvisory(profile, snapshot), fallback: true, notice: error.message },
        { headers: { "Cache-Control": "no-store" } },
      )
    }
    const message = error instanceof GeminiError ? error.message : "Could not write the advisory."
    const status = error instanceof GeminiError ? error.status ?? 502 : 502
    return jsonError(message, status)
  }
}

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } })
}
