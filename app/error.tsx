"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center gap-4 px-6 py-12"
    >
      <p className="text-sm font-medium tracking-wide text-primary uppercase">
        Hawa Saathi
      </p>
      <h1 className="font-heading text-2xl font-medium">
        Something went wrong while loading the air assistant.
      </h1>
      <p className="text-sm text-muted-foreground">
        {error.message || "Your saved profile in this browser is still here."}
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
