import { test, expect } from '../../fixtures/qa-fixtures';
import { KIND, PRIORITY, tags } from '../case-ids';

/**
 * Health check for the evidence pipeline itself, not for any Demo Shop feature.
 *
 * On UAPP this asserts that /api/ calls are recorded. Demo Shop is static and may make no
 * fetch/XHR at all, so it cannot demand a call. What it proves instead: the saved session
 * still works, the `api` fixture is wired, and the page does not throw in the console.
 * The HAR itself is checked by the fixture at teardown (EVIDENCE WARNING if missing).
 */
test.describe('QA harness', () => {
  test('HRN-EVD-001 the session and the evidence pipeline work', { tag: tags('HRN-EVD-001', PRIORITY.high, KIND.harness) },
    async ({ page, api }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', e => pageErrors.push(e.message));

      await page.goto('products');

      await test.step('the saved session is still valid', async () => {
        await expect(page).not.toHaveURL(/\/login/);
      });

      await test.step('the api fixture is recording', async () => {
        expect(Array.isArray(api), 'the api fixture is not attached').toBe(true);
        const serverErrors = api.filter(c => c.status >= 500);
        expect(serverErrors, 'server errors while loading products').toHaveLength(0);
      });

      await test.step('no uncaught errors on the page', async () => {
        expect(pageErrors, `uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0);
      });
    },
  );
});
