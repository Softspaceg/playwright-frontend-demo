/**
 * Stable case IDs and the tag vocabulary — the same scheme as UAPP.
 *
 * The IDs live on the tests, not in a hand-maintained catalogue. Playwright's `--list` and
 * its JSON report read the tags straight off the tests, so the automated inventory is
 * always generated rather than typed. Planned-but-unwritten cases stay in specs/, and
 * `npm run coverage` reconciles the two.
 *
 * Case ID format: SHOP-<AREA>-<NNN>
 *   SHOP-AUTH  Login / logout
 *   SHOP-PRD   Products
 *   SHOP-CRT   Cart
 */

/** Priority tags. Exactly one belongs on every test. */
export const PRIORITY = {
  /** Blocks a core shopper action. Run these before any release. */
  critical: '@critical',
  /** Important but the user has a way around it. */
  high: '@high',
  /** Cosmetic, or an edge case a real user rarely reaches. */
  medium: '@medium',
} as const;

/** Kind tags, so a run can pick a slice of the suite. */
export const KIND = {
  /** A single isolated check. */
  case: '@case',
  /** An ordered journey across several screens. */
  journey: '@journey',
  /** Proves an action changes behaviour on another screen. */
  effect: '@effect',
  /** Guards the automation itself, not the product. */
  harness: '@harness',
  /** Reported by a person using the product, not found by exploration. Added alongside the normal tags. */
  manual: '@manual',
} as const;

/** Module tags. scripts/dev-summary.mjs writes one report per module from these. */
export const MODULE = {
  auth: '@auth',
  products: '@products',
  cart: '@cart',
} as const;

/**
 * Tags a test that is pinned to a known product defect, so a retest is one command:
 *   npx playwright test --grep "@SHOP-BUG-12"
 */
export function defect(trackerId: string): string {
  return `@SHOP-BUG-${trackerId}`;
}

/**
 * Builds the tag list for a test.
 *
 * Usage:
 *   test('SHOP-PRD-001 ...', { tag: tags('SHOP-PRD-001', PRIORITY.critical, KIND.case, MODULE.products) }, async ({ page }) => {})
 */
export function tags(caseId: string, ...rest: string[]): string[] {
  return [`@${caseId}`, ...rest];
}
