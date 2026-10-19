/**
 * What belongs to each tab — the same mechanism as UAPP.
 *
 * Testing is done one tab at a time, so several tools need to agree on where a tab
 * starts and ends: which spec files to run, which case IDs count towards its coverage,
 * and what to call it. Adding a tab is one entry here.
 *
 * `cases` is a regular expression source, anchored by the tools that use it. It is
 * written out rather than inferred from the spec files, because a case can be planned
 * and not yet automated — those are exactly the ones coverage must still count.
 *
 * Each tab owns a block of IDs so two sessions can never hand out the same number.
 * The range is reserved numbers, not a target: a tab is capped at 25 cases.
 */
export const TABS = {
  'auth/login': {
    label: 'Demo Shop — Login',
    specs: ['tests/auth/login.spec.ts'],
    cases: 'SHOP-AUTH-0[0-4][0-9]',
  },
  'products/products': {
    label: 'Demo Shop — Products',
    specs: ['tests/products/products.spec.ts'],
    cases: 'SHOP-PRD-0[0-4][0-9]',
  },
  'cart/cart': {
    label: 'Demo Shop — Cart',
    specs: ['tests/cart/cart.spec.ts'],
    cases: 'SHOP-CRT-0[0-4][0-9]',
  },
};

/** Resolves a tab name to its entry, with a readable error listing what exists. */
export function tab(name) {
  const found = TABS[name];
  if (!found) {
    throw new Error(
      `Unknown tab "${name}". Known tabs: ${Object.keys(TABS).join(', ') || '(none yet)'}`,
    );
  }
  return found;
}
