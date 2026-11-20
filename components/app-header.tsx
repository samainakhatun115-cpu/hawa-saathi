import { Wind } from "lucide-react"

export function AppHeader() {
  return (
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
  )
}
