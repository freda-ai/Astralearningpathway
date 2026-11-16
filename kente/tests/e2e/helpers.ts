import { expect, type Page } from "@playwright/test";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@example.org`;
}

export async function signUp(page: Page, name: string, email: string, password = "correct-horse-battery") {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
}

export async function signIn(page: Page, email: string, password = "correct-horse-battery") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** Signs up a new owner, creates a workspace and a programme. Returns the programme URL. */
export async function ownerWithProgramme(page: Page, programme = "Young Founders 2027") {
  const email = uniqueEmail("owner");
  await signUp(page, "Freda Owner", email);
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  await page.getByLabel("Organisation or workspace name").fill("EBH Africa");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page.getByRole("heading", { name: "Programmes" })).toBeVisible();
  await page.getByRole("button", { name: "New programme" }).click();
  await page.getByLabel("Programme name").fill(programme);
  await page.getByLabel("Start date").fill("2026-09-01");
  await page.getByLabel("End date").fill("2027-08-31");
  await page.getByRole("button", { name: "Create programme" }).click();
  await expect(page).toHaveURL(/\/p\/[0-9a-f-]+\/dashboard/);
  return { email, url: page.url().replace(/\/dashboard$/, "") };
}
