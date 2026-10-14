import { expect, test } from "@playwright/test";

import { seedAuthenticatedSession } from "../fixtures/auth";

test.beforeEach(async ({ page }) => {
  await seedAuthenticatedSession(page);
  await page.goto("products");
});

test(
  "adding a product shows it in the list and keeps it after a reload",
  { tag: ["@smoke", "@products"] },
  async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Add product" });

    await test.step("Fill in and save the new product", async () => {
      await page.getByRole("button", { name: "Add product" }).click();
      await dialog.getByLabel("Name").fill("Water Bottle");
      await dialog.getByLabel("Price").fill("15.5");
      await dialog.getByLabel("Category").selectOption("Home");
      await dialog.getByLabel("Description").fill("Insulated steel bottle, 750ml.");
      await dialog.getByRole("button", { name: "Save product" }).click();
    });

    const card = page.getByTestId("product-card").filter({ hasText: "Water Bottle" });

    await test.step("The product appears in the list", async () => {
      await expect(dialog).toBeHidden();
      await expect(card.getByTestId("product-price")).toHaveText("$15.50");
      await expect(card.getByTestId("product-category")).toHaveText("Home");
      await expect(page.getByTestId("product-count")).toHaveText("Showing 13 of 13 products");
    });

    await test.step("It is still there after a reload", async () => {
      await page.reload();
      await expect(card).toBeVisible();
    });
  },
);
