import { Badge } from "@/components/ui/badge"
import { maskLabel } from "@/lib/format"
import { VERDICTS, type Decision } from "@/lib/types"

export function LockedRules({ decision }: { decision: Decision }) {
  return (
    <section
      aria-labelledby="locked-rules"
      className="rounded-lg border border-border bg-muted/40 px-3 py-3 text-sm"
    >
      <h3 id="locked-rules" className="font-medium">
        Locked by the rules engine — Gemini cannot change this
      </h3>
      <dl className="mt-2 grid gap-1 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Verdict</dt>
          <dd>{VERDICTS[decision.verdict]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Mask</dt>
          <dd>{maskLabel(decision.mask)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sensitive group</dt>
          <dd>{decision.sensitive ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <p className="mt-2">
        <Badge variant="outline">Numbers first, wording second</Badge>
      </p>
    </section>
  )
}
