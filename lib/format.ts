import {
  LIMITS,
  PRIORITY_LABELS,
  VENDOR_STATUS_LABELS,
  EVENT_LABELS,
  DIET_LABELS,
  VENUE_LABELS,
  type BudgetLine,
  type BudgetSnapshot,
  type Plan,
  type PlanTask,
  type Priority,
} from "@/lib/types"

const priorityRank: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

/** Generate a unique prefixed identifier for plan records. */
export function makeId(kind: string): string {
  const rand =
    globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${kind}_${rand}`
}

/** Format a numeric amount in Indian Rupees (INR) with no fractional digits. */
export function formatInr(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safe)
}

/** Compute the estimated cost per guest in INR. */
export function perGuestInr(totalInr: number, guestCount: number): number {
  if (!Number.isFinite(totalInr) || !Number.isFinite(guestCount) || guestCount <= 0) {
    return 0
  }
  return Math.round(Math.max(0, totalInr) / guestCount)
}

/** Normalize a Date to local midnight. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** Format a Date as YYYY-MM-DD in local time. */
export function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Parse and validate a strict YYYY-MM-DD calendar string. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

/** Return a new Date offset by the given number of calendar days. */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

/** Return an ISO date string N days ahead of the reference date. */
export function isoDateFromToday(daysAhead: number, today = new Date()): string {
  return formatIsoDate(addDays(startOfDay(today), daysAhead))
}

/** Calculate whole calendar days between today and the event date. */
export function daysUntil(eventDate: string, today = new Date()): number | null {
  const event = parseIsoDate(eventDate)
  if (!event) return null
  const diff = event.getTime() - startOfDay(today).getTime()
  return Math.round(diff / 86_400_000)
}

/** Format a human-readable countdown label for an event date. */
export function countdownLabel(eventDate: string, today = new Date()): string {
  const days = daysUntil(eventDate, today)
  if (days === null) return "Set an event date"
  if (days === 0) return "Today"
  if (days === 1) return "Tomorrow"
  if (days > 1) return `In ${days} days`
  if (days === -1) return "Yesterday"
  return `${Math.abs(days)} days ago`
}

/** Strip control characters, collapse whitespace, and cap string length. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

/** Narrow an unknown value to a plain object record. */
export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/** Check whether an unknown value is a member of a string tuple. */
export function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && options.includes(value as T)
}

/** Clamp an unknown numeric input to a valid INR amount. */
export function cleanMoney(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(amount) || amount < 0) return 0
  return Math.round(Math.min(amount, LIMITS.budgetMax))
}

/** Validate an ISO date string or fall back to a known valid date. */
export function cleanDate(value: unknown, fallback: string): string {
  const text = cleanText(value, 10)
  return parseIsoDate(text) ? text : fallback
}

/** Sum the estimated INR amounts across budget lines. */
export function budgetTotal(lines: Pick<BudgetLine, "estimateInr">[]): number {
  return lines.reduce((sum, line) => {
    const amount = Number(line.estimateInr)
    return sum + (Number.isFinite(amount) ? amount : 0)
  }, 0)
}

/** Compare planned budget estimates against the user's total budget cap. */
export function budgetSnapshot(
  lines: Pick<BudgetLine, "estimateInr">[],
  capInr: number,
): BudgetSnapshot {
  const plannedInr = budgetTotal(lines)
  const cap = Number.isFinite(capInr) ? capInr : 0
  const remainingInr = cap - plannedInr
  const overBudget = plannedInr > cap
  return {
    plannedInr,
    capInr: cap,
    remainingInr,
    overByInr: overBudget ? plannedInr - cap : 0,
    overBudget,
    percent: cap > 0 ? (plannedInr / cap) * 100 : 0,
  }
}

/** Sort timeline tasks chronologically by due date, then by priority. */
export function sortTasks<T extends Pick<PlanTask, "dueDate" | "priority">>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    const byDate = a.dueDate.localeCompare(b.dueDate)
    if (byDate !== 0) return byDate
    return priorityRank[a.priority] - priorityRank[b.priority]
  })
}

/** Summarize completed versus total timeline tasks. */
export function taskProgress(tasks: Pick<PlanTask, "done">[]): {
  doneCount: number
  totalCount: number
  percent: number
} {
  const totalCount = tasks.length
  const doneCount = tasks.filter((task) => task.done).length
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
  return { doneCount, totalCount, percent }
}

/** Format an entire plan as clean plain text for copying or sharing. */
export function formatPlanText(plan: Plan): string {
  const snapshot = budgetSnapshot(plan.budgetLines, plan.brief.budgetInr)
  const header = `${EVENT_LABELS[plan.brief.eventType]} in ${plan.brief.city} (${plan.brief.eventDate})`
  const meta = `${plan.brief.guestCount} guests · ${DIET_LABELS[plan.brief.diet]} · ${VENUE_LABELS[plan.brief.venueStyle]} · Budget cap ${formatInr(plan.brief.budgetInr)}`
  const budgetRows = plan.budgetLines.map(
    (line) => `- ${line.category}: ${formatInr(line.estimateInr)} (${line.note})`,
  )
  const taskRows = plan.tasks.map(
    (task) =>
      `- [${task.done ? "x" : " "}] ${task.title} (Due ${task.dueDate}, ${PRIORITY_LABELS[task.priority]})`,
  )
  const vendorRows = plan.vendors.map((vendor) => {
    const contact = [vendor.contactName, vendor.contactPhone].filter(Boolean).join(" ")
    const quote = vendor.quoteInr !== null ? ` · Quote ${formatInr(vendor.quoteInr)}` : ""
    return `- ${vendor.category} [${VENDOR_STATUS_LABELS[vendor.status]}${quote}]${contact ? ` — ${contact}` : ""}`
  })
  const scheduleRows = plan.daySchedule.map(
    (row) => `- ${row.time} ${row.moment}${row.note ? `: ${row.note}` : ""}`,
  )
  return [
    header,
    meta,
    "",
    plan.summary,
    "",
    `Budget (${formatInr(snapshot.plannedInr)} planned of ${formatInr(snapshot.capInr)} — estimates only):`,
    ...budgetRows,
    "",
    "Timeline:",
    ...taskRows,
    "",
    "Vendor Checklist (categories only):",
    ...vendorRows,
    "",
    "Suggested Day-Of Schedule:",
    ...scheduleRows,
  ].join("\n")
}
