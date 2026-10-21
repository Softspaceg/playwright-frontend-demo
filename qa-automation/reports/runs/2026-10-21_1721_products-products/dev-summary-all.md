# Demo Shop QA — developer summary — all modules

Generated 2026-10-21 14:21 from a real run against the dev environment.

**10 passed · 1 need attention · 2 tracked defects open**

## Needs attention

Ordered by priority. Each entry names the case, what broke and where the evidence is.

### SHOP-PRD-024 — Search matches words in the product description (rule R5)

**Priority:** high · **Tracked as:** @SHOP-BUG-2 · **Took:** 4897 ms

**What failed**

```
Error: search "battery": cards shown
expect(received).toEqual(expected) // deep equality
- Expected  - 3
+ Received  + 1
- Array [
-   "Wireless Headphones",
Error: search "battery": count line
expect(received).toBe(expected) // Object.is equality
Expected: "Showing 1 of 12 products"
Received: "Showing 0 of 12 products"
> 255 |         expect.soft(countText, `${label}: count line`).toBe(expectedCount);
Error: search "battery": "No products found" must not show
expect(received).toBe(expected) // Object.is equality
Expected: false
Received: true
> 256 |         expect.soft(emptyShown, `${label}: "No products found" must not show`).toBe(false);
Error: search "ceramic": cards shown
expect(received).toEqual(expected) // deep equality
- Expected  - 4
+ Received  + 1
- Array [
-   "Coffee Mug",
Error: search "ceramic": count line
expect(received).toBe(expected) // Object.is equality
Expected: "Showing 2 of 12 products"
Received: "Showing 0 of 12 products"
> 255 |         expect.soft(countText, `${label}: count line`).toBe(expectedCount);
Error: search "ceramic": "No products found" must not show
expect(received).toBe(expected) // Object.is equality
Expected: false
Received: true
> 256 |         expect.soft(emptyShown, `${label}: "No products found" must not show`).toBe(false);
Error: "ceramic" + Home: cards shown
expect(received).toEqual(expected) // deep equality
- Expected  - 4
+ Received  + 1
- Array [
-   "Coffee Mug",
Error: "ceramic" + Home: count line
expect(received).toBe(expected) // Object.is equality
Expected: "Showing 2 of 12 products"
Received: "Showing 0 of 12 products"
> 255 |         expect.soft(countText, `${label}: count line`).toBe(expectedCount);
Error: "ceramic" + Home: "No products found" must not show
expect(received).toBe(expected) // Object.is equality
Expected: false
Received: true
> 256 |         expect.soft(emptyShown, `${label}: "No products found" must not show`).toBe(false);
```

**Evidence:** [Screenshot](../test-results/products-products-Products-2eba9-roduct-description-rule-R5--chromium/test-failed-1.png) · [video](../test-results/products-products-Products-2eba9-roduct-description-rule-R5--chromium/attachments/video-7d2d482618e86d010126013620db4928a7b3d35e.webm) · [HAR](../test-results/products-products-Products-2eba9-roduct-description-rule-R5--chromium/attachments/network-har-669fbe62cf14a5f83b1194e919370122fd9344d4.har) · [error-context](../test-results/products-products-Products-2eba9-roduct-description-rule-R5--chromium/error-context.md) · [Trace](../test-results/products-products-Products-2eba9-roduct-description-rule-R5--chromium/trace.zip)

## Tracked defects

Open product defects with a test pinned to each one. A defect stays listed even on
a run where it does not reproduce, because intermittent is not the same as fixed.

| Defect | Case | Reproduced this run | What it costs |
|---|---|---|---|
| @SHOP-BUG-1 | `SHOP-PRD-011` | No — intermittent | SHOP-PRD-011 Search by name or category finds the product, ignores case and spaces, and updates the count |
| @SHOP-BUG-2 | `SHOP-PRD-024` | Yes | SHOP-PRD-024 Search matches words in the product description (rule R5) |

## Passed

- **HRN-API-001** preconditions can be created through the API
- seed
- **HRN-EVD-001** the session and the evidence pipeline work
- **SHOP-PRD-002** Every card shows a name, a category and a price
- **SHOP-PRD-003** Every price is US dollars written $N.NN
- **SHOP-PRD-004** Every price is greater than zero
- **SHOP-PRD-005** Name, category and price of each product match the expected catalogue
- **SHOP-PRD-011** Search by name or category finds the product, ignores case and spaces, and updates the count
- **SHOP-PRD-012** Search with no match shows the empty state
- **SHOP-PRD-014** Category filter shows only that category (each option used)

---

Full run detail, including every request and response: `npm run report`.
