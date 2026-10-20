# Demo Shop QA Automation — working guide

A practice copy of the UAPP QA architecture, pointed at a small app:
**https://softspaceg.github.io/playwright-templates/** (`demo@example.com` / `password123`, kept in `.env`).

Everything here works the way it does on UAPP: the same agents, MCP servers, fixtures,
evidence, tags, page objects, scripts and report template. Only the product is different.

**Starting a session: read the newest file in `qa-automation/handoffs/` first.** One tab per
session; at the end of a tab, write a new handoff and start the next tab in a fresh session.

---

## What this project is

Automated tests that drive Demo Shop in a real browser. Every test checks three things:

1. What the user sees on screen
2. What the app stored (a network call if there is one; Demo Shop is static, so usually localStorage)
3. Whether the data survived a page reload

---

## The commands you actually use

```bash
npm run auth                          # log in once and save the session
npm run summary                       # run everything, then write the developer report
npm run tab -- products/products      # run one tab (headed), with coverage scoped to it
npm run coverage                      # what is covered and what is not
npm run report                        # open Playwright's HTML report
npm run test:headed                   # watch the browser drive itself
```

Selections:

```bash
npx playwright test --grep "@critical"       # only critical cases
npx playwright test --grep "@products"       # one module
npx playwright test --grep "@SHOP-PRD-001"   # one case
npx playwright test --grep "@SHOP-BUG-12"    # retest one defect
```

**Order matters.** Run `npm run summary` before `npm run coverage`.

---

## How to add tests for a module — four steps

1. **The planner maps the whole module** (`playwright-test-planner` agent). Every screen and
   action, every scenario, a priority on each. It does not decide what to skip.
2. **You select** which case IDs get automated now. The rest stay in the plan as recorded gaps.
3. **The generator writes tests for exactly those IDs** (`playwright-test-generator` agent).
4. **You run them**: `npm run summary`, then read the report.

A red test goes to the **healer** (`playwright-test-healer`) only after deciding whether the
test or the product is wrong.

### The selection rule

1. Start with every `critical` scenario.
2. If that is more than about eight, keep the main path and move the rest to the next batch.
3. Add `high` only after the criticals pass. `medium` waits.

---

## Prompt: map a whole module

```
Mode: PLAN ONLY. Do not write test code.

Use the playwright-test-planner agent to explore the Products screen of Demo Shop
and produce a COMPLETE test plan in qa-automation/specs/products/products.plan.md.

Cover every screen, button, filter, sort and card action you find.
Do not limit the number of scenarios.

Owner's requirements — these are confirmed rules, assert them:
- <one rule per line, e.g. Every price is in US dollars, written as $N.NN>

For every scenario give: case ID (SHOP-PRD-NNN), priority, one line on what a shopper
cannot do if it breaks, steps, expected result with exact message text, expected storage
or network change, and whether it must survive a reload.

Use the standard case matrix in qa-automation/CLAUDE.md. Then stop for my review.
```

**Owner's requirements.** The planner may not invent business rules: anything arguable
becomes a Question for Product with no assertion. A rule written here is confirmed by the
owner, so the planner turns it into an expected result and the test asserts it. Write
only rules you are sure of, one per line, concrete and checkable (a currency, a format, a
range, an exact message). Leave out anything you are unsure of; the planner will raise it
as a question. Ready-to-send prompts live in `prompts/`.

## Prompt: write the tests, after you have selected

```
Use the playwright-test-generator agent. From specs/products/products.plan.md,
write tests for exactly these case IDs: SHOP-PRD-001, SHOP-PRD-004, SHOP-PRD-007.

Put them in tests/products/products.spec.ts. Use page objects; no locators inline.
Run them and show me the real result before telling me they work.
```

## Prompt: retest a fixed bug

```
Retest SHOP-BUG-12. Run its tests and give me the result.
If it fails, diagnose whether the product is still broken or the test needs
updating, and tell me which before changing anything.
```

---

## Never do the agents' work by hand

Exploration belongs to the planner, test authoring to the generator, fixing broken tests to
the healer. When an agent is blocked, fix the blocker and run the agent; if it cannot be
fixed, say so and stop. **Never narrow the scope without saying so.**

## Rules that must not be broken

- **Focus beats volume.** Hard cap 25 cases a tab.
- **Never weaken a test to make it pass.** Leave it red, or pin it with `test.fail()` and a comment naming the defect.
- **Diagnose before healing.** A renamed button is a test fix. A wrong total is a defect.
- **Never invent business rules.** Arguable behaviour is a question for Product, not a bug.
- **Screen knowledge lives in page objects.**
- **Every record needs a unique, readable name** — `uniqueName()` in `tests/helpers.ts`.
- **Vary the data.** Every option a form offers is used by some test.
- **Preconditions the fast way, the thing under test through the UI.** Demo Shop has no API,
  so preconditions are written to localStorage (`api/` holds those helpers).

---

## Evidence: all of it is kept, none of it is optional

| Evidence | When | Where it comes from |
|---|---|---|
| HAR file | Every test | `fixtures/qa-fixtures.ts` |
| API report | Every test | `fixtures/qa-fixtures.ts` (every fetch/XHR, timed; >2s flagged) |
| Annotated screenshot | On a defect | `annotatedShot` / `absenceShot` in `fixtures/evidence.ts` — always ringed in red with a caption |
| Trace | On failure | `playwright.config.ts` |

---

## Standard case matrix — check before calling any module done

Create (add to cart) · Read · **Edit** (quantity) · **Delete** (remove / clear) · Search ·
Filter and sort · Validation · Empty state · Persistence after reload · Permissions (logged out)

---

## Project layout

| Folder | Holds |
|---|---|
| `../.claude/agents/` | planner, generator, healer |
| `../.claude/skills/` | `demo-test-authoring` — how to write and judge tests here |
| `../.mcp.json` | `playwright` and `playwright-test` MCP servers |
| `prompts/` | Ready-to-send prompts, numbered in the order they are sent |
| `specs/` | Test plans, one case ID per scenario |
| `pages/` | One file per screen: its buttons and fields |
| `components/` | Shared UI pieces (product card) |
| `tests/` | The runnable checks, tagged by ID, priority, kind, module, defect |
| `tests/harness`, `tests/smoke` | Checks on the automation itself; run before every tab |
| `api/` | Precondition helpers (localStorage for now) |
| `fixtures/` | Evidence capture: HAR, API report, annotated screenshots, traffic |
| `scripts/` | Run-and-summarise, developer summary, coverage, case list, report builder |
| `tabs.config.mjs` | Which specs and case-ID range belong to each tab |
| `reports/` | What the team reads; `reports/_template/` is the HTML report format |
| `handoffs/` | One note per finished tab |
| `docs/` | Release history and decisions |

## Case IDs and tags

```
SHOP-PRD-001   @critical  @case  @products
SHOP-CRT-004   @high      @case  @cart  @SHOP-BUG-12
```

Built with `tags()` from `tests/case-ids.ts`. The plan owns what should be tested, the test
owns what exists, and `npm run coverage` computes the difference.

---

## Environment

- Target: `BASE_URL` in `.env` (ends with `/` — page objects use relative paths like `'products'`)
- Static site on GitHub Pages, no backend; state in the browser
- The session is saved once by `tests/auth.setup.ts` and reused
- Chromium only

## Current state — 15 Oct 2026

Architecture in place, no plans or product tests yet. Pages, components and `api/` are
empty skeletons. Next step: the planner maps Products.
