#!/usr/bin/env node
/*
 * Fast tests without a browser (about 2 seconds):
 *   - core.js: answer matching, spelling normalisation, DOIs, the search engine
 *   - data.js: invariants for every study (IDs, years, DOIs, no reviewer data, ...)
 *   - consistency between FILTER_SPECS, the filter menus in index.html and the grids
 *   - tools/build-data.js on made-up Covidence CSVs (good and broken inputs)
 *
 *     cd tools && node unit-test.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ------------------------------------------------------------- harness ----
const results = [];
let section = '';
function test(name, fn) {
  try { fn(); results.push({ section, name, ok: true }); }
  catch (e) { results.push({ section, name, ok: false, err: e.message }); }
}
function eq(actual, expected, msg = '') {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg}expected ${b}, got ${a}`);
}
function ok(cond, msg = 'condition was false') { if (!cond) throw new Error(msg); }
function group(name) { section = name; }

// ------------------------------------------------------------- load app ----
const core = {};
vm.createContext(core);
vm.runInContext(read('assets/js/core.js') + `
;this.FILTER_SPECS=FILTER_SPECS;this.canon=canon;this.splitValues=splitValues;this.escapeHtml=escapeHtml;
this.rowMatchesLabels=rowMatchesLabels;this.normalizeDoi=normalizeDoi;this.doiUrl=doiUrl;this.foldText=foldText;
this.parseSearchQuery=parseSearchQuery;this.termRegex=termRegex;this.searchScore=searchScore;this.buildSearchIndex=buildSearchIndex;`, core);
const { FILTER_SPECS, canon, splitValues, escapeHtml, rowMatchesLabels, normalizeDoi, doiUrl, foldText, parseSearchQuery, termRegex, searchScore, buildSearchIndex } = core;
const dataCtx = { window: {} };
vm.createContext(dataCtx);
vm.runInContext(read('assets/js/data.js'), dataCtx);
const data = dataCtx.window.myModule.filteredModuleData;
const gridsSrc = read('assets/js/grids.js');
const SPECTRUM_ROWS = vm.runInNewContext(gridsSrc.match(/const SPECTRUM_ROWS = (\[[\s\S]*?\n\]);/)[1]);
const html = read('index.html');
const want = (labels) => labels.map(canon);

// ============================================================== core.js ====
group('Answer matching');
test('canon lowercases and trims', () => eq(canon('  Entirely Solo  '), 'entirely solo'));
test('canon drops a trailing "(i.e., …)" example', () => eq(canon('Entirely Solo (i.e., Solitaire)'), 'entirely solo'));
test('canon drops a trailing "(e.g., …)" example', () => eq(canon('Specialists (e.g., therapists, teachers)'), 'specialists'));
test('canon keeps brackets that are not examples', () => eq(canon('Blind or low vision (BLV)'), 'blind or low vision (blv)'));
test('canon fixes Symetrical / Asymetrical', () => { eq(canon('Entirely Symetrical'), 'entirely symmetrical'); eq(canon('Mostly Asymetrical'), 'mostly asymmetrical'); });
test('canon fixes asychronous / asycnronous / asynchrounous', () => ['Mostly Synchronous with few asychronous affordances', 'Mostly asycnronous with few synchronous affordances', 'Entirely asynchrounous'].forEach(v => ok(/asynchronous/.test(canon(v)) && !/asych|asycn|asynchrou/.test(canon(v)), v)));
test('canon fixes Unkown', () => eq(canon('Undisclosed/Unkown'), 'undisclosed/unknown'));
test('canon collapses repeated spaces', () => eq(canon('Mostly skill-based (i.e.,  Mario Cart)'), canon('Mostly skill-based (i.e., Mario Cart)')));
test('canon treats "any time but" and "any time, but" the same', () => eq(canon('Most actions can be taken at any time but there are some phases'), canon('Most actions can be taken at any time, but there are some phases')));
test('splitValues splits on ";" and trims', () => eq(splitValues(' Interview;  Survey ;'), ['Interview', 'Survey']));
test('splitValues handles empty, null and numbers', () => { eq(splitValues(''), []); eq(splitValues(null), []); eq(splitValues(undefined), []); eq(splitValues(2020), ['2020']); });
test('a single answer matches its label', () => ok(rowMatchesLabels('Interview', want(['Interview']))));
test('multi-answer cells match each of their answers', () => { ok(rowMatchesLabels('Usability testing; Survey', want(['Survey']))); ok(rowMatchesLabels('Usability testing; Survey', want(['Usability testing']))); });
test('empty cells never match', () => { ok(!rowMatchesLabels('', want(['Interview']))); ok(!rowMatchesLabels(null, want(['Other']))); });
test('free-text "Other: …" counts as Other', () => ok(rowMatchesLabels('Other: Video elicitation', want(['Other']))));
test('no substring false positives (with/without, Symmetrical/Asymmetrical)', () => {
  ok(!rowMatchesLabels('People without disabilities', want(['People with disabilities'])), 'with vs without');
  ok(!rowMatchesLabels('Mostly Asymmetrical (i.e., Tag)', want(['Mostly Symmetrical (i.e., Uno)'])), 'Symmetrical vs Asymmetrical');
  ok(!rowMatchesLabels('Semi-structured interview', want(['Structured interview'])), 'structured vs semi-structured');
});
test('example text in the data does not block a match', () => ok(rowMatchesLabels('Mostly skill-based (i.e.,  Mario Cart)', want(['Mostly skill-based (i.e., Mario Cart)']))));
test('escapeHtml escapes & < > " \'', () => eq(escapeHtml(`<a href="x" title='y'>&</a>`), '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;'));
test('escapeHtml handles null and numbers', () => { eq(escapeHtml(null), ''); eq(escapeHtml(42), '42'); });

group('DOIs');
test('bare DOI is kept', () => eq(normalizeDoi('10.1145/3308561.3353775'), '10.1145/3308561.3353775'));
test('https://doi.org/ prefix is removed', () => eq(normalizeDoi('https://doi.org/10.1145/228347.228365'), '10.1145/228347.228365'));
test('http://dx.doi.org/ prefix is removed', () => eq(normalizeDoi('http://dx.doi.org/10.1000/xyz123'), '10.1000/xyz123'));
test('"doi:" prefix is removed', () => eq(normalizeDoi('doi: 10.1000/abc'), '10.1000/abc'));
test('the corrupted Alsaleem 2019 value is repaired', () => eq(normalizeDoi('http://dx.doi.org/10.1145/ 10.1145/3308561.3353775'), '10.1145/3308561.3353775'));
test('when a cell holds two DOIs, the last (corrected) one wins', () => eq(normalizeDoi('https://doi.org/10.1000/old-typo https://doi.org/10.1145/3308561.3353775'), '10.1145/3308561.3353775'));
test('trailing punctuation is dropped', () => { eq(normalizeDoi('10.1145/123.456.'), '10.1145/123.456'); eq(normalizeDoi('(10.1145/123)'), '10.1145/123'); });
test('empty or non-DOI text gives ""', () => { eq(normalizeDoi(''), ''); eq(normalizeDoi(null), ''); eq(normalizeDoi('not a doi'), ''); eq(normalizeDoi('10.12/x'), ''); });
test('doiUrl builds a doi.org link and keeps "/"', () => eq(doiUrl('10.1145/3308561.3353775'), 'https://doi.org/10.1145/3308561.3353775'));
test('doiUrl encodes unsafe characters', () => eq(doiUrl('10.1002/(SICI)1097#x<y>'), 'https://doi.org/10.1002/(SICI)1097%23x%3Cy%3E'));
test('doiUrl of "" is ""', () => eq(doiUrl(''), ''));

group('Search engine');
const groupsOf = q => parseSearchQuery(q).groups;
test('accents are ignored (música = musica)', () => eq(foldText('Música Jesús'), 'musica jesus'));
test('two words are two AND groups', () => eq(groupsOf('blind game').length, 2));
test('a quoted phrase is one group', () => { const g = groupsOf('"tactile drawing"'); eq(g.length, 1); ok(g[0].includes('tactile drawing')); });
test('OR merges words into one group', () => { const g = groupsOf('blind OR deaf'); eq(g.length, 1); ok(g[0].includes('blind') && g[0].includes('deaf')); });
test('-word is an exclusion', () => { const p = parseSearchQuery('blind -game'); eq(p.negatives, ['game']); eq(p.groups.length, 1); });
test('-"phrase" is an exclusion of the phrase', () => eq(parseSearchQuery('blind -"virtual reality"').negatives, ['virtual reality']));
test('abbreviations expand (vr -> virtual reality)', () => ok(groupsOf('vr')[0].includes('virtual reality')));
test('known phrases expand without quotes (virtual reality -> vr)', () => { const g = groupsOf('virtual reality'); eq(g.length, 1); ok(g[0].includes('vr')); });
test('BLV and blind are synonyms both ways', () => { ok(groupsOf('blv')[0].includes('blind')); ok(groupsOf('blind')[0].includes('blv')); });
test('a lone OR or a lone "-" is ignored', () => { eq(groupsOf('OR').length, 0); eq(parseSearchQuery('-').negatives.length, 0); });
test('empty query gives no groups', () => { eq(groupsOf('').length, 0); eq(groupsOf('   ').length, 0); });
test('short terms match whole words only ("ar" not in "research")', () => { ok(!termRegex('ar').test('research games')); ok(termRegex('ar').test('mobile ar app')); });
test('longer terms match word starts ("game" finds "games", not "endgame")', () => { ok(termRegex('game').test('serious games')); ok(!termRegex('game').test('endgame')); });
test('regex characters in queries are safe', () => { ok(termRegex('c++').test('c++ code')); ok(!termRegex('a.b').test('axb')); });
const S = (o) => { const r = { 'Study ID': 'X 2020', Title: '', 'Lead author contact details': '', DOI: '', Notes: '', ...o }; buildSearchIndex([r]); return r; };
test('a title match outranks a match in another field', () => {
  const inTitle = S({ Title: 'A tactile game' }), elsewhere = S({ Title: 'Something', 'Community of focus': 'tactile' });
  const q = parseSearchQuery('tactile');
  ok(searchScore(inTitle, q) > searchScore(elsewhere, q));
});
test('all words must match (AND)', () => { const r = S({ Title: 'blind drawing' }); ok(searchScore(r, parseSearchQuery('blind drawing')) > 0); eq(searchScore(r, parseSearchQuery('blind music')), 0); });
test('an excluded word removes the study', () => eq(searchScore(S({ Title: 'blind game' }), parseSearchQuery('blind -game')), 0));
test('search is accent-insensitive in the data too', () => ok(searchScore(S({ Title: 'Música parlata' }), parseSearchQuery('musica')) > 0));
test('column names are not searched', () => eq(searchScore(S({ 'Play vs. Game': 'Unstructured play' }), parseSearchQuery('game')), 0));

// ============================================================== data.js ====
group('Study data');
const CUR_YEAR = new Date().getFullYear();
const frameworkCols = [...new Set(Object.values(FILTER_SPECS).flatMap(g => Object.keys(g)))];
test('data.js is generated by the pipeline', () => ok(read('assets/js/data.js').startsWith('// GENERATED FILE')));
test('there are 216 studies', () => eq(data.length, 216));
test('Study IDs are unique', () => { const ids = data.map(r => r['Study ID']); eq(ids.length - new Set(ids).size, 0); });
test('every study has a title, a Study ID and a plausible year', () => data.forEach(r => ok(r.Title && r['Study ID'] && typeof r.Year === 'number' && r.Year >= 1950 && r.Year <= CUR_YEAR + 1, r['Study ID'])));
test('DOIs are bare (10.xxxx/…) or empty', () => data.forEach(r => ok(!r.DOI || /^10\.\d{4,9}\/\S+$/.test(r.DOI), `${r['Study ID']}: ${r.DOI}`)));
test('DOIs are unique', () => { const d = data.map(r => r.DOI).filter(Boolean); eq(d.length - new Set(d).size, 0); });
test('no reviewer data is published (no Reviewer Name / Covidence #)', () => data.forEach(r => ok(!('Reviewer Name' in r) && !('Covidence #' in r) && !('Title__1' in r))));
test('no leading/trailing spaces in any value', () => data.forEach(r => Object.entries(r).forEach(([k, v]) => ok(typeof v !== 'string' || v === v.trim(), `${r['Study ID']} / ${k}`))));
test('no known misspellings left (Symetrical, Unkown, asychronous…)', () => data.forEach(r => Object.entries(r).forEach(([k, v]) => {
  if (k === 'Title' || typeof v !== 'string') return;
  ok(!/\bSymetrical|\bAsymetrical|Unkown|asychronous|asycnronous|asynchrounous/.test(v), `${r['Study ID']} / ${k}: ${v}`);
})));
test('numeric columns hold numbers (Year, Pages, *Total)', () => data.forEach(r => ['Year', 'Pages', ...Object.keys(r).filter(k => / Total$/.test(k))].forEach(k => ok(r[k] === '' || typeof r[k] === 'number', `${r['Study ID']} / ${k}=${JSON.stringify(r[k])}`))));
test('every coded answer is a known option (or Other: …)', () => {
  const bad = [];
  for (const g of Object.values(FILTER_SPECS)) for (const [col, opts] of Object.entries(g)) {
    const known = new Set(Object.values(opts).map(canon));
    data.forEach(r => splitValues(r[col]).forEach(v => { const c = canon(v); if (!known.has(c) && !(c.startsWith('other') && known.has('other'))) bad.push(`${col}: ${v}`) }));
  }
  ok(!bad.length, [...new Set(bad)].slice(0, 3).join(' | '));
});
test('every coded column exists in the data', () => frameworkCols.forEach(c => ok(c in data[0], c)));

group('Definitions are consistent');
const tokens = Object.values(FILTER_SPECS).flatMap(g => Object.values(g).flatMap(o => Object.keys(o)));
test('filter tokens are unique', () => eq(tokens.length - new Set(tokens).size, 0));
const htmlItems = [...html.matchAll(/<div class="item" data-value="([^"]+)">\s*([\s\S]*?)\s*<\/div>/g)].map(m => ({ token: m[1], text: m[2].replace(/\s+/g, ' ').trim() }));
test('every filter token has a menu item in index.html', () => { const inHtml = new Set(htmlItems.map(i => i.token)); tokens.forEach(t => ok(inHtml.has(t), t)); });
test('every menu item in index.html has a filter token', () => { const known = new Set(tokens); htmlItems.forEach(i => ok(known.has(i.token), i.token)); });
test('menu item text matches its FILTER_SPECS label', () => {
  const label = {}; Object.values(FILTER_SPECS).forEach(g => Object.values(g).forEach(o => Object.entries(o).forEach(([t, l]) => { label[t] = l })));
  htmlItems.forEach(i => ok(canon(i.text) === canon(label[i.token]), `${i.token}: "${i.text}" vs "${label[i.token]}"`));
});
test('grid rows are the eight framework spectra', () => { eq(SPECTRUM_ROWS.length, 8); SPECTRUM_ROWS.forEach(r => ok(frameworkCols.includes(r.dim), r.dim)); });
test('every grid cell is a framework option', () => SPECTRUM_ROWS.forEach(r => {
  const opts = Object.values(FILTER_SPECS.first[r.dim]).map(canon);
  eq(r.cells.length, 5, r.dim + ': ');
  r.cells.forEach(c => ok(opts.includes(canon(c)), `${r.dim}: ${c}`));
}));
test('the CI golden values belong to this data.js', () => {
  const g = JSON.parse(read('tools/tests/golden.json'));
  const fp = crypto.createHash('sha256').update(read('assets/js/data.js').replace(/\r\n/g, '\n').replace(/^\/\/ Built by .*$/m, '')).digest('hex').slice(0, 16);
  eq(fp, g.dataFingerprint, 'run "npm run test:update-golden" — ');
});

// ======================================================= build-data.js ====
group('Data pipeline (made-up CSVs)');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pht-pipeline-'));
const dataKeys = Object.keys(data[0]);
const header = ['Covidence #', 'Study ID', 'Title', 'Reviewer Name', 'DOI', 'Title', ...dataKeys.filter(k => !['Study ID', 'Title', 'DOI'].includes(k))];
const csvCell = v => /[",\n\r]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
const baseStudy = (n, extra = {}) => {
  const r = {};
  dataKeys.forEach(k => { r[k] = '' });
  Object.assign(r, data[n]); // realistic coded answers, then overridden by fake identity
  return { ...r, 'Study ID': `Fake ${2000 + n}`, Title: `Made-up study ${n}`, DOI: `10.9999/fake.${n}`, 'Lead author contact details': 'Test Author', Year: 2000 + n, ...extra };
};
const csvRow = (cov, reviewer, s) => header.map((h, i) => {
  if (i === 0) return cov; if (i === 3) return reviewer; if (i === 5) return csvCell(s.Title); // duplicate Title column
  return csvCell(s[h] ?? '');
}).map((v, i) => (i === 0 || i === 3) ? csvCell(v) : v).join(',');
const makeCsv = (rows, { bom = false, head = header } = {}) => (bom ? '﻿' : '') + [head.map(csvCell).join(','), ...rows].join('\r\n') + '\r\n';
const build = (csvText, extraArgs = []) => {
  const inF = path.join(TMP, `in-${crypto.randomBytes(4).toString('hex')}.csv`);
  const outF = path.join(TMP, `out-${crypto.randomBytes(4).toString('hex')}.js`);
  fs.writeFileSync(inF, csvText);
  const r = spawnSync(process.execPath, [path.join(__dirname, 'build-data.js'), inF, `--out=${outF}`, ...extraArgs], { encoding: 'utf8' });
  let studies = null;
  if (fs.existsSync(outF)) { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(outF, 'utf8'), c); studies = c.window.myModule.filteredModuleData; }
  return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), studies, outF };
};
const good = makeCsv([
  csvRow(1, 'Reviewer One', baseStudy(1)),
  csvRow(1, 'Consensus', baseStudy(1, { Title: 'Made-up study 1, with "quotes"\nand a line break', DOI: 'https://doi.org/10.9999/fake.1', 'Lead author contact details': '  Test  Author  ' })),
  csvRow(2, 'Consensus', baseStudy(2, { 'Study ID': 'Smith 2020', 'Symmetrical vs. Asymmetrical': 'Entirely Symetrical (i.e., Tik tac toe)', Title: 'Symetrical title stays as written' })),
  csvRow(3, 'Consensus', baseStudy(3, { 'Study ID': 'Smith 2020' })),
  csvRow(4, 'Reviewer Two', baseStudy(4)) // no Consensus row yet
], { bom: true });
const g1 = build(good);
test('a valid export builds (exit 0)', () => eq(g1.code, 0, g1.out.slice(-300) + ' — '));
test('only Consensus rows are kept', () => eq(g1.studies && g1.studies.length, 3));
test('reviewer names never reach the output', () => ok(!fs.readFileSync(g1.outF, 'utf8').includes('Reviewer One') && !fs.readFileSync(g1.outF, 'utf8').includes('Reviewer Two')));
test('studies without a Consensus row are reported', () => ok(/no Consensus row yet/.test(g1.out) && /Covidence # 4/.test(g1.out), g1.out.slice(0, 400)));
test('duplicate Study IDs become a/b', () => eq(g1.studies.map(s => s['Study ID']).filter(x => x.startsWith('Smith')), ['Smith 2020a', 'Smith 2020b']));
test('DOI URLs are reduced to the bare DOI', () => eq(g1.studies[0].DOI, '10.9999/fake.1'));
test('answer misspellings are fixed, titles are left as written', () => { eq(g1.studies[1]['Symmetrical vs. Asymmetrical'], 'Entirely Symmetrical (i.e., Tik tac toe)'); eq(g1.studies[1].Title, 'Symetrical title stays as written'); });
test('spaces are trimmed and collapsed', () => eq(g1.studies[0]['Lead author contact details'], 'Test Author'));
test('numbers are converted', () => { eq(typeof g1.studies[0].Year, 'number'); eq(g1.studies[0].Year, 2001); });
test('quotes, commas and line breaks inside cells survive', () => ok(g1.studies[0].Title.includes('"quotes"') && g1.studies[0].Title.includes('\n'), JSON.stringify(g1.studies[0].Title)));
test('a UTF-8 byte-order mark is handled', () => ok(g1.studies.length === 3 && !('﻿Covidence #' in g1.studies[0])));
test('the output has the generated-file banner', () => ok(fs.readFileSync(g1.outF, 'utf8').startsWith('// GENERATED FILE')));
const fails = (name, csvText, pattern) => test(name, () => { const r = build(csvText); eq(r.code, 1, r.out.slice(-200) + ' — exit code '); ok(!r.studies, 'something was written'); ok(pattern.test(r.out), 'message: ' + r.out.slice(-300)); });
fails('a missing required column is refused, nothing written', makeCsv([csvRow(1, 'Consensus', baseStudy(1))], { head: header.map(h => h === 'Study Method' ? 'Study Methods' : h) }), /Missing columns[\s\S]*Study Method/);
fails('two Consensus rows for one study are refused', makeCsv([csvRow(1, 'Consensus', baseStudy(1)), csvRow(1, 'Consensus', baseStudy(1))]), /more than one Consensus row/);
fails('an unusable DOI is refused', makeCsv([csvRow(1, 'Consensus', baseStudy(1, { DOI: 'see paper' }))]), /Unusable DOI/);
fails('an implausible year is refused', makeCsv([csvRow(1, 'Consensus', baseStudy(1, { Year: 1066 }))]), /odd Year/);
fails('non-UTF-8 text (replacement characters) is refused', makeCsv([csvRow(1, 'Consensus', baseStudy(1, { Title: 'Caf� study' }))]), /UTF-8/);
fails('a truncated file (open quote) is refused', makeCsv([csvRow(1, 'Consensus', baseStudy(1))]) + '2,"Fake,unterminated', /truncated/);
fails('a row with the wrong number of cells is refused', makeCsv([csvRow(1, 'Consensus', baseStudy(1)) + ',extra']), /cells instead of/);
fails('a header-only file is refused', makeCsv([]), /no data rows/);
test('--dry-run writes nothing', () => { const r = build(good, ['--dry-run']); eq(r.code, 0); ok(!r.studies); });
test('building twice gives identical output (apart from the date)', () => {
  const a = build(good), b = build(good);
  const strip = f => fs.readFileSync(f, 'utf8').replace(/^\/\/ Built by .*$/m, '');
  ok(strip(a.outF) === strip(b.outF));
});
test('the audit passes on the site data', () => { const r = spawnSync(process.execPath, [path.join(__dirname, 'audit-data.js')], { encoding: 'utf8' }); eq(r.status, 0, (r.stdout || '').slice(-300)); });
fs.rmSync(TMP, { recursive: true, force: true });

// -------------------------------------------------------------- report ----
let last = '';
for (const r of results) {
  if (r.section !== last) { console.log(`\n${r.section}`); last = r.section; }
  console.log(`${r.ok ? '  ✓' : '  ✗'} ${r.name}${r.ok ? '' : ' — ' + r.err}`);
}
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} unit tests passed${failed ? ` — ${failed} FAILED` : ''}`);
process.exit(failed ? 1 : 0);
