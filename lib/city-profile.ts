import { fallbackCity, findCity } from "@/lib/cities"
import type { AirLocation } from "@/lib/open-meteo-parse"
import type { AdviseRequest } from "@/lib/types"

/** Switching city always replaces the pin with that city's coordinates. */
export function applyCityId(profile: AdviseRequest, cityId: string): AdviseRequest {
  const city = findCity(cityId)
  return {
    ...profile,
    cityId,
    cityName: city?.name,
    latitude: city?.latitude,
    longitude: city?.longitude,
  }
}

/** Resolve the pin the air API should read. Unknown cities fall back to Delhi. */
export function airQueryFor(profile: AdviseRequest): AirLocation {
  const city = findCity(profile.cityId)
  const fallback = fallbackCity()
  return {
    cityId: profile.cityId,
    cityName: city?.name ?? profile.cityName ?? "Your location",
    latitude: profile.latitude ?? city?.latitude ?? fallback.latitude,
    longitude: profile.longitude ?? city?.longitude ?? fallback.longitude,
  }
}
