import { expect, test } from "@playwright/test";

import { seedAuthenticatedSession } from "../fixtures/auth";

test.beforeEach(async ({ page }) => {
  await seedAuthenticatedSession(page);
  await page.goto("products");
  await page.getByRole("button", { name: "Add product" }).click();
});

test(
  "shows a field error for every missing or invalid input",
  { tag: ["@regression", "@products"] },
  async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Add product" });

    await dialog.getByRole("button", { name: "Save product" }).click();
    await expect(dialog.getByTestId("product-name-error")).toHaveText("Name is required");
    await expect(dialog.getByTestId("product-price-error")).toHaveText("Price is required");
    await expect(dialog.getByTestId("product-category-error")).toHaveText("Category is required");

    await dialog.getByLabel("Price").fill("0");
    await dialog.getByRole("button", { name: "Save product" }).click();
    await expect(dialog.getByTestId("product-price-error")).toHaveText(
      "Price must be greater than 0",
    );
    await expect(page.getByTestId("product-card")).toHaveCount(12);
  },
);

test(
  "cancelling or pressing Escape closes the dialog without adding anything",
  { tag: ["@regression", "@products"] },
  async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Add product" });

    await dialog.getByLabel("Name").fill("Not saved");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Add product" }).click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    await expect(page.getByTestId("product-card")).toHaveCount(12);
  },
);
