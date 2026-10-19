---
name: demo-test-authoring
description: How to write, judge, and classify tests for Demo Shop (the practice copy of the UAPP QA setup). Use whenever authoring test cases or plans for Demo Shop, reviewing a generated Playwright plan, deciding whether observed behaviour is a bug, or classifying a defect as Frontend or needing Product confirmation.
---

# Writing tests for Demo Shop

Demo Shop is a small online shop: login, products, cart. It is a static site with no backend,
so its state lives in the browser. The rules are the same as UAPP's; only the product differs.

## The altitude rule

Write every scenario from the seat of a shopper doing a real task. Not "the button is
clickable" but "a shopper adds two mugs and the cart total is right".

## Every test verifies both layers

1. What the user sees on screen
2. What the app stored (network call if any; otherwise localStorage)
3. Whether it survived a reload

## Classifying a failure

| Observed | Classification |
|---|---|
| Selector changed, label renamed, timing | **Test problem** — heal it |
| Wrong value, total, count or message | **Defect** — leave the test red or pin it with `test.fail()` and a comment |
| The rule itself is unclear | **Question for Product** — never a defect |

Never weaken an assertion to make a test pass.

## Defect, shortcoming or enhancement

- **Defect**: shows something untrue, loses data, offers an action that cannot succeed.
- **Shortcoming**: nothing is wrong, but something a user is entitled to expect is missing,
  and the product already does it one click away.
- **Enhancement**: correct and complete; this would make it pleasanter.

## The standard case matrix

Create (add to cart) · Read · **Edit** (quantity) · **Delete** (remove / clear) · Search ·
Filter and sort · Validation · Empty state · Persistence after reload · Permissions (logged out).

## Fewer cases, on what matters

Hard cap 25 cases a tab. Search, sort, filter, empty state and plain validation fold into one
case per area. Logic gets its own cases: totals after a second change, same product twice,
zero / negative quantity, decimals, badge vs. contents, what survives logout.

## Every screenshot in a report is marked in red

Use `annotatedShot(page, locator, caption)` from `fixtures/evidence.ts`, or `absenceShot`
when the defect is that something never appeared. A plain screenshot is not evidence.

## Every bug carries steps a person can follow by hand

Numbered, with the exact values typed, so a developer can reproduce it without the suite.

## Test data must be varied, not repeated

Use every option the form offers across the tests: each category, each sort, each quantity
path. Name anything you create with `uniqueName()` from `tests/helpers.ts`.

## Setting up test data

UI for the thing under test; for preconditions, the fastest honest route. Demo Shop has no
API, so preconditions are built by writing localStorage before the page loads
(`page.addInitScript`), in helpers under `api/`.

## Architecture rules

- Locators live in `pages/` and `components/`, never inline in a test
- Every test imports `test` from `fixtures/qa-fixtures.ts` (HAR + API evidence, automatically)
- Every test carries `tags(caseId, PRIORITY.x, KIND.x, MODULE.x)` from `tests/case-ids.ts`
- One tab per session; a handoff in `handoffs/` at the end of each

## Never drive the browser by hand to answer a question

Exploration is the planner's job, writing tests is the generator's, fixing a broken test
is the healer's. If an agent is blocked, fix the blocker or stop and say so.
