import { categoryTone } from "@/lib/format"
import type { AirSnapshot } from "@/lib/types"

export function HourStrip({ snapshot }: { snapshot: AirSnapshot }) {
  if (snapshot.hourlyPm25.length === 0) return null
  return (
    <section aria-labelledby="hour-strip" className="grid gap-2">
      <h3 id="hour-strip" className="text-sm font-medium">
        Next hours (PM2.5)
      </h3>
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {upcomingHours(snapshot).map((row) => {
          const label = new Date(row.hour).toLocaleTimeString("en-IN", {
            hour: "numeric",
            timeZone: "Asia/Kolkata",
          })
          return (
            <li key={row.hour}>
              <div
                className={`flex min-w-14 flex-col items-center rounded-lg px-2 py-2 text-center band-${categoryTone(row.category)}`}
              >
                <span className="text-[11px] opacity-80">{label}</span>
                <span className="text-sm font-medium">{Math.round(row.pm25)}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function upcomingHours(snapshot: AirSnapshot) {
  const now = Date.parse(snapshot.observedAt)
  const upcoming = snapshot.hourlyPm25.filter((row) => {
    const time = Date.parse(row.hour)
    return Number.isFinite(time) && (!Number.isFinite(now) || time >= now - 30 * 60 * 1000)
  })
  return (upcoming.length > 0 ? upcoming : snapshot.hourlyPm25).slice(0, 12)
}
