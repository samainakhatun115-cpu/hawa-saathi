"use client"

import { Button } from "@/components/ui/button"
import { COMPARE_PERSONAS, comparePersona } from "@/lib/compare"
import { maskLabel } from "@/lib/format"
import {
  PERSONAS,
  VERDICTS,
  type Activity,
  type Advisory,
  type Duration,
  type Persona,
  type TimeWindow,
} from "@/lib/types"
import { useMemo, useState } from "react"

export function ComparePersonas({
  advisory,
  persona,
  activity,
  duration,
  timeWindow,
}: {
  advisory: Advisory
  persona: Persona
  activity: Activity
  duration: Duration
  timeWindow: TimeWindow
}) {
  const [other, setOther] = useState<Persona | null>(null)
  const selected = other === persona ? null : other
  const compared = useMemo(() => {
    if (!selected) return null
    return comparePersona(advisory, selected, activity, duration, timeWindow)
  }, [activity, advisory, duration, selected, timeWindow])

  return (
    <section className="grid gap-2" aria-labelledby="compare-heading">
      <h3 id="compare-heading" className="font-medium">
        Same air, different person
      </h3>
      <p className="text-sm text-muted-foreground">
        Re-runs only the local rules on this reading. Gemini is not called again.
      </p>
      <div className="flex flex-wrap gap-2">
        {COMPARE_PERSONAS.filter((item) => item !== persona).map((item) => (
          <Button
            key={item}
            type="button"
            size="sm"
            variant={selected === item ? "default" : "outline"}
            aria-pressed={selected === item}
            onClick={() => setOther(item)}
          >
            {PERSONAS[item]}
          </Button>
        ))}
      </div>
      {compared && selected ? (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm" aria-live="polite">
          For {PERSONAS[selected]} this air is <strong>{VERDICTS[compared.verdict]}</strong>
          {" · "}
          {maskLabel(compared.mask)}.
        </p>
      ) : null}
    </section>
  )
}
