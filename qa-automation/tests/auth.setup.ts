import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE } from '../constants';
import { LoginPage } from '../pages/auth/login.page';
import * as fs from 'fs';
import * as path from 'path';

setup('log in to Demo Shop and save the session', async ({ page }) => {
  const email = process.env.DEMO_USER;
  const password = process.env.DEMO_PASS;
  if (!email || !password) throw new Error('DEMO_USER / DEMO_PASS missing from .env');

  const login = new LoginPage(page);
  await login.open();
  await login.login(email, password);

  // Login succeeded once we are no longer on the login route.
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30_000 });
  expect(page.url()).not.toContain('/login');

  // A static site keeps its session in localStorage; storageState saves that too.
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });

  console.log('Logged in. Landed on:', page.url());
});
