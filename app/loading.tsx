export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Mehfil celebration planner"
      className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:py-12"
    >
      <div className="h-24 animate-pulse rounded-2xl bg-muted/60 lg:col-span-2" />
      <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />
      <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />
    </div>
  )
}
