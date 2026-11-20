"use client"

import { Button } from "@/components/ui/button"
import { applyScene, SCENES, sceneFromProfile } from "@/lib/scenes"
import type { AdviseRequest } from "@/lib/types"

export function SceneChips({
  profile,
  disabled,
  onPick,
}: {
  profile: AdviseRequest
  disabled?: boolean
  onPick: (profile: AdviseRequest) => void
}) {
  const active = sceneFromProfile(profile)
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">Try a scene</legend>
      <div className="flex flex-wrap gap-2">
        {SCENES.map((scene) => (
          <Button
            key={scene.id}
            type="button"
            className="min-h-11"
            variant={active === scene.id ? "default" : "outline"}
            disabled={disabled}
            aria-pressed={active === scene.id}
            onClick={() => {
              const next = applyScene(scene.id)
              if (next) onPick(next)
            }}
          >
            {scene.label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
