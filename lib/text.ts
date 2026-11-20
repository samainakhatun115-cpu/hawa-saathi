import { CLIP_LIST_ITEM, MAX_PLAN_ITEMS } from "@/lib/constants"

export function clip(value: string | undefined, max: number) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max)
}

export function cleanList(value: string[] | undefined, fallback: string[]) {
  const cleaned = (value ?? [])
    .map((item) => clip(item, CLIP_LIST_ITEM))
    .filter((item) => item.length > 0)
    .slice(0, MAX_PLAN_ITEMS)
  return cleaned.length > 0 ? cleaned : fallback
}
