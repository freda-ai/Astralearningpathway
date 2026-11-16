import type { TaskStatus } from "@/db/schema";

export type DisplayStatus = TaskStatus | "overdue";

export interface TaskLike {
  status: TaskStatus;
  dueDate: string | null;
}

/** Overdue is computed: due date before today and not completed. Never stored. */
export function isOverdue(task: TaskLike, today: string): boolean {
  return task.status !== "completed" && task.dueDate !== null && task.dueDate < today;
}

export function displayStatus(task: TaskLike, today: string): DisplayStatus {
  return isOverdue(task, today) ? "overdue" : task.status;
}

export const DISPLAY_STATUS_LABEL: Record<DisplayStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
};

export const BOARD_COLUMNS: DisplayStatus[] = ["pending", "in_progress", "completed", "overdue"];
