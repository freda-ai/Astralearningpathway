"use client";

import { useActionState, useRef } from "react";
import { setTaskStatus } from "@/lib/actions/tasks";
import type { TaskStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

/** Changes a task's status as soon as a new option is picked. */
export function StatusSelect({
  programmeId,
  taskId,
  status,
  label,
  className,
}: {
  programmeId: string;
  taskId: string;
  status: TaskStatus;
  label: string;
  className?: string;
}) {
  const [state, action, pending] = useActionState(setTaskStatus, {});
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={action} className={className} onClick={(e) => e.stopPropagation()}>
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="status"
        aria-label={label}
        defaultValue={status}
        key={status}
        disabled={pending}
        onChange={() => form.current?.requestSubmit()}
        className={cn(
          "h-8 rounded-md border border-line bg-paper px-2 text-xs focus:border-gold focus:outline-none",
          pending && "opacity-60",
        )}
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
      </select>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-terracotta">
          {state.error}
        </p>
      )}
    </form>
  );
}
