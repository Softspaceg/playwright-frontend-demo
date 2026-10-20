# Handoff — 16 Oct 2026 — start here (first session in demo-playwright)

Replaces nothing: `2026-10-15-setup.md` stays as written. This one carries the full context
for the first session opened in this folder.

## What this project is

A copy of Zainab's UAPP QA automation project (`D:\SoftSapce_Projects\U_APP\U-App\qa-automation`,
an HR SaaS on an Odoo backend), rebuilt here against a small practice app:

- **App:** Demo Shop — https://softspaceg.github.io/playwright-templates/products
- **Login:** `demo@example.com` / `password123`, held in `qa-automation/.env` as `DEMO_USER` / `DEMO_PASS`
- **Purpose:** show the exact same workflow on a small app: agents, MCP servers, tags, page
  objects, fixtures, evidence, scripts, HTML report template, handoffs.

Demo Shop is a **static site on GitHub Pages with no backend**. A plain fetch of `/products`
returned 404 from the server and the root page only showed "Demo Shop", so it is a client-side
app and its state most likely lives in localStorage. Not yet confirmed in a browser; the
planner confirms it.

## What maps to what (UAPP → demo)

| UAPP | Here |
|---|---|
| `U-App/.mcp.json` | `demo-playwright/.mcp.json`: `playwright` and `playwright-test`, pointing at this folder's `node_modules` and config |
| `.claude/agents/` planner, generator, healer | Same three. The planner was rewritten for a shop (shopper, `SHOP-*` IDs, localStorage). The generator lost its Odoo/HR lines. The healer is unchanged |
| skill `uapp-test-authoring` | skill `demo-test-authoring` (short version) |
| `qa-automation/CLAUDE.md` | `qa-automation/CLAUDE.md`: the working guide, with commands, prompts, rules and layout. **Read it first** |
| `/api/` filter in fixtures | Every fetch/XHR (`isAppCall` in `fixtures/traffic.ts`), because there is no API |
| `api/` precondition helpers | `api/client.ts`, empty. Preconditions will be written to localStorage via `page.addInitScript` |
| `HRN-API-001` harness | Present and skipped, as in UAPP |
| smoke `evidence-capture` | `HRN-EVD-001`: session valid, `api` fixture wired, no page errors. It does not demand an API call |
| Case IDs `EMP-SET-*`, `ATT-*`, `LM-*` | `SHOP-AUTH-*`, `SHOP-PRD-*`, `SHOP-CRT-*`. Defects use `@SHOP-BUG-<n>` |
| Module tags | `@auth`, `@products`, `@cart` |
| `tabs.config.mjs` | Three tabs: `auth/login`, `products/products`, `cart/cart`. Range 000–049 each, capped at 25 cases |

## State of the files

- Installed: `npm install` and `npx playwright install chromium` (Playwright 1.63.0, same lockfile as UAPP).
- `tsc` compiles clean. `--list` shows 4 tests: setup, `HRN-API-001` (skipped), seed, `HRN-EVD-001`.
- **Empty on purpose, to be filled by the agents:** `pages/products/products.page.ts`,
  `pages/cart/cart.page.ts`, `components/product-card.ts`, `api/client.ts`, all of `specs/*`,
  and `tests/{auth,products,cart}/`.
- **A guess, not verified:** `pages/auth/login.page.ts`. It assumes route `login`,
  `input[type=email]`, `input[type=password]` and a button matching "Log in / Sign in".
  `BASE_URL` ends with `/`, so page objects use relative paths (`'products'`, not `'/products'`).

## Not run yet

- `npm run auth` has never run. If it fails, that is a **test problem** (the locator guess):
  fix the page object, not the expectation.
- No browser has been driven against Demo Shop, so nothing was changed in the app.

## How Zainab works (same rules as UAPP, all apply here)

- **Ask before executing.** No command and no file change without her explicit approval,
  step by step.
- **Never do the agents' work by hand.** The planner explores, the generator writes tests,
  the healer fixes broken tests. If an agent is blocked, fix the blocker or stop and say so.
  Never narrow the scope without saying so.
- **Never drive the browser yourself to answer a question.** For a retest, give her the npm command.
- **Diagnose before healing.** Decide whether the test or the product is wrong before the
  healer touches anything. Never weaken an assertion.
- **The planner explores without changing state**: no form submits, no cart actions, no
  logout. Results it could not observe are marked for the generator to confirm.
- **Hard cap of 25 cases a tab.** Fewer is better; ID ranges are not targets. Logic gets its
  own cases, and every form option is used by some test.
- **Every report screenshot is ringed in red with a caption** (`annotatedShot` / `absenceShot`).
  She says this gets forgotten every time.
- **Cases she reports by hand** go in the plan under **Manual**, with an ID and an `@manual` tag.
- **One tab per session.** At the end, write `handoffs/<stamp>-<tab>.md` and tell her to open
  a new session.
- Reply in Egyptian Arabic, with technical terms in English.

## Open decisions (hers)

- Tab order. Suggested: Login → Products → Cart.

## Next step

1. Ask her to approve `cd qa-automation && npm run auth`.
2. If it fails on a locator, run the planner on the login screen first, then fix `login.page.ts`.
3. Run the planner on Products with the "map a whole module" prompt in `CLAUDE.md`. Save to
   `specs/products/products.plan.md`, then stop for her selection.
