import { OPEN_METEO_TIMEOUT_MS } from "@/lib/constants"
import { snapshotFromOpenMeteo, type AirLocation } from "@/lib/open-meteo-parse"
import { sampleSnapshot } from "@/lib/sample-snapshot"

const ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality"

export async function fetchAirSnapshot(input: AirLocation) {
  const url = new URL(ENDPOINT)
  url.searchParams.set("latitude", String(input.latitude))
  url.searchParams.set("longitude", String(input.longitude))
  url.searchParams.set(
    "current",
    "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,european_aqi,us_aqi",
  )
  url.searchParams.set("hourly", "pm2_5")
  url.searchParams.set("forecast_days", "1")
  url.searchParams.set("timezone", "Asia/Kolkata")

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(OPEN_METEO_TIMEOUT_MS),
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) return sampleSnapshot(input)
    const data: unknown = await response.json()
    return snapshotFromOpenMeteo(input, data) ?? sampleSnapshot(input)
  } catch {
    return sampleSnapshot(input)
  }
}

export { withIstOffset } from "@/lib/open-meteo-parse"
