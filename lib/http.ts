const NO_STORE = { "Cache-Control": "no-store" } as const

export function jsonBody(data: unknown, status = 200) {
  return Response.json(data, { status, headers: NO_STORE })
}

export function jsonError(error: string, status: number) {
  return jsonBody({ error }, status)
}
