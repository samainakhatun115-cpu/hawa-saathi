import { cpcbPm25Index, categoryFromPm25 } from "@/lib/aqi"
import { sampleSnapshot } from "@/lib/sample-snapshot"
import type { AirSnapshot } from "@/lib/types"

const TIMEOUT_MS = 8000
const ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality"

type OpenMeteoResponse = {
  current?: {
    time?: string
    pm2_5?: number
    pm10?: number
    ozone?: number
    nitrogen_dioxide?: number
    sulphur_dioxide?: number
    carbon_monoxide?: number
    european_aqi?: number
    us_aqi?: number
  }
  hourly?: {
    time?: string[]
    pm2_5?: Array<number | null>
  }
}

export async function fetchAirSnapshot(input: {
  cityId: string
  cityName: string
  latitude: number
  longitude: number
}): Promise<AirSnapshot> {
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
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) return sampleSnapshot(input)
    const data = (await response.json()) as OpenMeteoResponse
    const current = data.current
    const pm25 = Number(current?.pm2_5)
    if (!Number.isFinite(pm25)) return sampleSnapshot(input)

    const times = data.hourly?.time ?? []
    const values = data.hourly?.pm2_5 ?? []
    const hourlyPm25 = times
      .map((hour, index) => {
        const value = Number(values[index])
        if (!Number.isFinite(value)) return null
        return {
          hour: withIstOffset(hour),
          pm25: value,
          category: categoryFromPm25(value),
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .slice(0, 24)

    return {
      cityId: input.cityId,
      cityName: input.cityName,
      latitude: input.latitude,
      longitude: input.longitude,
      observedAt: current?.time ? withIstOffset(current.time) : new Date().toISOString(),
      source: "open-meteo",
      pm25,
      pm10: Number(current?.pm10) || 0,
      ozone: finiteOrNull(current?.ozone),
      no2: finiteOrNull(current?.nitrogen_dioxide),
      so2: finiteOrNull(current?.sulphur_dioxide),
      co: finiteOrNull(current?.carbon_monoxide),
      europeanAqi: finiteOrNull(current?.european_aqi),
      usAqi: finiteOrNull(current?.us_aqi),
      cpcbPm25Index: cpcbPm25Index(pm25),
      category: categoryFromPm25(pm25),
      hourlyPm25,
    }
  } catch {
    return sampleSnapshot(input)
  }
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** Open-Meteo local timestamps have no offset when timezone=Asia/Kolkata. */
export function withIstOffset(value: string) {
  if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00+05:30`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return `${value}+05:30`
  return value
}
