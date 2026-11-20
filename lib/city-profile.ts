import { findCity } from "@/lib/cities"
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
