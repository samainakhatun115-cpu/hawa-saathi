export function clip(value: string | undefined, max: number) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max)
}

export function cleanList(value: string[] | undefined, fallback: string[]) {
  const cleaned = (value ?? [])
    .map((item) => clip(item, 180))
    .filter((item) => item.length > 0)
    .slice(0, 5)
  return cleaned.length > 0 ? cleaned : fallback
}
