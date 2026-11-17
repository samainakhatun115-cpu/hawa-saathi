"use client"

import { AirMeter } from "@/components/air-meter"
import { HourStrip } from "@/components/hour-strip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { copyText, maskLabel } from "@/lib/format"
import { VERDICTS, type Advisory } from "@/lib/types"
import { useState } from "react"

export function AdvisoryPanel({
  advisory,
  notice,
}: {
  advisory: Advisory | null
  notice?: string
}) {
  const [copied, setCopied] = useState(false)

  if (!advisory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waiting for a reading</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Pick who this is for and what they need to do. The assistant will read the air,
          lock a go / limit / stay-in decision, then write a short plan around that decision.
        </CardContent>
      </Card>
    )
  }

  const { decision } = advisory

  return (
    <div className="grid gap-4" aria-live="polite">
      {notice ? (
        <Alert>
          <AlertTitle>Plan is ready</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {VERDICTS[decision.verdict]}
            </p>
            <CardTitle className="font-heading text-2xl">{decision.headline}</CardTitle>
          </div>
          <Badge variant={decision.verdict === "indoor" ? "destructive" : "secondary"}>
            {maskLabel(decision.mask)}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AirMeter snapshot={advisory.snapshot} />
          <HourStrip snapshot={advisory.snapshot} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>What to do</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <p>{advisory.summary}</p>
          <p className="text-muted-foreground">{advisory.why}</p>
          <List title="For the next few hours" items={advisory.dayPlan} />
          <List title="Skip this" items={advisory.whatNotToDo} />
          {decision.windows.length > 0 ? (
            <List title="Comparatively better hours" items={decision.windows} />
          ) : null}
          <p className="text-xs text-muted-foreground">{advisory.disclaimer}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(copyText(advisory))
                setCopied(true)
                window.setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? "Copied" : "Copy summary"}
            </Button>
            <p className="self-center text-xs text-muted-foreground">
              Written with {advisory.model === "rules-engine" ? "the local rules engine" : advisory.model}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="mb-1 font-medium">{title}</h3>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  )
}
