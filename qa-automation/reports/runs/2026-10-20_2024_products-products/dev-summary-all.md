# Demo Shop QA — developer summary — all modules

Generated 2026-10-20 17:24 from a real run against the dev environment.

**10 passed · 0 need attention · 1 tracked defects open**

## Needs attention

Nothing unexpected. Every test behaved as the suite expected it to.

## Tracked defects

Open product defects with a test pinned to each one. A defect stays listed even on
a run where it does not reproduce, because intermittent is not the same as fixed.

| Defect | Case | Reproduced this run | What it costs |
|---|---|---|---|
| @SHOP-BUG-1 | `SHOP-PRD-011` | No — intermittent | SHOP-PRD-011 Search by name or category finds the product, ignores case and spaces, and updates the count |

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
