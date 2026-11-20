import { cpcbPm25Index, categoryFromPm25 } from "@/lib/aqi"
import { HOURLY_FORECAST_HOURS } from "@/lib/constants"
import type { AirSnapshot } from "@/lib/types"

export type AirLocation = {
  cityId: string
  cityName: string
  latitude: number
  longitude: number
}

export type OpenMeteoResponse = {
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

/** Map a live Open-Meteo payload into our snapshot, or null if PM2.5 is missing. */
export function snapshotFromOpenMeteo(
  location: AirLocation,
  data: unknown,
): AirSnapshot | null {
  if (!data || typeof data !== "object") return null
  const payload = data as OpenMeteoResponse
  const current = payload.current
  const pm25 = Number(current?.pm2_5)
  if (!Number.isFinite(pm25)) return null

  const times = payload.hourly?.time ?? []
  const values = payload.hourly?.pm2_5 ?? []
  const hourlyPm25 = times
    .map((hour, index) => {
      const raw = values[index]
      if (raw == null) return null
      const value = Number(raw)
      if (!Number.isFinite(value)) return null
      return {
        hour: withIstOffset(hour),
        pm25: value,
        category: categoryFromPm25(value),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .slice(0, HOURLY_FORECAST_HOURS)

  return {
    cityId: location.cityId,
    cityName: location.cityName,
    latitude: location.latitude,
    longitude: location.longitude,
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
}

export function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** Open-Meteo local timestamps have no offset when timezone=Asia/Kolkata. */
export function withIstOffset(value: string) {
  if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00+05:30`
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) return `${value}+05:30`
  return value
}
