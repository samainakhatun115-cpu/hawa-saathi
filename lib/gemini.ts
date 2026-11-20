import { GEMINI_TIMEOUT_MS } from "@/lib/constants"
import { readGeminiKey, readServerEnv } from "@/lib/env"
import {
  errorForGeminiStatus,
  GeminiError,
  isAbortError,
  isFatalGeminiError,
} from "@/lib/gemini-error"
import { modelCandidates, parseGeminiJson, textFromGeminiPayload } from "@/lib/gemini-parse"

const DEFAULT_MODEL = "gemini-3.5-flash-lite"

export async function generateJson<T>(input: {
  system: string
  user: string
  schema: Record<string, unknown>
}): Promise<{ data: T; model: string }> {
  const key = readGeminiKey()
  if (!key) {
    throw new GeminiError("Add GEMINI_API_KEY on the server to generate a personalized advisory.", 503)
  }

  const models = modelCandidates(DEFAULT_MODEL, readServerEnv("GEMINI_MODEL"))
  let lastError: unknown
  for (const next of models) {
    try {
      return { data: await callGemini<T>(key, next, input), model: next }
    } catch (error) {
      lastError = error
      if (isFatalGeminiError(error)) {
        throw error instanceof Error ? error : new GeminiError("Gemini request failed.", 502)
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
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts: [{ text: input.user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: input.schema,
        },
      }),
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw new GeminiError("Gemini timed out.", 408)
    }
    throw new GeminiError("Could not reach Gemini.", 502)
  }

  if (!response.ok) throw errorForGeminiStatus(response.status)
  const payload: unknown = await response.json()
  return parseGeminiJson<T>(textFromGeminiPayload(payload))
}

export { DEFAULT_MODEL, GeminiError }
