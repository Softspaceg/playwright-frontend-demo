import { type Locator, type Page } from '@playwright/test';
import { ProductCard } from '../../components/product-card';

export type CardData = { name: string; category: string; price: string; description: string; nameTag: string };

/** Products list (/products). Test ids observed 19 Oct 2026. */
export class ProductsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('products');
    await this.heading.waitFor();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.heading.waitFor();
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Products' });
  }

  get searchBox(): Locator {
    return this.page.getByTestId('product-search');
  }

  get categoryFilter(): Locator {
    return this.page.getByTestId('category-filter');
  }

  get count(): Locator {
    return this.page.getByTestId('product-count');
  }

  get cards(): Locator {
    return this.page.getByTestId('product-list').getByTestId('product-card');
  }

  /** Empty-state message shown when nothing matches. No test id; found by its text. */
  get emptyMessage(): Locator {
    return this.page.getByText('No products found', { exact: true });
  }

  /** Option labels of the category select, in order. */
  async categoryOptions(): Promise<string[]> {
    return (await this.categoryFilter.locator('option').allTextContents()).map(t => t.trim());
  }

  /** Names of the cards currently shown. */
  async visibleNames(): Promise<string[]> {
    return (await this.cards.getByTestId('product-name').allTextContents()).map(t => t.trim());
  }

  /** Categories of the cards currently shown. */
  async visibleCategories(): Promise<string[]> {
    return (await this.cards.getByTestId('product-category').allTextContents()).map(t => t.trim());
  }

  /** localStorage keys, to prove a read-only action stored nothing. */
  async storageKeys(): Promise<string[]> {
    return this.page.evaluate(() => Object.keys(localStorage).sort());
  }

  card(index: number): ProductCard {
    return new ProductCard(this.cards.nth(index));
  }

  async search(text: string): Promise<void> {
    await this.searchBox.fill(text);
  }

  async filterByCategory(label: string): Promise<void> {
    await this.categoryFilter.selectOption({ label });
  }

  /** Reads every card once the list has settled. */
  async readAll(): Promise<CardData[]> {
    await this.cards.first().waitFor();
    const n = await this.cards.count();
    const out: CardData[] = [];
    for (let i = 0; i < n; i++) out.push(await this.card(i).read());
    return out;
  }
}
