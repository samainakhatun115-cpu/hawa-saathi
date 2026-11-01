"use client"

import { useState } from "react"
import { ChoiceField } from "@/components/choice-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PRIORITY_LABELS,
  taskProgress,
  type PlanTask,
  type Priority,
} from "@/lib/plan"

export function TimelinePanel({
  tasks,
  defaultDate,
  disabled,
  onToggle,
  onAddTask,
}: {
  tasks: PlanTask[]
  defaultDate?: string
  disabled: boolean
  onToggle: (id: string, done: boolean) => void
  onAddTask?: (input: { title: string; dueDate: string; priority: Priority }) => void
}) {
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState(defaultDate ?? "")
  const [priority, setPriority] = useState<Priority>("medium")
  const progress = taskProgress(tasks)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {progress.doneCount} of {progress.totalCount} tasks completed
        </span>
        <span>{progress.percent}% done</span>
      </div>
      <ul className="grid gap-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-[var(--primary)]"
                checked={task.done}
                disabled={disabled}
                onChange={(event) => onToggle(task.id, event.target.checked)}
              />
              <span className="grid gap-1">
                <span
                  className={
                    task.done
                      ? "font-medium line-through decoration-foreground/40"
                      : "font-medium"
                  }
                >
                  {task.title}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <time dateTime={task.dueDate}>{formatDay(task.dueDate)}</time>
                  <Badge variant="outline">{PRIORITY_LABELS[task.priority]}</Badge>
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {onAddTask ? (
        <form
          className="grid gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[1fr_9.5rem_8rem_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            if (!title.trim()) return
            onAddTask({
              title: title.trim(),
              dueDate: dueDate || defaultDate || "",
              priority,
            })
            setTitle("")
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="new-task-title">Add a checklist task</Label>
            <Input
              id="new-task-title"
              className="h-10"
              maxLength={140}
              placeholder="Confirm power backup or seating"
              disabled={disabled}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="new-task-date">Due date</Label>
            <Input
              id="new-task-date"
              type="date"
              className="h-10"
              disabled={disabled}
              value={dueDate || defaultDate || ""}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <ChoiceField
            id="new-task-priority"
            label="Priority"
            value={priority}
            items={PRIORITY_LABELS}
            disabled={disabled}
            onChange={setPriority}
          />
          <Button type="submit" variant="outline" className="h-10 px-4" disabled={disabled}>
            Add task
          </Button>
        </form>
      ) : null}
    </div>
  )
}

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
