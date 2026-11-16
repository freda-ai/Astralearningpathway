import { expect, test } from "@playwright/test";
import { ownerWithProgramme, signIn, signUp, uniqueEmail } from "./helpers";

test("sends signed-out visitors to sign in", async ({ page }) => {
  await page.goto("/programmes");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a user signs up, creates a workspace and a programme", async ({ page }) => {
  const { email } = await ownerWithProgramme(page, "Women in Agribusiness");
  await expect(page.getByRole("heading", { name: "Women in Agribusiness" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");

  // Sign out and back in
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await signIn(page, email);
  await expect(page.getByRole("heading", { name: "Programmes" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Women in Agribusiness/ })).toBeVisible();
});

test("rejects a wrong password and a duplicate account", async ({ page }) => {
  const email = uniqueEmail("dup");
  await signUp(page, "Dup User", email);
  await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible();
  await page.context().clearCookies();

  await signIn(page, email, "wrong-password");
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toHaveText("That email and password do not match.");

  await signUp(page, "Dup User", email);
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toContainText("already exists");
});

test("another workspace's programme is not reachable", async ({ page, browser }) => {
  const { url } = await ownerWithProgramme(page, "Private Programme");
  const other = await browser.newPage();
  await signUp(other, "Someone Else", uniqueEmail("other"));
  await other.getByLabel("Organisation or workspace name").fill("Other Org");
  await other.getByRole("button", { name: "Create workspace" }).click();
  await expect(other.getByRole("heading", { name: "Programmes" })).toBeVisible();
  await other.goto(`${url}/dashboard`);
  await expect(other.getByRole("heading", { name: "Not found" })).toBeVisible();
  await other.close();
});
