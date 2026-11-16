import { Logo } from "@/components/logo";
import { requireUser, displayName } from "@/lib/auth/session";
import { WorkspaceForm } from "./workspace-form";

export const metadata = { title: "Set up your workspace" };

export default async function OnboardingPage() {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen">
      <div className="kente-strip w-2 shrink-0" aria-hidden />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <Logo />
        </div>
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold">Welcome, {displayName(user)}</h1>
          <p className="mt-2 text-sm text-muted">
            A workspace holds your organisation&rsquo;s programmes, people and records. You can invite your team once
            it&rsquo;s set up.
          </p>
          <div className="mt-6">
            <WorkspaceForm />
          </div>
        </div>
      </main>
    </div>
  );
}
