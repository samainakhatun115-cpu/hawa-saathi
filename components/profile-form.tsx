"use client"

import { ChoiceField } from "@/components/choice-field"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CITY_ITEMS } from "@/lib/cities"
import { ACTIVITIES, DURATIONS, PERSONAS, WINDOWS, type AdviseRequest } from "@/lib/types"

export function ProfileForm({
  profile,
  busy,
  locating,
  onChange,
  onLocate,
  onSubmit,
}: {
  profile: AdviseRequest
  busy: boolean
  locating: boolean
  onChange: <K extends keyof AdviseRequest>(key: K, value: AdviseRequest[K]) => void
  onLocate: () => void
  onSubmit: () => void
}) {
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <ChoiceField
        id="city"
        label="City"
        value={profile.cityId}
        items={CITY_ITEMS}
        onChange={(cityId) => onChange("cityId", cityId)}
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onLocate} disabled={busy || locating}>
          {locating ? "Finding you…" : "Use my location"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Location stays in this browser. We only send coordinates to read nearby air.
        </p>
      </div>
      <ChoiceField
        id="persona"
        label="Who is this for?"
        value={profile.persona}
        items={PERSONAS}
        onChange={(persona) => onChange("persona", persona)}
        disabled={busy}
      />
      <ChoiceField
        id="activity"
        label="What do you need to do?"
        value={profile.activity}
        items={ACTIVITIES}
        onChange={(activity) => onChange("activity", activity)}
        disabled={busy}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ChoiceField
          id="duration"
          label="How long?"
          value={profile.duration}
          items={DURATIONS}
          onChange={(duration) => onChange("duration", duration)}
          disabled={busy}
        />
        <ChoiceField
          id="window"
          label="When?"
          value={profile.window}
          items={WINDOWS}
          onChange={(window) => onChange("window", window)}
          disabled={busy}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="notes">Anything we should know?</Label>
        <Textarea
          id="notes"
          value={profile.notes}
          maxLength={280}
          disabled={busy}
          onChange={(event) => onChange("notes", event.target.value)}
          placeholder="Walks to the school gate. Child has a mild cough this week."
        />
        <p className="text-xs text-muted-foreground">{profile.notes.length}/280</p>
      </div>
      <Button type="submit" className="h-10" disabled={busy}>
        {busy ? "Reading the air…" : "Should I go out?"}
      </Button>
    </form>
  )
}
