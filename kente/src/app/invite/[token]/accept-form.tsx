"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/lib/actions/stakeholders";
import { FormMessage } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInvite, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      <FormMessage error={state.error} />
      <SubmitButton pendingText="Joining…">Accept invite</SubmitButton>
    </form>
  );
}
