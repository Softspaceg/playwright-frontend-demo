# Demo Shop QA — developer summary — products

Generated 2026-10-19 14:34 from a real run against the dev environment.

**6 passed · 1 need attention · 1 tracked defects open**

## Needs attention

Ordered by priority. Each entry names the case, what broke and where the evidence is.

### SHOP-PRD-011 — Search by name or category finds the product, ignores case and spaces, and updates the count

**Priority:** high · **Tracked as:** @SHOP-BUG-1 · **Took:** 22006 ms

**What failed**

```
Error: Home products shown
expect(received).toEqual(expected) // deep equality
- Expected  - 5
+ Received  + 1
- Array [
-   "Coffee Mug",
Error: every card is Home
expect(received).toEqual(expected) // deep equality
- Expected  - 5
+ Received  + 1
- Array [
-   "Home",
Error: count line
expect(received).toBe(expected) // Object.is equality
Expected: "Showing 3 of 12 products"
Received: "Showing 0 of 12 products"
> 162 |         expect.soft(countText, 'count line').toBe('Showing 3 of 12 products');
Error: "No products found" must not show
expect(received).toBe(expected) // Object.is equality
Expected: false
Received: true
> 163 |         expect.soft(emptyShown, '"No products found" must not show').toBe(false);
Error: search Home + category Home
expect(locator).toHaveText(expected) failed
Locator:  getByTestId('product-count')
Expected: "Showing 3 of 12 products"
Received: "Showing 0 of 12 products"
Timeout:  10000ms
Error: search Home + All categories
expect(locator).toHaveText(expected) failed
Locator:  getByTestId('product-count')
Expected: "Showing 3 of 12 products"
Received: "Showing 0 of 12 products"
Timeout:  10000ms
```

**Evidence:** [Screenshot](../../test-results/products-products-Products-9fc09-paces-and-updates-the-count-chromium/test-failed-1.png) · [HAR](../../test-results/products-products-Products-9fc09-paces-and-updates-the-count-chromium/attachments/network-har-8e369c6783722a77ea30a4224248077861a1b35d.har) · [error-context](../../test-results/products-products-Products-9fc09-paces-and-updates-the-count-chromium/error-context.md) · [Trace](../../test-results/products-products-Products-9fc09-paces-and-updates-the-count-chromium/trace.zip)

## Tracked defects

Open product defects with a test pinned to each one. A defect stays listed even on
a run where it does not reproduce, because intermittent is not the same as fixed.

| Defect | Case | Reproduced this run | What it costs |
|---|---|---|---|
| @SHOP-BUG-1 | `SHOP-PRD-011` | Yes | SHOP-PRD-011 Search by name or category finds the product, ignores case and spaces, and updates the count |

## Passed

- **SHOP-PRD-002** Every card shows a name, a category and a price
- **SHOP-PRD-003** Every price is US dollars written $N.NN
- **SHOP-PRD-004** Every price is greater than zero
- **SHOP-PRD-005** Name, category and price of each product match the expected catalogue
- **SHOP-PRD-012** Search with no match shows the empty state
- **SHOP-PRD-014** Category filter shows only that category (each option used)

---

Full run detail, including every request and response: `npm run report`.
