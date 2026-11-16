"use client";

import { BarChart3, ClipboardList, FolderLock, LayoutDashboard, ListChecks, Target, Users, Layers } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { slug: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { slug: "log", label: "Log", icon: ListChecks },
  { slug: "metrics", label: "Metric", icon: Target },
  { slug: "stakeholders", label: "Stakeholders", icon: Users },
  { slug: "vault", label: "Vault", icon: FolderLock },
  { slug: "reporting", label: "Reporting", icon: ClipboardList },
] as const;

export interface SidebarProps {
  workspaceName: string;
  programmes: { id: string; name: string }[];
}

export function Sidebar({ workspaceName, programmes }: SidebarProps) {
  const { pid } = useParams<{ pid?: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const section = pathname.split("/")[3] ?? "dashboard";

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 bg-ink text-cream max-lg:hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 px-5 pt-5 pb-4">
          <LogoMark />
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight font-semibold">Kente</p>
            <p className="truncate text-xs text-cream/60">{workspaceName}</p>
          </div>
        </div>

        <div className="px-3 pb-3">
          <label htmlFor="programme-switcher" className="px-2 text-[11px] font-medium tracking-wider text-cream/50 uppercase">
            Programme
          </label>
          <select
            id="programme-switcher"
            value={pid ?? ""}
            onChange={(e) => router.push(e.target.value ? `/p/${e.target.value}/${section}` : "/programmes")}
            className="mt-1 h-9 w-full rounded-md border border-cream/15 bg-ink-soft px-2 text-sm text-cream focus:border-gold focus:outline-none"
          >
            <option value="">{programmes.length ? "Choose a programme…" : "No programmes yet"}</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <nav className="flex-1 space-y-0.5 px-3" aria-label="Programme">
          {pid ? (
            NAV.map(({ slug, label, icon: Icon }) => {
              const active = section === slug;
              return (
                <Link
                  key={slug}
                  href={`/p/${pid}/${slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active ? "bg-gold text-ink font-medium" : "text-cream/80 hover:bg-cream/10 hover:text-cream",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-cream/50">Choose a programme to see its modules.</p>
          )}
        </nav>

        <div className="border-t border-cream/10 p-3">
          <Link
            href="/programmes"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-cream/80 hover:bg-cream/10",
              pathname === "/programmes" && "bg-cream/10 text-cream",
            )}
          >
            <Layers className="size-4" />
            All programmes
          </Link>
          <p className="mt-2 flex items-center gap-2 px-3 text-[11px] text-cream/40">
            <BarChart3 className="size-3" /> Every task rolls up to an outcome
          </p>
        </div>
      </div>
      <div className="kente-strip w-1.5 shrink-0" aria-hidden />
    </aside>
  );
}

/** Module links for small screens, where the sidebar is hidden. */
export function MobileNav() {
  const { pid } = useParams<{ pid?: string }>();
  const pathname = usePathname();
  if (!pid) return null;
  const section = pathname.split("/")[3] ?? "dashboard";
  return (
    <nav aria-label="Programme modules" className="flex gap-1 overflow-x-auto border-b border-line bg-ink px-3 py-2 lg:hidden">
      {NAV.map(({ slug, label, icon: Icon }) => (
        <Link
          key={slug}
          href={`/p/${pid}/${slug}`}
          aria-current={section === slug ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm",
            section === slug ? "bg-gold text-ink font-medium" : "text-cream/80",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
