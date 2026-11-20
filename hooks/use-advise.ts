"use client"

import { useProfileStore } from "@/hooks/use-profile-store"
import { requestAdvisory } from "@/lib/advise-client"
import { applyCityId } from "@/lib/city-profile"
import { locateProfile } from "@/lib/geo"
import type { Advisory, AdviseRequest } from "@/lib/types"
import { useState } from "react"

export function useAdvise() {
  const { profile, setProfile, update } = useProfileStore()
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)

  async function advise(next: AdviseRequest = profile) {
    setBusy(true)
    setError(undefined)
    setNotice(undefined)
    setAdvisory(null)
    try {
      const result = await requestAdvisory(next)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setAdvisory(result.advisory)
      setNotice(result.notice)
    } finally {
      setBusy(false)
    }
  }

  async function locate() {
    setLocating(true)
    setError(undefined)
    try {
      const result = await locateProfile(profile, navigator.geolocation)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setProfile(result.profile)
    } finally {
      setLocating(false)
    }
  }

  function changeField<K extends keyof AdviseRequest>(key: K, value: AdviseRequest[K]) {
    if (key === "cityId" && typeof value === "string") {
      setProfile(applyCityId(profile, value))
      return
    }
    update(key, value)
  }

  return {
    profile,
    setProfile,
    advisory,
    notice,
    error,
    busy,
    locating,
    advise,
    locate,
    changeField,
  }
}
