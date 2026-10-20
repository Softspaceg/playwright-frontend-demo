import { type Locator } from '@playwright/test';

/**
 * One product tile on the Products screen. Test ids observed 19 Oct 2026.
 * The card has no button, link or tabindex today.
 */
export class ProductCard {
  constructor(private readonly root: Locator) {}

  get name(): Locator {
    return this.root.getByTestId('product-name');
  }

  get category(): Locator {
    return this.root.getByTestId('product-category');
  }

  get price(): Locator {
    return this.root.getByTestId('product-price');
  }

  /** The description has no test id; it is the card paragraph that is not the category or price. */
  get description(): Locator {
    return this.root
      .locator('p')
      .filter({ hasNot: this.root.getByTestId('product-category') })
      .filter({ hasNot: this.root.getByTestId('product-price') })
      .first();
  }

  async read(): Promise<{ name: string; category: string; price: string; description: string; nameTag: string }> {
    return {
      name: ((await this.name.textContent()) ?? '').trim(),
      category: ((await this.category.textContent()) ?? '').trim(),
      price: ((await this.price.textContent()) ?? '').trim(),
      description: ((await this.description.textContent()) ?? '').trim(),
      nameTag: await this.name.evaluate(el => el.tagName.toLowerCase()),
    };
  }
}
