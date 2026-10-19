#!/usr/bin/env node
/**
 * Writes the readable list of cases a run covers — the one you show in a meeting.
 *
 * It is generated from the tests themselves rather than typed, because a hand-written
 * list of cases is wrong within a fortnight and nobody notices until they are standing
 * in front of the list explaining it.
 *
 *   node scripts/cases.mjs <out-name> [playwright filter args...]
 *
 *   node scripts/cases.mjs employees/departments \
 *        tests/employees/departments-settings.spec.ts tests/employees/departments-manual.spec.ts
 *
 * Writes reports/employees/departments-cases.md.
 *
 * The harness tests are left out: they guard the automation, not the product, and
 * nobody in a product meeting needs to see them.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [outName, ...filter] = process.argv.slice(2);
if (!outName) {
  console.error('usage: node scripts/cases.mjs <module/tab> [playwright filter args...]');
  process.exit(2);
}

const isWindows = process.platform === 'win32';
const tmp = path.join('artifacts', 'cases-list.json');
fs.mkdirSync('artifacts', { recursive: true });

// --list does not run anything; it only reports what would run. Its JSON goes to a
// scratch file so it cannot overwrite the results of the last real run.
const res = spawnSync(
  'npx',
  ['playwright', 'test', ...filter, '--list', '--reporter=json'],
  { shell: isWindows, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
if (res.status !== 0 && !res.stdout) {
  console.error(res.stderr || 'playwright --list failed');
  process.exit(1);
}
fs.writeFileSync(tmp, res.stdout, 'utf8');

/** Walks the suite tree and yields every test with its tags. */
function* walk(suites, trail = []) {
  for (const s of suites ?? []) {
    const here = s.title ? [...trail, s.title] : trail;
    for (const spec of s.specs ?? []) {
      const tags = spec.tags ?? (spec.tests?.[0]?.tags ?? []);
      yield { title: spec.title, file: spec.file ?? s.file ?? '', group: here[here.length - 1] ?? '', tags };
    }
    yield* walk(s.suites, here);
  }
}

const report = JSON.parse(fs.readFileSync(tmp, 'utf8'));
const all = [...walk(report.suites)];

const PRIORITIES = ['@critical', '@high', '@medium'];
const rows = all
  // A product case carries a case ID; the login and the seed template do not. The
  // harness has IDs of its own but guards the automation rather than the product, so
  // it is dropped by its tag.
  .filter(t => /\b[A-Z]{2,4}(?:-[A-Z]{2,4})*-\d{3}\b/.test(t.title))
  .filter(t => !t.tags.some(x => `${x}`.replace(/^@?/, '@') === '@harness'))
  .map(t => {
    const tags = t.tags.map(x => (x.startsWith('@') ? x : `@${x}`));
    const id = (t.title.match(/\b([A-Z]{2,4}(?:-[A-Z]{2,4})*-\d{3})\b/) ?? [])[1] ?? '';
    return {
      id,
      // The ID is already in the heading column; repeating it in the sentence reads badly.
      what: t.title.replace(/\b[A-Z]{2,4}(?:-[A-Z]{2,4})*-\d{3}\b\s*/, '').trim(),
      priority: (PRIORITIES.find(p => tags.includes(p)) ?? '').replace('@', ''),
      manual: tags.includes('@manual'),
      group: t.group,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const out = path.join('reports', `${outName}-cases.md`);
fs.mkdirSync(path.dirname(out), { recursive: true });

const title = outName.split('/').map(p => p.replace(/-/g, ' ')).join(' — ');
const md = [
  `# Cases covered — ${title}`,
  '',
  `Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} from the tests themselves.`,
  'Do not edit by hand: re-run `node scripts/cases.mjs` instead.',
  '',
  `**${rows.length} cases run by this selection.** Cases marked *reported* came from a person`,
  'using the product rather than from exploration. Cases that are planned but not automated',
  'are not here — `npm run coverage` is where the gaps live.',
  '',
  `Command: \`npx playwright test ${filter.join(' ')}\``,
  '',
  '| Case | What it checks | Priority | Source |',
  '|---|---|---|---|',
  ...rows.map(r =>
    `| \`${r.id}\` | ${r.what} | ${r.priority} | ${r.manual ? 'reported' : 'explored'} |`),
  '',
].join('\n');

fs.writeFileSync(out, md, 'utf8');
fs.rmSync(tmp, { force: true });
console.log(`Wrote ${out}  (${rows.length} cases)`);
