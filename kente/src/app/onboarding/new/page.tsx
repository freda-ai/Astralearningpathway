import { Logo } from "@/components/logo";
import { requireUser } from "@/lib/auth/session";
import { WorkspaceForm } from "../workspace-form";

export const metadata = { title: "New workspace" };

export default async function NewWorkspacePage() {
  await requireUser();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">New workspace</h1>
        <p className="mt-2 mb-6 text-sm text-muted">You&rsquo;ll be its owner.</p>
        <WorkspaceForm />
      </div>
    </main>
  );
}
