import type { Page, Request } from '@playwright/test';

/**
 * What the screen sent to the API during a test, kept so a case can say "no DELETE was sent", "the save sent a
 * PATCH with this body" or "the list was read with this query" without guessing from the page.
 *
 * `sent` is filled the moment a request leaves (so a request that never gets an answer still shows);
 * `calls` is filled when the answer arrives, with the request body and the response body.
 */
export type Call = { method: string; path: string; query: string; status: number; body: string; response: string };

/**
 * Demo Shop is a static site on GitHub Pages with no backend of its own, so there is no `/api/` prefix to filter on.
 * Every fetch / XHR the page makes is treated as an app call; scripts, styles and images are not.
 * When the app gets a real API, narrow this to its path, as UAPP does with `/uapp/api/`.
 */
export function isAppCall(req: Request): boolean {
  return ['fetch', 'xhr'].includes(req.resourceType());
}

export class Traffic {
  readonly sent: Array<{ method: string; path: string }> = [];
  readonly calls: Call[] = [];
  private readonly pending: Promise<void>[] = [];

  constructor(page: Page) {
    page.on('request', req => {
      const u = new URL(req.url());
      if (isAppCall(req)) this.sent.push({ method: req.method(), path: u.pathname });
    });
    page.on('response', res => {
      const req = res.request();
      const u = new URL(res.url());
      if (!isAppCall(req)) return;
      this.pending.push((async () => {
        const response = await res.text().catch(() => '');
        this.calls.push({ method: req.method(), path: u.pathname, query: u.search, status: res.status(), body: req.postData() ?? '', response: response.slice(0, 4000) });
      })());
    });
  }

  /**
   * Waits for every response body seen so far to be read. With `timeoutMs` the wait is bounded: a response body that is never delivered
   * (the page navigated away mid-read) must not eat the whole test timeout. Without it the wait is unbounded, as before.
   */
  async settle(timeoutMs?: number): Promise<void> {
    const all = Promise.allSettled(this.pending);
    if (!timeoutMs) { await all; return; }
    let timer: NodeJS.Timeout | undefined;
    await Promise.race([all, new Promise<void>(resolve => { timer = setTimeout(resolve, timeoutMs); })]);
    if (timer) clearTimeout(timer);
  }

  get mark(): number {
    return this.calls.length;
  }

  /** Calls that changed something (anything but GET) since `mark`. */
  writes(since = 0): Call[] {
    return this.calls.slice(since).filter(c => c.method !== 'GET');
  }

  /** The first call since `mark` that matches. */
  find(method: string, path: RegExp, since = 0): Call | undefined {
    return this.calls.slice(since).find(c => c.method === method && path.test(c.path));
  }

  /** True if a request of this method left for a path matching `path`, since `sentMark`. */
  wasSent(method: string, path: RegExp, sentMark = 0): boolean {
    return this.sent.slice(sentMark).some(s => s.method === method && path.test(s.path));
  }

  get sentMark(): number {
    return this.sent.length;
  }
}
