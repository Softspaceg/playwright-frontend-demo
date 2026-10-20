#!/usr/bin/env node
/**
 * Turns Playwright's own JSON report into a short summary a developer can act on.
 *
 * Deliberately NOT a reporting framework. Playwright already produces the HTML report,
 * the JSON results and the per-test attachments; this only rearranges them so the
 * failures come first, each one carrying its case ID, what broke, the API calls around
 * the failure and where its evidence sits. No AI runs here, so it costs nothing to
 * regenerate on every run.
 *
 * Usage:
 *   npx playwright test --reporter=json,html
 *   node scripts/dev-summary.mjs [path/to/results.json] [-o reports/dev-summary.md]
 */

import fs from 'node:fs';
import path from 'node:path';

const PRIORITY_ORDER = ['@critical', '@high', '@medium'];
const SLOW_MS = 2000;

function parseArgs(argv) {
  const args = { input: 'artifacts/results.json', output: null, module: null };
  const rest = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '-o' || argv[i] === '--output') args.output = argv[++i];
    else if (argv[i] === '-m' || argv[i] === '--module') args.module = argv[++i];
    else rest.push(argv[i]);
  }
  if (rest[0]) args.input = rest[0];
  return args;
}

/**
 * The module a test belongs to, from its module tag.
 *
 * Reports are written per module so someone working on Employees never has to read
 * past Leave Management results to find their own.
 */
const MODULE_TAGS = {
  '@auth': 'auth',
  '@products': 'products',
  '@cart': 'cart',
};

function moduleOf(t) {
  const tag = t.tags.find(x => MODULE_TAGS[x]);
  return tag ? MODULE_TAGS[tag] : 'harness';
}

/** Walks Playwright's nested suite tree into a flat list of results. */
function collect(report) {
  const out = [];
  const walk = suite => {
    for (const child of suite.suites ?? []) walk(child);
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        for (const result of test.results ?? []) {
          out.push({
            title: spec.title,
            file: suite.file ?? spec.file ?? '',
            tags: (spec.tags ?? test.tags ?? []).map(t => (t.startsWith('@') ? t : `@${t}`)),
            annotations: test.annotations ?? [],
            status: result.status,
            expected: test.expectedStatus,
            durationMs: result.duration ?? 0,
            errors: (result.errors ?? []).map(e => e.message ?? String(e)),
            attachments: result.attachments ?? [],
          });
        }
      }
    }
  };
  for (const suite of report.suites ?? []) walk(suite);
  return out;
}

/** A test is a problem when what happened is not what the suite expected. */
function isProblem(t) {
  return t.status !== t.expected;
}

/** A test pinned to a known defect: expected to fail, and it did. */
function isKnownDefect(t) {
  return t.expected === 'failed' && t.status === 'failed';
}

function caseId(t) {
  const tag = t.tags.find(x => /^@[A-Z]{2,4}-[A-Z]{2,4}-\d+$/.test(x));
  return tag ? tag.slice(1) : null;
}

function priority(t) {
  return PRIORITY_ORDER.find(p => t.tags.includes(p)) ?? '@medium';
}

function defectTags(t) {
  return t.tags.filter(x => /^@SHOP-BUG-/.test(x));
}

function decodeText(att) {
  if (att.body) return Buffer.from(att.body, 'base64').toString('utf8');
  if (att.path && fs.existsSync(att.path)) return fs.readFileSync(att.path, 'utf8');
  return null;
}

/** Pulls the calls table out of the api-evidence attachment this suite writes. */
function apiCalls(t) {
  const att = t.attachments.find(a => a.name === 'api-evidence.md');
  const text = att && decodeText(att);
  if (!text) return [];
  return [...text.matchAll(/^\|\s*\d+\s*\|\s*(\w+)\s*\|\s*(\d+)\s*([^|]*)\|\s*(\d+)ms\s*\|\s*`([^`]+)`/gm)].map(
    m => ({ method: m[1], status: Number(m[2]), flag: m[3].trim(), durationMs: Number(m[4]), url: m[5] }),
  );
}

function evidenceLinks(t, baseDir) {
  const links = [];
  for (const a of t.attachments) {
    if (!a.path) continue;
    const label =
      a.name === 'network.har' ? 'HAR' :
      a.name === 'trace' ? 'Trace' :
      a.name.includes('screenshot') ? 'Screenshot' :
      a.name;
    links.push(`[${label}](${path.relative(baseDir, a.path).split(path.sep).join('/')})`);
  }
  return links;
}

/**
 * Keeps the opening of an error message.
 *
 * Playwright errors carry the useful part at the top and a long stack underneath, so
 * this takes the first few meaningful lines and drops file paths and the code frame.
 */
function errorHead(text, maxLines = 6) {
  return String(text)
    .replace(/\x1b\[[0-9;]*m/g, '')
    .split('\n')
    .filter(l => l.trim())
    .filter(l => !/^\s*at\s/.test(l))
    .filter(l => !/^\s*\d+\s*\|/.test(l))
    .filter(l => !/^\s*[|>^\s]+$/.test(l))
    .slice(0, maxLines)
    .join('\n');
}

function renderProblem(t, baseDir) {
  const id = caseId(t);
  const lines = [];

  lines.push(`### ${id ? `${id} — ` : ''}${t.title.replace(/^[A-Z-]+\d+\s+/, '')}`);
  lines.push('');

  const bits = [`**Priority:** ${priority(t).slice(1)}`];
  if (defectTags(t).length) bits.push(`**Tracked as:** ${defectTags(t).join(', ')}`);
  bits.push(`**Took:** ${Math.round(t.durationMs)} ms`);
  lines.push(bits.join(' · '));
  lines.push('');

  const why = t.annotations.find(a => a.type === 'defect' || a.type === 'why');
  if (why) {
    lines.push(`**Impact.** ${why.description}`);
    lines.push('');
  }

  if (t.errors.length) {
    lines.push('**What failed**');
    lines.push('');
    lines.push('```');
    lines.push(t.errors.map(e => errorHead(e)).join('\n'));
    lines.push('```');
    lines.push('');
  }

  const calls = apiCalls(t);
  if (calls.length) {
    const notable = calls.filter(c => c.status >= 400 || c.durationMs > SLOW_MS);
    const shown = (notable.length ? notable : calls).slice(0, 6);
    lines.push(notable.length ? '**API calls that need attention**' : '**API calls during this test**');
    lines.push('');
    lines.push('| Method | Status | Time | Endpoint |');
    lines.push('|---|---|---|---|');
    for (const c of shown) {
      lines.push(`| ${c.method} | ${c.status}${c.status >= 400 ? ' ❌' : ''} | ${c.durationMs} ms | \`${c.url}\` |`);
    }
    lines.push('');
  }

  const links = evidenceLinks(t, baseDir);
  if (links.length) {
    lines.push(`**Evidence:** ${links.join(' · ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const { input, output } = args;

  if (!fs.existsSync(input)) {
    console.error(
      `No results at ${input}.\nRun the suite with the JSON reporter first, for example:\n` +
        `  npx playwright test --reporter=json,html`,
    );
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(input, 'utf8'));
  const all = collect(report).filter(t => !t.title.includes('log in to Demo Shop'));

  // A `--list` pass writes this same file with specs but no results, which would
  // otherwise produce a confident, empty, completely wrong report. Refuse instead.
  if (all.length === 0 || all.every(t => !t.status)) {
    console.error(
      `${input} holds no test results.\n` +
        `Something overwrote it, usually a "playwright test --list" run.\n` +
        `Run the tests again before generating the summary:\n\n  npm run summary\n`,
    );
    process.exit(1);
  }

  writeReports(all, output, args.module);
}

/**
 * Writes one report per module, plus a combined one.
 *
 * Someone working on Employees should never have to read past Leave Management
 * results to find their own, so each module gets its own file under reports/<module>/.
 */
function writeReports(everything, explicitOutput, onlyModule) {
  const modules = [...new Set(everything.map(moduleOf))].filter(m => !onlyModule || m === onlyModule);

  for (const mod of modules) {
    const tests = everything.filter(t => moduleOf(t) === mod);
    buildOne(tests, explicitOutput ?? `reports/${mod}/dev-summary.md`, mod);
  }

  if (!onlyModule && !explicitOutput && modules.length > 1) {
    buildOne(everything, 'reports/dev-summary.md', 'all modules');
  }
}

function buildOne(all, output, label) {
  const problems = all.filter(isProblem);
  const knownDefects = all.filter(isKnownDefect);
  const passed = all.filter(t => !isProblem(t) && !isKnownDefect(t));

  problems.sort((a, b) => PRIORITY_ORDER.indexOf(priority(a)) - PRIORITY_ORDER.indexOf(priority(b)));

  // Slowest calls across the whole run, so performance is visible without opening a test.
  const slow = all
    .flatMap(t => apiCalls(t))
    .filter(c => c.durationMs > SLOW_MS)
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 8);

  const md = [];
  md.push(`# Demo Shop QA — developer summary — ${label}`);
  md.push('');
  md.push(`Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} from a real run against the dev environment.`);
  md.push('');
  md.push(`**${passed.length} passed · ${problems.length} need attention · ${all.filter(t => defectTags(t).length > 0).length} tracked defects open**`);
  md.push('');

  if (problems.length) {
    md.push('## Needs attention');
    md.push('');
    md.push('Ordered by priority. Each entry names the case, what broke and where the evidence is.');
    md.push('');
    for (const t of problems) md.push(renderProblem(t, path.dirname(output)));
  } else {
    md.push('## Needs attention');
    md.push('');
    md.push('Nothing unexpected. Every test behaved as the suite expected it to.');
    md.push('');
  }

  // Every test carrying a tracker tag, whether or not it reproduced on this run.
  //
  // An intermittent defect that happens not to fire would otherwise vanish from the
  // report, and a reader would conclude it was fixed. It stays listed, marked as not
  // reproducing this time, until someone closes it deliberately.
  const tracked = all.filter(t => defectTags(t).length > 0);

  if (tracked.length) {
    md.push('## Tracked defects');
    md.push('');
    md.push('Open product defects with a test pinned to each one. A defect stays listed even on');
    md.push('a run where it does not reproduce, because intermittent is not the same as fixed.');
    md.push('');
    md.push('| Defect | Case | Reproduced this run | What it costs |');
    md.push('|---|---|---|---|');
    for (const t of tracked) {
      const id = caseId(t);
      const why = t.annotations.find(a => a.type === 'defect');
      // A pinned test "reproduces" when it fails; a plain test reproduces when it fails too.
      const reproduced = t.status === 'failed';
      md.push(
        `| ${defectTags(t).join(' ')} | \`${id ?? '—'}\` | ${reproduced ? 'Yes' : 'No — intermittent'} | ${why ? why.description : t.title} |`,
      );
    }
    md.push('');
  }

  if (slow.length) {
    md.push('## Slow API calls');
    md.push('');
    md.push(`Anything over ${SLOW_MS} ms, measured on this run.`);
    md.push('');
    md.push('| Time | Method | Endpoint |');
    md.push('|---|---|---|');
    for (const c of slow) md.push(`| ${c.durationMs} ms | ${c.method} | \`${c.url}\` |`);
    md.push('');
  }

  md.push('## Passed');
  md.push('');
  for (const t of passed) {
    const id = caseId(t);
    md.push(`- ${id ? `**${id}** ` : ''}${t.title.replace(/^[A-Z-]+\d+\s+/, '')}`);
  }
  md.push('');
  md.push('---');
  md.push('');
  md.push('Full run detail, including every request and response: `npm run report`.');
  md.push('');

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, md.join('\n'), 'utf8');

  console.log(`Wrote ${output}`);
  console.log(`  ${passed.length} passed, ${problems.length} need attention, ${knownDefects.length} known defects`);
}

main();
