import { expect, test } from "@playwright/test";

import { seedAuthenticatedSession } from "../fixtures/auth";

test.beforeEach(async ({ page }) => {
  await seedAuthenticatedSession(page);
  await page.goto("products");
});

test(
  "shows the full product list",
  { tag: ["@smoke", "@products"] },
  async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByTestId("product-card")).toHaveCount(12);
    await expect(page.getByTestId("product-count")).toHaveText("Showing 12 of 12 products");
  },
);

test(
  "search and category filter narrow the list",
  { tag: ["@smoke", "@products"] },
  async ({ page }) => {
    await test.step("Search by name", async () => {
      await page.getByRole("searchbox", { name: "Search products" }).fill("shoe");
      await expect(page.getByTestId("product-card")).toHaveCount(1);
      await expect(page.getByTestId("product-name")).toHaveText("Running Shoes");
    });

    await test.step("Filter by category", async () => {
      await page.getByRole("searchbox", { name: "Search products" }).fill("");
      await page.getByLabel("Filter by category").selectOption("Home");
      await expect(page.getByTestId("product-card")).toHaveCount(3);
      await expect(page.getByTestId("product-category")).toHaveText(["Home", "Home", "Home"]);
    });
  },
);
