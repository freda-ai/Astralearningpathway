import { Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteTeam } from "@/lib/actions/stakeholders";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui/card";
import { InviteButton } from "@/components/stakeholders/invite-button";
import { NewTeamForm } from "@/components/stakeholders/team-form";
import { accountability } from "@/lib/domain/dashboard";
import { todayISO } from "@/lib/domain/dates";
import { requireProgramme } from "@/lib/data/context";
import { loadProgrammeData, stakeholderName } from "@/lib/data/programme";
import { cn } from "@/lib/utils";

export const metadata = { title: "Stakeholders" };

const ACCESS_LABEL = { lead: "Lead", member: "Member", reviewer: "Reviewer", viewer: "Viewer", owner: "Owner" } as const;

export default async function StakeholdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ pid: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { pid } = await params;
  const tab = (await searchParams).tab === "teams" ? "teams" : "directory";
  const { user, canManage } = await requireProgramme(pid);
  const data = await loadProgrammeData(user.id, pid);
  const today = todayISO();
  const stats = new Map(
    accountability(
      data.stakeholders.map((s) => ({ id: s.id, name: stakeholderName(s), teamId: s.teamId })),
      data.tasks,
      today,
    ).map((r) => [r.stakeholderId, r]),
  );
  const teamName = new Map(data.teams.map((t) => [t.id, t.name]));

  return (
    <>
      <PageHeader
        title="Stakeholders"
        description="Everyone involved in this programme, their teams and their work."
        actions={canManage && <InviteButton programmeId={pid} teams={data.teams} />}
      />

      <div role="tablist" className="mb-5 inline-flex rounded-lg border border-line bg-paper p-1 text-sm">
        {(["directory", "teams"] as const).map((t) => (
          <Link
            key={t}
            role="tab"
            aria-selected={tab === t}
            href={`/p/${pid}/stakeholders${t === "teams" ? "?tab=teams" : ""}`}
            className={cn("rounded-md px-4 py-1.5 capitalize", tab === t ? "bg-ink text-cream" : "text-muted hover:text-ink")}
          >
            {t}
          </Link>
        ))}
      </div>

      {tab === "directory" ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Team</th>
                <th className="px-3 py-3 font-medium">Access</th>
                <th className="px-3 py-3 text-right font-medium">Tasks assigned</th>
                <th className="px-5 py-3 text-right font-medium">Completion</th>
              </tr>
            </thead>
            <tbody>
              {data.stakeholders.map((s) => {
                const st = stats.get(s.id);
                return (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-cream/60">
                    <td className="px-5 py-3">
                      <Link href={`/p/${pid}/stakeholders/${s.id}`} className="flex items-center gap-3">
                        <Avatar name={stakeholderName(s)} />
                        <span>
                          <span className="font-medium">{stakeholderName(s)}</span>
                          {s.name && <span className="block text-xs text-muted">{s.email}</span>}
                        </span>
                        {!s.userId && <Badge tone="gold">Invited</Badge>}
                      </Link>
                    </td>
                    <td className="px-3 py-3">{s.roleTitle ?? "—"}</td>
                    <td className="px-3 py-3">{s.teamId ? teamName.get(s.teamId) : "—"}</td>
                    <td className="px-3 py-3 text-muted">{ACCESS_LABEL[s.accessRole]}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{st?.assigned ?? 0}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {st?.completionRate === null || st === undefined ? "—" : `${st.completionRate}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="space-y-5">
          {canManage && <NewTeamForm programmeId={pid} />}
          {data.teams.length === 0 ? (
            <EmptyState title="No teams yet">Group stakeholders into teams, then assign tasks to a whole team.</EmptyState>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.teams.map((t) => {
                const members = data.stakeholders.filter((s) => s.teamId === t.id);
                return (
                  <Card key={t.id} data-testid="team-card">
                    <CardHeader>
                      <CardTitle>{t.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge>{members.length} member{members.length === 1 ? "" : "s"}</Badge>
                        {canManage && (
                          <form action={deleteTeam}>
                            <input type="hidden" name="teamId" value={t.id} />
                            <input type="hidden" name="programmeId" value={pid} />
                            <button aria-label={`Delete team ${t.name}`} className="rounded p-1 text-muted hover:bg-cream hover:text-terracotta">
                              <Trash2 className="size-4" />
                            </button>
                          </form>
                        )}
                      </div>
                    </CardHeader>
                    <CardBody>
                      {members.length === 0 ? (
                        <p className="text-sm text-muted">No members yet. Set a stakeholder&rsquo;s team from their profile.</p>
                      ) : (
                        <ul className="space-y-2">
                          {members.map((s) => (
                            <li key={s.id} className="flex items-center gap-2 text-sm">
                              <Avatar name={stakeholderName(s)} className="size-6 text-[10px]" />
                              <Link href={`/p/${pid}/stakeholders/${s.id}`} className="hover:underline">
                                {stakeholderName(s)}
                              </Link>
                              {s.roleTitle && <span className="text-muted">· {s.roleTitle}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
