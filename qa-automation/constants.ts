import * as path from 'path';

/** Saved logged-in session, reused by every test so we log in only once. */
export const AUTH_FILE = path.resolve(__dirname, 'auth/state.json');

/** Marks every record the tests create, so a person can tell it apart from real data. */
export const QA_PREFIX = 'QA';
