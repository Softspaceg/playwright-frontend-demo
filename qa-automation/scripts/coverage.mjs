#!/usr/bin/env node
/**
 * Reconciles what the plans say should be tested against what is actually automated.
 *
 * Two sources, neither duplicated:
 *   - specs/*.plan.md owns "what should be tested". Every scenario carries a **Case:** id.
 *   - The tests own "what exists". Their case IDs are native Playwright tags.
 *
 * This computes the difference. It is the answer to "show me what this suite will
 * actually check, and what it still will not".
 *
 * Usage:
 *   node scripts/coverage.mjs
 *   node scripts/coverage.mjs -o reports/coverage.md
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const SPECS_DIR = 'specs';

function parseArgs(argv) {
  const args = { output: 'reports/coverage.md', cases: null, label: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '-o' || argv[i] === '--output') args.output = argv[++i];
    else if (argv[i] === '--cases') args.cases = new RegExp('^(?:' + argv[++i] + ')$');
    else if (argv[i] === '--label') args.label = argv[++i];
  }
  if (args.cases && args.output === 'reports/coverage.md') {
    throw new Error('--cases needs its own -o, so the overall coverage file is not overwritten');
  }
  return args;
}

/** Finds every *.plan.md under specs/, including inside per-module folders. */
function findPlanFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...findPlanFiles(full));
    else if (entry.name.endsWith('.plan.md')) found.push(full);
  }
  return found;
}

/** Every scenario in every plan, with its id, title and declared status. */
function readPlans() {
  const scenarios = [];
  if (!fs.existsSync(SPECS_DIR)) return scenarios;

  for (const filePath of findPlanFiles(SPECS_DIR)) {
    const file = path.basename(filePath);
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n');

    // Two plan formats are supported, because plans are written by people and by
    // agents and the two settled on different shapes. Neither is wrong; both must
    // be readable or the coverage number silently lies.
    //
    //   Format A, a heading followed by a Case line:
    //     #### 1.1. Some scenario
    //     **Case:** `LM-LT-001` · **Status:** Automated
    //
    //   Format B, the id and title on one bold line:
    //     **EMP-SET-001 — Create a department (happy path)**
    //
    //   Format C, the id in the heading itself (what planner_save_plan writes, since it
    //   has no field for a Case line). A blocked case says so in its body:
    //     #### 1.7. SHOP-PRD-007 [critical] Add a product to the cart
    //       1. Case meta. ... Blocked: No add-to-cart control in the app.
    let heading = null;
    let currentSection = null;
    let fromHeading = null; // the Format C scenario whose body is being read

    for (const line of lines) {
      const sectionHeading = line.match(/^###\s+(.+?)(?:\s*\(.*)?$/);
      if (sectionHeading) currentSection = sectionHeading[1].trim();

      // Format A, and Format C when the heading carries the id
      const h = line.match(/^#{3,4}\s+(\d+\.\d+)\.?\s+(.*)$/);
      if (h) {
        heading = { section: h[1], title: h[2].trim() };
        fromHeading = null;
        const idInHeading = heading.title.match(/^([A-Z]{2,4}(?:-[A-Z]{2,4})*-\d+)\s+(?:\[[^\]]*\]\s*)?(.*)$/);
        if (idInHeading) {
          fromHeading = {
            id: idInHeading[1],
            plan: file.replace('.plan.md', ''),
            section: heading.section,
            title: idInHeading[2].trim(),
            declared: 'planned',
            blocked: null,
          };
          scenarios.push(fromHeading);
        }
        continue;
      }
      const c = line.match(/^\*\*Case:\*\*\s+`([^`]+)`\s*·\s*\*\*Status:\*\*\s*([^·]+)(?:·\s*\*\*Blocked:\*\*\s*(.*))?$/);
      if (c && heading) {
        const scenario = {
          id: c[1],
          plan: file.replace('.plan.md', ''),
          section: heading.section,
          title: fromHeading?.title ?? heading.title,
          declared: c[2].trim(),
          blocked: c[3]?.trim() ?? null,
        };
        // A Case line under a Format C heading describes the same scenario: replace, do not count twice.
        if (fromHeading && fromHeading.id === scenario.id) Object.assign(fromHeading, scenario);
        else scenarios.push(scenario);
        heading = null;
        fromHeading = null;
        continue;
      }

      // Format C body: the blocked reason
      const blockedInBody = fromHeading && line.match(/\bBlocked:\s*(.+?)\.?\s*$/);
      if (blockedInBody) {
        fromHeading.blocked = blockedInBody[1].trim();
        continue;
      }

      // Format B
      const b = line.match(/^\*\*([A-Z]{2,4}(?:-[A-Z]{2,4})*-\d+)\s*[—–-]\s*(.+?)\*\*\s*$/);
      if (b) {
        scenarios.push({
          id: b[1],
          plan: file.replace('.plan.md', ''),
          section: currentSection ?? '',
          title: b[2].trim(),
          declared: 'planned',
          blocked: null,
        });
      }
    }
  }
  return scenarios;
}

/** Case IDs that actually exist as tests, read from Playwright itself. */
function readAutomated() {
  // Send this listing's JSON somewhere harmless. The project config points the json
  // reporter at artifacts/results.json, which holds the last real run; a --list pass
  // would overwrite it with an empty listing and silently blank the developer summary.
  const listFile = path.join(os.tmpdir(), 'pw-coverage-list.json');

  execFileSync('npx', ['playwright', 'test', '--list', '--reporter=json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    shell: process.platform === 'win32',
    stdio: 'ignore',
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: listFile },
  });

  // With an output file configured the reporter writes there instead of to stdout.
  const json = JSON.parse(fs.readFileSync(listFile, 'utf8'));
  const found = new Map();

  const walk = suite => {
    for (const child of suite.suites ?? []) walk(child);
    for (const spec of suite.specs ?? []) {
      const tags = (spec.tags ?? []).map(t => (t.startsWith('@') ? t.slice(1) : t));
      const id = tags.find(t => /^[A-Z]{2,4}(?:-[A-Z]{2,4})*-\d+$/.test(t));
      if (id) found.set(id, { title: spec.title, tags });
    }
  };
  for (const suite of json.suites ?? []) walk(suite);
  return found;
}

function main() {
  const { output, cases, label } = parseArgs(process.argv);
  const allPlanned = readPlans();
  const automated = readAutomated();

  // Testing is done one tab at a time, so "29% of the whole product" is the wrong number
  // to read after a tab run: it moves whenever an unrelated module is planned, and says
  // nothing about the tab just finished. A scoped run answers "is this tab done" and
  // writes its own file; the unscoped one still holds the overall picture.
  const planned = cases ? allPlanned.filter(s => cases.test(s.id)) : allPlanned;
  if (cases && !planned.length) {
    throw new Error('--cases matched no planned scenario, out of ' + allPlanned.length + ' checked');
  }

  const byModule = new Map();
  for (const s of planned) {
    const key = s.id.split('-').slice(0, 2).join('-');
    if (!byModule.has(key)) byModule.set(key, []);
    byModule.get(key).push({ ...s, automated: automated.has(s.id) });
  }

  // Tests that exist but no plan scenario claims. Usually a defect found while
  // exploring, which is legitimate but should be written back into the plan.
  // A test with no plan scenario behind it. Usually a defect found while exploring,
  // which is legitimate but should be written back into the plan. When the report is
  // scoped to one tab, tests belonging to other tabs are not orphans — they simply are
  // not in scope — so they are filtered out too.
  const plannedIds = new Set(planned.map(s => s.id));
  const orphans = [...automated.entries()]
    .filter(([id]) => !cases || cases.test(id))
    .filter(([id]) => !plannedIds.has(id));

  const total = planned.length;
  const done = planned.filter(s => automated.has(s.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const md = [];
  md.push(label ? '# Coverage — ' + label : '# Coverage');
  if (cases) {
    md.push('');
    md.push('Scoped to ' + planned.length + ' of the ' + allPlanned.length +
      ' scenarios planned across all modules. The overall picture is in `reports/coverage.md`.');
  }
  md.push('');
  md.push(`Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')}.`);
  md.push('');
  md.push(`**${done} of ${total} planned scenarios are automated (${pct}%).**`);
  md.push('');
  md.push('The plans say what should be tested. The tests say what exists. This is the gap.');
  md.push('');

  const GROUP_NAMES = {
    'SHOP-AUTH': 'Demo Shop — Login',
    'SHOP-PRD': 'Demo Shop — Products',
    'SHOP-CRT': 'Demo Shop — Cart',
  };

  for (const [key, items] of byModule) {
    const groupDone = items.filter(i => i.automated).length;
    md.push(`## ${GROUP_NAMES[key] ?? key} — ${groupDone}/${items.length}`);
    md.push('');
    md.push('| Case | Scenario | Automated | Blocked by |');
    md.push('|---|---|---|---|');
    for (const i of items) {
      md.push(
        `| \`${i.id}\` | ${i.title} | ${i.automated ? 'Yes' : 'No'} | ${i.blocked ?? ''} |`,
      );
    }
    md.push('');
  }

  if (orphans.length) {
    md.push('## Automated but not in any plan');
    md.push('');
    md.push('Usually a defect found while exploring. Legitimate, but write it back into the');
    md.push('plan so the next person reading the plan knows it is covered.');
    md.push('');
    for (const [id, info] of orphans) md.push(`- \`${id}\` — ${info.title}`);
    md.push('');
  }

  md.push('---');
  md.push('');
  md.push('Run one case: `npx playwright test --grep "@SHOP-PRD-001"`');
  md.push('');
  md.push('Run everything critical: `npm run test:critical`');
  md.push('');

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, md.join('\n'), 'utf8');

  console.log(`Wrote ${output}`);
  console.log(`  ${done}/${total} planned scenarios automated (${pct}%)`);
  if (orphans.length) console.log(`  ${orphans.length} automated case(s) not present in any plan`);
}

main();
