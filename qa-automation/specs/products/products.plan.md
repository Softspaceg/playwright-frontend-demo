# Demo Shop — Products Test Plan (SHOP-PRD-001 to SHOP-PRD-023)

## Application Overview


## Changes made to the environment
None. I only navigated, typed into the search box, changed the category select, reloaded, clicked one product card (nothing happened) and read localStorage. Search and category were reset to empty and "All categories" afterwards. localStorage was identical before and after: only `demo_session`. No form was submitted and no one was logged out. Revision of 19 Oct 2026 (owner's answer on search): I re-opened /products, typed "Home" in the search box, read the count line and cards, then cleared the box. No other change.

## What the module is (observed 19 Oct 2026)
- Real address: https://softspaceg.github.io/playwright-frontend-demo/products. CLAUDE.md says `/playwright-templates/`. The login setup landed on `/playwright-frontend-demo/`. Check `BASE_URL` in `.env`.
- The session was already logged in as demo@example.com (saved session). Every route I tried (`/cart`, `/login`, `/products/1`, `/nope`, `/`) ended on `/products`.
- GitHub Pages answers a direct load or reload of `/products` with HTTP 404 and the app still renders (SPA fallback). The console shows "Failed to load resource: 404" for `/products` and `/favicon.ico`. This is expected hosting noise: the generator must not treat these console errors as failures without deciding.
- Screen contents: header ("Demo Shop", `user-email`, `logout-button` "Log out"); `<h1>` "Products"; search box (placeholder "Search products…", aria-label "Search products"); category select (aria-label "Filter by category", options All categories / Accessories / Clothing / Electronics / Home); count line "Showing N of 12 products"; list of 12 cards.
- Each card has: emoji icon (aria-hidden), category, name (h2), description, price. No button, no link, no tabindex.
- Test ids: `user-email`, `logout-button`, `product-search`, `category-filter`, `product-count`, `product-list`, `product-card`, `product-category`, `product-name`, `product-price`.
- NOT on the screen: no Add to cart button, no cart link or badge, no quantity control, no sort control, no product detail page. Clicking a card does nothing visible (URL and storage unchanged).

## Where state is kept
- localStorage `demo_session` = `{"name":"Demo User","email":"demo@example.com"}`. sessionStorage empty. No cookies. No fetch/XHR app calls were seen: the catalogue is not loaded from an API.
- No `cart` key exists today. Any test that needs a cart key is a recorded gap until the Cart tab confirms the key name.
- Search text and category are NOT kept after a reload (observed: after reload the box was empty and the select was "all").

## Catalogue observed (12 products; `Needs` lines refer to this table)
| Name | Category | Price |
|---|---|---|
| Wireless Headphones | Electronics | $129.99 |
| Smart Watch | Electronics | $199.00 |
| Bluetooth Speaker | Electronics | $59.50 |
| Laptop Stand | Accessories | $34.99 |
| Mechanical Keyboard | Accessories | $89.00 |
| Coffee Mug | Home | $12.00 |
| Desk Lamp | Home | $42.25 |
| Indoor Plant | Home | $24.99 |
| Running Shoes | Clothing | $110.00 |
| Hoodie | Clothing | $49.99 |
| Baseball Cap | Clothing | $19.99 |
| Backpack | Accessories | $74.00 |

## Owner's confirmed rules (asserted)
R1 every card shows name, category and price. R2 every price is US dollars written `$N.NN`, never EGP or another currency. R3 every price is greater than zero. On the 12 products observed, all three hold. The cases below are written so they keep checking as products change.
R4 (answered by the owner on 19 Oct 2026) Search matches the product name or its category. Searching "Home" shows the Home products. Asserted in SHOP-PRD-011. The live app does NOT follow R4 today (see Observations), so SHOP-PRD-011 is expected to fail until the app is fixed; the expected result was not changed to match the app.

## Case priority summary
critical 6 (001, 002, 003, 004, 005, 007), high 11 (006, 008, 009, 010, 011, 012, 014, 015, 017, 019, 021), medium 6 (013, 016, 018, 020, 022, 023). Total 23. Unchanged by this revision.

## Standard case matrix check
Create (add to cart): 007, NOT AVAILABLE. Read: 001-006. Edit (quantity): 009, NOT AVAILABLE. Delete (remove/clear): 010, NOT AVAILABLE; logout 021 not observed. Search: 011-013. Filter and sort: 014, 015, 016 (no sort exists). Validation: 013 (no form validation exists on this screen). Empty state: 012. Persistence after reload: 017 (plus a reload step in 001, 005, 007, 009, 010). Permissions (logged out): 019, not observed.

## Button / control checklist
- Log out button: 020 (visible), 021 (action not observed).
- Search box: 011, 012, 013, 015, 023.
- Category select (5 options): 014, 015, 023.
- Product card (x12): 002-006. Card has no button.
- Add to cart / quantity / remove / clear / sort: do not exist, 007, 009, 010, 016 record the gap.
- Cart link or badge: does not exist, 008.

## Questions for Product (no assertions made)
1. Where is Add to cart? The brief says there is a cart but the Products screen has no add control and no cart link. Is it missing, or planned? A typical shop has an Add to cart button on each card and a cart badge in the header.
2. Should a card open a product detail view? Today clicking does nothing. A typical shop opens a detail page.
3. Should there be a sort (price low to high, name)? Absent today. Typical shops offer one.
4. ANSWERED on 19 Oct 2026 and moved out of this list: see "Answered by Product" below. The number is kept so other references do not shift.
5. Should search/category survive a reload or be in the URL? Today they reset. Typical shops put them in the URL so they can be shared.
6. Should logging out show a confirmation? Typical shops do not, but the team's rules treat logout as destructive.
7. What happens to a cart on logout and login (kept or cleared)? Cannot be tested until a cart exists.
8. Should a logged-out visitor see the products at all? Not observed.
9. Is the "of 12" in "Showing N of 12 products" the total catalogue or the total after the category filter? Observed: it stays 12 under any filter (e.g. "Showing 3 of 12 products" for Home).
10. (New, follows from the owner's answer.) The owner's rule covers name and category only. Should search also match the description? Observed today: "battery" (a word in a description) gives 0 results. A typical shop searches name, category and description. No assertion made.

## Answered by Product
- Former Question 4, answered by the owner on 19 Oct 2026: search matches the product name or its category; searching "Home" shows the Home products. Now rule R4, asserted in SHOP-PRD-011.

## Recommendations (opinion, not assertions)
- Add stable test ids to the logout confirmation, the add button and the cart badge when they exist. Cost of doing nothing: tests fall back to fragile text locators.
- Serve a real `404.html`/hash routing so a reload does not return HTTP 404 and put red errors in the console. Cost: monitoring tools and crawlers see every deep link as broken.
- Put the search and category in the URL query string. Cost of doing nothing: a shopper loses their filter on every reload.
- Show a clear-search hint on "No products found". Cost: dead end for the shopper.
- Fix search so it also matches the category (rule R4). Cost of doing nothing: a shopper typing a category such as "Home" is told "No products found" although three Home products exist, and may leave the shop.

## Observations (cosmetic or low value, not cases)
- DEVIATION FROM RULE R4 (observed 19 Oct 2026): typing "Home" in Search products shows no cards, the message "No products found" and the count line "Showing 0 of 12 products". The owner's rule says the 3 Home products (Coffee Mug, Desk Lamp, Indoor Plant) and "Showing 3 of 12 products". The app matches the name only. This is recorded as a defect candidate for SHOP-PRD-011; the expected result there was not changed.
- The icons are emoji, not images; they are marked aria-hidden.
- Search is trimmed and case-insensitive (observed "  lamp  " and "LAMP" both find Desk Lamp).
- Search with `$`, `<b>x</b>`, `.*` gave "No products found" and no script ran.
- Product order on screen is by data order, not by category or price.
- The favicon request returns 404.

## What blocks testing
- No Add to cart, quantity, remove, clear, cart badge, cart page link, sort or detail view exists: 006-010 and 016 cannot assert a result. They are written and keep their IDs as recorded gaps.
- Logged-out behaviour could not be observed: I may not log out, and a second browser context I opened still showed the logged-in user (it appears to inherit the saved session). The generator must clear `demo_session` via an init script and confirm. (019, 021)
- A second account is NOT AVAILABLE. Not needed for this tab.
- The base URL in CLAUDE.md differs from the live address (see above).

## Conventions used in the cases
Every case gives: ID, priority, "If this breaks", Needs, steps, expected on-screen result, storage/network change, survives reload. Storage is localStorage; no network call is expected for any case (static data, no fetch/XHR seen). Where a result was not observed it says "Not observed — the generator confirms".


## Test Scenarios

### 1. Products

**Seed:** `tests/seed.spec.ts`

#### 1.1. SHOP-PRD-001 [critical] Products screen lists the full catalogue

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot see what is for sale, so cannot start shopping. Needs: a logged-in session (saved by auth setup) — OK. Network: none expected. Survives reload: yes.
    - expect: Plan only
  2. Open the products route as the logged-in demo user. Read the heading, the count line and the cards.
    - expect: Heading 'Products' (level 1) is visible
    - expect: Count line reads exactly 'Showing 12 of 12 products'
    - expect: 12 elements with test id product-card are in product-list
    - expect: Search box is empty and the category select shows 'All categories'
  3. Reload the page and read the same items again.
    - expect: Same 12 cards and the same count line
    - expect: localStorage unchanged: only key demo_session = {"name":"Demo User","email":"demo@example.com"}

#### 1.2. SHOP-PRD-002 [critical] Every card shows a name, a category and a price

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot tell what a product is or what it costs. Owner rule R1. Needs: any product list — OK. Storage: none. Survives reload: yes.
    - expect: Plan only
  2. For each product-card, read product-name, product-category and product-price.
    - expect: All three are present and non-empty on every card
    - expect: Name is an h2; category is one of Accessories, Clothing, Electronics, Home
    - expect: No card shows a placeholder such as undefined, null, NaN or an empty price
  3. Reload and repeat the check.
    - expect: Same result

#### 1.3. SHOP-PRD-003 [critical] Every price is US dollars written $N.NN

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper is shown the wrong currency or an unreadable price and cannot trust the total. Owner rule R2. Needs: any product list — OK. Storage: none. Survives reload: yes.
    - expect: Plan only
  2. Read product-price on every card.
    - expect: Each text matches the pattern ^\$\d+\.\d{2}$ (observed: $129.99, $199.00, $59.50, $12.00)
    - expect: Prices with whole amounts still show two decimals ($199.00, not $199)
    - expect: No text contains EGP, £, €, a comma thousands mark or any other currency code or symbol
  3. Search 'Smart Watch' and filter by Electronics, then read the price again.
    - expect: Price still reads $199.00; format is unchanged by search or filter

#### 1.4. SHOP-PRD-004 [critical] Every price is greater than zero

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper could get a product free or see a negative total. Owner rule R3. Needs: any product list — OK. Storage: none. Survives reload: yes.
    - expect: Plan only
  2. Parse each product-price as a number (remove the $ sign).
    - expect: Every value is greater than 0 (lowest observed: $12.00 Coffee Mug)
    - expect: No price is $0.00, empty or negative

#### 1.5. SHOP-PRD-005 [critical] Name, category and price of each product match the expected catalogue

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper is charged the wrong price or sees the wrong item. Needs: the catalogue table in the overview — OK (data observed 19 Oct 2026; update the table if the catalogue changes). Storage: none. Survives reload: yes.
    - expect: Plan only
  2. Read all 12 cards and compare with the catalogue table.
    - expect: Each name, category and price equals its row: e.g. Wireless Headphones / Electronics / $129.99, Desk Lamp / Home / $42.25, Backpack / Accessories / $74.00
    - expect: Each description is non-empty (e.g. Coffee Mug: 'Ceramic mug, 350ml, dishwasher safe.')
    - expect: No duplicate names
  3. Reload and compare again.
    - expect: Identical data

#### 1.6. SHOP-PRD-006 [high] Opening a product (click a card)

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot see more about a product before buying. Needs: any product — OK. Storage: expected none. Survives reload: not applicable. RECORDED GAP: no detail page exists today (Question 2). Blocked: No product detail view in the app — question for Product.
    - expect: Plan only
  2. Click the first card (Wireless Headphones). Also tab through the page and check whether any card can take focus.
    - expect: Observed on 19 Oct 2026: URL stays on products, no dialog or detail view opens, localStorage unchanged, cards are not focusable
    - expect: No assertion of what SHOULD happen: pending Question 2. If a detail view is added, it must show the same name, category and price as the card (to be confirmed by the generator)

#### 1.7. SHOP-PRD-007 [critical] Add a product to the cart and see it after a reload

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot buy anything. Needs: an empty cart — arrange by clearing the cart key once its name is known (key NOT KNOWN today). Add to cart control — NOT AVAILABLE on the screen. Survives reload: must be checked once the control exists. Blocked: No add-to-cart control in the app — question for Product.
    - expect: Plan only
  2. Look on a card for an Add to cart button.
    - expect: No button, link or control exists on any of the 12 cards (observed)
    - expect: Result of adding: Not observed — the generator confirms (message, cart storage key, value, badge)
  3. Once available: add Coffee Mug ($12.00) twice and add Desk Lamp, reload.
    - expect: Not observed — the generator confirms: quantity of Coffee Mug is 2, not two lines or a replaced item; line total and cart total equal the card prices; items still present after reload

#### 1.8. SHOP-PRD-008 [high] Cart badge or link is visible and updates without reload

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot see or reach what they have chosen. Needs: a cart link in the header — NOT AVAILABLE. Survives reload: the count must match the cart contents. Blocked: No cart badge or link in the app — question for Product.
    - expect: Plan only
  2. Inspect the header and the whole Products screen for a cart link or count badge.
    - expect: Only the user email and 'Log out' are in the header (observed); no cart control
    - expect: Badge count after add/remove: Not observed — the generator confirms (must equal the number of items in the cart storage)

#### 1.9. SHOP-PRD-009 [high] Change the quantity of an item; everything else in the cart is unchanged

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot fix a quantity or sees a wrong total. Needs: a cart with at least two products, e.g. Coffee Mug and Desk Lamp — NOT AVAILABLE (no add control, no quantity control on Products). Likely belongs to the Cart tab: cross-reference SHOP-CRT. Blocked: No cart or quantity control in the app — question for Product.
    - expect: Plan only
  2. Look for any quantity control on the Products screen.
    - expect: None exists (observed)
    - expect: Behaviour of quantity 0, a negative number, a decimal or a very large number, the new line and cart totals, and that the other lines are untouched: Not observed — the generator confirms. Maximum quantity and rounding are Questions for Product, not assertions

#### 1.10. SHOP-PRD-010 [high] Remove an item and clear the cart (confirm / Cancel / Confirm)

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot undo a mistake. Needs: a cart with items — NOT AVAILABLE. Survives reload: removal must persist. Blocked: No cart, remove or clear in the app — question for Product.
    - expect: Plan only
  2. Look for Remove or Clear cart controls on the Products screen.
    - expect: None exists (observed)
    - expect: Confirmation text, Cancel leaving the cart unchanged, Confirm removing the item, the total and badge updating without reload: Not observed — the generator confirms

#### 1.11. SHOP-PRD-011 [high] Search by name or category finds the product, ignores case and spaces, and updates the count

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot find a product by name or by its category. Owner rule R4 (answered 19 Oct 2026): search matches the product name or its category. Needs: any product list with products in the Home category — OK (Coffee Mug, Desk Lamp, Indoor Plant). Storage: none. Survives reload: the product list yes, the search text no (observed; see Question 5). KNOWN DEVIATION: the live app matches the name only, so steps 5 and 6 are expected to fail today (see Observations). Do not weaken them.
    - expect: Plan only
  2. Type 'lamp' in the box labelled 'Search products' (placeholder 'Search products…').
    - expect: Only Desk Lamp ($42.25, Home) is shown
    - expect: Count line updates without reload to 'Showing 1 of 12 products'
  3. Replace the text with 'LAMP', then with '  lamp  ', then with 'mug'.
    - expect: 'LAMP' and '  lamp  ' still show only Desk Lamp
    - expect: 'mug' shows only Coffee Mug ($12.00) and 'Showing 1 of 12 products'
  4. Replace the text with 'Home' (a category name; no product name contains it).
    - expect: Exactly the three Home products are shown: Coffee Mug, Desk Lamp, Indoor Plant
    - expect: Every visible card's category is Home; no Accessories, Clothing or Electronics card is shown
    - expect: Count line updates without reload to exactly 'Showing 3 of 12 products'
    - expect: 'No products found' is NOT shown
    - expect: Observed today (19 Oct 2026): 0 cards, 'No products found', 'Showing 0 of 12 products'. This differs from the rule and is recorded under Observations; the expected result above is not changed
  5. Replace the text with 'Home' and choose the category 'Home' in the select; then set the select back to All categories.
    - expect: With category Home and search 'Home': the same 3 Home products and 'Showing 3 of 12 products' (Not observed — the generator confirms)
    - expect: After All categories with search 'Home': 'Showing 3 of 12 products' again, no stale result
  6. Clear the box.
    - expect: All 12 cards return and the count reads 'Showing 12 of 12 products'
    - expect: localStorage unchanged: only demo_session

#### 1.12. SHOP-PRD-012 [high] Search with no match shows the empty state

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper sees a blank screen and does not know why. Needs: any product list — OK. Storage: none. Survives reload: not applicable. Note (19 Oct 2026): checked against rule R4; 'zzzz' matches neither a product name nor a category, so the expected result is unchanged. Do not use a category word (for example 'Home') as the no-match text: under R4 it returns products.
    - expect: Plan only
  2. Type 'zzzz' in Search products.
    - expect: No cards are shown
    - expect: Message text reads exactly 'No products found'
    - expect: Count line reads 'Showing 0 of 12 products'
  3. Assess the message.
    - expect: Message is clear but offers no next step (see Recommendations). Report as an observation, not a defect
  4. Clear the box.
    - expect: 12 cards return, count 'Showing 12 of 12 products', message gone

#### 1.13. SHOP-PRD-013 [medium] Search treats special characters as plain text

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper typing symbols gets an error or odd results. Needs: any product list — OK. Storage: none. Survives reload: not applicable.
    - expect: Plan only
  2. Search each of: '$', '<b>x</b>', '.*', '%', and a very long string (300 characters).
    - expect: Observed for '$', '<b>x</b>' and '.*': 'No products found' and 'Showing 0 of 12 products'; no script runs, no console page error, no crash
    - expect: '%' and the long string: Not observed — the generator confirms (expect the same empty state)
    - expect: 'Home' (a category) is NOT a special-character case: its expected result is asserted in SHOP-PRD-011 (rule R4). 'battery' (a description word) gives 0 results today; whether it should match is Question 10, so do not assert

#### 1.14. SHOP-PRD-014 [high] Category filter shows only that category (each option used)

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot narrow the list. Needs: products in all four categories — OK. Storage: none. Survives reload: the filter itself no (observed).
    - expect: Plan only
  2. Open the select labelled 'Filter by category' and read its options.
    - expect: Options in order: All categories, Accessories, Clothing, Electronics, Home
  3. Choose Accessories, then Clothing, then Electronics, then Home, then All categories. After each, read the cards and the count line.
    - expect: Accessories: Laptop Stand, Mechanical Keyboard, Backpack, 'Showing 3 of 12 products'
    - expect: Clothing: Running Shoes, Hoodie, Baseball Cap, 'Showing 3 of 12 products'
    - expect: Electronics: Wireless Headphones, Smart Watch, Bluetooth Speaker, 'Showing 3 of 12 products'
    - expect: Home: Coffee Mug, Desk Lamp, Indoor Plant, 'Showing 3 of 12 products'
    - expect: All categories: 12 cards, 'Showing 12 of 12 products'
    - expect: Every visible card's category equals the chosen option; counts update without reload

#### 1.15. SHOP-PRD-015 [high] Search and category work together and reset correctly

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper gets wrong or stale results when combining filters. Needs: any product list — OK. Storage: none. Survives reload: no. Note (19 Oct 2026): checked against rule R4; 'lamp' and 'watch' match neither the category 'Home' nor any Home product, so the expected results are unchanged.
    - expect: Plan only
  2. Choose Home, then type 'lamp'.
    - expect: Only Desk Lamp; 'Showing 1 of 12 products'
  3. Change the search to 'watch' (Watch is Electronics) with Home still chosen.
    - expect: No cards; 'No products found'; 'Showing 0 of 12 products'
  4. Clear the search, then set the category back to All categories.
    - expect: After clearing search: the 3 Home products; after All categories: all 12 products

#### 1.16. SHOP-PRD-016 [medium] Sort — no sort control exists

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot order products by price or name. Needs: a sort control — NOT AVAILABLE. Survives reload: unknown. Recorded gap (Question 3). Blocked: No sort control in the app — question for Product.
    - expect: Plan only
  2. Look for a sort control next to the search box and select.
    - expect: None exists (observed). Only search and category are in the toolbar
    - expect: Sort orders and results: Not observed — the generator confirms if a control is added

#### 1.17. SHOP-PRD-017 [high] The list survives a reload; search and category do not

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper sees an empty or wrong list after refreshing. Needs: any product list — OK. Storage: only demo_session. Survives reload: tested here.
    - expect: Plan only
  2. Choose Clothing and type 'cap' ('Showing 1 of 12 products'). Reload the page.
    - expect: The page renders (the server returns HTTP 404 for the path and the app still loads: hosting behaviour, see overview)
    - expect: Observed: search box empty, select 'All categories', 'Showing 12 of 12 products'
    - expect: Whether filters SHOULD persist is Question 5: do not assert that they reset or that they persist beyond recording what was observed
  3. Check localStorage.
    - expect: demo_session still present and unchanged; the user email is still shown in the header; still logged in

#### 1.18. SHOP-PRD-018 [medium] Browsing does not write anything to storage

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: browsing could silently alter the session or cart. Needs: any product list — OK. Survives reload: yes.
    - expect: Plan only
  2. Read localStorage and sessionStorage. Search, filter, click a card, read both again.
    - expect: localStorage has exactly one key, demo_session = {"name":"Demo User","email":"demo@example.com"}, before and after
    - expect: sessionStorage is empty; no cookies; no fetch/XHR app calls (the generator's API report stays empty)
    - expect: No cart key is created by browsing

#### 1.19. SHOP-PRD-019 [high] Logged-out visitor cannot use the Products screen

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper without an account sees shop data, or a logged-in shopper is bounced. Needs: a logged-out state — arrange by removing localStorage key demo_session with an init script before the page loads (do not use the Log out button). Survives reload: yes.
    - expect: Plan only
  2. With demo_session absent, open the products route and reload.
    - expect: Not observed — the generator confirms: whether the visitor is redirected to a login page, what message shows, and that no product cards or user email are shown. Whether anonymous browsing is allowed is Question 8: do not assert
  3. With demo_session removed, open the cart, login and an unknown route.
    - expect: Not observed — the generator confirms. (While logged in every one of these ends on products, observed)

#### 1.20. SHOP-PRD-020 [medium] Header shows who is logged in and offers Log out

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot tell which account they are using or find how to leave. Needs: the demo account — OK. Storage: none. Survives reload: yes.
    - expect: Plan only
  2. Read the header.
    - expect: Shows '🛍️ Demo Shop', then the email text from test id user-email equal to 'demo@example.com' (equal to demo_session.email), then a button 'Log out' (test id logout-button)
  3. Reload.
    - expect: Same email and button still shown

#### 1.21. SHOP-PRD-021 [high] Log out: confirmation, Cancel changes nothing, Confirm logs out

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper cannot leave safely, or loses data by accident. Needs: a disposable logged-in session — OK. Survives reload: yes. I did NOT press Log out (destructive).
    - expect: Plan only
  2. Click 'Log out'.
    - expect: Whether a confirmation dialog appears and its exact text: Not observed — the generator confirms (Question 6)
  3. If a confirmation appears, choose Cancel.
    - expect: Not observed — the generator confirms: nothing changes, demo_session remains, products still shown
  4. Click 'Log out' again and confirm.
    - expect: Not observed — the generator confirms: destination page, demo_session removed from localStorage, and still logged out after a reload. What happens to a cart is Question 7: do not assert

#### 1.22. SHOP-PRD-022 [medium] Direct link, reload and unknown routes land on the product list

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper with a bookmark or refresh lands on a broken page. Needs: logged-in session — OK. Storage: none. Survives reload: yes.
    - expect: Plan only
  2. Open the products route directly, then /cart, /login, /products/1 and /nope.
    - expect: Observed: the app renders and ends on the products route each time with the 12 products
    - expect: Network shows HTTP 404 for the path on direct load (GitHub Pages SPA fallback) and a 404 for /favicon.ico: record as observation; do not assert 200

#### 1.23. SHOP-PRD-023 [medium] Controls have accessible names

**File:** `tests/products/products.spec.ts`

**Steps:**
  1. Case meta. If this breaks: a shopper using a screen reader or keyboard cannot use search or the filter. Needs: any product list — OK. Storage: none. Survives reload: yes.
    - expect: Plan only
  2. Find the controls by role and name.
    - expect: Searchbox named 'Search products'; combobox named 'Filter by category'; button named 'Log out'; one heading level 1 'Products'; each product name is a level 2 heading
  3. Use the keyboard: Tab through the page, type in the search box, change the select with the arrow keys.
    - expect: Search and filter work with the keyboard and the count line updates; the cards take no focus (observed)
