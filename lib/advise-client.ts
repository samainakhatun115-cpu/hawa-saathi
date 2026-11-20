import { findCity } from "@/lib/cities"
import { ADVISE_CLIENT_TIMEOUT_MS } from "@/lib/constants"
import type { Advisory, AdviseRequest } from "@/lib/types"

export type AdviseOk = { ok: true; advisory: Advisory; notice?: string }
export type AdviseFail = { ok: false; error: string; timedOut?: boolean }
export type AdviseResult = AdviseOk | AdviseFail

/** Fill city coordinates before POST so the server never has to guess the map pin. */
export function requestBodyFor(profile: AdviseRequest): AdviseRequest {
  const city = findCity(profile.cityId)
  return {
    ...profile,
    latitude: profile.latitude ?? city?.latitude,
    longitude: profile.longitude ?? city?.longitude,
    cityName: city?.name ?? profile.cityName,
  }
}

export async function requestAdvisory(
  profile: AdviseRequest,
  fetchImpl: typeof fetch = fetch,
): Promise<AdviseResult> {
  try {
    const response = await fetchImpl("/api/advise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBodyFor(profile)),
      signal: AbortSignal.timeout(ADVISE_CLIENT_TIMEOUT_MS),
    })
    const payload = (await response.json()) as Advisory & { error?: string; notice?: string }
    if (!response.ok) {
      return { ok: false, error: payload.error || "Could not read the air just now." }
    }
    return { ok: true, advisory: payload, notice: payload.notice }
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")
    return {
      ok: false,
      timedOut,
      error: timedOut
        ? "That took too long. Tap Should I go out? once more."
        : "Network error. Check your connection and try again.",
    }
  }
}
