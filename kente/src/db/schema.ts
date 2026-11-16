import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * Kente data model. See docs/TECH-SPEC.md §2.
 *
 * Every workspace-owned table carries workspace_id and has row-level security
 * (policies live in drizzle/0001_rls.sql). `users` is the one exception: a
 * person can belong to several workspaces, so it is keyed by the auth user id.
 */

export const ROLES = ["owner", "lead", "member", "reviewer", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const METRIC_STATUSES = ["on_track", "at_risk", "behind", "achieved"] as const;
export type MetricStatus = (typeof METRIC_STATUSES)[number];

/** Stored task statuses. "overdue" is computed, never stored. */
export const TASK_STATUSES = ["pending", "in_progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
};

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  ...timestamps,
});

/** Mirrors the Supabase Auth user (id = auth.users.id). */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ROLES }).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("memberships_ws_user_idx").on(t.workspaceId, t.userId),
    check("memberships_role_check", sql`${t.role} in ('owner','lead','member','reviewer','viewer')`),
  ],
);

export const programmes = pgTable(
  "programmes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("programmes_ws_idx").on(t.workspaceId)],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("teams_programme_name_idx").on(t.programmeId, sql`lower(${t.name})`)],
);

/**
 * A person on a programme. May be invited by email and not yet signed up
 * (user_id null until they accept the invite).
 */
export const stakeholders = pgTable(
  "stakeholders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    name: text("name"),
    /** Job title on the programme, e.g. Programme Lead, Officer, Facilitator. */
    roleTitle: text("role_title"),
    /** Permission role granted in the workspace when the invite is accepted. */
    accessRole: text("access_role", { enum: ROLES }).notNull().default("member"),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    inviteToken: text("invite_token"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("stakeholders_programme_email_idx").on(t.programmeId, sql`lower(${t.email})`),
    uniqueIndex("stakeholders_invite_token_idx").on(t.inviteToken),
    index("stakeholders_user_idx").on(t.userId),
    check("stakeholders_access_role_check", sql`${t.accessRole} in ('lead','member','reviewer','viewer')`),
  ],
);

export const metrics = pgTable(
  "metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    target: numeric("target", { mode: "number" }),
    baseline: numeric("baseline", { mode: "number" }),
    /** Manually entered current value, for outcomes measured outside Kente. */
    current: numeric("current", { mode: "number" }),
    unit: text("unit"),
    deadline: date("deadline"),
    status: text("status", { enum: METRIC_STATUSES }).notNull().default("on_track"),
    ...timestamps,
  },
  (t) => [
    index("metrics_programme_idx").on(t.programmeId),
    check("metrics_status_check", sql`${t.status} in ('on_track','at_risk','behind','achieved')`),
  ],
);

/** History of manual progress entries, used for the progress chart. */
export const metricUpdates = pgTable(
  "metric_updates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    metricId: uuid("metric_id")
      .notNull()
      .references(() => metrics.id, { onDelete: "cascade" }),
    value: numeric("value", { mode: "number" }).notNull(),
    note: text("note"),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("metric_updates_metric_idx").on(t.metricId)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    programmeId: uuid("programme_id")
      .notNull()
      .references(() => programmes.id, { onDelete: "cascade" }),
    /** Required: every task rolls up to a metric. */
    metricId: uuid("metric_id")
      .notNull()
      .references(() => metrics.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    assigneeStakeholderId: uuid("assignee_stakeholder_id").references(() => stakeholders.id, {
      onDelete: "set null",
    }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    priority: text("priority", { enum: PRIORITIES }).notNull().default("medium"),
    status: text("status", { enum: TASK_STATUSES }).notNull().default("pending"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_programme_idx").on(t.programmeId),
    index("tasks_metric_idx").on(t.metricId),
    index("tasks_assignee_idx").on(t.assigneeStakeholderId),
    check("tasks_status_check", sql`${t.status} in ('pending','in_progress','completed')`),
    check("tasks_priority_check", sql`${t.priority} in ('low','medium','high','urgent')`),
    check("tasks_one_assignee_check", sql`not (${t.assigneeStakeholderId} is not null and ${t.teamId} is not null)`),
    check("tasks_dates_check", sql`${t.startDate} is null or ${t.dueDate} is null or ${t.startDate} <= ${t.dueDate}`),
  ],
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [index("task_comments_task_idx").on(t.taskId)],
);

/**
 * Email/password credentials for local development only, used when Supabase
 * is not configured. Never read through the RLS connection.
 */
export const localCredentials = pgTable("local_credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
});
