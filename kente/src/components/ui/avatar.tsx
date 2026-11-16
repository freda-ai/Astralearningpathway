import { cn, initials } from "@/lib/utils";

const palette = ["bg-gold text-ink", "bg-forest text-cream", "bg-terracotta text-white", "bg-ink text-cream"];

export function Avatar({ name, className }: { name: string; className?: string }) {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length;
  return (
    <span
      title={name}
      className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", palette[idx], className)}
    >
      {initials(name)}
    </span>
  );
}
