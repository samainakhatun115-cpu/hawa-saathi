export type GeminiAdvisory = {
  summary: string
  why: string
  dayPlan: string[]
  whatNotToDo: string[]
}

export const GEMINI_ADVISORY_SCHEMA: Record<string, unknown> = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    why: { type: "STRING" },
    dayPlan: { type: "ARRAY", items: { type: "STRING" } },
    whatNotToDo: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summary", "why", "dayPlan", "whatNotToDo"],
}
