import { type Page } from '@playwright/test';

/**
 * Cart screen.
 *
 * Empty on purpose: the route and controls are filled in once the planner has explored
 * the cart. Screen knowledge lives here, never inline in a test.
 */
export class CartPage {
  constructor(private readonly page: Page) {}
}
