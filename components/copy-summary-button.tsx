"use client"

import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/format"
import type { Advisory } from "@/lib/types"
import { useState } from "react"

export function CopySummaryButton({ advisory }: { advisory: Advisory }) {
  const [copied, setCopied] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      className="min-h-11"
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(copyText(advisory))
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2000)
        } catch {
          setCopied(false)
        }
      }}
    >
      {copied ? "Copied" : "Copy summary"}
    </Button>
  )
}
