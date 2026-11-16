import { readGeminiKey, readServerEnv } from "@/lib/env"

const DEFAULT_MODEL = "gemini-3.5-flash-lite"
const FALLBACK_MODEL = "gemini-3.6-flash"
const TIMEOUT_MS = 10_000

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = "GeminiError"
  }
}

export async function generateJson<T>(input: {
  system: string
  user: string
  schema: Record<string, unknown>
}): Promise<{ data: T; model: string }> {
  const key = readGeminiKey()
  if (!key) {
    throw new GeminiError("Add GEMINI_API_KEY on the server to generate a personalized advisory.", 503)
  }

  const model = readServerEnv("GEMINI_MODEL") || DEFAULT_MODEL
  const models = unique([model, DEFAULT_MODEL, FALLBACK_MODEL])
  let lastError: unknown

  for (const next of models) {
    try {
      return { data: await callGemini<T>(key, next, input), model: next }
    } catch (error) {
      lastError = error
      if (error instanceof GeminiError && (error.status === 401 || error.status === 403)) {
        throw error
      }
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiError("Gemini request failed.", 502)
}

async function callGemini<T>(
  key: string,
  model: string,
  input: { system: string; user: string; schema: Record<string, unknown> },
): Promise<T> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts: [{ text: input.user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: input.schema,
          thinkingConfig: { thinkingBudget: 0, thinkingLevel: "minimal" },
        },
      }),
    })
  } catch (error) {
    if (isTimeout(error)) {
      throw new GeminiError("Gemini timed out.", 408)
    }
    throw new GeminiError("Could not reach Gemini.", 502)
  }

  if (!response.ok) {
    const status = response.status
    if (status === 429 || status === 503) {
      throw new GeminiError("Gemini is busy. Try once more in a minute.", status)
    }
    if (status === 401 || status === 403) {
      throw new GeminiError("The Gemini key was rejected. Check GEMINI_API_KEY.", status)
    }
    throw new GeminiError(`Gemini request failed (${status}).`, status)
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? ""
  try {
    return JSON.parse(text) as T
  } catch {
    throw new GeminiError("Gemini returned text that was not valid JSON.")
  }
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))]
}

function isTimeout(error: unknown) {
  return (
    (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) ||
    (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "TimeoutError")
  )
}

export { DEFAULT_MODEL, FALLBACK_MODEL }
