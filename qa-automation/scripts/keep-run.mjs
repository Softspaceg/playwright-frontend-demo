#!/usr/bin/env node
/**
 * Keeps the result of the run that just finished, so the next run cannot overwrite it.
 *
 *   node node_modules/@playwright/test/cli.js test tests/attendance/registers.spec.ts & node scripts/keep-run.mjs registers
 *
 * Copies artifacts/results.json, playwright-report/ and test-results/ into reports/runs/<YYYY-MM-DD_HHMM>_<name>/
 * and prints the pass / fail / skip count per case. Nothing is deleted; an existing folder of the same minute gets a suffix.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const name = (process.argv[2] ?? 'run').replace(/[^\w.-]+/g, '-');
const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

let dest = join('reports', 'runs', `${stamp}_${name}`);
for (let i = 2; existsSync(dest); i++) dest = join('reports', 'runs', `${stamp}_${name}-${i}`);
mkdirSync(dest, { recursive: true });

const results = join('artifacts', 'results.json');
if (!existsSync(results)) {
  console.error('keep-run: artifacts/results.json not found: nothing to keep.');
  process.exit(1);
}
const age = (Date.now() - statSync(results).mtimeMs) / 60_000;
if (age > 30) console.warn(`keep-run: WARNING artifacts/results.json is ${Math.round(age)} min old: is this really the run that just finished?`);

cpSync(results, join(dest, 'results.json'));
for (const dir of ['playwright-report', 'test-results']) if (existsSync(dir)) cpSync(dir, join(dest, dir), { recursive: true });

// One line per case: status and the first error line.
const r = JSON.parse(readFileSync(results, 'utf8'));
const counts = {};
const lines = [];
const walk = (s) => {
  for (const sp of s.specs ?? []) for (const t of sp.tests) {
    const res = t.results.at(-1) ?? {};
    const status = res.status ?? 'unknown';
    counts[status] = (counts[status] ?? 0) + 1;
    const err = (res.errors?.[0]?.message ?? '').replace(/\x1b\[[0-9;]*m/g, '').split('\n')[0].slice(0, 140);
    if (/^SHOP-/.test(sp.title)) lines.push(`${status.padEnd(8)} ${sp.title.slice(0, 70)}${err ? `  | ${err}` : ''}`);
  }
  for (const c of s.suites ?? []) walk(c);
};
for (const s of r.suites ?? []) walk(s);
console.log(`\nkept in ${dest}`);
console.log(Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log(lines.join('\n'));
