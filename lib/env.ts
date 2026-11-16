/** Read a server env var at request time so Vercel can inject it after the build. */
export function readServerEnv(name: string): string {
  const value = process.env[name]
  return typeof value === "string" ? value.trim() : ""
}

export function readGeminiKey(): string {
  return readServerEnv("GEMINI_API_KEY") || readServerEnv("GOOGLE_API_KEY")
}
