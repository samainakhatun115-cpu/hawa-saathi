import { sortTasks } from "@/lib/format"
import type {
  Brief,
  BudgetLine,
  DayScheduleRow,
  Plan,
  PlanTask,
  VendorItem,
} from "@/lib/types"

function sameKey(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Merge a freshly generated Gemini refinement with the previous plan,
 * preserving user-locked budget estimates, checked tasks, vendor contacts,
 * and edited day-of schedule rows.
 */
export function mergeRefinement(
  previous: Plan,
  incoming: Plan,
  nowIso: string,
  brief: Brief = previous.brief,
): Plan {
  return {
    ...previous,
    brief,
    summary: incoming.summary.trim() || previous.summary,
    budgetLines: mergeBudget(previous.budgetLines, incoming.budgetLines),
    tasks: sortTasks(mergeTasks(previous.tasks, incoming.tasks)),
    vendors: mergeVendors(previous.vendors, incoming.vendors),
    ideas: incoming.ideas.length > 0 ? incoming.ideas : previous.ideas,
    daySchedule: mergeDaySchedule(previous.daySchedule, incoming.daySchedule),
    source: incoming.source === "gemini" ? "gemini" : previous.source,
    updatedAt: nowIso,
  }
}

function mergeDaySchedule(
  previous: DayScheduleRow[],
  incoming: DayScheduleRow[],
): DayScheduleRow[] {
  if (incoming.length === 0) return previous
  const locked = previous.filter((row) => row.locked)
  const lockedMoments = new Set(locked.map((row) => row.moment.trim().toLowerCase()))
  const fresh = incoming.filter(
    (row) => !lockedMoments.has(row.moment.trim().toLowerCase()),
  )
  return [...locked, ...fresh]
}

function markMatchingIds<T extends { id: string }>(
  items: T[],
  targetId: string,
  targetLabel: string,
  getLabel: (item: T) => string,
  used: Set<string>,
): T | undefined {
  let matched: T | undefined
  for (const item of items) {
    if (item.id === targetId || sameKey(getLabel(item), targetLabel)) {
      if (!matched && !used.has(item.id)) {
        matched = item
      }
      used.add(item.id)
    }
  }
  return matched
}

function mergeBudget(previous: BudgetLine[], incoming: BudgetLine[]): BudgetLine[] {
  if (incoming.length === 0) return previous
  const used = new Set<string>()
  const kept: BudgetLine[] = []
  for (const line of previous) {
    if (!line.amountLocked) continue
    const match = markMatchingIds(
      incoming,
      line.id,
      line.category,
      (item) => item.category,
      used,
    )
    kept.push({
      ...(match ?? line),
      id: line.id,
      category: line.category,
      estimateInr: line.estimateInr,
      amountLocked: true,
    })
  }
  const fresh = incoming
    .filter((item) => !used.has(item.id))
    .map((item) => ({ ...item, amountLocked: false }))
  return [...kept, ...fresh]
}

function mergeTasks(previous: PlanTask[], incoming: PlanTask[]): PlanTask[] {
  if (incoming.length === 0) return previous
  const used = new Set<string>()
  const kept: PlanTask[] = []
  for (const task of previous) {
    if (!task.doneLocked) continue
    const match = markMatchingIds(
      incoming,
      task.id,
      task.title,
      (item) => item.title,
      used,
    )
    kept.push({
      ...(match ?? task),
      id: task.id,
      title: task.title,
      done: task.done,
      doneLocked: true,
    })
  }
  const fresh = incoming
    .filter((item) => !used.has(item.id))
    .map((item) => ({ ...item, done: false, doneLocked: false }))
  return [...kept, ...fresh]
}

function mergeVendors(previous: VendorItem[], incoming: VendorItem[]): VendorItem[] {
  if (incoming.length === 0) return previous
  const used = new Set<string>()
  const kept: VendorItem[] = []
  for (const vendor of previous) {
    if (!vendor.detailsLocked && !vendor.userAdded) continue
    const match = markMatchingIds(
      incoming,
      vendor.id,
      vendor.category,
      (item) => item.category,
      used,
    )
    kept.push({
      ...(match ?? vendor),
      id: vendor.id,
      category: vendor.category,
      why: match?.why || vendor.why,
      status: vendor.status,
      contactName: vendor.contactName,
      contactPhone: vendor.contactPhone,
      quoteInr: vendor.quoteInr,
      detailsLocked: true,
      userAdded: vendor.userAdded,
    })
  }
  const fresh = incoming
    .filter((item) => !used.has(item.id))
    .map((item) => ({
      ...item,
      status: "pending" as const,
      contactName: "",
      contactPhone: "",
      quoteInr: null,
      detailsLocked: false,
      userAdded: false,
    }))
  return [...kept, ...fresh]
}
