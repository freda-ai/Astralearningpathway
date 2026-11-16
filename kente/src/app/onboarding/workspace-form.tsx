"use client";

import { useActionState } from "react";
import { createWorkspace } from "@/lib/actions/workspace";
import { Card, CardBody } from "@/components/ui/card";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function WorkspaceForm() {
  const [state, action] = useActionState(createWorkspace, {});
  return (
    <Card>
      <CardBody className="p-6">
        <form action={action} className="space-y-4">
          <Field label="Organisation or workspace name" htmlFor="name" hint="For example, EBH Africa.">
            <Input id="name" name="name" required autoFocus />
          </Field>
          <FormMessage error={state.error} />
          <SubmitButton className="w-full" pendingText="Creating…">
            Create workspace
          </SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
