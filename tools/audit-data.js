#!/usr/bin/env node
/*
 * Data audit for the PHT Lab dashboard.
 *
 * Run after every new Covidence export is converted into assets/js/data.js:
 *
 *     node tools/audit-data.js
 *
 * It uses the dashboard's own matching rules (FILTER_SPECS, canon(),
 * splitValues() from assets/js/script.js) and the grid cells in index.html,
 * and reports anything that would make the dashboard silently miscount:
 *   - filter options that match no study,
 *   - data answers that no filter option / grid cell can reach,
 *   - duplicate Study IDs, missing DOIs, empty framework ratings.
 * Exit code is 1 when a problem that changes counts is found, so it can run in CI.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// --- load data.js (defines window.myModule) ---
const dataCtx = { window: {}, console };
vm.createContext(dataCtx);
vm.runInContext(read('assets/js/data.js'), dataCtx);
const rows = dataCtx.window.myModule.filteredModuleData;

// --- load the pure helper section at the top of script.js (no DOM needed) ---
const script = read('assets/js/script.js');
const pureEnd = script.indexOf('var LOOKUP_CACHE');
if (pureEnd < 0) throw new Error('Could not find helper section in script.js');
const helperCtx = {};
vm.createContext(helperCtx);
vm.runInContext(script.slice(0, pureEnd) + '\n;this.FILTER_SPECS=FILTER_SPECS;this.canon=canon;this.splitValues=splitValues;', helperCtx);
const { FILTER_SPECS, canon, splitValues } = helperCtx;

// --- grid cells from index.html ---
const html = read('index.html');
const gridCells = {}; // dimension -> Set(canon(label))
for (const m of html.matchAll(/<tr data-row=["']([^"']+)["']>([\s\S]*?)<\/tr>/g)) {
  const set = gridCells[m[1]] || (gridCells[m[1]] = new Set());
  for (const c of m[2].matchAll(/data-column="([^"]+)"/g)) set.add(canon(c[1]));
}

let problems = 0;
const section = (t) => console.log(`\n=== ${t} ===`);
const warn = (msg, counts = true) => { if (counts) problems++; console.log('  ' + msg); };

console.log(`Studies: ${rows.length}   Columns: ${Object.keys(rows[0] || {}).length}`);

section('Duplicate Study IDs (different papers sharing "Author Year")');
const byId = {};
rows.forEach(r => (byId[r['Study ID']] = byId[r['Study ID']] || []).push(r));
Object.entries(byId).filter(([, v]) => v.length > 1)
  .forEach(([id, v]) => warn(`${id}: ${v.map(r => r.DOI || '(no DOI)').join(' | ')}`, false));

section('Missing DOI');
rows.filter(r => !String(r.DOI || '').trim()).forEach(r => warn(r['Study ID'], false));

section('Filter options that match no study');
for (const group of Object.values(FILTER_SPECS)) {
  for (const [col, opts] of Object.entries(group)) {
    if (!rows.some(r => col in r)) { warn(`COLUMN MISSING FROM DATA: "${col}"`); continue; }
    const present = new Set();
    rows.forEach(r => splitValues(r[col]).forEach(v => present.add(canon(v).startsWith('other') ? 'other' : canon(v))));
    Object.values(opts).forEach(label => { if (!present.has(canon(label))) warn(`[${col}] "${label}" (0 studies)`, false); });
  }
}

section('Data answers that no filter option can select');
for (const group of Object.values(FILTER_SPECS)) {
  for (const [col, opts] of Object.entries(group)) {
    const known = new Set(Object.values(opts).map(canon));
    const unreachable = {};
    rows.forEach(r => splitValues(r[col]).forEach(v => {
      const c = canon(v);
      if (!known.has(c) && !(c.startsWith('other') && known.has('other'))) unreachable[v] = (unreachable[v] || 0) + 1;
    }));
    Object.entries(unreachable).forEach(([v, n]) => warn(`[${col}] "${v}" x${n}`));
  }
}

section('Framework answers with no grid cell (Ratings / Spectrum tabs)');
for (const [dim, cells] of Object.entries(gridCells)) {
  const missing = {};
  rows.forEach(r => splitValues(r[dim]).forEach(v => {
    const c = canon(v);
    if (c === 'not applicable' || c.startsWith('undisclosed/unknown')) return; // intentionally not on the grid
    if (!cells.has(c)) missing[v] = (missing[v] || 0) + 1;
  }));
  Object.entries(missing).forEach(([v, n]) => warn(`[${dim}] "${v}" x${n}`));
}

section('Studies with an empty framework rating');
Object.keys(gridCells).forEach(dim => {
  const empty = rows.filter(r => !String(r[dim] ?? '').trim()).map(r => r['Study ID']);
  if (empty.length) warn(`[${dim}] ${empty.join(', ')}`, false);
});

console.log(problems
  ? `\n${problems} problem(s) that change dashboard counts.`
  : '\nNo problems that change dashboard counts. (Items listed above are informational.)');
process.exitCode = problems ? 1 : 0;
