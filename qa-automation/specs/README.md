# Specs

Test plans, one folder per module, one case ID per scenario (`SHOP-PRD-001`).

Written by the **playwright-test-planner** agent. A plan stays a draft until QA has read it
and selected the case IDs to automate. The plan owns *what should be tested*; the tests own
*what exists*; `npm run coverage` computes the gap.

| Module | Plan | Case IDs |
|---|---|---|
| Login | `specs/auth/login.plan.md` | SHOP-AUTH-001 … |
| Products | `specs/products/products.plan.md` | SHOP-PRD-001 … |
| Cart | `specs/cart/cart.plan.md` | SHOP-CRT-001 … |

Manual findings (reported by a person) go in the plan under a **Manual** heading, with an
ID and the `@manual` tag on their test.
