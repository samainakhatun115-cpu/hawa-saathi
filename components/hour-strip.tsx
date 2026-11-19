import { categoryTone } from "@/lib/format"
import { upcomingHourly } from "@/lib/hours"
import type { AirSnapshot } from "@/lib/types"

export function HourStrip({ snapshot }: { snapshot: AirSnapshot }) {
  const hours = upcomingHourly(snapshot).slice(0, 12)
  if (hours.length === 0) return null
  return (
    <section aria-labelledby="hour-strip" className="grid gap-2">
      <h3 id="hour-strip" className="text-sm font-medium">
        Next hours (PM2.5)
      </h3>
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {hours.map((row) => {
          const label = new Date(row.hour).toLocaleTimeString("en-IN", {
            hour: "numeric",
            timeZone: "Asia/Kolkata",
          })
          const pm25 = Math.round(row.pm25)
          return (
            <li key={row.hour}>
              <div
                className={`flex min-w-14 flex-col items-center rounded-lg px-2 py-2 text-center band-${categoryTone(row.category)}`}
                aria-label={`${label}, ${pm25} micrograms per cubic metre, ${row.category}`}
              >
                <span className="text-[11px] opacity-80" aria-hidden>
                  {label}
                </span>
                <span className="text-sm font-medium" aria-hidden>
                  {pm25}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
