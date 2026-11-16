"use client";

import { UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { inviteStakeholder } from "@/lib/actions/stakeholders";
import { Button } from "@/components/ui/button";
import { CopyLink } from "@/components/ui/copy-link";
import { Drawer } from "@/components/ui/drawer";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

const ROLE_TITLES = ["Programme Lead", "Programme Officer", "Coordinator", "Facilitator", "Partner", "Reviewer", "Funder"];

export function InviteButton({ programmeId, teams }: { programmeId: string; teams: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus /> Invite
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Invite a stakeholder">
        <InviteForm key={round} programmeId={programmeId} teams={teams} onAnother={() => setRound((r) => r + 1)} />
      </Drawer>
    </>
  );
}

function InviteForm({
  programmeId,
  teams,
  onAnother,
}: {
  programmeId: string;
  teams: { id: string; name: string }[];
  onAnother: () => void;
}) {
  const [state, action] = useActionState(inviteStakeholder, {});
  if (state.ok) {
    return (
      <div className="space-y-4">
        <FormMessage message={state.message} />
        {state.data?.link && <CopyLink link={state.data.link} />}
        <Button variant="outline" onClick={onAnother}>
          Invite someone else
        </Button>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="programmeId" value={programmeId} />
      <Field label="Email" htmlFor="inv-email">
        <Input id="inv-email" name="email" type="email" required autoFocus />
      </Field>
      <Field label="Name" htmlFor="inv-name" hint="Optional. They can change it later.">
        <Input id="inv-name" name="name" />
      </Field>
      <Field label="Role on the programme" htmlFor="inv-role">
        <Input id="inv-role" name="roleTitle" list="role-titles" placeholder="Programme Officer" />
        <datalist id="role-titles">
          {ROLE_TITLES.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
      </Field>
      <Field
        label="Access"
        htmlFor="inv-access"
        hint="Members update their own tasks. Reviewers comment and approve. Viewers have read-only access. Leads manage the programme."
      >
        <Select id="inv-access" name="accessRole" defaultValue="member">
          <option value="member">Team member</option>
          <option value="reviewer">Reviewer</option>
          <option value="viewer">Viewer or funder</option>
          <option value="lead">Programme lead</option>
        </Select>
      </Field>
      <Field label="Team" htmlFor="inv-team">
        <Select id="inv-team" name="teamId" defaultValue="">
          <option value="">No team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage error={state.error} />
      <SubmitButton pendingText="Sending…">Send invite</SubmitButton>
    </form>
  );
}
