import { expect, test, type Page } from "@playwright/test";
import { ownerWithProgramme, uniqueEmail } from "./helpers";

async function newTask(page: Page, url: string, title: string, metric: string, opts: { assignee?: string; due?: string } = {}) {
  await page.goto(`${url}/log`);
  await page.getByRole("button", { name: "New task" }).click();
  const d = page.getByRole("dialog", { name: "New task" });
  await d.getByLabel("Title").fill(title);
  await d.getByLabel("Metric").selectOption({ label: metric });
  if (opts.assignee) await d.getByLabel("Assignee or team").selectOption({ label: opts.assignee });
  if (opts.due) await d.getByLabel("Due date").fill(opts.due);
  await d.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByTestId("task-row").filter({ hasText: title })).toBeVisible();
}

test("the dashboard shows counts, metric progress, a brief and accountability", async ({ page }) => {
  const { url } = await ownerWithProgramme(page, "Youth Employment");

  // Empty state
  await expect(page.getByTestId("stat-total-tasks")).toContainText("0");
  await expect(page.getByTestId("brief")).toContainText("Plan the first tasks in the Log.");

  // A second stakeholder (invited, not yet joined) can still be assigned work
  await page.goto(`${url}/stakeholders`);
  await page.getByRole("button", { name: "Invite" }).click();
  await page.getByLabel("Email").fill(uniqueEmail("ngozi"));
  await page.getByLabel("Name", { exact: true }).fill("Ngozi Facilitator");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByLabel("Invite link")).toBeVisible();

  await page.goto(`${url}/metrics`);
  await page.getByRole("button", { name: "New outcome" }).click();
  await page.getByRole("textbox", { name: "Outcome" }).fill("Place 300 graduates in jobs");
  await page.getByLabel("Target").fill("300");
  await page.getByRole("button", { name: "Create outcome" }).click();
  await expect(page.getByTestId("metric-card")).toHaveCount(1);

  const metric = "Place 300 graduates in jobs";
  await newTask(page, url, "Sign employer partners", metric, { assignee: "Freda Owner", due: "2099-01-01" });
  await newTask(page, url, "Run job fair", metric, { assignee: "Ngozi Facilitator", due: "2026-01-15" });
  await newTask(page, url, "Collect CVs", metric, { assignee: "Ngozi Facilitator", due: "2026-02-01" });
  await newTask(page, url, "Publish placement report", metric);
  const row = page.getByTestId("task-row").filter({ hasText: "Sign employer partners" });
  await row.getByLabel("Status of Sign employer partners").selectOption("completed");
  await expect(row.getByLabel("Status of Sign employer partners")).toHaveValue("completed");

  await page.goto(`${url}/dashboard`);
  await expect(page.getByTestId("stat-total-tasks")).toContainText("4");
  await expect(page.getByTestId("stat-completed")).toContainText("1");
  await expect(page.getByTestId("stat-pending")).toContainText("1");
  await expect(page.getByTestId("stat-overdue")).toContainText("2");

  // Metric bar: 1 of 4 tasks, and behind because half the open tasks are overdue
  const bar = page.getByTestId("metric-progress");
  await expect(bar).toContainText("25%");
  await expect(bar).toContainText("Behind");
  await expect(bar).toContainText("1 of 4 tasks done");

  // Brief uses only programme data
  const brief = page.getByTestId("brief");
  await expect(brief).toContainText("3 open tasks, 0 in progress and 2 overdue.");
  await expect(brief).toContainText("Follow up on “Run job fair” with Ngozi Facilitator");
  await expect(brief).toContainText("“Place 300 graduates in jobs” is behind");
  await expect(page.getByRole("button", { name: "Regenerate" })).toBeEnabled();

  // Accountability: most overdue first
  const rows = page.getByTestId("accountability-row");
  await expect(rows.first()).toContainText("Ngozi Facilitator");
  await expect(rows.first()).toContainText("2");

  // Period preference is remembered
  await page.getByRole("tab", { name: "This month" }).click();
  await expect(page).toHaveURL(/period=month/);
  await expect(page.getByTestId("activity")).toContainText("This month:");
  await page.goto(`${url}/dashboard`);
  await expect(page.getByRole("tab", { name: "This month" })).toHaveAttribute("aria-selected", "true");

  // Filter by stakeholder
  await page.getByLabel("Filter by stakeholder").selectOption({ label: "Freda Owner" });
  await expect(page.getByTestId("stat-total-tasks")).toContainText("1");
  await expect(page.getByTestId("stat-overdue")).toContainText("0");
  await expect(page.getByTestId("accountability-row")).toHaveCount(1);
});
