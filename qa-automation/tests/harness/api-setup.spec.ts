import { test } from '../../fixtures/qa-fixtures';
import { KIND, PRIORITY, tags } from '../case-ids';

/**
 * On UAPP this proves preconditions can be created through the API and then seen in the UI.
 * Demo Shop has no API yet (see api/client.ts), so the check is declared and skipped,
 * exactly as UAPP's HRN-API-001 is today. Un-skip it when api/ gets real helpers.
 */
test.describe('QA harness', () => {
  test.skip('HRN-API-001 preconditions can be created through the API', { tag: tags('HRN-API-001', PRIORITY.high, KIND.harness) },
    async () => {},
  );
});
