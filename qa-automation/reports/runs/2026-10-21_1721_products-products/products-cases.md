# Cases covered — products — products

Generated 2026-10-21 14:21 from the tests themselves.
Do not edit by hand: re-run `node scripts/cases.mjs` instead.

**8 cases run by this selection.** Cases marked *reported* came from a person
using the product rather than from exploration. Cases that are planned but not automated
are not here — `npm run coverage` is where the gaps live.

Command: `npx playwright test tests/products/products.spec.ts`

| Case | What it checks | Priority | Source |
|---|---|---|---|
| `SHOP-PRD-002` | Every card shows a name, a category and a price | critical | explored |
| `SHOP-PRD-003` | Every price is US dollars written $N.NN | critical | explored |
| `SHOP-PRD-004` | Every price is greater than zero | critical | explored |
| `SHOP-PRD-005` | Name, category and price of each product match the expected catalogue | critical | explored |
| `SHOP-PRD-011` | Search by name or category finds the product, ignores case and spaces, and updates the count | high | explored |
| `SHOP-PRD-012` | Search with no match shows the empty state | high | explored |
| `SHOP-PRD-014` | Category filter shows only that category (each option used) | high | explored |
| `SHOP-PRD-024` | Search matches words in the product description (rule R5) | high | explored |
