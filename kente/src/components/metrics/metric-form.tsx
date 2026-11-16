"use client";

import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { saveMetric } from "@/lib/actions/metrics";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export interface MetricFormValues {
  id: string;
  title: string;
  description: string | null;
  target: number | null;
  baseline: number | null;
  unit: string | null;
  deadline: string | null;
}

export function MetricButton({ programmeId, metric }: { programmeId: string; metric?: MetricFormValues }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {metric ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Pencil /> Edit outcome
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus /> New outcome
        </Button>
      )}
      <Drawer open={open} onClose={() => setOpen(false)} title={metric ? "Edit outcome" : "New outcome"}>
        <MetricForm programmeId={programmeId} metric={metric} onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

function MetricForm({ programmeId, metric, onDone }: { programmeId: string; metric?: MetricFormValues; onDone: () => void }) {
  const [state, action] = useActionState(saveMetric, {});
  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="programmeId" value={programmeId} />
      {metric && <input type="hidden" name="metricId" value={metric.id} />}
      <Field label="Outcome" htmlFor="m-title" hint='For example, "Train 500 young founders by June 2027".'>
        <Input id="m-title" name="title" defaultValue={metric?.title} required autoFocus />
      </Field>
      <Field label="Description" htmlFor="m-desc">
        <Textarea id="m-desc" name="description" defaultValue={metric?.description ?? ""} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Baseline" htmlFor="m-baseline">
          <Input id="m-baseline" name="baseline" inputMode="decimal" defaultValue={metric?.baseline ?? ""} placeholder="0" />
        </Field>
        <Field label="Target" htmlFor="m-target">
          <Input id="m-target" name="target" inputMode="decimal" defaultValue={metric?.target ?? ""} />
        </Field>
        <Field label="Unit" htmlFor="m-unit">
          <Input id="m-unit" name="unit" defaultValue={metric?.unit ?? ""} placeholder="founders" />
        </Field>
      </div>
      <Field label="Deadline" htmlFor="m-deadline">
        <Input id="m-deadline" name="deadline" type="date" defaultValue={metric?.deadline ?? ""} />
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton>{metric ? "Save outcome" : "Create outcome"}</SubmitButton>
    </form>
  );
}
