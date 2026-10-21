import { test as base, expect } from '@playwright/test';
import { AUTH_FILE } from '../constants';
import { isAppCall } from './traffic';
import * as fs from 'fs';
import * as path from 'path';

/** One app call observed during a test, with everything a developer needs to diagnose it. */
export type ApiCall = {
  method: string;
  url: string;
  status: number;
  requestBody: string;
  responseBody: string;
  durationMs: number;
};

/** Calls slower than this are flagged in the evidence report. */
const SLOW_MS = 2000;

/** Bodies are truncated so a huge list response cannot bloat the report. */
const MAX_BODY = 2000;

function short(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search || '');
  } catch {
    return url;
  }
}

function buildReport(calls: ApiCall[], title: string): string {
  if (calls.length === 0) {
    // Expected on Demo Shop today: it is a static site, so most screens make no fetch/XHR at all.
    return `# API evidence — ${title}\n\nNo fetch/XHR calls were observed during this test.\n`;
  }

  const failed = calls.filter(c => c.status >= 400);
  const slow = calls.filter(c => c.durationMs > SLOW_MS);

  const lines: string[] = [];
  lines.push(`# API evidence — ${title}`);
  lines.push('');
  lines.push(`Calls: ${calls.length} · Failed: ${failed.length} · Slower than ${SLOW_MS}ms: ${slow.length}`);
  lines.push('');

  lines.push('## All calls');
  lines.push('');
  lines.push('| # | Method | Status | Duration | Endpoint |');
  lines.push('|---|---|---|---|---|');
  calls.forEach((c, i) => {
    const flag = c.status >= 400 ? ' ❌' : c.durationMs > SLOW_MS ? ' 🐢' : '';
    lines.push(`| ${i + 1} | ${c.method} | ${c.status}${flag} | ${c.durationMs}ms | \`${short(c.url)}\` |`);
  });
  lines.push('');

  // Full detail only for the calls someone would actually investigate.
  const interesting = calls.filter(c => c.status >= 400 || c.durationMs > SLOW_MS);
  if (interesting.length > 0) {
    lines.push('## Details for failed and slow calls');
    lines.push('');
    for (const c of interesting) {
      lines.push(`### ${c.method} ${short(c.url)} → ${c.status} (${c.durationMs}ms)`);
      lines.push('');
      lines.push('**Request payload**');
      lines.push('```json');
      lines.push(c.requestBody || '(no body)');
      lines.push('```');
      lines.push('');
      lines.push('**Response**');
      lines.push('```json');
      lines.push(c.responseBody || '(no body)');
      lines.push('```');
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Demo Shop QA test fixture — the same shape as the UAPP one.
 *
 * Every test using this gets, automatically and whether it passes or fails:
 *   - a HAR file of the whole session, attached to the HTML report
 *   - a video of the whole test, attached as `video` (shown in Playwright's report and in ours)
 *   - a readable API evidence report: endpoint, method, status, timing, payload, response
 *
 * The video is recorded here, not by `use.video` in playwright.config.ts: that option only
 * applies to contexts Playwright creates itself, and this fixture creates its own.
 */
export const test = base.extend<{ api: ApiCall[] }>({
  context: async ({ browser }, use, testInfo) => {
    const harPath = testInfo.outputPath('network.har');
    const videoDir = testInfo.outputPath('videos');

    const context = await browser.newContext({
      storageState: AUTH_FILE,
      recordHar: { path: harPath, content: 'embed' },
      recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
    });

    await use(context);

    // The HAR and the videos are only flushed to disk once the context closes.
    await context.close();

    // One video per page the test opened; usually exactly one.
    const videos = fs.existsSync(videoDir)
      ? fs.readdirSync(videoDir).filter(f => f.endsWith('.webm')).sort()
      : [];
    for (const [i, file] of videos.entries()) {
      await testInfo.attach(videos.length > 1 ? `video-${i + 1}` : 'video', {
        path: path.join(videoDir, file),
        contentType: 'video/webm',
      });
    }
    if (videos.length === 0) {
      await testInfo.attach('EVIDENCE WARNING — video', {
        body: `No video was produced for this test. Expected .webm files in ${videoDir}.`,
        contentType: 'text/plain',
      });
    }

    // Verify the evidence actually exists rather than assuming the option took effect.
    const stat = fs.existsSync(harPath) ? fs.statSync(harPath) : null;

    if (stat && stat.size > 1024) {
      await testInfo.attach('network.har', {
        path: harPath,
        contentType: 'application/json',
      });
    } else {
      await testInfo.attach('EVIDENCE WARNING', {
        body:
          `No usable HAR was produced for this test.\n\n` +
          `Expected a file at ${harPath}.\n` +
          `Found: ${stat ? `${stat.size} bytes, which is too small to contain traffic` : 'nothing'}.\n\n` +
          `Until this is fixed, the network evidence for this test is missing and any ` +
          `finding raised from it cannot be backed up.`,
        contentType: 'text/plain',
      });
    }
  },

  /**
   * Declared `auto: true` so it runs for every test whether or not the test asks for it.
   * A test that forgets to destructure `api` would otherwise silently produce no evidence.
   */
  api: [async ({ context }, use, testInfo) => {
    const calls: ApiCall[] = [];
    const pending: Promise<void>[] = [];

    context.on('response', response => {
      const req = response.request();
      if (!isAppCall(req)) return;

      pending.push(
        (async () => {
          let responseBody = '';
          try {
            responseBody = (await response.text()).slice(0, MAX_BODY);
          } catch {
            responseBody = '(body unavailable)';
          }

          // In Playwright's ResourceTiming, startTime is an absolute epoch value while
          // every other field is already relative to it, so responseEnd IS the duration.
          let durationMs = -1;
          try {
            const t = req.timing();
            if (t.responseEnd >= 0) durationMs = Math.round(t.responseEnd);
          } catch {
            /* timing is unavailable for some aborted requests */
          }

          calls.push({
            method: req.method(),
            url: req.url(),
            status: response.status(),
            requestBody: (req.postData() ?? '').slice(0, MAX_BODY),
            responseBody,
            durationMs,
          });
        })(),
      );
    });

    await use(calls);

    // Response bodies resolve asynchronously, so settle them before reporting. Cap the wait.
    await Promise.race([
      Promise.allSettled(pending),
      new Promise(resolve => setTimeout(resolve, 10_000)),
    ]);

    await testInfo.attach('api-evidence.md', {
      body: buildReport(calls, testInfo.title),
      contentType: 'text/markdown',
    });
  }, { auto: true }],
});

export { expect };
