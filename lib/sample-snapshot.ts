import { cpcbPm25Index, categoryFromPm25 } from "@/lib/aqi"
import type { AirSnapshot } from "@/lib/types"

const SAMPLE_HOURS = [168, 155, 142, 128, 119, 126, 148, 176, 198, 210, 188, 172]

export function sampleSnapshot(input: {
  cityId: string
  cityName: string
  latitude: number
  longitude: number
}): AirSnapshot {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  const hourlyPm25 = SAMPLE_HOURS.map((pm25, index) => {
    const hour = new Date(start.getTime() + index * 60 * 60 * 1000)
    return {
      hour: hour.toISOString(),
      pm25,
      category: categoryFromPm25(pm25),
    }
  })
  const pm25 = SAMPLE_HOURS[0]
  return {
    cityId: input.cityId,
    cityName: input.cityName,
    latitude: input.latitude,
    longitude: input.longitude,
    observedAt: new Date().toISOString(),
    source: "sample",
    pm25,
    pm10: 248,
    ozone: 42,
    no2: 38,
    so2: 12,
    co: 640,
    europeanAqi: 78,
    usAqi: 168,
    cpcbPm25Index: cpcbPm25Index(pm25),
    category: categoryFromPm25(pm25),
    hourlyPm25,
  }
}
