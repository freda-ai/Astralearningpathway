import { eq } from "drizzle-orm";
import Link from "next/link";
import { adminDb } from "@/db";
import { programmes, stakeholders, workspaces } from "@/db/schema";
import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { AcceptInviteForm } from "./accept-form";

export const metadata = { title: "Invitation" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Token-gated lookup before the visitor has an account, so it cannot go through RLS.
  const [invite] = await adminDb()
    .select({ email: stakeholders.email, roleTitle: stakeholders.roleTitle, programme: programmes.name, workspace: workspaces.name })
    .from(stakeholders)
    .innerJoin(programmes, eq(programmes.id, stakeholders.programmeId))
    .innerJoin(workspaces, eq(workspaces.id, stakeholders.workspaceId))
    .where(eq(stakeholders.inviteToken, token));
  const user = await getSessionUser();
  const next = `/invite/${token}`;

  return (
    <div className="flex min-h-screen">
      <div className="kente-strip w-2 shrink-0" aria-hidden />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8">
          <Logo />
        </div>
        <Card className="w-full max-w-md">
          <CardBody className="space-y-4 p-6">
            {!invite ? (
              <>
                <h1 className="text-xl font-semibold">This invite is no longer valid</h1>
                <p className="text-sm text-muted">It may have been accepted already or replaced by a newer invite.</p>
                <Link href="/" className={buttonVariants({ variant: "outline" })}>
                  Go to Kente
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-xl font-semibold">Join {invite.programme}</h1>
                <p className="text-sm text-muted">
                  You&rsquo;ve been invited to {invite.workspace}
                  {invite.roleTitle ? ` as ${invite.roleTitle}` : ""}. The invite was sent to{" "}
                  <span className="font-medium text-ink">{invite.email}</span>.
                </p>
                {user ? (
                  user.email.toLowerCase() === invite.email.toLowerCase() ? (
                    <AcceptInviteForm token={token} />
                  ) : (
                    <p role="alert" className="rounded-md bg-terracotta-soft px-3 py-2 text-sm text-terracotta">
                      You&rsquo;re signed in as {user.email}. Sign out and sign in as {invite.email} to accept.
                    </p>
                  )
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href={`/signup?next=${encodeURIComponent(next)}&email=${encodeURIComponent(invite.email)}`}
                      className={buttonVariants()}
                    >
                      Create account
                    </Link>
                    <Link
                      href={`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(invite.email)}`}
                      className={buttonVariants({ variant: "outline" })}
                    >
                      Sign in
                    </Link>
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
