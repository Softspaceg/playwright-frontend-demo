import { expect, test } from "@playwright/test";

import { demoUser, login } from "../fixtures/auth";

test(
  "shows an error and stays on the login page for invalid credentials",
  { tag: ["@regression", "@auth"] },
  async ({ page }) => {
    await test.step("Submit wrong credentials", async () => {
      await login(page, demoUser.email, "wrong-password");
    });

    await test.step("Shows the error and stays on /login", async () => {
      await expect(page.getByRole("alert")).toHaveText("Invalid email or password");
      await expect(page).toHaveURL(/\/login$/);
    });
  },
);

test(
  "requires email and password before submitting",
  { tag: ["@regression", "@auth"] },
  async ({ page }) => {
    await page.goto("login");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("alert")).toHaveText("Email and password are required");
  },
);
