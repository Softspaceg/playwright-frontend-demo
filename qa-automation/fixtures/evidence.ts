import { test, type Locator, type Page } from '@playwright/test';

/**
 * Shared evidence helpers. Every module imports from here, so a screenshot taken by an
 * Employees test looks the same as one taken by a Leave Management test.
 *
 * This lives in fixtures/ rather than inside one module's helpers because it was
 * previously buried in tests/leave-management/helpers.ts, which meant the Employees
 * tests silently produced plain screenshots with nothing marked on them. A reader then
 * has to guess what they are looking at.
 */

/**
 * Screenshots the page with one element ringed in red and everything else dimmed, then
 * attaches the image together with a written caption.
 *
 * A plain failure screenshot is close to useless when the defect is a missing dialog or
 * a wrong number: the page looks entirely normal and nobody can see what is wrong. This
 * points at the evidence and says what is wrong with it.
 */
export async function annotatedShot(page: Page, target: Locator, caption: string): Promise<void> {
  const info = test.info();
  const el = target.first();

  await el.evaluate(node => (node as HTMLElement).setAttribute('data-qa-focus', '1')).catch(() => {});
  const style = await page.addStyleTag({
    content: `[data-qa-focus]{
      outline: 3px solid #e11d48 !important;
      outline-offset: 3px !important;
      border-radius: 4px !important;
      box-shadow: 0 0 0 9999px rgba(8,12,20,.55) !important;
      position: relative !important;
      z-index: 2147483647 !important;
    }`,
  });

  await el.scrollIntoViewIfNeeded().catch(() => {});
  const shot = await page.screenshot();

  await info.attach('defect — screenshot', { body: shot, contentType: 'image/png' });
  await info.attach('defect — what this shows', { body: caption, contentType: 'text/plain' });

  await style.evaluate(node => (node as HTMLElement).remove()).catch(() => {});
  await el.evaluate(node => (node as HTMLElement).removeAttribute('data-qa-focus')).catch(() => {});
}

/**
 * Screenshots the page when there is nothing to ring, and says so.
 *
 * Use this when the defect is the *absence* of something: no confirmation appeared, no
 * dialog opened, nothing was highlighted because nothing was there. The caption carries
 * the meaning that an outline normally would.
 */
export async function absenceShot(page: Page, caption: string): Promise<void> {
  const info = test.info();
  const shot = await page.screenshot();
  await info.attach('defect — screenshot', { body: shot, contentType: 'image/png' });
  await info.attach('defect — what this shows', {
    body: `${caption}\n\nNothing is marked on this image on purpose: the defect is that the expected element never appeared.`,
    contentType: 'text/plain',
  });
}
