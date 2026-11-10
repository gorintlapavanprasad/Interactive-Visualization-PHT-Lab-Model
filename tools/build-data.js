#!/usr/bin/env node
/*
 * Build assets/js/data.js from a Covidence "extraction" CSV export.
 *
 *     node tools/build-data.js <covidence-export.csv>            # build + audit
 *     node tools/build-data.js <covidence-export.csv> --dry-run  # report only, write nothing
 *
 * What it does (in order):
 *   1. Parses the CSV (quoted fields, embedded commas/newlines, UTF-8 BOM).
 *   2. Checks that every column the dashboard needs is present.
 *   3. Keeps only the "Consensus" rows (one per study). Individual reviewers'
 *      rows are dropped, so reviewer names never reach the website.
 *   4. Drops the "Covidence #" and "Reviewer Name" columns and the duplicate "Title" column.
 *   5. Cleans values: trims spaces, collapses repeated spaces, turns numeric
 *      cells into numbers, reduces DOIs to the bare "10.xxxx/…" form, and fixes
 *      known spelling mistakes in the answer options (e.g. "Symetrical").
 *   6. Makes duplicate Study IDs unique ("Zhang 2023" -> "Zhang 2023a", "Zhang 2023b").
 *   7. Prints what changed compared with the current data.js, writes the new file,
 *      and runs tools/audit-data.js. Exit code is non-zero if anything is wrong.
 *
 * The raw export is NOT needed on the website. Keep it in data/raw/, which is
 * git-ignored, or anywhere outside the repo.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const OUT = path.join(root, 'assets/js/data.js');
const args = process.argv.slice(2);
const input = args.find(a => !a.startsWith('--'));
const DRY = args.includes('--dry-run');
if (!input) {
  console.error('Usage: node tools/build-data.js <covidence-export.csv> [--dry-run]');
  process.exit(2);
}

// ---------------------------------------------------------------- helpers ----
function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('CSV ends inside a quoted field — the file is probably truncated.');
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.length > 1 || r[0] !== '');
}

// Pure helpers shared with the app (normalizeDoi, FILTER_SPECS), loaded from the
// assets/js/core.js, so the website and the pipeline can never disagree.
function loadAppHelpers() {
  const src = fs.readFileSync(path.join(root, 'assets/js/core.js'), 'utf8');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(src + '\n;this.FILTER_SPECS=FILTER_SPECS;this.normalizeDoi=normalizeDoi;', ctx);
  return ctx;
}

function loadCurrentData() {
  if (!fs.existsSync(OUT)) return [];
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(OUT, 'utf8'), ctx);
  return (ctx.window.myModule && ctx.window.myModule.filteredModuleData) || [];
}

// Display-quality spelling fixes for answer options (case-preserving).
// The app also tolerates the old spellings, so filters keep working either way.
const DISPLAY_FIXES = [
  [/\bAsymetrical\b/g, 'Asymmetrical'], [/\basymetrical\b/g, 'asymmetrical'],
  [/\bSymetrical\b/g, 'Symmetrical'], [/\bsymetrical\b/g, 'symmetrical'],
  [/\basychronous\b/g, 'asynchronous'], [/\basycnronous\b/g, 'asynchronous'], [/\basynchrounous\b/g, 'asynchronous'],
  [/\bUnkown\b/g, 'Unknown']
];
const TEXT_COLUMNS_NOT_TO_FIX = new Set(['Title', 'Notes (e.g., Why does the paper not fit the framework?)', 'Lead author contact details']);

// ------------------------------------------------------------------ build ----
const helpers = loadAppHelpers();
const rows = parseCSV(fs.readFileSync(path.resolve(input), 'utf8'));
if (rows.length < 2) throw new Error('The CSV has no data rows.');

// Header names: trim, and suffix duplicates the same way the existing data does ("Other Disabled__1").
const rawHeader = rows[0].map(h => h.trim());
const seen = {};
const header = rawHeader.map(h => { seen[h] = (seen[h] || 0) + 1; return seen[h] > 1 ? `${h}__${seen[h] - 1}` : h });

const problems = [];
const notes = [];

// Required columns: identifiers plus every column a dashboard filter uses.
const required = new Set(['Covidence #', 'Study ID', 'Title', 'Reviewer Name', 'DOI', 'Year', 'Lead author contact details', 'Participant Groups']);
for (const group of Object.values(helpers.FILTER_SPECS)) for (const col of Object.keys(group)) required.add(col);
const missing = [...required].filter(c => !header.includes(c));
if (missing.length) {
  console.error('Missing columns the dashboard needs:\n  ' + missing.join('\n  '));
  console.error('Was the Covidence extraction template changed? Update FILTER_SPECS in assets/js/core.js to match.');
  process.exit(1);
}

const col = (name) => header.indexOf(name);
const iReviewer = col('Reviewer Name'), iCovidence = col('Covidence #');
const DROP = new Set(['Covidence #', 'Reviewer Name', 'Title__1']);
const body = rows.slice(1);
const badWidth = body.filter(r => r.length !== header.length);
if (badWidth.length) problems.push(`${badWidth.length} row(s) have ${badWidth[0].length} cells instead of ${header.length} — the CSV may be damaged.`);

const consensus = body.filter(r => String(r[iReviewer] || '').trim() === 'Consensus');
const allStudies = new Set(body.map(r => r[iCovidence]).filter(Boolean));
const withConsensus = new Set(consensus.map(r => r[iCovidence]));
const noConsensus = [...allStudies].filter(id => !withConsensus.has(id));
if (noConsensus.length) notes.push(`${noConsensus.length} study(ies) have reviewer rows but no Consensus row yet, so they are NOT on the dashboard: Covidence # ${noConsensus.join(', ')}`);
const dupConsensus = consensus.map(r => r[iCovidence]).filter((id, i, a) => a.indexOf(id) !== i);
if (dupConsensus.length) problems.push(`Covidence # with more than one Consensus row: ${[...new Set(dupConsensus)].join(', ')}`);

let fixedSpelling = 0, fixedDoi = 0, collapsed = 0;
const studies = consensus.map(r => {
  const o = {};
  header.forEach((h, i) => {
    if (DROP.has(h) || !h) return;
    let v = String(r[i] ?? '').trim();
    const c = v.replace(/[ \t]{2,}/g, ' ');
    if (c !== v) { collapsed++; v = c }
    if (h === 'DOI') {
      const d = helpers.normalizeDoi(v);
      if (v && !d) problems.push(`Unusable DOI for ${o['Study ID'] || '?'}: "${v}"`);
      if (d !== v) fixedDoi++;
      v = d;
    } else if (!TEXT_COLUMNS_NOT_TO_FIX.has(h)) {
      const before = v;
      DISPLAY_FIXES.forEach(([re, to]) => { v = v.replace(re, to) });
      if (v !== before) fixedSpelling++;
    }
    o[h] = v !== '' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  });
  return o;
});

// Unique Study IDs: "Zhang 2023" x2 -> "Zhang 2023a", "Zhang 2023b" (in CSV order).
const byId = {};
studies.forEach(s => (byId[s['Study ID']] = byId[s['Study ID']] || []).push(s));
const renamed = [];
Object.entries(byId).filter(([, list]) => list.length > 1).forEach(([id, list]) => {
  list.forEach((s, i) => { s['Study ID'] = `${id}${String.fromCharCode(97 + i)}` });
  renamed.push(`${id} -> ${list.map(s => s['Study ID']).join(', ')}`);
});

// Basic sanity checks
studies.forEach(s => {
  if (!s['Study ID']) problems.push('A Consensus row has no Study ID.');
  if (!s.Title) problems.push(`${s['Study ID']}: missing Title.`);
  if (typeof s.Year !== 'number' || s.Year < 1950 || s.Year > new Date().getFullYear() + 1) problems.push(`${s['Study ID']}: odd Year "${s.Year}".`);
});
const replacementChars = studies.filter(s => Object.values(s).some(v => String(v).includes('�'))).length;
if (replacementChars) problems.push(`${replacementChars} study(ies) contain "�" characters — export the CSV as UTF-8.`);

// ------------------------------------------------------- compare with old ----
const current = loadCurrentData();
const key = s => helpers.normalizeDoi(s.DOI) || String(s.Title || '').toLowerCase();
const oldMap = new Map(current.map(s => [key(s), s]));
const newMap = new Map(studies.map(s => [key(s), s]));
const added = studies.filter(s => !oldMap.has(key(s)));
const removed = current.filter(s => !newMap.has(key(s)));
let changedStudies = 0;
const changedFields = {};
studies.forEach(s => {
  const old = oldMap.get(key(s));
  if (!old) return;
  let changed = false;
  for (const k of new Set([...Object.keys(s), ...Object.keys(old)])) {
    if (k === 'Title__1') continue;
    if (String(old[k] ?? '').trim() !== String(s[k] ?? '').trim()) { changed = true; changedFields[k] = (changedFields[k] || 0) + 1 }
  }
  if (changed) changedStudies++;
});

// ------------------------------------------------------------------ report ----
console.log(`Input: ${path.resolve(input)}`);
console.log(`Rows: ${body.length} (${consensus.length} Consensus, ${body.length - consensus.length} individual reviewer rows dropped)`);
console.log(`Studies: ${studies.length}   Columns: ${Object.keys(studies[0] || {}).length}`);
console.log(`Cleaned: ${fixedDoi} DOIs normalised, ${fixedSpelling} spelling fixes, ${collapsed} repeated spaces collapsed`);
if (renamed.length) console.log('Duplicate Study IDs made unique:\n  ' + renamed.join('\n  '));
console.log(`\nCompared with the current data.js (${current.length} studies):`);
console.log(`  added:   ${added.length}${added.length ? '  — ' + added.slice(0, 10).map(s => s['Study ID']).join(', ') + (added.length > 10 ? ' …' : '') : ''}`);
console.log(`  removed: ${removed.length}${removed.length ? '  — ' + removed.slice(0, 10).map(s => s['Study ID']).join(', ') + (removed.length > 10 ? ' …' : '') : ''}`);
console.log(`  changed: ${changedStudies} studies` + (Object.keys(changedFields).length ? ' (' + Object.entries(changedFields).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} x${n}`).join(', ') + ')' : ''));
notes.forEach(n => console.log('\nNOTE: ' + n));
if (problems.length) {
  console.error('\nPROBLEMS:\n  ' + [...new Set(problems)].join('\n  '));
  console.error('\nNothing was written. Fix the export (or this script) and run again.');
  process.exit(1);
}
if (DRY) { console.log('\n--dry-run: nothing written.'); process.exit(0) }

// ------------------------------------------------------------------- write ----
const banner = `// GENERATED FILE — do not edit by hand.
// Built by tools/build-data.js from ${path.basename(input)} on ${new Date().toISOString().slice(0, 10)}.
// ${studies.length} studies (Covidence Consensus rows). To update: export the
// extraction CSV from Covidence and run  node tools/build-data.js <file.csv>
`;
const js = banner + 'const uniqueConsensusData = ' + JSON.stringify(studies, null, 4) + ';\n\n' +
  'window.myModule = {\n    filteredModuleData: uniqueConsensusData\n};\n';
fs.writeFileSync(OUT, js.replace(/\r?\n/g, '\r\n'));
console.log(`\nWrote ${path.relative(root, OUT)} (${(Buffer.byteLength(js) / 1024 / 1024).toFixed(2)} MB). Running the audit…\n`);

const audit = spawnSync(process.execPath, [path.join(__dirname, 'audit-data.js')], { stdio: 'inherit' });
process.exit(audit.status);
