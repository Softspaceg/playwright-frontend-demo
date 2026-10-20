#!/usr/bin/env node
/**
 * Runs the suite, writes the developer summary, and keeps a dated copy of both.
 *
 * Two things this fixes.
 *
 * `playwright test && node scripts/dev-summary.mjs` only generates the summary on a
 * green run, which is precisely backwards: the run you most need a report from is the
 * one with failures in it. So the summary is written either way.
 *
 * And every output here used to be overwritten by the next run — results.json, the
 * developer summary, the coverage file. That makes it impossible to say what changed
 * between two runs, which is the question anyone asks after a fix lands. Each run now
 * also lands in `reports/runs/<timestamp>/`, which is never written to twice.
 *
 * The suite's exit code is preserved, so CI still fails when tests fail.
 *
 * Any arguments are passed straight through to Playwright:
 *   npm run summary -- --grep @employees
 *   npm run summary -- tests/employees/departments-settings.spec.ts
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tab } from '../tabs.config.mjs';

const argv = process.argv.slice(2);

// `--tab <name> -- <playwright args>` also writes coverage scoped to that tab. Without
// it, coverage covers everything, which is the right number for "is the product
// covered" and the wrong one for "is this tab finished".
let tabName = null;
if (argv[0] === '--tab') {
  tabName = argv[1];
  argv.splice(0, argv[2] === '--' ? 3 : 2);
}

// `--name batch1` labels the kept run folder: reports/runs/<stamp>_<tab>-batch1. It is ours, not
// Playwright's, so it is taken out before the rest is passed through.
let runName = null;
const nameAt = argv.indexOf('--name');
if (nameAt !== -1) {
  runName = argv[nameAt + 1];
  argv.splice(nameAt, 2);
}
const scope = tabName ? tab(tabName) : null;

// `npm run tab -- employees/job-positions` with nothing else runs that tab's specs with
// the browser visible, which is how testing is done here. Anything passed explicitly
// still wins, so a single file or a --grep can be run inside the same tab.
// On CI (GitHub Actions sets CI=true) there is no screen, so the browser runs headless.
const headed = !process.env.CI && !argv.includes('--headed') ? ['--headed'] : [];
const passthrough = scope && !argv.some(a => a.endsWith('.spec.ts'))
  ? [...scope.specs, ...headed, ...argv]
  : argv;

// Node is started directly, never through a shell. On Windows a shell concatenates the
// arguments unescaped, so a coverage range such as ATT-0([2-6][0-9]|7[0-9]) reached cmd
// as a pipe and coverage failed with "'7[0-9])' is not recognized" (05 Oct).
const node = args => spawnSync(process.execPath, args, { stdio: 'inherit' });
// Playwright is started the same way, through its own cli.js. It used to go through npx with
// a shell, and on 15 Oct `--grep "@LM-LT-|@LM-RT-00[12346]"` reached cmd as a pipe: Playwright
// died with EPIPE before running anything.
const PLAYWRIGHT_CLI = path.join('node_modules', '@playwright', 'test', 'cli.js');

/** 2026-10-01_1432 — sorts chronologically and is readable in a folder listing. */
function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

const RESULTS = 'artifacts/results.json';
const resultsBefore = fs.existsSync(RESULTS) ? fs.statSync(RESULTS).mtimeMs : 0;
const startedAt = Date.now();

const test = node([PLAYWRIGHT_CLI, 'test', ...passthrough]);

// If Playwright died before writing results, results.json still holds the PREVIOUS run (on
// 15 Oct the 13:19 folder was kept with another session's attendance results in it). Nothing is
// summarised or kept from a stale file.
const resultsAfter = fs.existsSync(RESULTS) ? fs.statSync(RESULTS).mtimeMs : 0;
if (resultsAfter === resultsBefore || resultsAfter < startedAt - 1000) {
  console.error(
    `\nNO TESTS RAN: ${RESULTS} was not rewritten by this run (Playwright exit code ${test.status ?? 'unknown'}).` +
      '\nNothing was summarised and no run folder was kept. Fix the command above and run again.',
  );
  process.exit(test.status || 1);
}

console.log('\n--- generating developer summary ---\n');
const summary = node(['scripts/dev-summary.mjs']);
if (summary.status !== 0) {
  console.error('The summary could not be generated. The run itself is reported above.');
}

console.log('\n--- reconciling coverage ---\n');
const coverageArgs = ['scripts/coverage.mjs'];
let scopedCoverage = null;
if (scope) {
  scopedCoverage = path.join('reports', `${tabName}-coverage.md`).replace(/\\/g, '/');
  coverageArgs.push('--cases', scope.cases, '--label', scope.label, '-o', scopedCoverage);
}
const coverage = node(coverageArgs);
if (coverage.status !== 0) {
  console.error('Coverage could not be reconciled. The run itself is reported above.');
}

// The readable case list, for showing people what this run actually covers.
if (scope) {
  console.log('\n--- listing the cases ---\n');
  node(['scripts/cases.mjs', tabName, ...scope.specs]);
}

// The team report, filled from this run by fill-report.mjs (no person, no AI).
let autoReport = null;
if (scope) {
  console.log('\n--- building the team report ---\n');
  autoReport = path.join('reports', tabName.split('/')[0], `${path.basename(tabName)}-auto`);
  const filled = node(['scripts/fill-report.mjs', tabName, '--out', autoReport]);
  if (filled.status !== 0) {
    console.error('The team report could not be built. The run itself is reported above.');
    autoReport = null;
  }
}

// ── Keep this run ──────────────────────────────────────────────────────────────
// Copied rather than moved, so the familiar paths still hold the latest run and
// nothing that reads them has to change.
// The folder says what ran: 2026-10-15_1331_leave-management-leave-types-batch1. A folder that
// already exists (two runs in one minute) gets -v2, -v3, so a run is never written twice.
const label = [tabName && tabName.replace(/[\\/]/g, '-'), runName].filter(Boolean).join('-');
const base = path.join('reports', 'runs', label ? `${stamp()}_${label}` : stamp());
let dir = base;
for (let v = 2; fs.existsSync(dir); v++) dir = `${base}-v${v}`;
fs.mkdirSync(dir, { recursive: true });

/** Copies a file or a whole directory, and says what it kept. */
function keep(from, as) {
  if (!fs.existsSync(from)) return;
  const to = path.join(dir, as);
  fs.cpSync(from, to, { recursive: true });
  console.log(`  kept  ${to}`);
}

keep('artifacts/results.json', 'results.json');
keep('reports/coverage.md', 'coverage.md');
if (scopedCoverage) keep(scopedCoverage, path.basename(scopedCoverage));
if (scope) keep(path.join('reports', `${tabName}-cases.md`), `${path.basename(tabName)}-cases.md`);
for (const entry of fs.existsSync('reports') ? fs.readdirSync('reports', { withFileTypes: true }) : []) {
  if (!entry.isDirectory() || entry.name === 'runs') continue;
  keep(path.join('reports', entry.name, 'dev-summary.md'), `dev-summary-${entry.name}.md`);
}
keep('reports/dev-summary.md', 'dev-summary-all.md');
if (autoReport) keep(autoReport, 'report');

// What was asked for is part of the record: a run limited to one tab and a run of the
// whole suite produce very different numbers, and six weeks later nobody remembers which.
fs.writeFileSync(
  path.join(dir, 'run.txt'),
  [
    `when:      ${new Date().toISOString()}`,
    `command:   npx playwright test ${passthrough.join(' ')}`.trimEnd(),
    `exit code: ${test.status ?? 'unknown'}`,
    '',
    'The team report generated from this run is in report/ (scripts/fill-report.mjs).',
    'A hand-edited version for a meeting is built separately:',
    '  node scripts/build-report.mjs <source.html> reports/<module>/<tab>-<version> --evidence <dir>',
    '',
  ].join('\n'),
  'utf8',
);

console.log(`\nThis run is kept at ${dir}`);

// Exit with the test result, not the summary's, so a failing suite still fails the build.
process.exit(test.status ?? 1);
