"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useActionState, useCallback, useState } from "react";
import { addComment, deleteTask } from "@/lib/actions/tasks";
import type { ActionState } from "@/lib/actions/state";
import { Avatar } from "@/components/ui/avatar";
import { PriorityFlag, TaskStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FormMessage, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/domain/dates";
import { StatusSelect } from "./status-select";
import { TaskForm } from "./task-form";
import type { LogOptions, LogTask } from "./types";

export interface CommentView {
  id: string;
  author: string;
  body: string;
  createdAt: string;
}

export function TaskDrawer({
  programmeId,
  task,
  comments,
  options,
  canManage,
  canComment,
}: {
  programmeId: string;
  task: LogTask | null;
  comments: CommentView[];
  options: LogOptions;
  canManage: boolean;
  canComment: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [editing, setEditing] = useState(false);

  const close = useCallback(() => {
    const next = new URLSearchParams(params);
    next.delete("task");
    setEditing(false);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [params, pathname, router]);
  const doneEditing = useCallback(() => setEditing(false), []);

  return (
    <Drawer open={task !== null} onClose={close} title={editing ? "Edit task" : "Task"}>
      {task &&
        (editing ? (
          <TaskForm programmeId={programmeId} options={options} task={task} onDone={doneEditing} />
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={task.display} />
                <PriorityFlag priority={task.priority} />
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">{task.title}</h3>
              {task.description && <p className="mt-2 text-sm whitespace-pre-line text-muted">{task.description}</p>}
            </div>

            <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted">Metric</dt>
              <dd>
                <Link href={`/p/${programmeId}/metrics/${task.metricId}`} className="font-medium hover:underline">
                  {task.metricTitle}
                </Link>
              </dd>
              <dt className="text-muted">Assigned to</dt>
              <dd>{task.assigneeName ?? "Unassigned"}</dd>
              <dt className="text-muted">Start</dt>
              <dd>{formatDate(task.startDate)}</dd>
              <dt className="text-muted">Due</dt>
              <dd className={task.display === "overdue" ? "font-medium text-terracotta" : ""}>{formatDate(task.dueDate)}</dd>
              {task.completedAt && (
                <>
                  <dt className="text-muted">Completed</dt>
                  <dd>{formatDate(task.completedAt)}</dd>
                </>
              )}
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              {task.canUpdate && (
                <StatusSelect programmeId={programmeId} taskId={task.id} status={task.status} label="Task status" />
              )}
              {canManage && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Edit task
                </Button>
              )}
              {canManage && <DeleteTask programmeId={programmeId} taskId={task.id} onDeleted={close} />}
            </div>

            <section>
              <h4 className="mb-3 text-sm font-semibold">Progress updates</h4>
              {comments.length === 0 ? (
                <p className="text-sm text-muted">No updates yet.</p>
              ) : (
                <ul className="space-y-3">
                  {comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <Avatar name={c.author} className="size-6 text-[10px]" />
                      <div className="min-w-0 flex-1 rounded-lg bg-paper px-3 py-2 text-sm">
                        <p className="text-xs text-muted">
                          <span className="font-medium text-ink">{c.author}</span> · {formatDate(c.createdAt)}
                        </p>
                        <p className="mt-0.5 whitespace-pre-line">{c.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {canComment && <CommentForm programmeId={programmeId} taskId={task.id} />}
            </section>
          </div>
        ))}
    </Drawer>
  );
}

function CommentForm({ programmeId, taskId }: { programmeId: string; taskId: string }) {
  const [state, action] = useActionState(addComment, {});
  return (
    <form action={action} key={state.ok} className="mt-4 space-y-2">
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="taskId" value={taskId} />
      <Textarea name="body" aria-label="Add a progress update" placeholder="Add a progress update…" required />
      <FormMessage error={state.error} />
      <SubmitButton size="sm" variant="dark" pendingText="Posting…">
        Post update
      </SubmitButton>
    </form>
  );
}

function DeleteTask({ programmeId, taskId, onDeleted }: { programmeId: string; taskId: string; onDeleted: () => void }) {
  const [state, action] = useActionState(async (prev: ActionState, fd: FormData) => {
    const r = await deleteTask(prev, fd);
    if (r.ok) onDeleted();
    return r;
  }, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Delete this task?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="taskId" value={taskId} />
      <SubmitButton variant="ghost" size="sm" className="text-terracotta" pendingText="Deleting…">
        Delete
      </SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}
