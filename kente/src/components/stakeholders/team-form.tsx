"use client";

import { useActionState } from "react";
import { createTeam } from "@/lib/actions/stakeholders";
import { FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function NewTeamForm({ programmeId }: { programmeId: string }) {
  const [state, action] = useActionState(createTeam, {});
  return (
    <form action={action} key={state.ok} className="flex flex-wrap items-start gap-2">
      <input type="hidden" name="programmeId" value={programmeId} />
      <Input name="name" aria-label="Team name" placeholder="New team name" required className="max-w-xs" />
      <SubmitButton variant="dark" pendingText="Adding…">
        Add team
      </SubmitButton>
      <div className="w-full">
        <FormMessage error={state.error} />
      </div>
    </form>
  );
}
