# Report notes — QA's wording for the team report, written once and reused on every run

`scripts/fill-report.mjs` builds the report from the run and the plan. The plan's questions and
recommendations are one line each; the report reads better when each card says what was
observed, why it is not a defect and what changes if Product decides. That wording lives here.

Anything without a note still appears, from the plan's own text, so nothing is hidden while it
waits. Defects have their own file: `docs/defects.md`.

Keys per section (one `- Key: value` line each; a value can continue on lines indented by two
spaces; `==text==` is highlighted, `` `text` `` is code):

- `## Q<n>` (the plan's question number): Title, Blocks, Observed, Why here, If confirmed
- `## R: <first words of the plan's recommendation>`: Title, Where, Observed, Our view, Cost
- `## Need <CASE-ID>`: Owner, Cannot test, We need, Why
- `## Storage`: one `- Action | Where | Result` line per row

---

## Q1
- Title: Should shoppers be able to add a product to a cart from this screen?
- Blocks: SHOP-PRD-007, 008
- Observed: Products: no Add to cart button on any card, no cart link or badge in the header.
- Why here: Nobody has said a cart is in scope for this app, so its absence cannot be called a defect.
- If confirmed: SHOP-PRD-007 and 008 become testable, and a Cart tab is planned. A typical shop has both.

## Q2
- Title: Should clicking a card open the product's details?
- Blocks: SHOP-PRD-006
- Observed: Products: clicking a card does nothing; the address and storage do not change.
- Why here: There is no stated requirement for a detail view.
- If confirmed: SHOP-PRD-006 checks that the detail matches the card.

## Q3
- Title: Should the list be sortable, by price or by name?
- Blocks: SHOP-PRD-016
- Observed: Products: no sort control; the order is the order of the data.
- Why here: No requirement asks for a sort.
- If confirmed: SHOP-PRD-016 checks each sort order.

## Q5
- Title: Should the search text and category survive a reload, or be in the address?
- Blocks: affects SHOP-PRD-017
- Observed: Products: after a reload the box is empty and the select is back on “All categories”.
- Why here: Either behaviour is defensible until Product chooses.
- If confirmed: SHOP-PRD-017 asserts the chosen behaviour.

## Q6
- Title: Should logging out ask for confirmation?
- Blocks: affects SHOP-PRD-021
- Observed: Not observed: QA's exploration does not trigger logout.
- Why here: Typical shops log out without asking; the team's rules treat logout as destructive.
- If confirmed: SHOP-PRD-021 checks the dialog, Cancel and Confirm.

## Q7
- Title: What should happen to a cart when the shopper logs out and back in?
- Blocks: depends on Q1
- Observed: No cart exists today.
- Why here: Kept or cleared are both common; the choice is Product's.
- If confirmed: A Cart tab case asserts it.

## Q8
- Title: Should a visitor who is not logged in see the products?
- Blocks: affects SHOP-PRD-019
- Observed: Not observed yet; the planner works with the saved session.
- Why here: Some shops allow anonymous browsing, others do not.
- If confirmed: SHOP-PRD-019 asserts the redirect or the open list.

## Q9
- Title: In “Showing N of 12 products”, should 12 stay the whole catalogue under a filter?
- Blocks: the Products count line
- Observed: Products, category Home: “Showing 3 of 12 products”. The 12 never changes.
- Why here: Both readings are reasonable; the tests assert today's wording only where it is uncontested.
- If confirmed: SHOP-PRD-014 asserts the agreed denominator.

## Q11
- Title: Should a description search match part of a word, and ignore upper and lower case?
- Blocks: refines SHOP-PRD-024
- Observed: Rule R5 says “any word in its description”. The tests use whole lower-case words only (“battery”, “ceramic”).
- Why here: Whether “batt” or “Ceramic” should match is not settled.
- If confirmed: SHOP-PRD-024 gains a partial-word and a capitalised step.

## R: Add stable test ids
- Title: Give every control a test id, including the empty-state message
- Where: Products
- Observed: Every control has a test id except “No products found” and the card description, which the tests find by text and by position.
- Our view: Add test ids to both, and to any future logout dialog, add button and cart badge.
- Cost: A wording or markup change breaks tests that have found no defect.

## R: Serve a real `404.html`
- Title: Stop deep links answering HTTP 404
- Where: Hosting
- Observed: A direct load or reload of /products returns 404 from GitHub Pages and the app still renders.
- Our view: Use hash routing or another fallback that answers 200.
- Cost: Monitoring and crawlers see every deep link as broken, and the console shows red errors.

## R: Put the search and category in the URL
- Title: Put the search and category in the address
- Where: Products
- Observed: Both reset on reload (see Q5).
- Our view: A query string keeps them on reload and lets a shopper share a filtered list.
- Cost: A shopper loses the filter on every reload.

## R: Show a clear-search hint
- Title: Offer a way out of “No products found”
- Where: Products
- Observed: The empty state shows only the message; clearing is done with the × in the box.
- Our view: A “Clear search” link inside the message.
- Cost: A dead end for the shopper who does not notice the ×.

## Need SHOP-PRD-006
- Owner: Product
- Cannot test: A shopper opens a product and sees the same details as on the card.
- We need: A decision on a product detail view (Q2).
- Why: There is nothing to open today.

## Need SHOP-PRD-007
- Owner: Product
- Cannot test: A shopper adds a product to the cart and it is still there after a reload.
- We need: A decision on Add to cart (Q1).
- Why: No add control exists.

## Need SHOP-PRD-008
- Owner: Product
- Cannot test: The cart badge shows the right count without a reload.
- We need: A decision on a cart link or badge (Q1).
- Why: None exists.

## Need SHOP-PRD-009
- Owner: Product
- Cannot test: A shopper changes a quantity and nothing else in the cart changes.
- We need: A cart with a quantity control (Q1).
- Why: None exists.

## Need SHOP-PRD-010
- Owner: Product
- Cannot test: A shopper removes an item or clears the cart, with Cancel changing nothing.
- We need: A cart with remove and clear (Q1).
- Why: None exists.

## Need SHOP-PRD-016
- Owner: Product
- Cannot test: A shopper sorts the list by price or by name.
- We need: A decision on sorting (Q3).
- Why: No sort control exists.

## Storage
- Logged in | `localStorage demo_session` | `{"name":"Demo User","email":"demo@example.com"}`
- Search, category filter | none | No request and no storage change; reset on reload
- Reload or direct load of /products | `GET /products` | 404 from GitHub Pages; the app still renders
