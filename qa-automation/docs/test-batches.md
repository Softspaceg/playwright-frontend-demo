# Test batches — how cases move from plan to suite

Part of the architecture this project demonstrates (planner → selection → generator → run → CI).

## The idea

The planner maps a whole module and gives every scenario an ID and a priority. Nothing is
automated at that point. The owner then picks a **batch** of IDs, the generator writes tests
for exactly those, and they are run and reviewed before the next batch starts.

Why batches:

- A small batch is reviewed properly; thirty tests at once are not.
- Criticals go green first, so a failure in a later batch is never hidden behind a broken base.
- Every case not yet selected stays in the plan as a recorded gap, and `npm run coverage`
  shows it, so nothing is silently dropped.

## The rule

1. Batch 1: the `critical` cases.
2. Batch 2: `high` cases, only after batch 1 passes.
3. `medium` waits.
4. A batch stays around eight cases or fewer.
5. Recorded gaps (features the app does not have) are not automated until Product answers.

## One case held back for CI

One critical case is kept out of the local batches on purpose. Once the suite runs in
GitHub Actions, it is added in its own commit, so the whole CI cycle can be watched on a
single change: push → workflow runs → report → pass or fail.

## Products tab (`specs/products/products.plan.md`)

| Batch | Cases | Status |
|---|---|---|
| 1 — critical | SHOP-PRD-002, 003, 004, 005 | Next |
| 2 — high | SHOP-PRD-014, 011, 012 | After batch 1 passes |
| Held for CI | SHOP-PRD-001 (full catalogue is listed) | Added when CI is wired |
| Not automated — recorded gaps | SHOP-PRD-006 to 010, 016 (no product page, cart or sort in the app) | Waiting on Product |
| Later | the remaining high and medium cases | Owner's choice |
