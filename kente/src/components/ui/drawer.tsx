"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/** Side drawer built on the native <dialog> element. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className={cn(
        "fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-lg overflow-y-auto border-l border-line bg-cream p-0 text-ink shadow-2xl",
        className,
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-cream px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X />
        </Button>
      </div>
      <div className="px-6 py-5">{open && children}</div>
    </dialog>
  );
}
