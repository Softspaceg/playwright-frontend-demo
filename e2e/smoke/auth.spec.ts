import { expect, test } from "@playwright/test";

import { demoUser, login, seedAuthenticatedSession } from "../fixtures/auth";

test(
  "logging in with the demo account shows the products page",
  { tag: ["@smoke", "@auth"] },
  async ({ page }) => {
    await test.step("Submit valid credentials", async () => {
      await login(page, demoUser.email, demoUser.password);
    });

    await test.step("Lands on /products as the demo user", async () => {
      await expect(page).toHaveURL(/\/products$/);
      await expect(page.getByTestId("user-email")).toHaveText(demoUser.email);
    });
  },
);

test(
  "signing up creates an account and logs the new user in",
  { tag: ["@smoke", "@auth"] },
  async ({ page }) => {
    const email = `new-user-${Date.now()}@example.com`;

    await test.step("Fill in the signup form", async () => {
      await page.goto("signup");
      await page.getByLabel("Full name").fill("New User");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill("secret123");
      await page.getByLabel("Confirm password").fill("secret123");
      await page.getByRole("button", { name: "Sign up" }).click();
    });

    await test.step("Lands on /products as the new user", async () => {
      await expect(page).toHaveURL(/\/products$/);
      await expect(page.getByTestId("user-email")).toHaveText(email);
    });
  },
);

test(
  "an authenticated session survives a page reload",
  { tag: ["@smoke", "@auth"] },
  async ({ page }) => {
    await seedAuthenticatedSession(page);

    await page.goto("products");
    await page.reload();

    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByTestId("user-email")).toHaveText(demoUser.email);
  },
);

test(
  "logging out returns to the login page and protects /products",
  { tag: ["@smoke", "@auth"] },
  async ({ page }) => {
    await login(page, demoUser.email, demoUser.password);
    await expect(page).toHaveURL(/\/products$/);

    await test.step("Log out", async () => {
      await page.getByRole("button", { name: "Log out" }).click();
      await expect(page).toHaveURL(/\/login$/);
    });

    await test.step("/products redirects back to /login", async () => {
      await page.goto("products");
      await expect(page).toHaveURL(/\/login$/);
    });
  },
);
