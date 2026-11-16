import type { Priority, TaskStatus } from "@/db/schema";
import type { DisplayStatus } from "@/lib/domain/tasks";

export interface LogTask {
  id: string;
  title: string;
  description: string | null;
  metricId: string;
  metricTitle: string;
  assignee: string | null; // "s:<id>" or "t:<id>"
  assigneeName: string | null;
  startDate: string | null;
  dueDate: string | null;
  priority: Priority;
  status: TaskStatus;
  display: DisplayStatus;
  completedAt: string | null;
  canUpdate: boolean;
}

export interface Option {
  id: string;
  name: string;
}

export interface LogOptions {
  metrics: Option[];
  people: Option[];
  teams: Option[];
}
