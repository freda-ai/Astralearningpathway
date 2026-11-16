"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { saveTask } from "@/lib/actions/tasks";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import type { LogOptions, LogTask } from "./types";

export function TaskForm({
  programmeId,
  options,
  task,
  defaultMetricId,
  onDone,
}: {
  programmeId: string;
  options: LogOptions;
  task?: LogTask;
  defaultMetricId?: string;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveTask, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  if (options.metrics.length === 0) {
    return (
      <div className="space-y-3 text-sm">
        <p>Every task must contribute to an outcome, and this programme has none yet.</p>
        <Link href={`/p/${programmeId}/metrics`} className="font-medium underline underline-offset-4">
          Create an outcome in Metric
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="programmeId" value={programmeId} />
      {task && <input type="hidden" name="taskId" value={task.id} />}
      {task && <input type="hidden" name="status" value={task.status} />}
      <Field label="Title" htmlFor="t-title">
        <Input id="t-title" name="title" defaultValue={task?.title} required autoFocus />
      </Field>
      <Field label="Description" htmlFor="t-desc">
        <Textarea id="t-desc" name="description" defaultValue={task?.description ?? ""} />
      </Field>
      <Field label="Metric" htmlFor="t-metric" hint="Required. The outcome this task moves.">
        <Select id="t-metric" name="metricId" defaultValue={task?.metricId ?? defaultMetricId ?? ""} required>
          <option value="" disabled>
            Choose a metric…
          </option>
          {options.metrics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Assignee or team" htmlFor="t-assignee">
        <Select id="t-assignee" name="assignee" defaultValue={task?.assignee ?? ""}>
          <option value="">Unassigned</option>
          <optgroup label="People">
            {options.people.map((p) => (
              <option key={p.id} value={`s:${p.id}`}>
                {p.name}
              </option>
            ))}
          </optgroup>
          {options.teams.length > 0 && (
            <optgroup label="Teams">
              {options.teams.map((t) => (
                <option key={t.id} value={`t:${t.id}`}>
                  {t.name} (team)
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" htmlFor="t-start">
          <Input id="t-start" name="startDate" type="date" defaultValue={task?.startDate ?? ""} />
        </Field>
        <Field label="Due date" htmlFor="t-due">
          <Input id="t-due" name="dueDate" type="date" defaultValue={task?.dueDate ?? ""} />
        </Field>
      </div>
      <Field label="Priority" htmlFor="t-priority">
        <Select id="t-priority" name="priority" defaultValue={task?.priority ?? "medium"}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton>{task ? "Save task" : "Create task"}</SubmitButton>
    </form>
  );
}
