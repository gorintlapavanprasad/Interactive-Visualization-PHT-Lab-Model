#!/usr/bin/env node
/*
 * End-to-end tests for the PHT Lab dashboard (run locally or in GitHub Actions).
 *
 *     cd tools && npm ci && node ci-test.js                 # run all tests
 *     node ci-test.js --update-golden                       # after an intentional data change
 *
 * Starts a tiny static server for the repo, drives headless Chrome and fails
 * (exit code 1) if any check fails. Checks:
 *   data       every study has a usable bare DOI; data.js is generated
 *   counts     every filter option's badge == results after selecting it
 *   golden     known results (filters, search, grid, reset) — tied to the data
 *              fingerprint, so a data update only needs `--update-golden`
 *   a11y       axe-core WCAG 2.2 AA on every tab; 200% zoom; announcements
 *   offline    no request leaves the site
 *   budget     page size and filter speed stay within limits
 * Screenshots of failures go to tools/ci-artifacts/.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const GOLDEN = path.join(__dirname, 'tests', 'golden.json');
const ART = path.join(__dirname, 'ci-artifacts');
const UPDATE = process.argv.includes('--update-golden');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const CHROME = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ------------------------------------------------------------ tiny server ----
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json' };
function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end() }
      fs.readFile(f, (e, b) => {
        if (e) { res.writeHead(404); return res.end('not found') }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
        res.end(b);
      });
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

// ---------------------------------------------------------------- results ----
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ' — ' + detail : ''}`);
}

async function openPage(browser, base, { width = 1440, height = 900 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  page.__errors = [];
  page.on('pageerror', e => page.__errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') page.__errors.push(m.text()) });
  await page.evaluateOnNewDocument(() => localStorage.setItem('pht_lab_tour_seen', 'true'));
  await page.goto(base, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => document.querySelector('.currentRecords')?.textContent && window.plotState?.chart, { timeout: 30000 });
  return page;
}
const tab = (page, t) => page.evaluate(t => $(`#myTab .item[data-tab="${t}"]`).trigger('click'), t).then(() => sleep(300));

// Values that depend on the data, recorded in tests/golden.json.
async function collectGolden(page) {
  return page.evaluate(async () => {
    const out = {};
    const wait = () => new Promise(r => setTimeout(r, 0));
    const reset = () => applyFilters('reset');
    const pick = async (group, tokens) => { reset(); allFilters = { [group]: tokens.join(',') }; applyFilters(); await wait(); return filteredDataTmp.length };
    const search = async (q) => { reset(); document.getElementById('globalSearch').value = q; applyFilters(); await wait(); return filteredDataTmp.length };
    out.total = csvData.length;
    out['Study Method = Interview'] = await pick('second', ['study_interview']);
    out['Study Method = Interview OR Survey'] = await pick('second', ['study_interview', 'study_survey']);
    reset(); allFilters = { second: 'study_interview', first: 'symmetrical_mostly' }; applyFilters(); await wait();
    out['Interview AND Mostly Symmetrical'] = filteredDataTmp.length;
    out['Participant Groups = People with disabilities'] = await pick('third', ['participants_pwd']);
    reset(); document.getElementById('YearFilter').value = '2010-2012'; applyFilters(); await wait();
    out['Year 2010-2012'] = filteredDataTmp.length;
    reset(); document.getElementById('authorFilter').value = 'Ostiz-Blanco, Kamel'; applyFilters(); await wait();
    out['Author Ostiz-Blanco or Kamel'] = filteredDataTmp.length;
    for (const q of ['blind', 'BLV', 'vr', 'virtual reality', 'blind -game', 'blind OR deaf', 'musica', 'zzzqqq'])
      out[`search "${q}"`] = await search(q);
    reset(); document.getElementById('globalSearch').value = 'blind'; applyFilters(); await wait();
    out['search "blind" top result'] = filteredDataTmp[0]['Study ID'];
    reset(); await wait();
    displaySpectrum();
    document.querySelectorAll('.type-2 tr[data-row]').forEach(tr => {
      out['grid: ' + tr.getAttribute('data-row')] = [...tr.querySelectorAll('td[data-column]')].map(td => +(td.getAttribute('data-count') || 0)).join(',');
    });
    out['zero-count options'] = [...document.querySelectorAll('.menu .item.zero-count')].length;
    return out;
  });
}

(async () => {
  fs.mkdirSync(ART, { recursive: true });
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', protocolTimeout: 600000,
    args: process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : []
  });
  const dataJs = fs.readFileSync(path.join(ROOT, 'assets/js/data.js'));
  const fingerprint = crypto.createHash('sha256').update(dataJs.toString('utf8').replace(/\r\n/g, '\n').replace(/^\/\/ Built by .*$/m, '')).digest('hex').slice(0, 16);
  try {
    // ------------------------------------------------------------- data ----
    console.log('\ndata');
    const page = await openPage(browser, base);
    check('page loads without JavaScript errors', page.__errors.length === 0, page.__errors.join('; '));
    check('data.js is generated by tools/build-data.js', dataJs.toString('utf8').startsWith('// GENERATED FILE'));
    const doi = await page.evaluate(() => {
      const bad = csvData.filter(r => r.DOI && (!/^10\.\d{4,9}\/\S+$/.test(r.DOI) || !doiUrl(r.DOI).startsWith('https://doi.org/10.')));
      const ids = csvData.map(r => r['Study ID']);
      return { bad: bad.map(r => r['Study ID']), dupIds: ids.filter((x, i) => ids.indexOf(x) !== i) };
    });
    check('every DOI is a bare 10.xxxx/… DOI with a doi.org link', doi.bad.length === 0, doi.bad.join(', '));
    check('Study IDs are unique', doi.dupIds.length === 0, doi.dupIds.join(', '));

    // ----------------------------------------------------------- counts ----
    console.log('\nfilter option counts');
    // Run the many re-filters on the Data tab: only the visible view redraws, so
    // this avoids ~300 chart redraws (chart speed is covered by the budget check).
    await tab(page, 'Show-data');
    const counts = await page.evaluate(async () => {
      applyFilters('reset');
      const shown = {};
      for (const [tok, item] of Object.entries(optionItems)) shown[tok] = +item.querySelector('.option-count').textContent;
      const groupOf = tok => optionItems[tok].closest('.firstDropdown') ? 'first' : optionItems[tok].closest('.secondDropdown') ? 'second' : 'third';
      const wrong = [];
      for (const [tok, n] of Object.entries(shown)) {
        allFilters = { [groupOf(tok)]: tok };
        applyFilters();
        if (filteredDataTmp.length !== n) wrong.push(`${tok}: badge ${n}, results ${filteredDataTmp.length}`);
        const disabled = optionItems[tok].classList.contains('disabled');
        if ((n === 0) !== disabled && !optionItems[tok].classList.contains('active')) wrong.push(`${tok}: count ${n} but disabled=${disabled}`);
      }
      // With filters in other groups: Interview + search "blind"
      applyFilters('reset');
      document.getElementById('globalSearch').value = 'blind';
      allFilters = { second: 'study_interview' };
      applyFilters();
      const base = { ...allFilters };
      for (const tok of Object.keys(shown).filter(t => groupOf(t) !== 'second')) {
        const n = +optionItems[tok].querySelector('.option-count').textContent;
        allFilters = { ...base, [groupOf(tok)]: tok };
        applyFilters();
        if (filteredDataTmp.length !== n) wrong.push(`(Interview+blind) ${tok}: badge ${n}, results ${filteredDataTmp.length}`);
        allFilters = { ...base };
        applyFilters();
      }
      applyFilters('reset');
      return { options: Object.keys(shown).length, wrong };
    });
    check(`all ${counts.options} option badges equal the results after selecting them`, counts.wrong.length === 0, counts.wrong.slice(0, 5).join('; '));

    // Through the real dropdown widgets (catches UI-state bugs such as
    // "removing one tag silently clears the other tags").
    const ui = await page.evaluate(async () => {
      const wait = () => new Promise(r => setTimeout(r, 30));
      applyFilters('reset'); await wait();
      $('.secondDropdown').dropdown('set selected', 'study_interview'); await wait();
      const one = filteredDataTmp.length;
      $('.secondDropdown').dropdown('set selected', 'study_survey'); await wait();
      const two = filteredDataTmp.length;
      $('.secondDropdown').dropdown('remove selected', 'study_survey'); await wait();
      const back = filteredDataTmp.length;
      const stillSelected = $('.secondDropdown').dropdown('get value');
      $('.firstDropdown').dropdown('clear'); $('.secondDropdown').dropdown('clear'); await wait();
      const cleared = filteredDataTmp.length;
      applyFilters('reset'); await wait();
      return { one, two, back, stillSelected, cleared, total: csvData.length };
    });
    check('dropdown: add 2 tags, remove 1 -> same results as with 1 tag', ui.back === ui.one && ui.stillSelected === 'study_interview' && ui.two >= ui.one,
      `1 tag ${ui.one}, 2 tags ${ui.two}, after removing 1: ${ui.back} (selected: ${ui.stillSelected})`);
    check('dropdown: clearing all tags shows every study', ui.cleared === ui.total, `${ui.cleared}/${ui.total}`);

    // ----------------------------------------------------------- golden ----
    console.log('\nknown results (golden values)');
    const now = await collectGolden(page);
    if (UPDATE) {
      fs.mkdirSync(path.dirname(GOLDEN), { recursive: true });
      fs.writeFileSync(GOLDEN, JSON.stringify({ dataFingerprint: fingerprint, recorded: new Date().toISOString().slice(0, 10), values: now }, null, 2) + '\n');
      console.log(`  recorded ${Object.keys(now).length} golden values for data ${fingerprint} -> tools/tests/golden.json`);
    } else if (!fs.existsSync(GOLDEN)) {
      check('golden values exist', false, 'run: node ci-test.js --update-golden');
    } else {
      const g = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
      if (g.dataFingerprint !== fingerprint) {
        check('golden values match the current data', false,
          `assets/js/data.js changed (${g.dataFingerprint} -> ${fingerprint}). If the data change is intended, run "node tools/ci-test.js --update-golden" and commit tools/tests/golden.json.`);
      } else {
        for (const [k, v] of Object.entries(g.values)) check(k, JSON.stringify(now[k]) === JSON.stringify(v), JSON.stringify(now[k]) === JSON.stringify(v) ? String(v) : `expected ${JSON.stringify(v)}, got ${JSON.stringify(now[k])}`);
      }
    }
    // Invariants that hold for any data
    const inv = await page.evaluate(async () => {
      applyFilters('reset');
      allFilters = { second: 'study_interview' }; applyFilters();
      const a = filteredDataTmp.length;
      allFilters = { second: 'study_interview,study_survey' }; applyFilters();
      const b = filteredDataTmp.length;
      allFilters = { second: 'study_interview', first: 'symmetrical_mostly' }; applyFilters();
      const c = filteredDataTmp.length;
      applyFilters('reset');
      return { a, b, c, reset: filteredDataTmp.length, total: csvData.length };
    });
    check('OR within a group never returns fewer studies', inv.b >= inv.a, `${inv.a} -> ${inv.b}`);
    check('AND across groups never returns more studies', inv.c <= inv.a, `${inv.a} -> ${inv.c}`);
    check('reset shows every study', inv.reset === inv.total, `${inv.reset}/${inv.total}`);

    // ------------------------------------------------------------ budget ----
    console.log('\nspeed and size budget');
    await tab(page, 'Show-plot');
    const perf = await page.evaluate(async () => {
      applyFilters('reset');
      const t = [];
      for (const tok of ['study_interview', 'tech_pc', 'community_blv']) {
        const s = performance.now();
        allFilters = { [tok.startsWith('study') || tok.startsWith('tech') ? 'second' : 'third']: tok };
        applyFilters();
        t.push(performance.now() - s);
      }
      applyFilters('reset');
      return { worstMs: Math.round(Math.max(...t)), dom: document.getElementsByTagName('*').length };
    });
    check('page stays small (DOM < 5,000 elements)', perf.dom < 5000, `${perf.dom} elements`);
    check('a filter change on the chart tab takes < 1,500 ms', perf.worstMs < 1500, `${perf.worstMs} ms`);
    await page.close();

    // -------------------------------------------------------------- a11y ----
    console.log('\naccessibility');
    const a11y = await openPage(browser, base);
    const violations = {};
    for (const [m, s] of [['Show-plot'], ['Show-plot', 'Show-plot/table'], ['Show-data'], ['ratings-grid'], ['Show-grid']]) {
      await tab(a11y, m);
      if (s) { await a11y.evaluate(s => $(`#show-plot-pane .menu .item[data-tab="${s}"]`).trigger('click'), s); await sleep(300) }
      if (!(await a11y.evaluate(() => !!window.axe))) await a11y.addScriptTag({ content: AXE });
      const v = await a11y.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] })).violations.map(x => `${x.id} (${x.impact}): ${x.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`));
      v.forEach(x => (violations[x] = violations[x] || []).push(s || m));
      if (s) await a11y.evaluate(() => $('#show-plot-pane .menu .item[data-tab="Show-plot/visual"]').trigger('click'));
    }
    check('axe-core: 0 WCAG 2.2 AA violations on every tab', !Object.keys(violations).length, Object.entries(violations).map(([k, v]) => `${k} [${[...new Set(v)].join(',')}]`).join('; '));

    // What a screen reader gets: every focusable control must have a name.
    // (axe skips visually-hidden inputs such as the theme switch.)
    await tab(a11y, 'Show-plot');
    // Open the settings menu (theme switch, tour) the way a keyboard user does,
    // so its controls are in the accessibility tree too.
    await a11y.focus('.hover-nav-trigger');
    await sleep(300);
    const cdp = await a11y.target().createCDPSession();
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const CONTROL = new Set(['button', 'link', 'checkbox', 'switch', 'radio', 'textbox', 'searchbox', 'combobox', 'tab', 'slider', 'menuitem', 'option', 'spinbutton', 'listbox']);
    const unnamed = nodes.filter(n => !n.ignored && CONTROL.has(n.role?.value) &&
      (n.properties || []).some(p => p.name === 'focusable' && p.value.value) &&
      !String(n.name?.value || '').trim());
    const describe = async n => {
      if (!n.backendDOMNodeId) return n.role.value;
      try {
        const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: n.backendDOMNodeId });
        const r = await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration: 'function(){return this.tagName+(this.id?"#"+this.id:"")+"."+String(this.className).split(" ").slice(0,2).join(".")}', returnByValue: true });
        return `${n.role.value} ${r.result.value}`;
      } catch { return n.role.value }
    };
    const names = await Promise.all(unnamed.slice(0, 5).map(describe));
    check('every focusable control has an accessible name', unnamed.length === 0, names.join(', '));
    await tab(a11y, 'Show-plot');
    await a11y.focus('.secondDropdown input.search');
    await a11y.keyboard.type('Interview');
    await sleep(300);
    await a11y.keyboard.press('Enter');
    await sleep(1000);
    const said = await a11y.$eval('#sr-announcer', e => e.textContent);
    check('keyboard filtering works and the result count is announced', /\d+ of \d+ studies match/.test(said), JSON.stringify(said));
    if (results.some(r => !r.ok)) await a11y.screenshot({ path: path.join(ART, 'a11y.png') });
    await a11y.close();
    const zoom = await openPage(browser, base, { width: 720, height: 900 });
    const z = await zoom.evaluate(() => {
      const vis = s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 };
      return { filters: vis('#titleFilter'), chart: vis('#plotIt'), hScroll: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    check('200% zoom (720px): filters and chart usable, no horizontal scroll', z.filters && z.chart && !z.hScroll, JSON.stringify(z));
    if (!(z.filters && z.chart && !z.hScroll)) await zoom.screenshot({ path: path.join(ART, 'zoom200.png') });
    // The chart's data table is the text alternative for the chart; it must
    // stay available when zoomed (an old rule hid it below 1024px).
    await zoom.evaluate(() => $('#show-plot-pane .menu .item[data-tab="Show-plot/table"]').trigger('click'));
    await sleep(300);
    const zt = await zoom.evaluate(() => {
      const c = document.getElementById('plotDataTableContainer');
      const r = c.getBoundingClientRect();
      return { visible: getComputedStyle(c).display !== 'none' && r.height > 0, rows: document.querySelectorAll('#sr-table-body tr').length };
    });
    check('200% zoom: the chart data table (text alternative) is shown', zt.visible && zt.rows > 0, JSON.stringify(zt));
    await zoom.close();

    // ----------------------------------------------------------- offline ----
    console.log('\noffline');
    const off = await browser.newPage();
    await off.setViewport({ width: 1440, height: 900 });
    await off.setRequestInterception(true);
    const outside = [], failed = [];
    const host = new URL(base).host;
    off.on('request', r => { const u = new URL(r.url()); if (u.protocol === 'data:' || u.host === host) r.continue(); else { outside.push(r.url()); r.abort() } });
    off.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) });
    await off.evaluateOnNewDocument(() => localStorage.setItem('pht_lab_tour_seen', 'true'));
    await off.goto(base, { waitUntil: 'networkidle0' });
    for (const t of ['Show-grid', 'ratings-grid', 'Show-data', 'Show-plot']) await tab(off, t);
    const fontsOk = await off.evaluate(async () => { await document.fonts.ready; return ['16px Phosphor', '16px Icons', '16px Lato'].every(f => document.fonts.check(f)) });
    check('no requests to outside servers', outside.length === 0, outside.slice(0, 3).join(', '));
    check('no missing files (HTTP 4xx/5xx)', failed.length === 0, failed.slice(0, 3).join(', '));
    check('fonts and icon fonts load locally', fontsOk);
    await off.close();
  } catch (e) {
    check('test run completed', false, e.stack || String(e));
  } finally {
    await browser.close();
    srv.close();
  }
  const failedN = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - failedN}/${results.length} checks passed${failedN ? ` — ${failedN} FAILED` : ''}`);
  process.exit(failedN ? 1 : 0);
})();
