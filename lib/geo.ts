import { nearestCity } from "@/lib/cities"
import { GEO_MAXIMUM_AGE_MS, GEO_TIMEOUT_MS } from "@/lib/constants"
import type { AdviseRequest } from "@/lib/types"

export type LocateResult =
  | { ok: true; profile: AdviseRequest }
  | { ok: false; error: string }

export type GeoFix = { coords: { latitude: number; longitude: number } }

export type GeoApi = {
  getCurrentPosition: (
    success: (position: GeoFix) => void,
    error?: () => void,
    options?: { timeout: number; maximumAge: number },
  ) => void
}

export function locateProfile(
  profile: AdviseRequest,
  geolocation: GeoApi | undefined,
): Promise<LocateResult> {
  if (!geolocation) {
    return Promise.resolve({
      ok: false,
      error: "This browser cannot share location. Pick a city instead.",
    })
  }

  return new Promise((resolve) => {
    geolocation.getCurrentPosition(
      (position) => {
        const city = nearestCity(position.coords.latitude, position.coords.longitude)
        resolve({
          ok: true,
          profile: {
            ...profile,
            cityId: city.id,
            cityName: city.name,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        })
      },
      () => resolve({ ok: false, error: "Location was blocked. Pick a city from the list." }),
      { timeout: GEO_TIMEOUT_MS, maximumAge: GEO_MAXIMUM_AGE_MS },
    )
  })
}
