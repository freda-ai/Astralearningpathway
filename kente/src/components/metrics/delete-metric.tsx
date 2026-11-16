"use client";

import { useActionState } from "react";
import { deleteMetric } from "@/lib/actions/metrics";
import { FormMessage } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function DeleteMetricForm({ programmeId, metricId }: { programmeId: string; metricId: string }) {
  const [state, action] = useActionState(deleteMetric, {});
  return (
    <form
      action={action}
      className="space-y-2"
      onSubmit={(e) => {
        if (!confirm("Delete this outcome? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="metricId" value={metricId} />
      <SubmitButton variant="outline" size="sm" className="text-terracotta" pendingText="Deleting…">
        Delete outcome
      </SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}
