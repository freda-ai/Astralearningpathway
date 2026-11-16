"use client";

import { Plus } from "lucide-react";
import { useActionState, useState } from "react";
import { createProgramme } from "@/lib/actions/workspace";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function NewProgrammeButton({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New programme
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="New programme">
        <ProgrammeForm workspaceId={workspaceId} />
      </Drawer>
    </>
  );
}

function ProgrammeForm({ workspaceId }: { workspaceId: string }) {
  const [state, action] = useActionState(createProgramme, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <Field label="Programme name" htmlFor="pname">
        <Input id="pname" name="name" required autoFocus placeholder="Young Founders Accelerator 2027" />
      </Field>
      <Field label="Description" htmlFor="pdesc">
        <Textarea id="pdesc" name="description" placeholder="What the programme delivers and for whom" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" htmlFor="pstart">
          <Input id="pstart" name="startDate" type="date" />
        </Field>
        <Field label="End date" htmlFor="pend">
          <Input id="pend" name="endDate" type="date" />
        </Field>
      </div>
      <FormMessage error={state.error} />
      <SubmitButton pendingText="Creating…">Create programme</SubmitButton>
    </form>
  );
}
