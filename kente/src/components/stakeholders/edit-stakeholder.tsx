"use client";

import { useActionState } from "react";
import { resendInvite, updateStakeholder } from "@/lib/actions/stakeholders";
import { CopyLink } from "@/components/ui/copy-link";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function EditStakeholderForm({
  programmeId,
  stakeholder,
  teams,
}: {
  programmeId: string;
  stakeholder: { id: string; name: string | null; roleTitle: string | null; teamId: string | null };
  teams: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(updateStakeholder, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="programmeId" value={programmeId} />
      <input type="hidden" name="stakeholderId" value={stakeholder.id} />
      <Field label="Name" htmlFor="sh-name">
        <Input id="sh-name" name="name" defaultValue={stakeholder.name ?? ""} />
      </Field>
      <Field label="Role on the programme" htmlFor="sh-role">
        <Input id="sh-role" name="roleTitle" defaultValue={stakeholder.roleTitle ?? ""} />
      </Field>
      <Field label="Team" htmlFor="sh-team">
        <Select id="sh-team" name="teamId" defaultValue={stakeholder.teamId ?? ""}>
          <option value="">No team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage error={state.error} message={state.message} />
      <SubmitButton variant="dark">Save changes</SubmitButton>
    </form>
  );
}

export function ResendInviteForm({ stakeholderId }: { stakeholderId: string }) {
  const [state, action] = useActionState(resendInvite, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="stakeholderId" value={stakeholderId} />
      <SubmitButton variant="outline" size="sm" pendingText="Sending…">
        Resend invite
      </SubmitButton>
      <FormMessage error={state.error} message={state.message} />
      {state.data?.link && <CopyLink link={state.data.link} />}
    </form>
  );
}
