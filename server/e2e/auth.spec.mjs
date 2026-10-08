import { test, expect } from "@playwright/test";

test("signup and login controls work in the browser", async ({ page }) => {
  await page.route("https://accounts.google.com/**", route => route.abort());
  await page.goto("/");
  const signup = page.locator("#heroSignup");
  await expect(signup).toBeVisible();
  await signup.scrollIntoViewIfNeeded();
  await signup.click();
  await expect(page.locator("#authEmail")).toBeVisible();
  await expect(page.locator("#authPassword")).toBeVisible();
  await expect(page.locator("#authSubmit")).toBeVisible();
  await expect(page.locator("#authFirstName")).toBeVisible();
  await page.locator("#authSwitch").click();
  await expect(page.locator("#authFirstName")).toBeHidden();
  await expect(page.locator("#authSubmit")).toHaveText("Se connecter");
  await expect(page.locator("#authCountry")).toBeHidden();
  await page.locator("#authSwitch").click();
  await expect(page.locator("#authFirstName")).toBeVisible();
  await expect(page.locator("#authCountry")).toBeVisible();
});

test("header login opens the authentication dialog", async ({ page }) => {
  await page.route("https://accounts.google.com/**", route => route.abort());
  await page.goto("/");
  await page.locator("#topLogin").click();
  await expect(page.locator("#authEmail")).toBeVisible();
});
