import { Badge } from "@/components/ui/badge"
import { categoryTone, observedLabel, pollutantLabel } from "@/lib/format"
import type { AirSnapshot } from "@/lib/types"

export function AirMeter({ snapshot }: { snapshot: AirSnapshot }) {
  const tone = categoryTone(snapshot.category)
  return (
    <section aria-labelledby="air-reading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {snapshot.cityName}
          </p>
          <h2 id="air-reading" className="font-heading text-3xl font-medium tracking-tight">
            {snapshot.category}
          </h2>
          <p className="text-sm text-muted-foreground">{observedLabel(snapshot)}</p>
        </div>
        <p
          className={`rounded-full px-3 py-1 text-sm font-medium band-${tone}`}
          aria-label={`CPCB-style PM2.5 index ${snapshot.cpcbPm25Index}`}
        >
          Index {snapshot.cpcbPm25Index}
        </p>
      </div>
      <p className="text-sm">
        PM2.5 is about <strong>{Math.round(snapshot.pm25)} µg/m³</strong>. That is mapped to a
        CPCB-style band — an estimate, not an official station AQI.
      </p>
      <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        <Stat label="PM10" value={pollutantLabel(snapshot.pm10, "µg/m³")} />
        <Stat label="Ozone" value={pollutantLabel(snapshot.ozone, "µg/m³")} />
        <Stat label="NO₂" value={pollutantLabel(snapshot.no2, "µg/m³")} />
        <Stat label="SO₂" value={pollutantLabel(snapshot.so2, "µg/m³")} />
        <Stat label="CO" value={pollutantLabel(snapshot.co, "µg/m³")} />
        <Stat label="US AQI" value={pollutantLabel(snapshot.usAqi, "")} />
      </dl>
      {snapshot.source === "sample" ? (
        <Badge variant="outline">Using a labeled sample — live air was unavailable</Badge>
      ) : null}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
