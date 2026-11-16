import { starterProfile } from "@/lib/validation"
import type { AdviseRequest } from "@/lib/types"

export const STORAGE_KEY = "hawa-saathi-profile-v1"

export function readProfile(): AdviseRequest {
  if (typeof window === "undefined") return starterProfile()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return starterProfile()
    const parsed = JSON.parse(raw) as Partial<AdviseRequest>
    const base = starterProfile()
    return {
      ...base,
      ...parsed,
      notes: typeof parsed.notes === "string" ? parsed.notes.slice(0, 280) : base.notes,
    }
  } catch {
    return starterProfile()
  }
}

export function writeProfile(profile: AdviseRequest) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}
