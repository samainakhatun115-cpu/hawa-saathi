import { fallbackCity, findCity } from "@/lib/cities"
import { MAX_CITY_NAME, MAX_NOTES } from "@/lib/constants"
import {
  ACTIVITIES,
  DURATIONS,
  PERSONAS,
  WINDOWS,
  type AdviseRequest,
} from "@/lib/types"

function isKey<T extends Record<string, string>>(table: T, value: unknown): value is keyof T {
  return typeof value === "string" && value in table
}

function asNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined
  if (value < min || value > max) return undefined
  return value
}

export function parseAdviseRequest(body: unknown): { ok: true; value: AdviseRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Send a JSON profile." }
  const data = body as Record<string, unknown>

  if (!isKey(PERSONAS, data.persona)) return { ok: false, error: "Pick who this advice is for." }
  if (!isKey(ACTIVITIES, data.activity)) return { ok: false, error: "Pick what you need to do outdoors." }
  if (!isKey(DURATIONS, data.duration)) return { ok: false, error: "Pick how long you will be out." }
  if (!isKey(WINDOWS, data.window)) return { ok: false, error: "Pick when this is happening." }

  const notes = typeof data.notes === "string" ? data.notes.trim().slice(0, MAX_NOTES) : ""
  const cityId = typeof data.cityId === "string" ? data.cityId : ""
  const city = findCity(cityId)
  const latitude = asNumber(data.latitude, -90, 90)
  const longitude = asNumber(data.longitude, -180, 180)
  const cityName =
    typeof data.cityName === "string" ? data.cityName.trim().slice(0, MAX_CITY_NAME) : undefined

  if (!city && (latitude === undefined || longitude === undefined)) {
    return { ok: false, error: "Pick a city, or allow location so we can use nearby air data." }
  }

  return {
    ok: true,
    value: {
      cityId: city?.id ?? "custom",
      cityName: city?.name ?? cityName,
      persona: data.persona,
      activity: data.activity,
      duration: data.duration,
      window: data.window,
      notes,
      latitude: latitude ?? city?.latitude,
      longitude: longitude ?? city?.longitude,
    },
  }
}

export function starterProfile(): AdviseRequest {
  const city = findCity("karnal") ?? fallbackCity()
  return {
    cityId: city.id,
    cityName: city.name,
    persona: "parent",
    activity: "school_run",
    duration: "under_30",
    window: "morning",
    notes: "Class 3 child, walks to the school gate.",
    latitude: city.latitude,
    longitude: city.longitude,
  }
}

/** Drop anything localStorage cannot turn into a valid profile. */
export function sanitizeProfile(raw: unknown): AdviseRequest {
  const base = starterProfile()
  if (!raw || typeof raw !== "object") return base
  const data = raw as Record<string, unknown>
  const parsed = parseAdviseRequest({
    cityId: data.cityId ?? base.cityId,
    cityName: data.cityName ?? base.cityName,
    persona: data.persona ?? base.persona,
    activity: data.activity ?? base.activity,
    duration: data.duration ?? base.duration,
    window: data.window ?? base.window,
    notes: typeof data.notes === "string" ? data.notes : base.notes,
    latitude: data.latitude,
    longitude: data.longitude,
  })
  return parsed.ok ? parsed.value : base
}
