import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

// GitHub sets these on every run; locally the title stays "Playwright Frontend Demo E2E".
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
const pullRequest = process.env.GITHUB_REF?.match(/^refs\/pull\/(\d+)\//)?.[1];
const reportTitle = ["Playwright Frontend Demo E2E", branch, pullRequest && `PR #${pullRequest}`]
  .filter(Boolean)
  .join(" · ");

// More info at https://playwright.dev/docs/test-configuration
export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // CI keeps the HTML report too: e2e-playwright.yml publishes it to GCP.
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", title: reportTitle }]]
    : [["html", { title: reportTitle }]],

  use: {
    baseURL,
    trace: "on-first-retry",
    video: process.env.CI ? "on" : "off",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Only auto-start a local dev server when no explicit target (e.g. the GitHub Pages site) is provided.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
