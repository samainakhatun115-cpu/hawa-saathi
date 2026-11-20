import { GeminiError } from "@/lib/gemini-error"

type GeminiPart = { text?: string }
type GeminiPayload = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>
}

export function modelCandidates(primary: string, extra: string) {
  return [...new Set([primary, extra].filter((value) => value.length > 0))]
}

export function textFromGeminiPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return ""
  const candidates = (payload as GeminiPayload).candidates
  if (!Array.isArray(candidates)) return ""
  return candidates[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? ""
}

export function parseGeminiJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiError("Gemini returned text that was not valid JSON.")
  }
}
