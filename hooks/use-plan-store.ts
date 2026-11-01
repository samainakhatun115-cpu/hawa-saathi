"use client"

import { useSyncExternalStore } from "react"
import {
  blankTask,
  blankVendor,
  parseStoredPlan,
  sortTasks,
  validateBrief,
  type Brief,
  type DayScheduleRow,
  type Plan,
  type Priority,
  type VendorItem,
} from "@/lib/plan"

const STORAGE_KEY = "mehfil-plan-v1"

export const STARTER_BRIEF: Brief = {
  eventType: "birthday",
  eventDate: "2026-11-24",
  city: "Pune",
  guestCount: 30,
  budgetInr: 20000,
  diet: "vegetarian",
  venueStyle: "outdoor",
  wish: "I prefer an outdoor venue, simple decorations, vegetarian food, and a photography service.",
}

export interface SavedState {
  brief: Brief
  plan: Plan | null
}

const serverSaved: SavedState = { brief: STARTER_BRIEF, plan: null }
let currentState: SavedState = serverSaved
let hasHydrated = false
let restoredFlag = false
const subscribers = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  subscribers.add(listener)
  return () => subscribers.delete(listener)
}

function parseSavedState(value: unknown): SavedState | null {
  if (!value || typeof value !== "object") return null
  const record = value as { brief?: unknown; plan?: unknown }
  const checked = validateBrief(record.brief)
  if (!checked.ok) return null
  if (record.plan == null) return { brief: checked.brief, plan: null }
  const plan = parseStoredPlan(record.plan)
  return { brief: checked.brief, plan: plan ?? null }
}

function readSnapshot(): SavedState {
  if (typeof window === "undefined") return serverSaved
  if (!hasHydrated) {
    hasHydrated = true
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = parseSavedState(JSON.parse(raw) as unknown)
        if (parsed) {
          currentState = parsed
          restoredFlag = Boolean(parsed.plan)
        }
      }
    } catch {
      // Fall back to starter brief if stored JSON is unreadable.
    }
  }
  return currentState
}

function writeSnapshot(next: SavedState): void {
  currentState = next
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Ignore storage quota errors in private browsing modes.
    }
  }
  for (const listener of subscribers) listener()
}

function updateCurrentPlan(updater: (plan: Plan) => Plan): void {
  if (!currentState.plan) return
  writeSnapshot({
    ...currentState,
    plan: updater(currentState.plan),
  })
}

/** Synchronize the active brief and celebration plan with browser localStorage. */
export function usePlanStore() {
  const { brief, plan } = useSyncExternalStore(
    subscribe,
    readSnapshot,
    () => serverSaved,
  )
  const restored = useSyncExternalStore(
    subscribe,
    () => restoredFlag,
    () => false,
  )

  return {
    brief,
    plan,
    restored,
    setBrief(nextBrief: Brief) {
      writeSnapshot({ ...currentState, brief: nextBrief })
    },
    setBriefAndPlan(nextBrief: Brief, nextPlan: Plan | null) {
      writeSnapshot({ brief: nextBrief, plan: nextPlan })
    },
    clearPlan() {
      restoredFlag = false
      writeSnapshot({ ...currentState, plan: null })
    },
    updateBudget(id: string, estimateInr: number) {
      updateCurrentPlan((current) => ({
        ...current,
        budgetLines: current.budgetLines.map((line) =>
          line.id === id
            ? {
                ...line,
                estimateInr: Number.isFinite(estimateInr)
                  ? Math.max(0, Math.round(estimateInr))
                  : 0,
                amountLocked: true,
              }
            : line,
        ),
        updatedAt: new Date().toISOString(),
      }))
    },
    toggleTask(id: string, done: boolean) {
      updateCurrentPlan((current) => ({
        ...current,
        tasks: sortTasks(
          current.tasks.map((task) =>
            task.id === id ? { ...task, done, doneLocked: true } : task,
          ),
        ),
        updatedAt: new Date().toISOString(),
      }))
    },
    addTask(input: { title: string; dueDate: string; priority: Priority }) {
      updateCurrentPlan((current) => {
        const created = blankTask(input, current.brief.eventDate)
        if (!created) return current
        return {
          ...current,
          tasks: sortTasks([...current.tasks, created]),
          updatedAt: new Date().toISOString(),
        }
      })
    },
    updateVendor(id: string, patch: Partial<VendorItem>) {
      updateCurrentPlan((current) => ({
        ...current,
        vendors: current.vendors.map((vendor) =>
          vendor.id === id
            ? { ...vendor, ...patch, detailsLocked: true }
            : vendor,
        ),
        updatedAt: new Date().toISOString(),
      }))
    },
    addVendor() {
      updateCurrentPlan((current) => ({
        ...current,
        vendors: [...current.vendors, blankVendor()],
        updatedAt: new Date().toISOString(),
      }))
    },
    removeVendor(id: string) {
      updateCurrentPlan((current) => ({
        ...current,
        vendors: current.vendors.filter((vendor) =>
          vendor.userAdded ? vendor.id !== id : true,
        ),
        updatedAt: new Date().toISOString(),
      }))
    },
    updateDaySchedule(
      id: string,
      patch: Partial<Pick<DayScheduleRow, "time" | "moment" | "note">>,
    ) {
      updateCurrentPlan((current) => ({
        ...current,
        daySchedule: current.daySchedule.map((row) =>
          row.id === id ? { ...row, ...patch, locked: true } : row,
        ),
        updatedAt: new Date().toISOString(),
      }))
    },
  }
}
