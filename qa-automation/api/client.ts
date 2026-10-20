/**
 * Preconditions through the API — the UAPP rule is "API for preconditions, UI for the thing
 * under test".
 *
 * Empty on purpose: Demo Shop is a static site with no backend, so there is no API to call.
 * Until it has one, preconditions are built through the UI, or by writing the app's
 * localStorage before the page loads (page.addInitScript). Put those helpers here so the
 * tests keep the same shape as UAPP's.
 */
export {};
