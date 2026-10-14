import { expect, test } from "@playwright/test";

import { seedAuthenticatedSession } from "../fixtures/auth";

test(
  "shows an empty state when nothing matches the search",
  { tag: ["@regression", "@products"] },
  async ({ page }) => {
    await seedAuthenticatedSession(page);
    await page.goto("products");

    await page.getByRole("searchbox", { name: "Search products" }).fill("no-such-product");

    await expect(page.getByTestId("no-products")).toHaveText("No products found");
    await expect(page.getByTestId("product-count")).toHaveText("Showing 0 of 12 products");
  },
);
