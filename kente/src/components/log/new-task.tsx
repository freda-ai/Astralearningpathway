"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { TaskForm } from "./task-form";
import type { LogOptions } from "./types";

export function NewTaskButton({
  programmeId,
  options,
  defaultMetricId,
}: {
  programmeId: string;
  options: LogOptions;
  defaultMetricId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New task
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="New task">
        <TaskForm programmeId={programmeId} options={options} defaultMetricId={defaultMetricId} onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
