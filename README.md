# playwright-templates

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
