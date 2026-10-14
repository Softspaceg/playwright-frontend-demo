import type { Page } from "@playwright/test";

/** Seeded by src/auth/AuthContext.tsx, so it exists on every fresh browser. */
export const demoUser = {
  name: "Demo User",
  email: "demo@example.com",
  password: "password123",
};

/**
 * Seeds the localStorage session the app reads on boot (AuthContext's
 * `demo_session` key), so a test can start already logged in.
 */
export async function seedAuthenticatedSession(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem("demo_session", JSON.stringify(user));
  }, { name: demoUser.name, email: demoUser.email });
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}
