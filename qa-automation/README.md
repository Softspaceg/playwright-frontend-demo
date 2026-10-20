# Demo Shop QA Automation

Automated browser tests for [Demo Shop](https://softspaceg.github.io/playwright-frontend-demo/),
built with Playwright and three AI agents. It is a working copy of the UAPP QA architecture on
a small app, so the whole workflow can be learned and shown end to end.

Owner: QA (zainab.ayman@softspace.ae).

---

## The idea in one picture

```
 Planner agent ──► plan (specs/)  ──► you pick a batch of case IDs
                                            │
 Generator agent ◄──────────────────────────┘
        │
        ▼
 tests + page objects ──► npm run tab ──► dev summary · coverage · kept run
                                                      │
                                                      ▼
                                   team report (reports/<module>/<tab>-vN)
                                                      │
                                                      ▼
                                       GitHub Actions (CI) on every PR
```

- **Planner** explores a screen and writes every scenario with an ID and a priority. It does
  not change anything in the app and never writes code.
- **You** choose which IDs are automated now (a *batch*). The rest stay in the plan as gaps.
- **Generator** writes tests for exactly those IDs, using page objects, and runs them.
- **Healer** fixes a test only when the *test* is wrong. When the *app* is wrong, the test
  stays red and becomes a defect (`@SHOP-BUG-<n>`).

Every test checks three things: what the user sees, what the app stored (localStorage here,
because Demo Shop has no backend), and whether it survives a reload.

---

## Quick start

```cmd
cd qa-automation
npm install
npx playwright install chromium
(create .env, see below)
npm run auth                      log in once, save the session
npx playwright test --project=harness
npm run tab -- products/products
```

`.env` (never committed):

```
BASE_URL=https://softspaceg.github.io/playwright-frontend-demo/
DEMO_USER=demo@example.com
DEMO_PASS=password123
```

`BASE_URL` must end with `/`. Every command is listed with its expected result in
[docs/run-commands.md](docs/run-commands.md).

---

## Every folder and file

### Repository root (outside `qa-automation/`)

| Path | What it is |
|---|---|
| `.claude/agents/playwright-test-planner.md` | The planner's instructions: explore without changing state, case IDs, priorities, plan format |
| `.claude/agents/playwright-test-generator.md` | The generator's instructions: what it may touch, never weaken an assertion, evidence rules |
| `.claude/agents/playwright-test-healer.md` | The healer's instructions: decide test-wrong vs app-wrong before changing anything |
| `.claude/skills/demo-test-authoring/SKILL.md` | How tests are written and judged here; how a failure is classified |
| `.mcp.json` | The two MCP servers the agents use to drive the browser (`playwright`, `playwright-test`) |

### `qa-automation/`

| Path | What it is |
|---|---|
| `README.md` | This file |
| `CLAUDE.md` | The working guide the agents read first: rules, prompts, case matrix |
| `package.json` | npm scripts (`auth`, `tab`, `summary`, `coverage`, `report`, …) |
| `playwright.config.ts` | Projects (`setup` → `harness` → `chromium`), evidence policy, reporters |
| `tabs.config.mjs` | Which spec file and which case-ID range belong to each tab |
| `constants.ts` | Shared paths, such as where the saved session lives |
| `.env` | URL and login. Local only, git-ignored |

| Folder | What it holds |
|---|---|
| `specs/` | **Test plans**, one per tab (`specs/products/products.plan.md`). The plan owns *what should be tested* |
| `tests/` | **Runnable tests**, tagged by case ID, priority, kind, module and defect |
| `tests/auth.setup.ts` | Logs in once and saves the session for every other test |
| `tests/seed.spec.ts` | The page the planner and generator start from |
| `tests/harness/`, `tests/smoke/` | Checks on the automation itself (session valid, evidence pipeline works). Run before every tab |
| `tests/case-ids.ts` | `tags()`, `PRIORITY`, `KIND`, `MODULE`, `defect()`: how tags are built |
| `tests/helpers.ts` | `uniqueName()` and other small helpers |
| `pages/` | **Page objects**: one file per screen with its locators and actions. No locator lives in a test |
| `components/` | Shared UI pieces, e.g. `product-card.ts` |
| `fixtures/qa-fixtures.ts` | The `test` every spec imports: records a HAR and a traffic report for every test |
| `fixtures/evidence.ts` | `annotatedShot` (rings the proof in red) and `absenceShot` (when something never appeared) |
| `fixtures/traffic.ts` | Which requests count as app calls (every fetch/XHR, since there is no API) |
| `api/` | Precondition helpers. Demo Shop has no API, so they write localStorage before the page loads |
| `data/` | Test data files (empty so far) |
| `scripts/run-and-summarize.mjs` | Behind `npm run tab` / `npm run summary`: runs, then summary, coverage, case list, keeps the run |
| `scripts/dev-summary.mjs` | Writes `reports/<module>/dev-summary.md`: what failed, why, where the evidence is |
| `scripts/coverage.mjs` | Plan vs tests: which planned cases are automated, which are blocked |
| `scripts/cases.mjs` | Lists the automated cases of a tab |
| `scripts/keep-run.mjs` | Copies each run's results into `reports/runs/<date>_<time>_<tab>/` |
| `scripts/fill-report.mjs` | Fills the team report template from a run (failures, plan questions, blocked cases, timings) and builds it into `reports/<module>/<tab>-auto/`. Runs on every `npm run tab` and on CI |
| `scripts/build-report.mjs` | Builds a filled report into one folder you can hand over (inlines images, redacts tokens) |
| `reports/_template/` | The agreed HTML report format (seven tabs) and how to fill it |
| `reports/<module>/` | Latest summary, coverage and case list per tab, and built reports (`products-v1/`) |
| `reports/runs/` | Every kept run, never overwritten |
| `prompts/` | One file per tab with every prompt in the order it was sent (`products-tab.prompts.md`) |
| `docs/run-commands.md` | Every command, in order, with its expected result |
| `docs/test-batches.md` | How cases move from plan to suite in batches, and the current batches |
| `docs/defects.md` | QA's reading of each `@SHOP-BUG-<n>` (title, owner, impact), written once and reused by every generated report |
| `docs/RELEASES.md` | Dated decisions |
| `handoffs/` | One note per finished tab: where it stopped and what comes next |

Git-ignored, created by runs: `node_modules/`, `auth/` (saved session), `test-results/`,
`playwright-report/`, `artifacts/`, `mcp-output/`, `har/`, `reports/*/*-auto/`.

### CI

`.github/workflows/qa-automation.yml` (workflow **QA Automation**) runs on every push and pull
request to `main`. It starts the app from that commit, runs the Products tab headless, and
uploads the generated team report as the artifact **qa-report-products**. A known defect keeps
its test red, so the job stays red until the defect is fixed.

---

## Case IDs and tags

```
SHOP-PRD-003   @critical  @case  @products
SHOP-PRD-011   @high      @case  @products  @SHOP-BUG-1
```

`SHOP-AUTH-*` login, `SHOP-PRD-*` products, `SHOP-CRT-*` cart. A tab is capped at 25 cases.

```cmd
npx playwright test --grep "@critical"
npx playwright test --grep "@SHOP-BUG-1"
```

---

## Current state — 19 Oct 2026

| Tab | Planned | Automated | Pass | Fail | Report |
|---|---|---|---|---|---|
| Products | 23 | 7 | 6 | 1 (`SHOP-BUG-1`, search ignores category) | `reports/products/products-v1/` |

Six cases are blocked because the app has no cart, product page or sort. `SHOP-PRD-001` is held
back on purpose, to be added when the suite runs in CI.

---

## Rules that are never broken

- Never weaken an assertion to make a test pass. A red test on a real defect is a result.
- Never invent a business rule. An unclear rule is a question for Product, not a bug.
- Locators live in page objects, never in tests.
- Every evidence screenshot is ringed in red with a caption.
- Nothing is dropped silently: a case that cannot run stays in the plan and in the coverage.
