# Defects — QA's reading, written once per defect

`scripts/fill-report.mjs` builds the team report on every run. Everything it can measure
(which test failed, the error, the ringed screenshot, the recording) it takes from the run.
What it cannot measure is the judgement: what the problem is in a sentence, which team owns
it, and what it costs a shopper. That is written here, once, by QA, and reused on every run.

A failing test tagged `@SHOP-BUG-<n>` with no entry here still appears in the report,
marked **"Needs QA reading"**, so a new defect is never hidden while it waits.

Format: one `## SHOP-BUG-<n>` section per defect. Each field is a `- Key: value` line; a
value can continue on following lines indented by two spaces. `==text==` is highlighted,
`` `text` `` is code.

Keys: Title, Severity, Owner, Where, Frontend, Backend, Steps, Expected, Actual, Impact,
Supersedes (the start of a plan recommendation this defect replaces, so it is not listed twice).

---

## SHOP-BUG-1
- Title: Searching for a category shows “No products found”, although products in that category exist
- Severity: High
- Owner: Frontend
- Where: Products, search box
- Frontend: The search compares the typed text with the product name only. “lamp”, “LAMP” and “  lamp  ” all find Desk Lamp, so trimming and case are handled; the category is simply not part of the match. Our reading: the filter in the product list does not look at the category field.
- Backend: Nothing to do. The recording shows no request while searching: the catalogue is in the page and filtered in the browser.
- Steps: 1. Log in as demo@example.com / password123.
  2. On Products, type `Home` in “Search products”.
  3. Leave the category on “All categories”.
- Expected: Coffee Mug, Desk Lamp and Indoor Plant are listed and the count reads “Showing 3 of 12 products” (owner's rule R4, 19 Oct 2026: search matches the product name or its category).
- Actual: No cards, the message ==No products found== and the count ==Showing 0 of 12 products==.
- Impact: A shopper who searches by the kind of product they want, rather than its exact name, is told the shop has nothing and may leave. The category select still works, but only if the shopper thinks to use it.
- Supersedes: Fix search so it also matches the category
