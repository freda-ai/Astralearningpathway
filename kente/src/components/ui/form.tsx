import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-md border border-line bg-paper px-3 text-sm text-ink placeholder:text-muted/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(field, "h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(field, "min-h-20 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(field, "h-10 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error)
    return (
      <p role="alert" className="rounded-md bg-terracotta-soft px-3 py-2 text-sm text-terracotta">
        {error}
      </p>
    );
  if (message)
    return (
      <p role="status" className="rounded-md bg-forest-soft px-3 py-2 text-sm text-forest">
        {message}
      </p>
    );
  return null;
}
