# Products tab — every prompt, in the order it is sent

One file per tab. Go top to bottom: each step says when it is sent, what to change before
sending, and the command you run after it. Commands are run from `qa-automation/`
(see `docs/run-commands.md`).

---

## Step 0 — before the tab (you run)

```cmd
npm run auth
npx playwright test --project=harness
```
Expect: auth `1 passed`; harness `3 passed, 1 skipped`.

---

## Step 1 — Planner: map the Products screen

**Send when:** the harness is green.
**Change before sending:** only the lines under "Owner's requirements" (rules you are sure of,
one per line, concrete and checkable).
**Result:** `specs/products/products.plan.md`, then stop for your selection. No test code.

```
Mode: PLAN ONLY. Do not write test code.

Use the playwright-test-planner agent to explore the Products screen of Demo Shop
and produce a COMPLETE test plan in qa-automation/specs/products/products.plan.md.

Cover every screen, button, filter, sort and card action you find.
Do not limit the number of scenarios.

Owner's requirements — these are confirmed rules, assert them:
- Every product card shows a name, a category and a price.
- Every price is in US dollars, written as $N.NN (never EGP or any other currency).
- Every price is greater than zero.

For every scenario give: case ID (SHOP-PRD-NNN), priority, one line on what a shopper
cannot do if it breaks, steps, expected result with exact message text, expected storage
or network change, and whether it must survive a reload.

Use the standard case matrix in qa-automation/CLAUDE.md. Then stop for my review.
```

---

## Step 2 — Generator: batch 1 (critical)

**Send when:** you have reviewed the plan and agreed the batch in `docs/test-batches.md`.
**Change before sending:** only the case IDs.

```
Use the playwright-test-generator agent. From specs/products/products.plan.md,
write tests for exactly these case IDs: SHOP-PRD-002, SHOP-PRD-003, SHOP-PRD-004, SHOP-PRD-005.

Approved by the owner: these four case IDs only, on BASE_URL from qa-automation/.env
(https://softspaceg.github.io/playwright-frontend-demo/), read-only browsing with the
saved session. No records are created.

Put them in tests/products/products.spec.ts. Use page objects; no locators inline.
Run them and show me the real result before telling me they work.
```

**Then you run:**
```cmd
npm run tab -- products/products
```
Expect: all green, coverage written, run kept in `reports/runs/`.

---

## Step 3 — Planner: record the owner's answer to a Question for Product

**Send when:** batch 1 is green and you have settled one of the plan's questions.
**Change before sending:** the rule under "Owner's answer" and the case IDs it touches.
**Result:** the plan follows the rule; if the app breaks it, Observations say what it does
today and the expected result is not changed.

```
Mode: PLAN ONLY. Do not write test code.

Use the playwright-test-planner agent to update qa-automation/specs/products/products.plan.md.
Do not renumber or remove any existing case. Keep every **Case:** line.

Owner's answer to a Question for Product — this is now a confirmed rule, assert it:
- Search matches the product name or its category. Searching "Home" shows the Home products.

Update SHOP-PRD-011 (and SHOP-PRD-012 if it is affected) so the expected results follow this
rule, including the exact count line. Move the question out of "Questions for Product" and
note that the owner answered it on 19 Oct 2026. If the live app does not follow the rule,
record what it does today under Observations; do not change the expected result to match it.

Then stop for my review.
```

---

## Step 4 — Generator: batch 2 (high), with the first real defect

**Send when:** you have reviewed the updated SHOP-PRD-011.
**Change before sending:** only the case IDs or the defect number.

```
Use the playwright-test-generator agent. From specs/products/products.plan.md,
write tests for exactly these case IDs: SHOP-PRD-014, SHOP-PRD-011, SHOP-PRD-012.

Approved by the owner: these three case IDs only, on BASE_URL from qa-automation/.env
(https://softspaceg.github.io/playwright-frontend-demo/), read-only browsing with the
saved session. No records are created.

SHOP-PRD-011 asserts owner's rule R4 (search matches the product name or its category).
The plan records that the live app breaks it. Do not weaken or soften that assertion and do
not add skip, fixme or test.fail: the test stays red. Tag it with @SHOP-BUG-1 and capture
the evidence with annotatedShot or absenceShot from fixtures/evidence.ts, ringed in red with
a caption saying what it proves.

Add them to tests/products/products.spec.ts. Use page objects; no locators inline.
Use every category option in SHOP-PRD-014.
Run them and show me the real result before telling me they work.
```

**Then you run:**
```cmd
npm run tab -- products/products
```
Expect: one failure, SHOP-PRD-011 (`@SHOP-BUG-1`); everything else green.

---

## Step 5 — Team report and handoff

Written from the kept run of step 4 with `reports/_template/report-template.html`, then
`handoffs/<stamp>-products.md`. Prompts for these are added here when they are sent.

---

## Step 6 — Planner: owner's answer to Question 10 (search the description) → SHOP-BUG-2

**Send when:** SHOP-BUG-1 is fixed and you want the next rule asserted.
**Change before sending:** the rule under "Owner's answer".
**Result:** a new case SHOP-PRD-024 in the plan. If the app breaks the rule, Observations say
what it does today and the expected result is not changed.

```
Mode: PLAN ONLY. Do not write test code.

Use the playwright-test-planner agent to update qa-automation/specs/products/products.plan.md.
Do not renumber or remove any existing case.

Owner's answer to Question 10 — this is now a confirmed rule, assert it:
- R5: Search matches the product name, its category, or any word in its description.
  Searching "battery" shows the product whose description mentions a battery.

Add one new case, SHOP-PRD-024, for this rule: the exact product(s) and count line expected
for "battery" and for one more description word you confirm on the live app. Move Question 10
to "Answered by Product", dated 21 Oct 2026. Also record that SHOP-BUG-1 was fixed on main
(PR #9, 20 Oct 2026) and SHOP-PRD-011 now passes. If the live app does not follow R5, record
what it does today under Observations; do not change the expected result to match it.

Then stop for my review.
```

---

## Step 7 — Generator: SHOP-PRD-024 (expected to fail as SHOP-BUG-2)

**Send when:** you have reviewed SHOP-PRD-024 in the plan.
**Change before sending:** nothing, unless the case ID changed.

```
Use the playwright-test-generator agent. From specs/products/products.plan.md,
write a test for exactly this case ID: SHOP-PRD-024.

Approved by the owner: this case ID only, on BASE_URL from qa-automation/.env
(https://softspaceg.github.io/playwright-frontend-demo/), read-only browsing with the
saved session. No records are created.

SHOP-PRD-024 asserts owner's rule R5 (search matches name, category or description). If the
live app breaks it, do not weaken the assertion and do not add skip, fixme or test.fail: the
test stays red. Tag it with @SHOP-BUG-2 and capture the evidence with annotatedShot from
fixtures/evidence.ts, ringed in red with a caption saying what it proves.

Add it to tests/products/products.spec.ts. Use page objects; no locators inline.
Run it and show me the real result before telling me it works.
```

**Then you run:**
```cmd
npm run tab -- products/products
```
Expect: one failure, SHOP-PRD-024 (`@SHOP-BUG-2`), and a new report version with it under
"Bugs for developers", with its screenshot and video.
