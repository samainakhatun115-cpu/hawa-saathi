"use client"

import { AdvisoryPanel } from "@/components/advisory-panel"
import { AppHeader } from "@/components/app-header"
import { ProfileForm } from "@/components/profile-form"
import { SceneChips } from "@/components/scene-chips"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdvise } from "@/hooks/use-advise"

export function AssistantApp() {
  const {
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
  } = useAdvise()

  return (
    <main
      id="assistant"
      aria-busy={busy}
      className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:py-12"
    >
      <AppHeader />

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Your situation</CardTitle>
          <CardDescription>
            Saved in this browser only. The Gemini key never leaves the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <SceneChips
            profile={profile}
            disabled={busy}
            onPick={(next) => {
              setProfile(next)
              void advise(next)
            }}
          />
          <ProfileForm
            profile={profile}
            busy={busy}
            locating={locating}
            onChange={changeField}
            onLocate={() => void locate()}
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
        <AdvisoryPanel
          advisory={advisory}
          notice={notice}
          persona={profile.persona}
          activity={profile.activity}
          duration={profile.duration}
          timeWindow={profile.window}
        />
      </div>
    </main>
  )
}
