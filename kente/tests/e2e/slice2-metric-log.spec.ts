import { expect, test, type Page } from "@playwright/test";
import { ownerWithProgramme, uniqueEmail } from "./helpers";

async function createOutcome(page: Page, url: string, title: string, target: string, unit: string, deadline: string) {
  await page.goto(`${url}/metrics`);
  await page.getByRole("button", { name: "New outcome" }).click();
  await page.getByRole("textbox", { name: "Outcome" }).fill(title);
  await page.getByLabel("Target").fill(target);
  await page.getByLabel("Unit").fill(unit);
  await page.getByLabel("Deadline").fill(deadline);
  await page.getByRole("button", { name: "Create outcome" }).click();
  await expect(page.getByTestId("metric-card").filter({ hasText: title })).toBeVisible();
}

async function createTask(
  page: Page,
  url: string,
  t: { title: string; metric: string; assignee?: string; start?: string; due?: string; priority?: string },
) {
  await page.goto(`${url}/log`);
  await page.getByRole("button", { name: "New task" }).click();
  const drawer = page.getByRole("dialog", { name: "New task" });
  await drawer.getByLabel("Title").fill(t.title);
  await drawer.getByLabel("Metric").selectOption({ label: t.metric });
  if (t.assignee) await drawer.getByLabel("Assignee or team").selectOption({ label: t.assignee });
  if (t.start) await drawer.getByLabel("Start date").fill(t.start);
  if (t.due) await drawer.getByLabel("Due date").fill(t.due);
  if (t.priority) await drawer.getByLabel("Priority").selectOption(t.priority);
  await drawer.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByTestId("task-row").filter({ hasText: t.title })).toBeVisible();
}

test("tasks need a metric, and completed tasks roll up into metric progress", async ({ page }) => {
  const { url } = await ownerWithProgramme(page, "Founders Accelerator");

  // No metrics yet: the task drawer points to Metric instead of allowing a task
  await page.goto(`${url}/log`);
  await page.getByRole("button", { name: "New task" }).click();
  await expect(page.getByRole("dialog").getByText("Every task must contribute to an outcome")).toBeVisible();
  await page.keyboard.press("Escape");

  await createOutcome(page, url, "Train 500 young founders by June 2027", "500", "founders", "2027-06-30");
  const metric = "Train 500 young founders by June 2027";
  await createTask(page, url, { title: "Recruit cohort 1", metric, assignee: "Freda Owner", start: "2026-10-01", due: "2026-10-20" });
  await createTask(page, url, { title: "Run bootcamp week", metric, start: "2026-11-01", due: "2099-01-31", priority: "high" });

  // The past-due task is overdue (computed)
  const recruit = page.getByTestId("task-row").filter({ hasText: "Recruit cohort 1" });
  await expect(recruit.getByText("Overdue")).toBeVisible();

  // Completing it rolls up into the metric
  await recruit.getByLabel("Status of Recruit cohort 1").selectOption("completed");
  await expect(recruit.getByText("Overdue")).toHaveCount(0);

  await page.goto(`${url}/metrics`);
  const card = page.getByTestId("metric-card").filter({ hasText: metric });
  await expect(card.getByRole("img", { name: "50% achieved" })).toBeVisible();
  await expect(card).toContainText("1/2");

  // Outcome page lists linked activities; a recorded value takes over the headline figure
  await card.click();
  await expect(page.getByRole("heading", { name: metric })).toBeVisible();
  await expect(page.getByRole("link", { name: "Recruit cohort 1" })).toBeVisible();
  await page.getByLabel("Current value (founders)").fill("125");
  await page.getByLabel("Source or note").fill("Cohort 1 graduation");
  await page.getByRole("button", { name: "Record progress" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Progress recorded." })).toBeVisible();
  await expect(page.getByText("125 / 500 founders")).toBeVisible();
  await expect(page.getByText("From recorded values")).toBeVisible();

  // An outcome with linked tasks cannot be deleted
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete outcome" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /linked to this outcome/ })).toBeVisible();
});

test("board and timeline views, task details and progress updates", async ({ page }) => {
  const { url } = await ownerWithProgramme(page, "Teacher Training");
  await createOutcome(page, url, "Certify 200 teachers", "200", "teachers", "2027-03-31");
  const metric = "Certify 200 teachers";
  await createTask(page, url, { title: "Book venues", metric, start: "2026-09-01", due: "2026-09-15" });
  await createTask(page, url, { title: "Design curriculum", metric, start: "2026-10-01", due: "2099-12-01" });

  await page.goto(`${url}/log?view=board`);
  await expect(page.getByRole("region", { name: "Overdue" }).getByTestId("task-card")).toContainText("Book venues");
  await expect(page.getByRole("region", { name: "Pending" }).getByTestId("task-card")).toContainText("Design curriculum");
  await page
    .getByRole("region", { name: "Pending" })
    .getByLabel("Status of Design curriculum")
    .selectOption("in_progress");
  await expect(page.getByRole("region", { name: "In progress" }).getByTestId("task-card")).toContainText("Design curriculum");

  await page.goto(`${url}/log?view=timeline`);
  await expect(page.getByTestId("timeline-row")).toHaveCount(2);

  // Open a task, post an update, edit it
  await page.goto(`${url}/log`);
  await page.getByRole("link", { name: "Book venues" }).click();
  const drawer = page.getByRole("dialog", { name: "Task" });
  await expect(drawer.getByRole("heading", { name: "Book venues" })).toBeVisible();
  await drawer.getByLabel("Add a progress update").fill("Two venues confirmed in Ibadan.");
  await drawer.getByRole("button", { name: "Post update" }).click();
  await expect(drawer.getByText("Two venues confirmed in Ibadan.")).toBeVisible();
  await drawer.getByRole("button", { name: "Edit task" }).click();
  await page.getByRole("dialog", { name: "Edit task" }).getByLabel("Title").fill("Book training venues");
  await page.getByRole("dialog", { name: "Edit task" }).getByRole("button", { name: "Save task" }).click();
  await expect(page.getByRole("dialog", { name: "Task" }).getByRole("heading", { name: "Book training venues" })).toBeVisible();

  // Filters
  await page.keyboard.press("Escape");
  await expect(page).not.toHaveURL(/task=/);
  await page.getByLabel("Filter by status").selectOption("overdue");
  await expect(page.getByTestId("task-row")).toHaveCount(1);
  await expect(page.getByTestId("task-row")).toContainText("Book training venues");

  // Search from the top bar
  await page.goto(`${url}/log`);
  await page.getByLabel("Search tasks").fill("curriculum");
  await page.getByLabel("Search tasks").press("Enter");
  await expect(page.getByTestId("task-row")).toHaveCount(1);
});

test("a member can update the status of their own tasks only", async ({ page, browser }) => {
  const { url } = await ownerWithProgramme(page, "Market Access");
  await createOutcome(page, url, "Link 50 farmers to buyers", "50", "farmers", "2027-05-01");

  const memberEmail = uniqueEmail("farmer-officer");
  await page.goto(`${url}/stakeholders`);
  await page.getByRole("button", { name: "Invite" }).click();
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByLabel("Name", { exact: true }).fill("Tunde Officer");
  await page.getByRole("button", { name: "Send invite" }).click();
  const link = await page.getByLabel("Invite link").inputValue();

  await createTask(page, url, { title: "Visit cooperatives", metric: "Link 50 farmers to buyers", assignee: "Tunde Officer" });
  await createTask(page, url, { title: "Sign buyer MoUs", metric: "Link 50 farmers to buyers" });

  const member = await (await browser.newContext()).newPage();
  await member.goto(link);
  await member.getByRole("link", { name: "Create account" }).click();
  await member.getByLabel("Full name").fill("Tunde Officer");
  await member.getByLabel("Password").fill("correct-horse-battery");
  await member.getByRole("button", { name: "Create account" }).click();
  await member.getByRole("button", { name: "Accept invite" }).click();
  await expect(member).toHaveURL(/dashboard$/);

  await member.goto(`${url}/log`);
  await expect(member.getByRole("button", { name: "New task" })).toHaveCount(0);
  await expect(member.getByLabel("Status of Sign buyer MoUs")).toHaveCount(0);
  const saved = member.waitForResponse((r) => r.request().method() === "POST" && r.ok());
  await member.getByLabel("Status of Visit cooperatives").selectOption("in_progress");
  await saved;
  await member.reload();
  await expect(member.getByLabel("Status of Visit cooperatives")).toHaveValue("in_progress");

  await member.getByRole("link", { name: "Visit cooperatives" }).click();
  await expect(member.getByRole("dialog").getByRole("button", { name: "Edit task" })).toHaveCount(0);
});
