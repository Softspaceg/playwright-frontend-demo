#!/usr/bin/env node
/**
 * Compiles a written report into one self-contained folder you can hand over whole.
 *
 *   node scripts/build-report.mjs <source.html> <out-dir> --evidence <dir>
 *
 * The source refers to its evidence the obvious way — `src="evidence/thing.png"`,
 * `href="evidence/thing.har"`. This copies those files next to the page, inlines the
 * images into the page as data URIs so it still shows its evidence when sent on its
 * own, and strips session credentials out of every recording.
 *
 * Traces are never copied: a trace runs to tens of megabytes and needs a viewer served
 * over http, not a double-click. The report explains how to regenerate one.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = name => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1];
};
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--evidence');
const [src, outDir] = positional;
const evidenceSrc = flag('--evidence');

if (!src || !outDir || !evidenceSrc) {
  console.error('usage: node scripts/build-report.mjs <source.html> <out-dir> --evidence <dir>');
  process.exit(2);
}

/**
 * Strips session credentials out of a recording.
 *
 * A HAR is a complete recording, so it carries the signed-in session in URLs, in
 * cookies and in JSON bodies. The report is meant to be handed around, and a working
 * token is a working login. Only the credential values are replaced; every request,
 * response, status and timing stays exactly as recorded, so the file still proves what
 * it was attached to prove.
 */
function redact(text) {
  let hits = 0;
  const bump = (_m, keep) => { hits++; return keep + 'REDACTED'; };
  text = text.replace(/((?:access|refresh)_token=)[A-Za-z0-9._-]+/g, bump);
  text = text.replace(/("name":"(?:access|refresh)_token","value":")[^"]+/g, bump);
  text = text.replace(/("(?:access|refresh)_token":")[^"]+/g, bump);
  return { text, hits };
}

let html = fs.readFileSync(src, 'utf8');

const unresolved = [...html.matchAll(/\{\{[^}]+\}\}/g)].map(m => m[0]);
if (unresolved.length) {
  console.error(`\n${unresolved.length} template placeholder(s) are still unfilled:`);
  console.error('  ' + [...new Set(unresolved)].slice(0, 12).join('\n  '));
  console.error('\nFill or delete them before building.');
  process.exit(1);
}

// ── images inline ──────────────────────────────────────────────────────────────
const images = [...new Set([...html.matchAll(/src="(evidence\/[^"]+\.(?:png|jpg|jpeg|webp))"/g)].map(m => m[1]))];
for (const rel of images) {
  const from = path.join(evidenceSrc, path.basename(rel));
  if (!fs.existsSync(from)) { console.error(`  MISSING  ${from}`); process.exit(1); }
  const ext = path.extname(rel).slice(1).replace('jpg', 'jpeg');
  const b64 = fs.readFileSync(from).toString('base64');
  html = html.replaceAll(`src="${rel}"`, `src="data:image/${ext};base64,${b64}"`);
  console.log(`  inlined  ${rel}  ${(b64.length / 1024).toFixed(0)} KB`);
}

const page = redact(html);
html = page.text;
if (page.hits) console.log(`  redacted ${page.hits} credentials in the page`);

// ── evidence beside the page ───────────────────────────────────────────────────
// Only the files the report actually links to or shows. Copying the whole directory
// would quietly ship recordings from tests this report never mentions.
const linked = new Set([
  ...images.map(r => path.basename(r)),
  ...[...html.matchAll(/href="(evidence\/[^"]+)"/g)].map(m => path.basename(m[1])),
]);

fs.mkdirSync(path.join(outDir, 'evidence'), { recursive: true });
for (const name of linked) {
  if (name.endsWith('.zip')) { console.log(`  skipped  ${name}  (trace: needs a viewer)`); continue; }
  const from = path.join(evidenceSrc, name);
  if (!fs.existsSync(from)) { console.error(`  MISSING  ${from}`); process.exit(1); }
  const to = path.join(outDir, 'evidence', name);
  if (name.endsWith('.har')) {
    const { text, hits } = redact(fs.readFileSync(from, 'utf8'));
    fs.writeFileSync(to, text);
    console.log(`  copied   evidence/${name}  (${hits} credentials redacted)`);
  } else {
    fs.copyFileSync(from, to);
    console.log(`  copied   evidence/${name}`);
  }
}

const out = path.join(outDir, 'index.html');
fs.writeFileSync(out, html);
console.log(`\n${out}  ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);

// A dead link costs the reader their trust in everything else on the page.
const links = [...new Set([...html.matchAll(/href="(evidence\/[^"]+)"/g)].map(m => m[1]))];
const missing = links.filter(l => !fs.existsSync(path.join(outDir, l)));
console.log(`${links.length} evidence links` + (missing.length ? `, MISSING: ${missing.join(', ')}` : ', all resolve'));
if (missing.length) process.exit(1);
