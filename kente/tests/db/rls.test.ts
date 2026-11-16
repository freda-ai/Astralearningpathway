import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { asUser } from "@/db";
import { memberships, metrics, programmes, stakeholders, tasks, workspaces } from "@/db/schema";
import { makeUser, makeWorkspace, resetDb } from "./helpers";

async function fails(p: Promise<unknown>) {
  let failed = false;
  try {
    await p;
  } catch {
    failed = true;
  }
  expect(failed, "expected the database to refuse this").toBe(true);
}

describe("row-level security", () => {
  let owner: Awaited<ReturnType<typeof makeUser>>;
  let outsider: Awaited<ReturnType<typeof makeUser>>;
  let ws: string;
  let programmeId: string;
  let metricId: string;

  beforeEach(async () => {
    await resetDb();
    owner = await makeUser("Owner");
    outsider = await makeUser("Outsider");
    ws = await makeWorkspace(owner.id);
    await makeWorkspace(outsider.id, "Other org");
    await asUser(owner.id, async (tx) => {
      [{ id: programmeId }] = await tx
        .insert(programmes)
        .values({ workspaceId: ws, name: "Founders", createdBy: owner.id })
        .returning({ id: programmes.id });
      [{ id: metricId }] = await tx
        .insert(metrics)
        .values({ workspaceId: ws, programmeId, title: "Train 500 founders", target: 500 })
        .returning({ id: metrics.id });
      await tx.insert(tasks).values({ workspaceId: ws, programmeId, metricId, title: "Run cohort 1" });
    });
  });

  it("makes the workspace creator its owner", async () => {
    const rows = await asUser(owner.id, (tx) => tx.select().from(memberships));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ workspaceId: ws, role: "owner" });
  });

  it("hides another workspace's data", async () => {
    await asUser(outsider.id, async (tx) => {
      const seen = await tx.select().from(workspaces);
      expect(seen.map((w) => w.name)).toEqual(["Other org"]);
      expect(await tx.select().from(programmes)).toHaveLength(0);
      expect(await tx.select().from(metrics)).toHaveLength(0);
      expect(await tx.select().from(tasks)).toHaveLength(0);
    });
  });

  it("refuses writes into another workspace", async () => {
    await fails(
      asUser(outsider.id, (tx) =>
        tx.insert(programmes).values({ workspaceId: ws, name: "Sneaky", createdBy: outsider.id }),
      ),
    );
    const updated = await asUser(outsider.id, (tx) =>
      tx.update(tasks).set({ title: "Hacked" }).where(eq(tasks.programmeId, programmeId)).returning(),
    );
    expect(updated).toHaveLength(0);
  });

  it("refuses a task without a metric, or with another programme's metric", async () => {
    await fails(
      asUser(owner.id, (tx) =>
        tx.execute(sql`insert into tasks (workspace_id, programme_id, title) values (${ws}, ${programmeId}, 'No metric')`),
      ),
    );
    await fails(
      asUser(owner.id, async (tx) => {
        const [p2] = await tx
          .insert(programmes)
          .values({ workspaceId: ws, name: "Second", createdBy: owner.id })
          .returning();
        await tx.insert(tasks).values({ workspaceId: ws, programmeId: p2.id, metricId, title: "Wrong metric" });
      }),
    );
  });

  describe("invited members", () => {
    let member: Awaited<ReturnType<typeof makeUser>>;
    let stakeholderId: string;

    beforeEach(async () => {
      member = await makeUser("Member");
      await asUser(owner.id, async (tx) => {
        [{ id: stakeholderId }] = await tx
          .insert(stakeholders)
          .values({ workspaceId: ws, programmeId, email: member.email.toUpperCase(), accessRole: "member", inviteToken: "tok-1" })
          .returning({ id: stakeholders.id });
        await tx.update(tasks).set({ assigneeStakeholderId: stakeholderId }).where(eq(tasks.programmeId, programmeId));
      });
    });

    it("cannot see the programme before accepting", async () => {
      expect(await asUser(member.id, (tx) => tx.select().from(programmes))).toHaveLength(0);
    });

    it("must accept with the invited email", async () => {
      await fails(asUser(outsider.id, (tx) => tx.execute(sql`select app.accept_invite('tok-1')`)));
    });

    it("joins, sees the programme and can update status of own task only", async () => {
      await asUser(member.id, (tx) => tx.execute(sql`select app.accept_invite('tok-1')`));
      await asUser(member.id, async (tx) => {
        expect(await tx.select().from(programmes)).toHaveLength(1);
        const [m] = await tx.select().from(memberships).where(eq(memberships.userId, member.id));
        expect(m.role).toBe("member");
        const done = await tx.update(tasks).set({ status: "completed" }).where(eq(tasks.programmeId, programmeId)).returning();
        expect(done[0].completedAt).not.toBeNull();
      });
      await fails(asUser(member.id, (tx) => tx.update(tasks).set({ title: "Renamed" }).where(eq(tasks.programmeId, programmeId))));
      await fails(
        asUser(member.id, (tx) => tx.insert(metrics).values({ workspaceId: ws, programmeId, title: "Member metric" })),
      );
    });

    it("does not see other programmes in the workspace", async () => {
      await asUser(member.id, (tx) => tx.execute(sql`select app.accept_invite('tok-1')`));
      await asUser(owner.id, (tx) =>
        tx.insert(programmes).values({ workspaceId: ws, name: "Private", createdBy: owner.id }),
      );
      const seen = await asUser(member.id, (tx) => tx.select().from(programmes));
      expect(seen.map((p) => p.name)).toEqual(["Founders"]);
    });
  });
});
