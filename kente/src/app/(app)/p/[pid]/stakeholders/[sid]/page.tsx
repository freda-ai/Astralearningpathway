import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { removeStakeholder } from "@/lib/actions/stakeholders";
import { Avatar } from "@/components/ui/avatar";
import { Badge, TaskStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui/card";
import { EditStakeholderForm, ResendInviteForm } from "@/components/stakeholders/edit-stakeholder";
import { accountability } from "@/lib/domain/dashboard";
import { formatDate, todayISO } from "@/lib/domain/dates";
import { displayStatus } from "@/lib/domain/tasks";
import { requireProgramme } from "@/lib/data/context";
import { loadProgrammeData, stakeholderName } from "@/lib/data/programme";

export const metadata = { title: "Stakeholder" };

export default async function StakeholderProfile({ params }: { params: Promise<{ pid: string; sid: string }> }) {
  const { pid, sid } = await params;
  const { user, canManage } = await requireProgramme(pid);
  const data = await loadProgrammeData(user.id, pid);
  const s = data.stakeholders.find((x) => x.id === sid);
  if (!s) notFound();
  const today = todayISO();
  const name = stakeholderName(s);
  const [stats] = accountability([{ id: s.id, name, teamId: s.teamId }], data.tasks, today);
  const mine = data.tasks.filter((t) => t.assigneeStakeholderId === s.id || (!t.assigneeStakeholderId && t.teamId && t.teamId === s.teamId));
  const metricName = new Map(data.metrics.map((m) => [m.id, m.title]));
  const team = data.teams.find((t) => t.id === s.teamId);

  return (
    <>
      <Link href={`/p/${pid}/stakeholders`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Stakeholders
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={name} className="size-14 text-lg" />
        <div>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted">
            {[s.roleTitle, team?.name, s.email].filter(Boolean).join(" · ")}
          </p>
        </div>
        {!s.userId && <Badge tone="gold">Invite pending</Badge>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Assigned", stats.assigned],
          ["Completed", stats.completed],
          ["Overdue", stats.overdue],
          ["Completion rate", stats.completionRate === null ? "—" : `${stats.completionRate}%`],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardBody>
              <p className="text-xs tracking-wide text-muted uppercase">{label}</p>
              <p className={`mt-1 font-display text-2xl font-semibold ${label === "Overdue" && stats.overdue ? "text-terracotta" : ""}`}>
                {value}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assigned tasks</CardTitle>
          </CardHeader>
          {mine.length === 0 ? (
            <CardBody>
              <EmptyState title="Nothing assigned yet" />
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {mine.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <Link href={`/p/${pid}/log?task=${t.id}`} className="font-medium hover:underline">
                      {t.title}
                    </Link>
                    <p className="text-xs text-muted">
                      {metricName.get(t.metricId)} · Due {formatDate(t.dueDate)}
                      {t.teamId && !t.assigneeStakeholderId ? " · via team" : ""}
                    </p>
                  </div>
                  <TaskStatusBadge status={displayStatus(t, today)} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canManage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardBody>
                <EditStakeholderForm programmeId={pid} stakeholder={s} teams={data.teams} />
              </CardBody>
            </Card>
            {!s.userId && (
              <Card>
                <CardBody>
                  <ResendInviteForm stakeholderId={s.id} />
                </CardBody>
              </Card>
            )}
            {s.userId !== user.id && (
              <form action={removeStakeholder}>
                <input type="hidden" name="stakeholderId" value={s.id} />
                <input type="hidden" name="programmeId" value={pid} />
                <Button variant="outline" size="sm" className="text-terracotta">
                  Remove from programme
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
