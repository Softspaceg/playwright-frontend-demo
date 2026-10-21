#!/usr/bin/env node
/**
 * Fills reports/_template/report-template.html from a run, with no person and no AI involved,
 * then builds it with build-report.mjs into one folder you can hand over.
 *
 *   node scripts/fill-report.mjs <tab> [--results artifacts/results.json] [--out reports/<module>/<tab>-auto]
 *   node scripts/fill-report.mjs products/products
 *
 * Where each part comes from:
 *   Bugs for developers   failing tests of the tab, their errors, ringed screenshot (annotatedShot) and HAR;
 *                    the human reading of each @SHOP-BUG-<n> comes from docs/defects.md
 *   For business     "Questions for Product" and "Recommendations" in the tab's plan
 *   What we need     planned cases that say "Blocked:" in the plan
 *   Performance      every request in the tab's HAR files, grouped by method and path
 *   What was tested  every planned case of the tab, with this run's result
 *
 * Nothing here is guessed. A failing test with no reading in docs/defects.md is shown as
 * "Not reviewed by QA yet" with an inferred owner; a failing test with no defect tag is "Not triaged yet", because
 * deciding whether the test or the product is wrong is a person's call.
 *
 * The run's exit code is not this script's business: it exits 0 when the report was built.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import dotenv from 'dotenv';
import { tab as tabConfig } from '../tabs.config.mjs';
import { readPlans } from './coverage.mjs';

// BASE_URL for the header: from the environment on CI, from .env locally. An existing variable wins.
dotenv.config({ path: '.env', quiet: true });

// ── arguments ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const tabName = argv.find((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
if (!tabName) {
  console.error('usage: node scripts/fill-report.mjs <tab> [--results <results.json>] [--out <dir>]');
  process.exit(2);
}
const scope = tabConfig(tabName);
const [moduleName, tabBase] = tabName.split('/');
const resultsFile = flag('--results', 'artifacts/results.json');

/**
 * Every build gets its own folder, numbered after the ones already there:
 * reports/products/products-v1 (written by hand), then -v2, -v3 … Nothing is ever overwritten.
 */
function nextVersion() {
  const dir = path.join('reports', moduleName);
  const taken = fs.existsSync(dir)
    ? fs.readdirSync(dir).map(n => n.match(new RegExp('^' + tabBase + '-v(\\d+)$'))?.[1]).filter(Boolean).map(Number)
    : [];
  return (taken.length ? Math.max(...taken) : 0) + 1;
}
const explicitOut = flag('--out', null);
const version = explicitOut ? null : nextVersion();
const outDir = explicitOut ?? path.join('reports', moduleName, `${tabBase}-v${version}`);
const versionLabel = version ? `v${version}` : path.basename(outDir);
const caseRe = new RegExp('^(?:' + scope.cases + ')$');

// ── helpers ────────────────────────────────────────────────────────────────────
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Escapes, then turns `code` and ==highlight== into markup, and newlines into breaks. */
const rich = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/==([^=]+)==/g, '<span class="hl">$1</span>')
  .replace(/\n/g, '<br>');
const stripAnsi = s => String(s ?? '').replace(/\x1b\[[0-9;]*m/g, '');
const kb = file => `${Math.max(1, Math.round(fs.statSync(file).size / 1024))} KB`;
const bare = t => (t.startsWith('@') ? t.slice(1) : t);

// ── the run ────────────────────────────────────────────────────────────────────
if (!fs.existsSync(resultsFile)) {
  console.error(`fill-report: ${resultsFile} not found. Run the tab first.`);
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
const tests = [];
const walk = suite => {
  for (const child of suite.suites ?? []) walk(child);
  for (const spec of suite.specs ?? []) {
    const tags = (spec.tags ?? []).map(bare);
    const id = tags.find(t => caseRe.test(t));
    if (!id) continue;
    for (const t of spec.tests ?? []) {
      const res = t.results?.at(-1) ?? {};
      tests.push({
        id,
        title: spec.title.replace(new RegExp('^' + id + '\\s*'), ''),
        tags,
        priority: ['critical', 'high', 'medium'].find(p => tags.includes(p)) ?? 'medium',
        bug: tags.find(x => /^SHOP-BUG-\d+$/.test(x)) ?? null,
        status: res.status ?? 'unknown',
        duration: res.duration ?? 0,
        errors: (res.errors ?? []).map(e => stripAnsi(e.message ?? '')),
        attachments: res.attachments ?? [],
      });
    }
  }
};
for (const s of report.suites ?? []) walk(s);
const byId = new Map(tests.map(t => [t.id, t]));
const failed = tests.filter(t => t.status === 'failed' || t.status === 'timedOut');
const ran = tests.filter(t => t.status !== 'skipped');
const passed = tests.filter(t => t.status === 'passed');
const runStart = report.stats?.startTime ? new Date(report.stats.startTime) : new Date();

// ── the plan ───────────────────────────────────────────────────────────────────
const planFile = path.join('specs', `${tabName}.plan.md`);
const planText = fs.existsSync(planFile) ? fs.readFileSync(planFile, 'utf8').replace(/\r\n/g, '\n') : '';
const planned = readPlans().filter(s => caseRe.test(s.id));

/** The body of a "## Heading" section of the plan, up to the next "## ". */
function section(title) {
  const start = planText.search(new RegExp('^## ' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*$', 'm'));
  if (start === -1) return '';
  const rest = planText.slice(start).split('\n').slice(1).join('\n');
  const end = rest.search(/^## /m);
  return end === -1 ? rest : rest.slice(0, end);
}

const questions = [...section('Questions for Product').matchAll(/^(\d+)\.\s+(.+)$/gm)]
  .map(m => ({ n: m[1], text: m[2].trim() }))
  .filter(q => !/^ANSWERED\b/i.test(q.text))
  .map(q => {
    const cut = q.text.indexOf('?');
    const head = cut === -1 ? q.text : q.text.slice(0, cut + 1);
    return { ...q, head: head.replace(/^\(New[^)]*\)\s*/, ''), rest: cut === -1 ? '' : q.text.slice(cut + 1).trim() };
  });

// ── QA's wording, written once: docs/defects.md and docs/report-notes.md ───────
/**
 * Reads "## <heading>" sections made of "- Key: value" lines (a value may continue on lines
 * indented by two spaces). Lines that are not key/value are kept in `_lines`.
 */
function readSections(file) {
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  let cur = null;
  let key = null;
  for (const line of fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n')) {
    const h = line.match(/^## (.+?)\s*$/);
    if (h) { cur = { _lines: [] }; map.set(h[1], cur); key = null; continue; }
    if (!cur) continue;
    const kv = line.match(/^- ([A-Za-z][A-Za-z ]*?):\s+(.*)$/);
    if (kv && !line.includes(' | ')) { key = kv[1].toLowerCase().replace(/\s+/g, ''); cur[key] = kv[2]; continue; }
    if (key && /^ {2,}\S/.test(line)) { cur[key] += '\n' + line.trim(); continue; }
    if (line.startsWith('- ')) cur._lines.push(line.slice(2).trim());
    if (line.trim() === '') key = null;
  }
  return map;
}
const defects = new Map([...readSections(path.join('docs', 'defects.md'))].filter(([k]) => /^SHOP-BUG-\d+$/.test(k)));
const notes = readSections(path.join('docs', 'report-notes.md'));
const noteFor = heading => notes.get(heading) ?? null;
/** The note whose "## R: <start>" matches the start of a plan recommendation. */
const recNote = text => [...notes].find(([k]) => k.startsWith('R: ') && text.startsWith(k.slice(3)))?.[1] ?? null;
const superseded = [...defects.values()].map(d => d.supersedes).filter(Boolean);

const recommendations = [...section('Recommendations').matchAll(/^- (.+)$/gm)]
  .map(m => m[1].trim())
  .filter(text => !superseded.some(s => text.startsWith(s)))
  .map(text => {
    const [what, cost] = text.split(/\s*Cost(?: of doing nothing)?:\s*/);
    return { what: what.trim(), cost: (cost ?? '').trim() };
  });

const stateNotes = [...section('Where state is kept').matchAll(/^- (.+)$/gm)].map(m => m[1].trim());
const storageRows = (noteFor('Storage')?._lines ?? []).map(l => l.split(' | ').map(c => c.trim())).filter(r => r.length === 3);

// ── evidence ───────────────────────────────────────────────────────────────────
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fill-report-'));
const evidenceDir = path.join(work, 'evidence');
fs.mkdirSync(evidenceDir);

function harEntries(test) {
  const har = test.attachments.find(a => a.name === 'network.har' && a.path && fs.existsSync(a.path));
  if (!har) return { file: null, entries: [] };
  try {
    return { file: har.path, entries: JSON.parse(fs.readFileSync(har.path, 'utf8')).log?.entries ?? [] };
  } catch {
    return { file: har.path, entries: [] };
  }
}
const isAppCall = e => ['fetch', 'xhr'].includes(e._resourceType);

/** Copies the test's recording(s) into the evidence folder; returns the file names. */
function videosOf(test) {
  const atts = test.attachments.filter(a => /^video(-\d+)?$/.test(a.name) && a.path && fs.existsSync(a.path));
  return atts.map((a, i) => {
    const name = `${test.id.toLowerCase()}${atts.length > 1 ? '-' + (i + 1) : ''}.webm`;
    if (!fs.existsSync(path.join(evidenceDir, name))) fs.copyFileSync(a.path, path.join(evidenceDir, name));
    return name;
  });
}

/**
 * Who most likely owns a failure, from what the browser recorded during the test. Always
 * shown as an inference; QA's reading in docs/defects.md replaces it.
 *   no app call at all             → Frontend: the screen produced the result itself
 *   an app call answered 4xx / 5xx → Backend
 *   the expected value is in a response but the screen showed something else → Frontend
 *   otherwise                      → unclear, QA decides
 */
function inferOwner(app, checks) {
  if (app.length === 0) {
    return { owner: 'Frontend', why: 'No request was sent during the test, so the screen produced this result itself.' };
  }
  const bad = app.filter(e => e.response.status >= 400);
  if (bad.length) {
    const e = bad[0];
    return { owner: 'Backend', why: `\`${e.request.method} ${new URL(e.request.url).pathname}\` answered ${e.response.status} during the test.` };
  }
  const unquote = s => String(s ?? '').replace(/^["'](.*)["']$/, '$1');
  for (const c of checks) {
    const want = unquote(c.expected);
    if (want.length < 3 || /^(true|false|\d+)$/.test(want)) continue;
    const hit = app.find(e => (e.response.content?.text ?? '').includes(want));
    if (hit) {
      return {
        owner: 'Frontend',
        why: `The value the test expected (“${want}”) was in the response to \`${hit.request.method} ${new URL(hit.request.url).pathname}\`, but the screen showed “${unquote(c.received)}”.`,
      };
    }
  }
  return { owner: null, why: 'Every request succeeded and the expected value was not in any response, so the recording alone cannot say. QA decides.' };
}

// ── Bugs for developers ─────────────────────────────────────────────────────────────
const rank = { critical: 0, high: 1, medium: 2 };
failed.sort((a, b) => rank[a.priority] - rank[b.priority]);

const devCards = failed.map((t, i) => {
  const d = (t.bug && defects.get(t.bug)) || null;
  const slug = (t.bug ?? 'untriaged') + '-' + t.id.toLowerCase();
  const sev = d?.severity ?? (t.priority[0].toUpperCase() + t.priority.slice(1));
  // Without QA's reading, the chip shows the run's inference (worked out below, once the
  // recording and the failed checks are read) and says it is one.
  let owner = d?.owner ?? null;
  const title = d?.title ?? t.title;
  const kind = t.bug ? 'Defect' : 'Needs triage';

  // Every ringed screenshot and its caption, exactly as the test attached them, in order:
  // a test that checks several steps can attach one per broken step.
  const shots = t.attachments.filter(a => a.name === 'defect — screenshot' && a.body);
  const caps = t.attachments.filter(a => a.name === 'defect — what this shows' && a.body);
  let shotHtml = '<div class="src" style="margin-top:0">No ringed screenshot was attached by the test. Playwright\'s own failure screenshot is in the run, but it is not evidence on its own.</div>';
  const files = [];
  if (shots.length) {
    shotHtml = shots.map((s, i) => {
      const name = shots.length > 1 ? `${slug}-${i + 1}.png` : `${slug}.png`;
      fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(s.body, 'base64'));
      files.push(name);
      const caption = caps[i] ? Buffer.from(caps[i].body, 'base64').toString('utf8') : 'No caption was attached.';
      return `<figure${i ? ' style="margin-top:14px"' : ''}><div class="shot"><img src="evidence/${name}" alt="${esc(caption)}"></div>
            <div class="caps"><div class="cap"><span>${i + 1}</span><div>${esc(caption)}</div></div></div></figure>`;
    }).join('\n');
  }
  const clips = videosOf(t);
  const videoHtml = clips.length
    ? clips.map(v => `<figure style="margin-top:14px"><video class="vid" controls preload="metadata" src="evidence/${v}"></video>
            <figcaption>The whole test, recorded on this run: open the page, every step, and the moment the check fails.</figcaption></figure>`).join('\n')
    : '<div class="src">No video was recorded for this test.</div>';
  files.push(...clips);
  const { file: harFile, entries } = harEntries(t);
  if (harFile) {
    const name = `${t.id.toLowerCase()}.har`;
    fs.copyFileSync(harFile, path.join(evidenceDir, name));
    files.push(name);
  }

  // On the wire, in the template's own block: each app call with its bodies, or, when the
  // screen made none, the page load and a plain statement that nothing else was sent.
  const app = entries.filter(isAppCall);
  const pathOf = e => new URL(e.request.url).pathname;
  const doc = entries.find(e => e._resourceType === 'document');
  const others = entries.filter(e => e !== doc);
  const wire = app.length
    ? app.slice(0, 6).map(e => `<div class="wire"><div class="w-h"><span class="verb${e.request.method === 'POST' ? ' post' : e.request.method === 'PATCH' ? ' patch' : e.request.method === 'DELETE' ? ' del' : ''}">${esc(e.request.method)}</span><span>${esc(pathOf(e))}</span><span class="st${e.response.status >= 400 ? ' bad' : ''}">${e.response.status}</span><span class="ms">${Math.round(e.time)} ms</span></div>
            <div class="w-b"><h6>Request</h6><pre>${esc(e.request.postData?.text ?? '(no body)')}</pre></div>
            <div class="w-b"><h6>Response</h6><pre>${esc((e.response.content?.text ?? '').slice(0, 1500) || '(no body)')}</pre></div></div>`).join('\n')
    : `<div class="wire">
            ${doc ? `<div class="w-h"><span class="verb">${esc(doc.request.method)}</span><span>${esc(pathOf(doc))}</span><span class="st${doc.response.status >= 400 ? ' bad' : ''}">${doc.response.status}</span><span class="ms">${Math.round(doc.time)} ms</span></div>` : ''}
            <div class="w-b"><h6>Request</h6><pre>${doc ? 'Page load only (document).' : 'No page load was recorded.'}${others.length ? ' Followed by ' + others.map(e => `${e.request.method} ${pathOf(e).split('/').pop()} ${e.response.status} (${Math.round(e.time)} ms)`).join(', ') + '.' : ''}</pre></div>
            <div class="w-b"><h6>Response</h6><pre>No app call (fetch or XHR) during the test: everything on this screen happens in the browser.</pre></div>
          </div>`;

  // What the test checked and what it got, read from the assertion messages: one row per
  // broken check. The full output stays one click away.
  const checks = t.errors.map(msg => {
    const lines = msg.split('\n');
    const label = (lines.find(l => /^Error:/.test(l)) ?? '').replace(/^Error:\s*/, '').replace(/^expect\(.*$/, '').trim();
    const expected = lines.find(l => /^\s*Expected[^:]*:/.test(l))?.replace(/^\s*Expected[^:]*:\s*/, '').trim();
    const received = lines.find(l => /^\s*Received[^:]*:/.test(l))?.replace(/^\s*Received[^:]*:\s*/, '').trim();
    return { label, expected, received };
  }).filter(c => c.expected !== undefined && c.received !== undefined && !/^[-+]\s*\d+$/.test(c.expected));
  const checksTable = checks.length
    ? `<table class="t"><thead><tr><th>Check</th><th>Expected</th><th>Actual</th></tr></thead><tbody>${checks.map(c => `<tr><td>${esc(c.label || '—')}</td><td>${esc(c.expected)}</td><td><span class="hl">${esc(c.received)}</span></td></tr>`).join('')}</tbody></table>`
    : '';
  const errorText = t.errors.join('\n\n').split('\n').filter(l => !/^\s+at\s/.test(l)).slice(0, 60).join('\n');
  const rawOutput = `<details style="margin-top:${checksTable ? 10 : 0}px"><summary style="cursor:pointer;color:var(--muted);font-size:12.5px">Full test output</summary><pre>${esc(errorText || '(no error text)')}</pre></details>`;

  // Until QA writes its reading, the run offers one, from the recording, labelled as an
  // inference. QA's reading in docs/defects.md always replaces it.
  const guess = inferOwner(app, checks);
  owner ??= guess.owner ? `Likely ${guess.owner}` : 'Owner not decided';
  const reading = d
    ? `<div class="own">
            <div class="o fe"><h5>${esc(owner)}</h5><p>${rich(d.frontend ?? '')}</p></div>
            <div class="o none"><h5>${d.backend && /^nothing/i.test(d.backend) ? 'Backend — nothing to do' : 'Backend'}</h5><p>${rich((d.backend ?? '').replace(/^Nothing to do\.\s*/i, ''))}</p></div>
          </div>`
    : `<div class="own">
            <div class="o ${guess.owner === 'Backend' ? 'be' : guess.owner === 'Frontend' ? 'fe' : 'none'}"><h5>${guess.owner ? 'Likely ' + guess.owner + ' — inferred, not confirmed' : 'Owner unclear from the run'}</h5><p>${rich(guess.why)}</p></div>
            <div class="o none"><h5>${t.bug ? 'Not reviewed by QA yet' : 'Not triaged yet'}</h5><p>${t.bug
              ? 'The test proves the rule is broken. QA will add who owns it and what it costs.'
              : 'QA has not yet decided whether the test or the product is wrong.'}</p></div>
          </div>`;

  const n = i + 1;
  return `
    <div class="card bug">
      <button class="card-btn" aria-expanded="false" aria-controls="d${n}">
        <span>
          <h3>${esc(title)}</h3>
          <span class="where">${esc(sev)} · ${esc(owner)} · ${esc(t.id)}${t.bug ? ' · @' + esc(t.bug) : ''}${d?.where ? ' · ' + esc(d.where) : ''}</span>
        </span>
        <span class="caret">▶</span>
      </button>
      <div id="d${n}" hidden>
      <div class="card-h" style="padding-top:0">
        <div class="chips"><span class="chip bug">${kind} · ${esc(sev)}</span><span class="chip id">${esc(t.id)}</span>${t.bug ? `<span class="chip id">${esc(t.bug)}</span>` : ''}<span class="chip ${/backend/i.test(owner) ? 'be' : 'fe'}">${esc(owner)}</span></div>
      </div>
      <dl class="rows">
        <div class="row"><dt>What is going on</dt><dd>${reading}</dd></div>
        ${d?.steps ? `<div class="row"><dt>Steps</dt><dd>${rich(d.steps)}</dd></div>` : ''}
        ${d?.expected ? `<div class="row"><dt>Expected</dt><dd>${rich(d.expected)}</dd></div>` : ''}
        ${d?.actual ? `<div class="row"><dt>Actual</dt><dd>${rich(d.actual)}</dd></div>` : ''}
        ${d?.impact ? `<div class="row impact"><dt>Impact</dt><dd>${rich(d.impact)}</dd></div>` : ''}
        <div class="row"><dt>${d ? 'What the test saw' : 'Expected vs actual'}</dt><dd>${checksTable}${rawOutput}</dd></div>
        <div class="row"><dt>On the wire</dt><dd>${wire}
          <div class="src">From evidence/${esc(t.id.toLowerCase())}.har, the recording of this test on this run.</div></dd></div>
        <div class="row"><dt>Evidence</dt><dd>${shotHtml}
          ${videoHtml}
          <div class="files" style="margin-top:12px">${files.map(f => `<a class="filelink" href="evidence/${f}">evidence/${f} <span class="sz">${kb(path.join(evidenceDir, f))}</span></a>`).join('')}</div>
        </dd></div>
      </dl>
      <div class="copybar"><button class="copybtn">Copy for tracker</button><span class="copyhint">${files[0] ? 'Attach ' + esc(files[0]) + ' · ' : ''}retest: <code>npx playwright test --grep "@${esc(t.bug ?? t.id)}"</code></span></div>
      </div>
    </div>`;
});

// ── For business ───────────────────────────────────────────────────────────────
const qCards = questions.map(q => {
  const n = noteFor('Q' + q.n);
  return `
      <div class="card" style="margin-bottom:0;border-left:4px solid var(--ask)">
        <button class="card-btn" aria-expanded="false" aria-controls="q${q.n}">
          <span><h3>${esc(n?.title ?? q.head)}</h3>
          <span class="where">Q${q.n}${n?.blocks ? ' · ' + (/^(affects|depends|refines|the )/i.test(n.blocks) ? esc(n.blocks[0].toUpperCase() + n.blocks.slice(1)) : 'Blocks ' + esc(n.blocks)) : ''}</span></span><span class="caret">▶</span></button>
        <div id="q${q.n}" hidden><dl class="rows">
          <div class="row"><dt>Observed</dt><dd>${rich(n?.observed ?? (q.rest || 'See the plan.'))}</dd></div>
          <div class="row"><dt>Why here</dt><dd>${rich(n?.whyhere ?? 'Nobody has settled the rule, so the suite does not assert it either way.')}</dd></div>
          ${n?.ifconfirmed ? `<div class="row fix"><dt>If confirmed</dt><dd>${rich(n.ifconfirmed)}</dd></div>` : ''}
        </dl></div>
      </div>`;
});
const rCards = recommendations.map((r, i) => {
  const n = recNote(r.what);
  return `
      <div class="card" style="margin-bottom:0;border-left:4px solid var(--enh)">
        <button class="card-btn" aria-expanded="false" aria-controls="r${i + 1}">
          <span><h3>${esc(n?.title ?? r.what)}</h3><span class="where">R${i + 1} · QA recommendation${n?.where ? ' · ' + esc(n.where) : ''}</span></span><span class="caret">▶</span></button>
        <div id="r${i + 1}" hidden><dl class="rows">
          ${n?.observed ? `<div class="row"><dt>Observed</dt><dd>${rich(n.observed)}</dd></div>` : ''}
          <div class="row"><dt>Our view</dt><dd>${rich(n?.ourview ?? r.what)}</dd></div>
          ${(n?.cost ?? r.cost) ? `<div class="row impact"><dt>Cost of doing nothing</dt><dd>${rich(n?.cost ?? r.cost)}</dd></div>` : ''}
          <div class="row"><dt>Status</dt><dd>QA's opinion, not a requirement. No test fails because of this.</dd></div>
        </dl></div>
      </div>`;
});

// ── What we need ───────────────────────────────────────────────────────────────
const blocked = planned.filter(s => s.blocked);
const needCards = blocked.map(s => {
  const n = noteFor('Need ' + s.id);
  return `
      <div class="need">
        <div class="n-top"><span class="n-id">${esc(s.id)}</span><span class="n-from">${esc(n?.owner ?? (/product/i.test(s.blocked) ? 'Product' : 'Owner to name'))}</span></div>
        <div class="n-block"><span class="n-lbl">Cannot test</span><p>${rich(n?.cannottest ?? s.title.replace(/^\[[^\]]*\]\s*/, ''))}</p></div>
        <div class="n-ask"><span class="n-lbl">We need</span><p><b>${rich(n?.weneed ?? s.blocked + '.')}</b>${n?.why ? ' ' + rich(n.why) : ''}</p></div>
      </div>`;
});

// ── Performance ────────────────────────────────────────────────────────────────
const groups = new Map();
let appCalls = 0;
for (const t of ran) {
  for (const e of harEntries(t).entries) {
    if (isAppCall(e)) appCalls++;
    const u = new URL(e.request.url);
    const k = `${e.request.method} ${u.pathname}`;
    const g = groups.get(k) ?? { k, app: isAppCall(e), times: [], status: new Set() };
    g.times.push(e.time);
    g.status.add(e.response.status);
    groups.set(k, g);
  }
}
const perfRows = [...groups.values()]
  .sort((a, b) => Math.max(...b.times) - Math.max(...a.times))
  .slice(0, 15)
  .map(g => {
    const worst = Math.round(Math.max(...g.times));
    const avg = Math.round(g.times.reduce((x, y) => x + y, 0) / g.times.length);
    return `<tr><td><code>${esc(g.k)}</code>${g.app ? '' : ' <span class="tag">page load</span>'}</td><td style="text-align:right;${worst > 2000 ? 'color:var(--bug);font-weight:600' : ''}">${worst} ms</td><td style="text-align:right">${avg} ms</td><td style="text-align:right">${g.times.length}</td><td style="text-align:right">${[...g.status].join(', ')}</td></tr>`;
  });
const slowest = [...groups.values()].map(g => Math.max(...g.times)).sort((a, b) => b - a)[0] ?? 0;

// ── What was tested ────────────────────────────────────────────────────────────
const resultCell = s => {
  const t = byId.get(s.id);
  if (t?.status === 'passed') return `<td style="color:var(--ok)">Passed${t.bug ? ` (${esc(t.bug)} did not reproduce)` : ''}</td>`;
  if (t && (t.status === 'failed' || t.status === 'timedOut')) return `<td style="color:var(--bug);font-weight:600">Failed${t.bug ? ' · ' + esc(t.bug) : ' · needs triage'}</td>`;
  if (t?.status === 'skipped') return '<td style="color:var(--muted)">Skipped</td>';
  if (s.blocked) return '<td style="color:var(--ask)">Blocked</td>';
  return '<td style="color:var(--muted)">Not automated yet</td>';
};
const videoCell = s => {
  const t = byId.get(s.id);
  const clips = t && t.status !== 'skipped' ? videosOf(t) : [];
  return `<td>${clips.map(v => `<a class="vidlink" href="evidence/${v}">▶ watch</a>`).join(' ') || '<span style="color:var(--muted)">—</span>'}</td>`;
};
const caseRows = planned.map(s => `<tr><td><code>${esc(s.id)}</code></td><td>${esc(s.title.replace(/^\[[^\]]*\]\s*/, ''))}</td>${resultCell(s)}${videoCell(s)}</tr>`);
const automatedPlanned = planned.filter(s => byId.has(s.id) && byId.get(s.id).status !== 'skipped').length;

// ── header and lead ────────────────────────────────────────────────────────────
const env = (process.env.BASE_URL ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '') || 'BASE_URL not set';
const when = runStart.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
const ci = process.env.GITHUB_RUN_ID ? `GitHub Actions run ${process.env.GITHUB_RUN_ID}` : 'local run';
const ids = planned.map(s => s.id).sort();
const forBusiness = questions.length + recommendations.length;
const firstDefect = failed[0];
// What works, said plainly: it is as much a result as the failures. Built from the passing
// tests' own titles, so it can never claim more than this run showed.
const lower = s => s.charAt(0).toLowerCase() + s.slice(1);
const passedTitles = passed.map(t => lower(t.title.replace(/\s*\(rule R\d+\)\s*$/, '')));
const works = passed.length === 0
  ? 'No automated case passed on this run.'
  : `${failed.length ? 'Everything else that was automated works' : 'Everything that was automated works'} (${passed.length} of ${ran.length}): ` +
    esc(passedTitles.length > 1 ? passedTitles.slice(0, -1).join('; ') + '; and ' + passedTitles.at(-1) : passedTitles[0]) + '.';
const headline = firstDefect
  ? `${esc((firstDefect.bug && defects.get(firstDefect.bug)?.title) || firstDefect.title)}.`
  : 'No automated case failed on this run.';

const body = `<header class="top">
  <div class="top-in">
    <div class="eyebrow">Demo Shop · ${esc(scope.label.replace(/^Demo Shop — /, ''))} · generated from the run</div>
    <h1>${esc(scope.label.replace(/^Demo Shop — /, ''))} — QA Findings</h1>
    <div class="meta">
      <span><b>Environment</b> ${esc(env)}</span>
      <span><b>Run</b> ${esc(when)} · ${esc(ci)}</span>
      <span><b>Scope</b> ${esc(tabName)} · cases ${esc(ids[0] ?? '-')} to ${esc(ids.at(-1) ?? '-')}</span>
      <span><b>Method</b> Automated browser tests, all network traffic recorded</span>
      <span><b>Version</b> ${esc(versionLabel)}</span>
    </div>
  </div>
</header>

<div class="wrap">
  <section class="lead">
    <p><strong>${failed.length} bugs for developers, ${forBusiness} for Product (${questions.length} questions, ${recommendations.length} recommendations), ${blocked.length} cases blocked.</strong>
      ${headline}
      ${works}</p>
    <div class="counts">
      <div class="c bug"><div class="n">${failed.length}</div><div class="l">Bugs for developers</div></div>
      <div class="c enh"><div class="n">0</div><div class="l">Enhancements</div></div>
      <div class="c ask"><div class="n">${forBusiness}</div><div class="l">For business</div></div>
      <div class="c ok"><div class="n">${passed.length}/${ran.length}</div><div class="l">Automated cases passing</div></div>
    </div>
  </section>

  <nav class="tabs" role="tablist" aria-label="Sections">
    <button class="tab" role="tab" aria-selected="true" aria-controls="p-dev" id="t-dev">Bugs for developers <span class="cnt">${failed.length}</span></button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="p-enh" id="t-enh">Enhancements <span class="cnt">0</span></button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="p-biz" id="t-biz">For business <span class="cnt">${forBusiness}</span></button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="p-need" id="t-need">What we need <span class="cnt">${blocked.length}</span></button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="p-perf" id="t-perf">Performance <span class="cnt">${appCalls}</span></button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="p-qa" id="t-qa">What was tested <span class="cnt">${automatedPlanned}</span></button>
    <button class="tab" role="tab" aria-selected="false" aria-controls="p-api" id="t-api">Storage reference</button>
  </nav>

  <section class="panel" role="tabpanel" id="p-dev" aria-labelledby="t-dev">
    <div class="audience">Assign to: the owner on each card</div>
    <h2>Defects and failures</h2>
    <p class="sub">Every automated case that failed on this run, most severe first. A <b>defect</b> carries a
      <code>@SHOP-BUG</code> tag; until QA reviews it, the owner shown is the run's inference from the recording. A failure marked <b>not triaged yet</b> has not yet been judged
      test-wrong or product-wrong.</p>
    ${devCards.join('\n') || '<div class="note">No automated case failed on this run.</div>'}
  </section>

  <section class="panel" role="tabpanel" id="p-enh" aria-labelledby="t-enh" hidden>
    <div class="audience">Assign to: Frontend · prioritise with Product</div>
    <h2>Enhancements</h2>
    <p class="sub">Enhancements are a QA judgement and are not generated from a run. None are recorded here;
      QA's suggestions are under For business as recommendations.</p>
  </section>

  <section class="panel" role="tabpanel" id="p-biz" aria-labelledby="t-biz" hidden>
    <div class="audience">Assign to: Product Manager &amp; BA</div>
    <h2>Questions and recommendations</h2>
    <p class="sub">Taken from the plan. None of these are defects. A <b>question</b> has no agreed answer, so
      the suite cannot say whether today's behaviour is right. A <b>recommendation</b> is QA's opinion.</p>
    <div class="rows" style="display:flex;flex-direction:column;gap:8px;border-top:0">
      ${[...qCards, ...rCards].join('\n') || '<div class="note">Nothing open for Product.</div>'}
    </div>
  </section>

  <section class="panel" role="tabpanel" id="p-need" aria-labelledby="t-need" hidden>
    <div class="audience">Owner named on each card</div>
    <h2>What we need to finish this tab</h2>
    <p class="sub">${blocked.length} cases are blocked on someone else. They stay in the plan and keep counting as gaps.</p>
    <div class="needs">${needCards.join('\n') || '<div class="note">Nothing is blocked.</div>'}</div>
  </section>

  <section class="panel" role="tabpanel" id="p-perf" aria-labelledby="t-perf" hidden>
    <div class="audience">Assign to: Frontend &amp; Backend</div>
    <h2>Response times</h2>
    <p class="sub">Measured on this run, not estimated. ${appCalls} app calls (fetch or XHR) across ${ran.length} tests;
      the table also lists page loads, grouped by method and path. Slowest request: ${Math.round(slowest)} ms.</p>
    ${appCalls === 0
      ? `<div class="note" style="margin-bottom:18px;border-left:4px solid var(--ok)"><strong>Nothing a shopper waits on.</strong>
      The screen made no request while it was used: search and filters run in the browser, so they respond as fast as the page can redraw.</div>`
      : `<div class="note" style="margin-bottom:18px;border-left:4px solid ${slowest > 2000 ? 'var(--bug)' : 'var(--ok)'}"><strong>${slowest > 2000 ? 'A shopper waits on this screen.' : 'No request is slow.'}</strong>
      The slowest request on this run took ${Math.round(slowest)} ms${slowest > 2000 ? ', above the 2 s the suite flags' : ''}.</div>`}
    <div style="overflow-x:auto">
      <table class="t">
        <thead><tr><th>Request</th><th style="text-align:right">Worst</th><th style="text-align:right">Average</th><th style="text-align:right">Calls</th><th style="text-align:right">Status</th></tr></thead>
        <tbody style="font-variant-numeric:tabular-nums">${perfRows.join('\n') || '<tr><td colspan="5">No requests recorded.</td></tr>'}</tbody>
      </table>
    </div>
    <div class="note" style="margin-top:20px">
      <strong>What this measurement cannot tell you.</strong> These are round-trip times seen by the browser on
      one run. They show where time goes, not why.
    </div>
  </section>

  <section class="panel" role="tabpanel" id="p-qa" aria-labelledby="t-qa" hidden>
    <div class="audience">For QA &amp; anyone re-running this</div>
    <h2>What was tested</h2>
    <p class="sub"><b>${automatedPlanned} of ${planned.length} planned cases automated · ${passed.length} pass · ${failed.length} fail.</b>
      ${blocked.length} are blocked (What we need).</p>
    <div style="overflow-x:auto">
      <table class="t">
        <thead><tr><th>Case</th><th>What it checks</th><th>Result</th><th>Video</th></tr></thead>
        <tbody>${caseRows.join('\n')}</tbody>
      </table>
    </div>
    <h2 style="margin-top:26px">Re-running</h2>
    <p class="sub" style="margin-top:6px">From <code>qa-automation/</code>: <code>npm run tab -- ${esc(tabName)}</code>.</p>
  </section>

  <section class="panel" role="tabpanel" id="p-api" aria-labelledby="t-api" hidden>
    <div class="audience">Reference</div>
    <h2>Confirmed storage behaviour</h2>
    <p class="sub">The app has no API, so this tab records where state lives instead. The app's calls on
      this run are under Performance.</p>
    ${storageRows.length
      ? `<div style="overflow-x:auto"><table class="t"><thead><tr><th>Action</th><th>Where</th><th>Result</th></tr></thead><tbody>
          ${storageRows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>`
      : `<ul class="p">${stateNotes.map(n => `<li>${rich(n)}</li>`).join('\n') || '<li>Not recorded in the plan.</li>'}</ul>`}
    <h2 style="margin-top:30px">About the attached files</h2>
    <div style="overflow-x:auto">
      <table class="t">
        <thead><tr><th>File</th><th>What it is</th><th>How to open it</th></tr></thead>
        <tbody>
          <tr><td><code>.png</code></td><td>The screen at the moment of the finding, with the part that matters ringed in red and the rest dimmed.</td><td>Any image viewer. They are also embedded in this page.</td></tr>
          <tr><td><code>.har</code></td><td>Every network request the browser made during that test.</td><td>DevTools &rarr; Network &rarr; the import arrow, then drop the file in.</td></tr>
          <tr><td><code>.webm</code></td><td>A video of the whole test, from opening the page to the last check.</td><td>Plays in the page. On its own: Chrome, Edge or Firefox, or VLC.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="src" style="margin-top:12px">Session tokens in the HARs are replaced with <code>REDACTED</code>; nothing else is altered.</p>
  </section>
</div>
`;

// ── assemble with the agreed template's styles and script, then build ─────────
const template = fs.readFileSync(path.join('reports', '_template', 'report-template.html'), 'utf8');
const headEnd = template.indexOf('</style><header');
const scriptStart = template.indexOf('<script>');
if (headEnd === -1 || scriptStart === -1) {
  console.error('fill-report: the template no longer has the expected </style><header and <script> markers.');
  process.exit(1);
}
const head = template.slice(0, headEnd + '</style>'.length)
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(scope.label.replace(/^Demo Shop — /, ''))} QA Findings</title>`);
const html = head + '\n' + body + template.slice(scriptStart);
const source = path.join(work, 'report.html');
fs.writeFileSync(source, html);

if (fs.existsSync(outDir)) {
  console.error(`fill-report: ${outDir} already exists. Reports are never overwritten; omit --out to get the next version.`);
  process.exit(1);
}
const built = spawnSync(process.execPath, ['scripts/build-report.mjs', source, outDir, '--evidence', evidenceDir], { stdio: 'inherit' });
fs.rmSync(work, { recursive: true, force: true });
if (built.status !== 0) process.exit(built.status ?? 1);

// Tells whoever ran this where the report went: run-and-summarize.mjs records it in the run
// folder, and on GitHub Actions later steps read it as $QA_REPORT_DIR.
fs.writeFileSync(path.join('reports', moduleName, `.${tabBase}-latest`), outDir.replace(/\\/g, '/') + '\n');
if (process.env.GITHUB_ENV) fs.appendFileSync(process.env.GITHUB_ENV, `QA_REPORT_DIR=qa-automation/${outDir.replace(/\\/g, '/')}\n`);

console.log(`Report ${versionLabel}: ${path.join(outDir, 'index.html')}  (${failed.length} bugs for developers, ${forBusiness} for business, ${blocked.length} blocked)`);
