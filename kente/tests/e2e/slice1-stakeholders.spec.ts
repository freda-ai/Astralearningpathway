import { expect, test } from "@playwright/test";
import { ownerWithProgramme, signUp, uniqueEmail } from "./helpers";

test("a lead invites a member who signs up, accepts and sees the programme", async ({ page, browser }) => {
  const { url } = await ownerWithProgramme(page, "Digital Skills for Youth");

  // Create a team
  await page.goto(`${url}/stakeholders?tab=teams`);
  await page.getByLabel("Team name").fill("Field Team");
  await page.getByRole("button", { name: "Add team" }).click();
  await expect(page.getByTestId("team-card").filter({ hasText: "Field Team" })).toBeVisible();

  // Invite a member into that team
  await page.goto(`${url}/stakeholders`);
  await expect(page.getByRole("row", { name: /Freda Owner/ })).toContainText("Programme Lead");
  const memberEmail = uniqueEmail("member");
  await page.getByRole("button", { name: "Invite" }).click();
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByLabel("Name", { exact: true }).fill("Kemi Officer");
  await page.getByLabel("Role on the programme").fill("Programme Officer");
  await page.getByLabel("Team").selectOption({ label: "Field Team" });
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByText(`Invite created for ${memberEmail}`)).toBeVisible();
  const link = await page.getByLabel("Invite link").inputValue();
  expect(link).toContain("/invite/");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("row", { name: /Kemi Officer/ })).toContainText("Invited");

  // The member follows the link, creates an account and accepts
  const member = await (await browser.newContext()).newPage();
  await member.goto(link);
  await expect(member.getByRole("heading", { name: "Join Digital Skills for Youth" })).toBeVisible();
  await member.getByRole("link", { name: "Create account" }).click();
  await expect(member.getByLabel("Email")).toHaveValue(memberEmail);
  await member.getByLabel("Full name").fill("Kemi Officer");
  await member.getByLabel("Password").fill("correct-horse-battery");
  await member.getByRole("button", { name: "Create account" }).click();
  await member.getByRole("button", { name: "Accept invite" }).click();
  await expect(member).toHaveURL(/\/dashboard$/);
  await expect(member.getByRole("heading", { name: "Digital Skills for Youth" })).toBeVisible();

  // Members see the directory but cannot invite
  await member.goto(`${url}/stakeholders`);
  await expect(member.getByRole("row", { name: /Kemi Officer/ })).not.toContainText("Invited");
  await expect(member.getByRole("button", { name: "Invite" })).toHaveCount(0);

  // The invite link no longer works
  await member.goto(link);
  await expect(member.getByRole("heading", { name: "This invite is no longer valid" })).toBeVisible();

  // Teams tab lists the member
  await page.goto(`${url}/stakeholders?tab=teams`);
  await expect(page.getByTestId("team-card").filter({ hasText: "Field Team" })).toContainText("Kemi Officer");
});

test("an invite cannot be accepted from a different account", async ({ page, browser }) => {
  const { url } = await ownerWithProgramme(page, "Climate Fellows");
  await page.goto(`${url}/stakeholders`);
  await page.getByRole("button", { name: "Invite" }).click();
  await page.getByLabel("Email").fill(uniqueEmail("intended"));
  await page.getByRole("button", { name: "Send invite" }).click();
  const link = await page.getByLabel("Invite link").inputValue();

  const other = await (await browser.newContext()).newPage();
  await signUp(other, "Wrong Person", uniqueEmail("wrong"));
  await expect(other.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  await other.goto(link);
  await expect(other.getByRole("alert").filter({ hasText: /signed in as/ })).toBeVisible();
  await expect(other.getByRole("button", { name: "Accept invite" })).toHaveCount(0);
});

test("a lead edits a stakeholder's details from their profile", async ({ page }) => {
  const { url } = await ownerWithProgramme(page, "Health Workers Training");
  await page.goto(`${url}/stakeholders`);
  await page.getByRole("link", { name: /Freda Owner/ }).click();
  await expect(page.getByRole("heading", { name: "Freda Owner" })).toBeVisible();
  await page.getByLabel("Role on the programme").fill("Programme Director");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved." })).toBeVisible();
  await page.goto(`${url}/stakeholders`);
  await expect(page.getByRole("row", { name: /Freda Owner/ })).toContainText("Programme Director");
});
