import { test, expect } from '../../fixtures/qa-fixtures';
import { KIND, PRIORITY, MODULE, tags, defect } from '../case-ids';
import { annotatedShot } from '../../fixtures/evidence';
import { ProductsPage } from '../../pages/products/products.page';

// spec: specs/products/products.plan.md
// seed: tests/seed.spec.ts

/** Catalogue observed 19 Oct 2026 (plan, "Catalogue observed"). Update with the plan if it changes. */
const CATALOGUE: Array<[string, string, string]> = [
  ['Wireless Headphones', 'Electronics', '$129.99'],
  ['Smart Watch', 'Electronics', '$199.00'],
  ['Bluetooth Speaker', 'Electronics', '$59.50'],
  ['Laptop Stand', 'Accessories', '$34.99'],
  ['Mechanical Keyboard', 'Accessories', '$89.00'],
  ['Coffee Mug', 'Home', '$12.00'],
  ['Desk Lamp', 'Home', '$42.25'],
  ['Indoor Plant', 'Home', '$24.99'],
  ['Running Shoes', 'Clothing', '$110.00'],
  ['Hoodie', 'Clothing', '$49.99'],
  ['Baseball Cap', 'Clothing', '$19.99'],
  ['Backpack', 'Accessories', '$74.00'],
];
const CATEGORIES = ['Accessories', 'Clothing', 'Electronics', 'Home'];

test.describe('Products', () => {
  test('SHOP-PRD-002 Every card shows a name, a category and a price',
    { tag: tags('SHOP-PRD-002', PRIORITY.critical, KIND.case, MODULE.products) },
    async ({ page }) => {
      const products = new ProductsPage(page);
      await products.open();

      for (const phase of ['first load', 'after reload']) {
        await test.step(`every card is complete: ${phase}`, async () => {
          const cards = await products.readAll();
          expect(cards.length).toBeGreaterThan(0);
          for (const c of cards) {
            expect(c.name, 'name').not.toBe('');
            expect(c.category, `category of ${c.name}`).not.toBe('');
            expect(c.price, `price of ${c.name}`).not.toBe('');
            expect(c.nameTag, `heading level of ${c.name}`).toBe('h2');
            expect(CATEGORIES, `category of ${c.name}`).toContain(c.category);
            for (const v of [c.name, c.category, c.price]) {
              expect(v).not.toMatch(/undefined|null|NaN/i);
            }
          }
        });
        if (phase === 'first load') await products.reload();
      }
    });

  test('SHOP-PRD-003 Every price is US dollars written $N.NN',
    { tag: tags('SHOP-PRD-003', PRIORITY.critical, KIND.case, MODULE.products) },
    async ({ page }) => {
      const products = new ProductsPage(page);
      await products.open();

      await test.step('every price matches $N.NN with no other currency', async () => {
        const cards = await products.readAll();
        expect(cards.length).toBeGreaterThan(0);
        for (const c of cards) {
          expect(c.price, `price of ${c.name}`).toMatch(/^\$\d+\.\d{2}$/);
          expect(c.price).not.toMatch(/EGP|£|€|,/);
        }
        // Whole amounts keep two decimals.
        const smartWatch = cards.find(c => c.name === 'Smart Watch');
        expect(smartWatch?.price).toBe('$199.00');
      });

      await test.step('format is unchanged by search and filter', async () => {
        await products.search('Smart Watch');
        await products.filterByCategory('Electronics');
        await expect(products.cards).toHaveCount(1);
        await expect(products.card(0).price).toHaveText('$199.00');
      });
    });

  test('SHOP-PRD-004 Every price is greater than zero',
    { tag: tags('SHOP-PRD-004', PRIORITY.critical, KIND.case, MODULE.products) },
    async ({ page }) => {
      const products = new ProductsPage(page);
      await products.open();

      const cards = await products.readAll();
      expect(cards.length).toBeGreaterThan(0);
      for (const c of cards) {
        const value = Number(c.price.replace('$', ''));
        expect(Number.isFinite(value), `price of ${c.name} is a number: "${c.price}"`).toBe(true);
        expect(value, `price of ${c.name}`).toBeGreaterThan(0);
      }
    });

  test('SHOP-PRD-005 Name, category and price of each product match the expected catalogue',
    { tag: tags('SHOP-PRD-005', PRIORITY.critical, KIND.case, MODULE.products) },
    async ({ page }) => {
      const products = new ProductsPage(page);
      await products.open();

      for (const phase of ['first load', 'after reload']) {
        await test.step(`catalogue matches: ${phase}`, async () => {
          const cards = await products.readAll();
          expect(cards.map(c => [c.name, c.category, c.price])).toEqual(CATALOGUE);
          for (const c of cards) expect(c.description, `description of ${c.name}`).not.toBe('');
          expect(cards.find(c => c.name === 'Coffee Mug')?.description).toBe('Ceramic mug, 350ml, dishwasher safe.');
          expect(new Set(cards.map(c => c.name)).size).toBe(cards.length);
        });
        if (phase === 'first load') await products.reload();
      }
    });

  test('SHOP-PRD-011 Search by name or category finds the product, ignores case and spaces, and updates the count',
    { tag: tags('SHOP-PRD-011', PRIORITY.high, KIND.case, MODULE.products, defect('1')) },
    async ({ page }) => {
      // Rule R4 (owner, 19 Oct 2026): search matches the product name or its category.
      // The live app matches the name only, so the 'Home' step is expected to fail. Do not weaken it.
      const products = new ProductsPage(page);
      await products.open();

      await test.step('search "lamp" finds only Desk Lamp', async () => {
        await products.search('lamp');
        await expect(products.cards).toHaveCount(1);
        expect(await products.visibleNames()).toEqual(['Desk Lamp']);
        await expect(products.card(0).price).toHaveText('$42.25');
        await expect(products.card(0).category).toHaveText('Home');
        await expect(products.count).toHaveText('Showing 1 of 12 products');
      });

      await test.step('case and surrounding spaces are ignored; "mug" finds Coffee Mug', async () => {
        for (const text of ['LAMP', '  lamp  ']) {
          await products.search(text);
          await expect(products.cards).toHaveCount(1);
          expect(await products.visibleNames()).toEqual(['Desk Lamp']);
        }
        await products.search('mug');
        await expect(products.cards).toHaveCount(1);
        expect(await products.visibleNames()).toEqual(['Coffee Mug']);
        await expect(products.card(0).price).toHaveText('$12.00');
        await expect(products.count).toHaveText('Showing 1 of 12 products');
      });

      await test.step('search "Home" (a category) shows the three Home products (rule R4)', async () => {
        await products.search('Home');
        // Let the list settle before reading what the app really shows.
        await expect(products.count).not.toHaveText('Showing 12 of 12 products');
        const names = await products.visibleNames();
        const countText = (await products.count.textContent())?.trim();
        const emptyShown = await products.emptyMessage.isVisible();

        if (names.length !== 3 || emptyShown || countText !== 'Showing 3 of 12 products') {
          // Evidence of the deviation from R4, ringed in red.
          await annotatedShot(
            page,
            emptyShown ? products.emptyMessage : products.count,
            `SHOP-BUG-1: searching "Home" (a category) should show Coffee Mug, Desk Lamp and Indoor Plant with ` +
              `"Showing 3 of 12 products" (rule R4). The app showed ${names.length} cards, ` +
              `empty message visible: ${emptyShown}, count line: "${countText}". Search matches the name only.`,
          );
        }

        expect.soft([...names].sort(), 'Home products shown').toEqual(['Coffee Mug', 'Desk Lamp', 'Indoor Plant']);
        expect.soft(await products.visibleCategories(), 'every card is Home').toEqual(['Home', 'Home', 'Home']);
        expect.soft(countText, 'count line').toBe('Showing 3 of 12 products');
        expect.soft(emptyShown, '"No products found" must not show').toBe(false);
      });

      await test.step('search "Home" with category Home, then All categories, gives no stale result', async () => {
        await products.filterByCategory('Home');
        await expect.soft(products.count, 'search Home + category Home').toHaveText('Showing 3 of 12 products');
        await products.filterByCategory('All categories');
        await expect.soft(products.count, 'search Home + All categories').toHaveText('Showing 3 of 12 products');
      });

      await test.step('clearing the box brings back all 12 and stores nothing', async () => {
        await products.search('');
        await expect(products.cards).toHaveCount(12);
        await expect(products.count).toHaveText('Showing 12 of 12 products');
        expect(await products.storageKeys()).toEqual(['demo_session']);
      });
    });

  test('SHOP-PRD-012 Search with no match shows the empty state',
    { tag: tags('SHOP-PRD-012', PRIORITY.high, KIND.case, MODULE.products) },
    async ({ page }) => {
      const products = new ProductsPage(page);
      await products.open();

      await test.step('"zzzz" shows the empty state', async () => {
        await products.search('zzzz');
        await expect(products.cards).toHaveCount(0);
        await expect(products.emptyMessage).toHaveText('No products found');
        await expect(products.count).toHaveText('Showing 0 of 12 products');
      });

      await test.step('clearing the box restores the list', async () => {
        await products.search('');
        await expect(products.cards).toHaveCount(12);
        await expect(products.count).toHaveText('Showing 12 of 12 products');
        await expect(products.emptyMessage).toHaveCount(0);
      });
    });

  test('SHOP-PRD-014 Category filter shows only that category (each option used)',
    { tag: tags('SHOP-PRD-014', PRIORITY.high, KIND.case, MODULE.products) },
    async ({ page }) => {
      const products = new ProductsPage(page);
      await products.open();

      await test.step('options are in the expected order', async () => {
        expect(await products.categoryOptions()).toEqual(['All categories', ...CATEGORIES]);
      });

      // Every option the select offers, in the plan's order, ending on All categories.
      for (const option of [...CATEGORIES, 'All categories']) {
        await test.step(`choose ${option}`, async () => {
          await products.filterByCategory(option);
          const expected = option === 'All categories'
            ? CATALOGUE.map(r => r[0])
            : CATALOGUE.filter(r => r[1] === option).map(r => r[0]);
          await expect(products.cards).toHaveCount(expected.length);
          expect(await products.visibleNames()).toEqual(expected);
          if (option !== 'All categories') {
            expect(new Set(await products.visibleCategories())).toEqual(new Set([option]));
          }
          await expect(products.count).toHaveText(`Showing ${expected.length} of 12 products`);
        });
      }
    });
});
