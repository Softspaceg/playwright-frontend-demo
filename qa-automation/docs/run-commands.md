# Run commands — in the order you use them

Run everything from `qa-automation/`. If the terminal is already there, do not `cd` again.

## 1. Once per session, before a tab

```cmd
npm run auth
```
Logs in and saves the session. Expect `1 passed` and `Landed on: .../products`.

```cmd
npx playwright test --project=harness
```
Checks the automation itself. Expect `3 passed, 1 skipped` (`HRN-API-001` is skipped on purpose).

## 2. After the generator writes a batch

```cmd
npm run tab -- products/products
```
Runs one tab headed, then writes the developer summary, the coverage for that tab and the
case list. Each run is kept in `reports/runs/<date>_<time>_<tab>/`.

```cmd
npm run report
```
Opens Playwright's own HTML report for the last run (traces, screenshots, steps). This is
the debugging view, not the report the team reads.

## 3. Whole suite

```cmd
npm run summary
npm run coverage
```
Run `summary` first: `coverage` reads its results.

## 4. Selections

```cmd
npx playwright test --grep "@critical"
npx playwright test --grep "@products"
npx playwright test --grep "@SHOP-PRD-003"
npx playwright test --grep "@SHOP-BUG-12"
```

## 5. The team report (custom template)

Not a run command. At the end of a tab the report is written from
`reports/_template/report-template.html`, from the numbers of the kept run, then built
into one folder you can hand over:

```cmd
node scripts/build-report.mjs <filled.html> reports/<module>/<tab>-v<N> --evidence <evidence-dir>
```

Earlier versions are never overwritten. See `reports/_template/README.md`.
