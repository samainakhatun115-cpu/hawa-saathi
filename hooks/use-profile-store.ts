"use client"

import { useCallback, useMemo, useSyncExternalStore } from "react"
import { readProfile, writeProfile } from "@/lib/storage"
import { starterProfile } from "@/lib/validation"
import type { AdviseRequest } from "@/lib/types"

const serverSnapshot = starterProfile()
let current = serverSnapshot
const listeners = new Set<() => void>()

function readProfileSafe(): AdviseRequest {
  try {
    return readProfile()
  } catch {
    return starterProfile()
  }
}

function getServerSnapshot() {
  return serverSnapshot
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return current
}

if (typeof window !== "undefined") {
  current = readProfileSafe()
}

export function useProfileStore() {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setProfile = useCallback((next: AdviseRequest | ((prev: AdviseRequest) => AdviseRequest)) => {
    current = typeof next === "function" ? next(current) : next
    writeProfile(current)
    emit()
  }, [])

  const update = useCallback(
    <K extends keyof AdviseRequest>(key: K, value: AdviseRequest[K]) => {
      setProfile((prev) => ({ ...prev, [key]: value }))
    },
    [setProfile],
  )

  return useMemo(() => ({ profile, setProfile, update }), [profile, setProfile, update])
}
