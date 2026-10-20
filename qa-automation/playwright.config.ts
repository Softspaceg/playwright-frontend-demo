import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Same rule as UAPP: there is deliberately no default host. A guessed host would mean a
 * run landing somewhere nobody meant to test.
 */
if (!process.env.BASE_URL) {
  throw new Error(
    'BASE_URL is not set. Put the site you are testing in qa-automation/.env, for example\n' +
      '  BASE_URL=https://softspaceg.github.io/playwright-templates/\n' +
      'There is no default on purpose.',
  );
}

import { AUTH_FILE } from './constants';
export { AUTH_FILE };

export default defineConfig({
  testDir: './tests',

  timeout: 60_000,
  expect: { timeout: 10_000 },

  // One test at a time, as on UAPP: shared data, so parallel runs would collide.
  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    // The JSON feeds scripts/dev-summary.mjs and scripts/coverage.mjs.
    ['json', { outputFile: 'artifacts/results.json' }],
  ],

  use: {
    // Ends with a slash, so page.goto('products') resolves under /playwright-templates/.
    // Use relative paths in page objects ('products', not '/products').
    baseURL: process.env.BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    // Evidence policy, same as UAPP: HAR and API report on every test; trace, screenshot
    // and video only when a test fails. The video goes on the failure's card in the team
    // report (scripts/fill-report.mjs).
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // The harness checks the automation itself, not the product. It is a dependency so
    // that a filtered run (one tab) still runs it.
    {
      name: 'harness',
      testMatch: /tests[\\/](harness|smoke)[\\/].*\.spec\.ts|tests[\\/]seed\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_FILE },
      // A failing harness test is fixed, never routed around.
      dependencies: ['harness'],
      testIgnore: [/tests[\\/](harness|smoke)[\\/]/, /tests[\\/]seed\.spec\.ts/],
    },
  ],
});
