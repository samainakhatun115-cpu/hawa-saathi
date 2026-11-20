export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = "GeminiError"
  }
}

const NO_RETRY = new Set([401, 403, 408, 429, 503])

/** Auth, timeout, and overload errors will not get faster on a heavier model. */
export function isFatalGeminiError(error: unknown): boolean {
  if (!(error instanceof GeminiError)) return true
  return error.status !== undefined && NO_RETRY.has(error.status)
}

export function errorForGeminiStatus(status: number): GeminiError {
  if (status === 429 || status === 503) {
    return new GeminiError("Gemini is busy. Try once more in a minute.", status)
  }
  if (status === 401 || status === 403) {
    return new GeminiError("The Gemini key was rejected. Check GEMINI_API_KEY.", status)
  }
  return new GeminiError(`Gemini request failed (${status}).`, status)
}

export function isAbortError(error: unknown) {
  return (
    (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) ||
    (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "TimeoutError")
  )
}
