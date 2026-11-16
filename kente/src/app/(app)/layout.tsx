import { Suspense } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { displayName } from "@/lib/auth/session";
import { listProgrammes, requireWorkspace } from "@/lib/data/context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, all } = await requireWorkspace();
  const programmes = (await listProgrammes(user.id, workspace.id)).map((p) => ({ id: p.id, name: p.name }));
  return (
    <div className="flex min-h-screen">
      <Sidebar workspaceName={workspace.name} programmes={programmes} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense>
          <Topbar
            userName={displayName(user)}
            userEmail={user.email}
            workspaces={all.map((w) => ({ id: w.id, name: w.name, role: w.role }))}
            currentWorkspaceId={workspace.id}
            programmes={programmes}
          />
        </Suspense>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
