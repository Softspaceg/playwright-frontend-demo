# Coverage — Demo Shop — Products

Scoped to 24 of the 24 scenarios planned across all modules. The overall picture is in `reports/coverage.md`.

Generated 2026-10-21 14:30.

**8 of 24 planned scenarios are automated (33%).**

The plans say what should be tested. The tests say what exists. This is the gap.

## Demo Shop — Products — 8/24

| Case | Scenario | Automated | Blocked by |
|---|---|---|---|
| `SHOP-PRD-001` | Products screen lists the full catalogue | No |  |
| `SHOP-PRD-002` | Every card shows a name, a category and a price | Yes |  |
| `SHOP-PRD-003` | Every price is US dollars written $N.NN | Yes |  |
| `SHOP-PRD-004` | Every price is greater than zero | Yes |  |
| `SHOP-PRD-005` | Name, category and price of each product match the expected catalogue | Yes |  |
| `SHOP-PRD-006` | Opening a product (click a card) | No | No product detail view in the app — question for Product |
| `SHOP-PRD-007` | Add a product to the cart and see it after a reload | No | No add-to-cart control in the app — question for Product |
| `SHOP-PRD-008` | Cart badge or link is visible and updates without reload | No | No cart badge or link in the app — question for Product |
| `SHOP-PRD-009` | Change the quantity of an item; everything else in the cart is unchanged | No | No cart or quantity control in the app — question for Product |
| `SHOP-PRD-010` | Remove an item and clear the cart (confirm / Cancel / Confirm) | No | No cart, remove or clear in the app — question for Product |
| `SHOP-PRD-011` | Search by name or category finds the product, ignores case and spaces, and updates the count | Yes |  |
| `SHOP-PRD-012` | Search with no match shows the empty state | Yes |  |
| `SHOP-PRD-013` | Search treats special characters as plain text | No |  |
| `SHOP-PRD-014` | Category filter shows only that category (each option used) | Yes |  |
| `SHOP-PRD-015` | Search and category work together and reset correctly | No |  |
| `SHOP-PRD-016` | Sort — no sort control exists | No | No sort control in the app — question for Product |
| `SHOP-PRD-017` | The list survives a reload; search and category do not | No |  |
| `SHOP-PRD-018` | Browsing does not write anything to storage | No |  |
| `SHOP-PRD-019` | Logged-out visitor cannot use the Products screen | No |  |
| `SHOP-PRD-020` | Header shows who is logged in and offers Log out | No |  |
| `SHOP-PRD-021` | Log out: confirmation, Cancel changes nothing, Confirm logs out | No |  |
| `SHOP-PRD-022` | Direct link, reload and unknown routes land on the product list | No |  |
| `SHOP-PRD-023` | Controls have accessible names | No |  |
| `SHOP-PRD-024` | Search matches words in the product description (rule R5) | Yes |  |

---

Run one case: `npx playwright test --grep "@SHOP-PRD-001"`

Run everything critical: `npm run test:critical`
