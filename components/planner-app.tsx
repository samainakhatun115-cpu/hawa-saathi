"use client"

import { useState } from "react"
import { BriefForm, exampleBrief } from "@/components/brief-form"
import { PlanWorkspace } from "@/components/plan-workspace"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { usePlanStore } from "@/hooks/use-plan-store"
import {
  buildSamplePlan,
  parseStoredPlan,
  validateBrief,
  type FieldErrors,
  type Plan,
} from "@/lib/plan"

export function PlannerApp() {
  const {
    brief,
    plan,
    restored,
    setBrief,
    setBriefAndPlan,
    clearPlan,
    updateBudget,
    toggleTask,
    addTask,
    updateVendor,
    addVendor,
    removeVendor,
    updateDaySchedule,
  } = usePlanStore()

  const [errors, setErrors] = useState<FieldErrors>({})
  const [followUp, setFollowUp] = useState("")
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const [message, setMessage] = useState("")
  const [banner, setBanner] = useState<{ title: string; detail: string } | null>(
    null,
  )

  async function requestPlan(nextFollowUp = "") {
    const checked = validateBrief(brief)
    if (!checked.ok) {
      setErrors(checked.errors)
      setMessage(checked.message)
      setBanner(null)
      return
    }
    if (nextFollowUp && !plan) {
      setErrors({ followUp: "Generate a plan first." })
      return
    }
    setErrors({})
    setStatus("loading")
    setMessage(nextFollowUp ? "Revising the plan…" : "Writing the plan…")
    setBanner(null)
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief: checked.brief,
          followUp: nextFollowUp,
          currentPlan: nextFollowUp ? plan : null,
        }),
      })
      const data = (await response.json()) as {
        plan?: Plan
        error?: string
        message?: string
        errors?: FieldErrors
      }
      if (!response.ok || !data.plan) {
        const detail = data.message || "The plan could not be written."
        setMessage(detail)
        if (data.errors) setErrors(data.errors)
        if (data.error === "NO_KEY") {
          setBanner({
            title: "Gemini is not connected on this server",
            detail,
          })
        } else {
          setBanner({ title: "The plan did not come back", detail })
        }
        return
      }
      const stored = parseStoredPlan(data.plan) ?? data.plan
      setBriefAndPlan(checked.brief, { ...stored, brief: checked.brief })
      setFollowUp("")
      setMessage(
        stored.source === "gemini"
          ? "Gemini plan ready. Estimates are not bookings."
          : "Plan ready.",
      )
    } catch {
      const detail =
        "The network request failed. Check your connection and try again."
      setMessage(detail)
      setBanner({ title: "Could not reach the planner", detail })
    } finally {
      setStatus("idle")
    }
  }

  function showSample() {
    const checked = validateBrief(brief)
    if (!checked.ok) {
      setErrors(checked.errors)
      setMessage(checked.message)
      return
    }
    setErrors({})
    setBanner(null)
    setBriefAndPlan(checked.brief, buildSamplePlan(checked.brief))
    setMessage("Sample plan ready. This did not call Gemini.")
  }

  const loading = status === "loading"

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:py-12">
      <header className="lg:col-span-2">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          Mehfil
        </p>
        <h1 className="mt-1 font-heading text-4xl font-medium tracking-tight text-balance sm:text-5xl">
          Plan the gathering before the spending starts.
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          Describe a wedding, birthday, or community event. Mehfil turns it into a budget, a timeline, a vendor checklist, and ideas you can edit.
        </p>
      </header>
      <div className="grid gap-4 lg:sticky lg:top-6">
        {banner ? (
          <Alert
            variant={banner.title.includes("Gemini") ? "default" : "destructive"}
          >
            <AlertTitle>{banner.title}</AlertTitle>
            <AlertDescription>{banner.detail}</AlertDescription>
          </Alert>
        ) : null}
        {restored && plan ? (
          <p className="text-sm text-muted-foreground">
            Restored the plan saved in this browser.
          </p>
        ) : null}
        {message && !banner ? (
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}
        <BriefForm
          brief={brief}
          errors={errors}
          disabled={loading}
          onChange={(next) => {
            setBrief(next)
            setErrors({})
          }}
          onExample={() => {
            setBrief(exampleBrief())
            setErrors({})
            setMessage("Birthday example filled in. Generate when you are ready.")
          }}
          onGenerate={() => void requestPlan("")}
          onSample={showSample}
        />
      </div>
      <div id="planner" aria-busy={loading}>
        <PlanWorkspace
          plan={plan}
          followUp={followUp}
          followUpError={errors.followUp}
          disabled={loading}
          onBudget={updateBudget}
          onToggleTask={toggleTask}
          onAddTask={addTask}
          onVendor={updateVendor}
          onAddVendor={addVendor}
          onRemoveVendor={removeVendor}
          onFollowUp={(value) => {
            setFollowUp(value)
            setErrors((current) => ({ ...current, followUp: undefined }))
          }}
          onRefine={() => {
            if (!followUp.trim()) {
              setErrors((current) => ({
                ...current,
                followUp: "Say what you want changed.",
              }))
              return
            }
            void requestPlan(followUp.trim())
          }}
          onClear={() => {
            clearPlan()
            setFollowUp("")
            setMessage("Saved plan cleared on this browser.")
          }}
          onDaySchedule={updateDaySchedule}
        />
      </div>
      <footer className="text-sm text-muted-foreground lg:col-span-2">
        Built for PromptWars Challenge 5. Estimates are not bookings, and vendor rows are not real listings.
      </footer>
    </div>
  )
}
