"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-paper p-2">
      <input readOnly value={link} aria-label="Invite link" className="min-w-0 flex-1 bg-transparent text-xs text-ink outline-none" />
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-cream"
        onClick={async () => {
          await navigator.clipboard?.writeText(link).catch(() => {});
          setCopied(true);
        }}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
