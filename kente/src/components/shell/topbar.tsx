"use client";

import { Bell, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth/actions";
import { switchWorkspace } from "@/lib/actions/workspace";

export function Topbar({
  userName,
  userEmail,
  workspaces,
  currentWorkspaceId,
  programmes,
}: {
  userName: string;
  userEmail: string;
  workspaces: { id: string; name: string; role: string }[];
  currentWorkspaceId: string;
  programmes: { id: string; name: string }[];
}) {
  const { pid } = useParams<{ pid?: string }>();
  const q = useSearchParams().get("q") ?? "";
  const [menu, setMenu] = useState<"user" | "bell" | null>(null);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-cream/95 px-4 backdrop-blur lg:px-8">
      <div className="lg:hidden">
        <select
          aria-label="Programme"
          className="h-9 max-w-40 rounded-md border border-line bg-paper px-2 text-sm"
          value={pid ?? ""}
          onChange={(e) => (window.location.href = e.target.value ? `/p/${e.target.value}/dashboard` : "/programmes")}
        >
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {pid ? (
        <form action={`/p/${pid}/log`} className="relative max-w-md flex-1" role="search">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search tasks in this programme"
            aria-label="Search tasks"
            className="h-10 w-full rounded-md border border-line bg-paper pr-3 pl-9 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </form>
      ) : (
        <div className="flex-1" />
      )}

      <div className="ml-auto flex items-center gap-1">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={menu === "bell"}
            onClick={() => setMenu(menu === "bell" ? null : "bell")}
            className="inline-flex size-10 items-center justify-center rounded-md hover:bg-ink/5"
          >
            <Bell className="size-5" />
          </button>
          {menu === "bell" && (
            <div className="absolute right-0 mt-2 w-72 rounded-lg border border-line bg-paper p-4 text-sm shadow-lg">
              <p className="font-medium">Notifications</p>
              <p className="mt-1 text-muted">You&rsquo;re all caught up.</p>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={menu === "user"}
            onClick={() => setMenu(menu === "user" ? null : "user")}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-ink/5"
          >
            <Avatar name={userName} />
            <span className="text-sm font-medium max-sm:hidden">{userName}</span>
          </button>
          {menu === "user" && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-line bg-paper py-2 text-sm shadow-lg">
              <div className="px-4 pb-2">
                <p className="font-medium">{userName}</p>
                <p className="truncate text-xs text-muted">{userEmail}</p>
              </div>
              {workspaces.length > 1 && (
                <div className="border-t border-line px-2 pt-2">
                  <p className="px-2 pb-1 text-[11px] font-medium tracking-wider text-muted uppercase">Workspaces</p>
                  {workspaces.map((w) => (
                    <form key={w.id} action={switchWorkspace}>
                      <input type="hidden" name="workspaceId" value={w.id} />
                      <button
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-cream"
                        aria-current={w.id === currentWorkspaceId}
                      >
                        <span className="truncate">{w.name}</span>
                        {w.id === currentWorkspaceId && <span className="text-xs text-forest">Current</span>}
                      </button>
                    </form>
                  ))}
                </div>
              )}
              <div className="mt-1 border-t border-line px-2 pt-2">
                <Link href="/onboarding/new" className="block rounded px-2 py-1.5 hover:bg-cream">
                  New workspace
                </Link>
                <form action={signOut}>
                  <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-cream">
                    <LogOut className="size-4" /> Sign out
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
