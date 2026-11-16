export const PERSONAS = {
  parent: "Parent of a school-age child",
  elderly: "Older adult (60+)",
  asthma: "Someone with asthma or breathing issues",
  outdoor_worker: "Outdoor / delivery / construction worker",
  adult: "General adult",
} as const

export type Persona = keyof typeof PERSONAS

export const ACTIVITIES = {
  school_run: "School drop / pickup",
  commute: "Daily commute",
  outdoor_exercise: "Walk, run, or outdoor play",
  outdoor_work: "Work that has to happen outdoors",
  errands: "Short outdoor errands",
  stay_home: "Planning a stay-home day",
} as const

export type Activity = keyof typeof ACTIVITIES

export const DURATIONS = {
  under_30: "Under 30 minutes",
  one_hour: "About 1 hour",
  half_day: "Half day",
  full_day: "Most of the day",
} as const

export type Duration = keyof typeof DURATIONS

export const WINDOWS = {
  now: "Right now",
  morning: "This morning",
  afternoon: "This afternoon",
  evening: "This evening",
} as const

export type TimeWindow = keyof typeof WINDOWS

export const CATEGORIES = [
  "Good",
  "Satisfactory",
  "Moderate",
  "Poor",
  "Very Poor",
  "Severe",
] as const

export type AqiCategory = (typeof CATEGORIES)[number]

export const VERDICTS = {
  go: "Go ahead",
  caution: "Go, but take care",
  limit: "Limit outdoor time",
  indoor: "Stay indoors if you can",
} as const

export type Verdict = keyof typeof VERDICTS

export type City = {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
}

export type AirSnapshot = {
  cityId: string
  cityName: string
  latitude: number
  longitude: number
  observedAt: string
  source: "open-meteo" | "sample"
  pm25: number
  pm10: number
  ozone: number | null
  no2: number | null
  so2: number | null
  co: number | null
  europeanAqi: number | null
  usAqi: number | null
  cpcbPm25Index: number
  category: AqiCategory
  hourlyPm25: Array<{ hour: string; pm25: number; category: AqiCategory }>
}

export type Profile = {
  cityId: string
  persona: Persona
  activity: Activity
  duration: Duration
  window: TimeWindow
  notes: string
}

export type Decision = {
  verdict: Verdict
  headline: string
  reasons: string[]
  actions: string[]
  mask: "none" | "optional" | "recommended" | "n95"
  windows: string[]
  sensitive: boolean
}

export type Advisory = {
  snapshot: AirSnapshot
  decision: Decision
  summary: string
  why: string
  dayPlan: string[]
  whatNotToDo: string[]
  disclaimer: string
  model: string
}

export type AdviseRequest = Profile & {
  latitude?: number
  longitude?: number
  cityName?: string
}
