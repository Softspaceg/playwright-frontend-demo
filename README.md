# playwright-frontend-demo

Live demo: https://softspaceg.github.io/playwright-frontend-demo/

A small demo React app (login, signup, product list) to use as a target for Playwright tests.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type check + production build
```

## Demo account

- Email: `demo@example.com`
- Password: `password123`

## How it works

- No backend. Users are stored in `localStorage` (`demo_users`) and the logged-in session in `demo_session`.
- Login and signup wait about 300ms to simulate a network call.
- Routes: `/login`, `/signup`, `/products` (requires login). Any other path redirects to `/products`.
- Key elements have `data-testid` attributes (e.g. `login-email`, `login-submit`, `form-error`, `product-card`, `product-search`, `category-filter`, `logout-button`).

## Test reports

Every pull request to `main` and every push to `main` runs two workflows. Each one publishes its report to the team dashboard at https://e2e-reports.uapp.ae/ (team login required):

| Workflow | Tests | Project on the dashboard |
|---|---|---|
| E2E Playwright | `e2e/` (smoke and regression) | `playwright-frontend-demo · E2E` |
| QA Automation | `qa-automation/` (Products tab team report) | `playwright-frontend-demo · QA` |

Choose the project in the dashboard's dropdown to see only its runs. The link to each run's report is also in the run summary on GitHub Actions.
