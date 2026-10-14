import { expect, test } from "@playwright/test";

import { demoUser } from "../fixtures/auth";

test.beforeEach(async ({ page }) => {
  await page.goto("signup");
});

test(
  "shows a field error for every invalid input",
  { tag: ["@regression", "@auth"] },
  async ({ page }) => {
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("123");
    await page.getByLabel("Confirm password").fill("456");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByTestId("signup-name-error")).toHaveText("Name is required");
    await expect(page.getByTestId("signup-email-error")).toHaveText("Enter a valid email");
    await expect(page.getByTestId("signup-password-error")).toHaveText(
      "Password must be at least 6 characters",
    );
    await expect(page.getByTestId("signup-confirm-password-error")).toHaveText(
      "Passwords do not match",
    );
    await expect(page).toHaveURL(/\/signup$/);
  },
);

test(
  "rejects an email that is already registered",
  { tag: ["@regression", "@auth"] },
  async ({ page }) => {
    await page.getByLabel("Full name").fill("Someone Else");
    await page.getByLabel("Email").fill(demoUser.email);
    await page.getByLabel("Password", { exact: true }).fill("secret123");
    await page.getByLabel("Confirm password").fill("secret123");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByRole("alert")).toHaveText("An account with this email already exists");
    await expect(page).toHaveURL(/\/signup$/);
  },
);
