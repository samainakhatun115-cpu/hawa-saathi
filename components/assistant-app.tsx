"use client"

import { AdvisoryPanel } from "@/components/advisory-panel"
import { ProfileForm } from "@/components/profile-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfileStore } from "@/hooks/use-profile-store"
import { findCity, nearestCity } from "@/lib/cities"
import type { Advisory, AdviseRequest } from "@/lib/types"
import { Wind } from "lucide-react"
import { useState } from "react"

export function AssistantApp() {
  const { profile, setProfile, update } = useProfileStore()
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)

  async function advise(next = profile) {
    setBusy(true)
    setError(undefined)
    setNotice(undefined)
    try {
      const city = findCity(next.cityId)
      const response = await fetch("/api/advise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...next,
          latitude: next.latitude ?? city?.latitude,
          longitude: next.longitude ?? city?.longitude,
          cityName: city?.name ?? next.cityName,
        } satisfies AdviseRequest),
      })
      const payload = (await response.json()) as Advisory & { error?: string; notice?: string }
      if (!response.ok) {
        setError(payload.error || "Could not read the air just now.")
        return
      }
      setAdvisory(payload)
      setNotice(payload.notice)
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  function locate() {
    if (!navigator.geolocation) {
      setError("This browser cannot share location. Pick a city instead.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const city = nearestCity(position.coords.latitude, position.coords.longitude)
        const next = {
          ...profile,
          cityId: city.id,
          cityName: city.name,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setProfile(next)
        setLocating(false)
      },
      () => {
        setLocating(false)
        setError("Location was blocked. Pick a city from the list.")
      },
      { timeout: 8000, maximumAge: 300000 },
    )
  }

  return (
    <main id="assistant" className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:py-12">
      <header className="lg:col-span-2">
        <p className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-primary uppercase">
          <Wind className="size-4" aria-hidden />
          Hawa Saathi
        </p>
        <h1 className="mt-1 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Should you step out, or stay in?
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          For Indian cities in winter haze. The app reads live PM2.5, maps a CPCB-style band,
          then decides for a child, an older adult, someone with asthma, an outdoor worker,
          or a general adult — before Gemini writes the words around that decision.
        </p>
      </header>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Your situation</CardTitle>
          <CardDescription>
            Saved in this browser only. The Gemini key never leaves the server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            profile={profile}
            busy={busy}
            locating={locating}
            onChange={(key, value) => {
              if (key === "cityId" && typeof value === "string") {
                const city = findCity(value)
                setProfile({
                  ...profile,
                  cityId: value,
                  cityName: city?.name,
                  latitude: city?.latitude,
                  longitude: city?.longitude,
                })
                return
              }
              update(key, value)
            }}
            onLocate={locate}
            onSubmit={() => void advise()}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not finish</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {busy ? (
          <p role="status" className="text-sm text-muted-foreground">
            Reading nearby air and writing a plan…
          </p>
        ) : null}
        <AdvisoryPanel advisory={advisory} notice={notice} />
      </div>
    </main>
  )
}
