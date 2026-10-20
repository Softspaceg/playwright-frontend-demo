import { type Locator, type Page } from '@playwright/test';

/**
 * Login screen.
 *
 * The locators below are a first guess written before exploration. The planner records the
 * real labels and route; the generator or healer corrects them here — in the page object,
 * never inline in a test.
 */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    // Relative to BASE_URL (which ends in /playwright-templates/).
    await this.page.goto('login');
  }

  get email(): Locator {
    return this.page.locator('input[type="email"], input[name="email"]').first();
  }
  get password(): Locator {
    return this.page.locator('input[type="password"]').first();
  }
  get submit(): Locator {
    return this.page.getByRole('button', { name: /log ?in|sign ?in/i }).first();
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
