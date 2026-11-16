"use client";

import { useActionState } from "react";
import { recordProgress } from "@/lib/actions/metrics";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProgressForm({ programmeId, metricId, unit }: { programmeId: string; metricId: string; unit: string | null }) {
  const [state, action] = useActionState(recordProgress, {});
  return (
    <form action={action} key={state.ok} className="space-y-3">
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="metricId" value={metricId} />
      <Field label={`Current value${unit ? ` (${unit})` : ""}`} htmlFor="p-value">
        <Input id="p-value" name="value" inputMode="decimal" required />
      </Field>
      <Field label="Source or note" htmlFor="p-note" hint="For example, endline survey, March 2027.">
        <Input id="p-note" name="note" />
      </Field>
      <FormMessage error={state.error} message={state.message} />
      <SubmitButton variant="dark" size="sm">
        Record progress
      </SubmitButton>
    </form>
  );
}
