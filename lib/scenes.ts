import { findCity } from "@/lib/cities"
import type { AdviseRequest } from "@/lib/types"

export type Scene = {
  id: string
  label: string
  profile: AdviseRequest
}

export const SCENES: Scene[] = [
  {
    id: "karnal-school",
    label: "Karnal · school run",
    profile: {
      cityId: "karnal",
      cityName: "Karnal",
      persona: "parent",
      activity: "school_run",
      duration: "under_30",
      window: "morning",
      notes: "Class 3 child, walks to the school gate.",
    },
  },
  {
    id: "noida-walk",
    label: "Noida · 60+ morning walk",
    profile: {
      cityId: "noida",
      cityName: "Noida",
      persona: "elderly",
      activity: "outdoor_exercise",
      duration: "one_hour",
      window: "morning",
      notes: "Daily park walk, 60+.",
    },
  },
  {
    id: "kolkata-asthma",
    label: "Kolkata · asthma commute",
    profile: {
      cityId: "kolkata",
      cityName: "Kolkata",
      persona: "asthma",
      activity: "commute",
      duration: "one_hour",
      window: "morning",
      notes: "Bus and last-mile walk to office. Has asthma.",
    },
  },
]

export function sceneFromProfile(profile: AdviseRequest): string | undefined {
  return SCENES.find((scene) => {
    return (
      scene.profile.cityId === profile.cityId &&
      scene.profile.persona === profile.persona &&
      scene.profile.activity === profile.activity
    )
  })?.id
}

export function applyScene(id: string): AdviseRequest | undefined {
  const scene = SCENES.find((row) => row.id === id)
  if (!scene) return undefined
  const city = findCity(scene.profile.cityId)
  return {
    ...scene.profile,
    latitude: city?.latitude,
    longitude: city?.longitude,
  }
}
