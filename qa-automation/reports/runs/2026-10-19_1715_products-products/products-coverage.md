# Coverage — Demo Shop — Products

Scoped to 23 of the 23 scenarios planned across all modules. The overall picture is in `reports/coverage.md`.

Generated 2026-10-19 14:15.

**4 of 23 planned scenarios are automated (17%).**

The plans say what should be tested. The tests say what exists. This is the gap.

## Demo Shop — Products — 4/23

| Case | Scenario | Automated | Blocked by |
|---|---|---|---|
| `SHOP-PRD-001` | SHOP-PRD-001 [critical] Products screen lists the full catalogue | No |  |
| `SHOP-PRD-002` | SHOP-PRD-002 [critical] Every card shows a name, a category and a price | Yes |  |
| `SHOP-PRD-003` | SHOP-PRD-003 [critical] Every price is US dollars written $N.NN | Yes |  |
| `SHOP-PRD-004` | SHOP-PRD-004 [critical] Every price is greater than zero | Yes |  |
| `SHOP-PRD-005` | SHOP-PRD-005 [critical] Name, category and price of each product match the expected catalogue | Yes |  |
| `SHOP-PRD-006` | SHOP-PRD-006 [high] Opening a product (click a card) | No | No product detail view in the app — question for Product |
| `SHOP-PRD-007` | SHOP-PRD-007 [critical] Add a product to the cart and see it after a reload | No | No add-to-cart control in the app — question for Product |
| `SHOP-PRD-008` | SHOP-PRD-008 [high] Cart badge or link is visible and updates without reload | No | No cart badge or link in the app — question for Product |
| `SHOP-PRD-009` | SHOP-PRD-009 [high] Change the quantity of an item; everything else in the cart is unchanged | No | No cart or quantity control in the app — question for Product |
| `SHOP-PRD-010` | SHOP-PRD-010 [high] Remove an item and clear the cart (confirm / Cancel / Confirm) | No | No cart, remove or clear in the app — question for Product |
| `SHOP-PRD-011` | SHOP-PRD-011 [high] Search by name finds the product, ignores case and spaces, and updates the count | No |  |
| `SHOP-PRD-012` | SHOP-PRD-012 [high] Search with no match shows the empty state | No |  |
| `SHOP-PRD-013` | SHOP-PRD-013 [medium] Search treats special characters as plain text | No |  |
| `SHOP-PRD-014` | SHOP-PRD-014 [high] Category filter shows only that category (each option used) | No |  |
| `SHOP-PRD-015` | SHOP-PRD-015 [high] Search and category work together and reset correctly | No |  |
| `SHOP-PRD-016` | SHOP-PRD-016 [medium] Sort — no sort control exists | No | No sort control in the app — question for Product |
| `SHOP-PRD-017` | SHOP-PRD-017 [high] The list survives a reload; search and category do not | No |  |
| `SHOP-PRD-018` | SHOP-PRD-018 [medium] Browsing does not write anything to storage | No |  |
| `SHOP-PRD-019` | SHOP-PRD-019 [high] Logged-out visitor cannot use the Products screen | No |  |
| `SHOP-PRD-020` | SHOP-PRD-020 [medium] Header shows who is logged in and offers Log out | No |  |
| `SHOP-PRD-021` | SHOP-PRD-021 [high] Log out: confirmation, Cancel changes nothing, Confirm logs out | No |  |
| `SHOP-PRD-022` | SHOP-PRD-022 [medium] Direct link, reload and unknown routes land on the product list | No |  |
| `SHOP-PRD-023` | SHOP-PRD-023 [medium] Controls have accessible names | No |  |

---

Run one case: `npx playwright test --grep "@SHOP-PRD-001"`

Run everything critical: `npm run test:critical`
