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
  // Start every test page from the same state (tour seen, default Cards view).
  await page.evaluateOnNewDocument(() => { localStorage.setItem('pht_lab_tour_seen', 'true'); localStorage.removeItem('pht_data_view') });
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

    // ---------------------------------------------------- chart controls ----
    console.log('\nchart controls');
    await tab(page, 'Show-plot');
    const chart = await page.evaluate(async () => {
      const wait = () => new Promise(r => setTimeout(r, 50));
      applyFilters('reset'); await wait();
      const set = async (x, stack, mode) => {
        document.getElementById('stackBy').value = stack;
        document.getElementById('plotMode').value = mode;
        $('#plotFilter').dropdown('set selected', x);
        viewsDirty.plot = true; renderVisibleViews(); await wait();
        return plotState.chart;
      };
      const out = {};
      // 1. Percentages without colouring: bar = % of filtered studies with that answer
      let c = await set('Study Method', '', 'percent');
      const iv = c.xAxis[0].categories.indexOf('Interview');
      const ivCount = csvData.filter(r => canonSet(r, 'Study Method').has('interview')).length;
      out.noneInterview = { shown: c.series[0].points[iv].y, expected: Math.round(1000 * ivCount / csvData.length) / 10 };
      // 2. Percent-stacked bars each add up to 100%, with n under each bar
      c = await set('Fun-First vs. Utility-First (Initial Design Intention)', 'Community of focus', 'percent');
      out.pctSums = c.xAxis[0].categories.map((_, i) => Math.round(c.series.reduce((a, s) => a + (s.points[i]?.percentage || 0), 0)));
      out.nLabels = [...document.querySelectorAll('#plotIt .highcharts-xaxis-labels text')].filter(t => /n=\d+/.test(t.textContent)).length;
      // 3. Framework answers in framework order, not alphabetical
      out.order = c.xAxis[0].categories.slice(0, 5);
      // 4. Data table shows study counts that match the chart
      const firstRow = [...document.querySelectorAll('#sr-table-body tr:first-child td')].map(td => +td.textContent);
      out.tableMatches = c.series.every((s, i) => (s.points[0].options.count ?? s.points[0].y) === firstRow[i]);
      // 5. Every study is accounted for in the colours ("Not recorded" for blanks)
      c = await set('Year', 'Symmetrical vs. Asymmetrical', 'count');
      const blank = csvData.filter(r => !String(r['Symmetrical vs. Asymmetrical'] ?? '').trim()).length;
      out.notRecorded = { blank, series: c.series.some(s => s.name === 'Not recorded') };
      // 6. Choices saved in the Excel export
      const orig = XLSX.writeFile; let rows = [];
      XLSX.writeFile = wb => { rows = XLSX.utils.sheet_to_json(wb.Sheets['Filter Settings']) };
      exportFilteredData(); XLSX.writeFile = orig;
      out.exported = rows.filter(r => /^chart/.test(r['Filter Name'])).map(r => `${r['Filter Name']}=${r.Value}`);
      out.instances = Highcharts.charts.filter(Boolean).length;
      await set('Year', 'Participant Groups', 'count');
      return out;
    });
    check('"Percentages" without colour = % of filtered studies', chart.noneInterview.shown === chart.noneInterview.expected, JSON.stringify(chart.noneInterview));
    check('"Percentages" with colour: every bar adds up to 100%, with n under each bar', chart.pctSums.every(v => v === 100) && chart.nLabels === chart.pctSums.length, `sums ${[...new Set(chart.pctSums)]}, n-labels ${chart.nLabels}/${chart.pctSums.length}`);
    check('framework answers are shown in framework order', chart.order[0] === 'Totally fun first' && chart.order[4] === 'Totally utility first', chart.order.join(' | '));
    check('chart data table matches the chart', chart.tableMatches);
    check('studies without an answer appear as "Not recorded"', !chart.notRecorded.blank || chart.notRecorded.series, JSON.stringify(chart.notRecorded));
    check('chart choices are saved in the Excel export', chart.exported.includes('chartColourBy=Symmetrical vs. Asymmetrical') && chart.exported.includes('chartShow=count'), chart.exported.join(', '));
    check('changing chart options reuses one chart (no leaks)', chart.instances === 1, `${chart.instances} chart instances`);

    // ------------------------------------------------- study list (table) ----
    console.log('\nstudy list: cards / table');
    await tab(page, 'Show-data');
    const list = await page.evaluate(async () => {
      const wait = () => new Promise(r => setTimeout(r, 50));
      applyFilters('reset'); await wait();
      const out = { cardsByDefault: document.querySelectorAll('.secondUI .divOuter').length };
      document.querySelector('.view-toggle [data-view="table"]').click(); await wait();
      const rows = () => [...document.querySelectorAll('#studyTable tbody tr')];
      const colIdx = c => tableColumns.indexOf(c);
      out.tableRows = rows().length;
      out.tablePressed = document.querySelector('.view-toggle [data-view="table"]').getAttribute('aria-pressed');
      // sort by Year with the header button: newest first, then oldest first
      document.querySelector('#studyTable .sort-button[data-col="Year"]').click(); await wait();
      const years = () => rows().map(tr => +tr.children[colIdx('Year')].textContent);
      const maxYear = Math.max(...csvData.map(r => r.Year)), minYear = Math.min(...csvData.map(r => r.Year));
      out.yearDesc = { first: years()[0], max: maxYear, ariaSort: document.querySelector('#studyTable .sort-button[data-col="Year"]').closest('th').getAttribute('aria-sort'), ordered: years().every((y, i, a) => i === 0 || a[i - 1] >= y) };
      document.querySelector('#studyTable .sort-button[data-col="Year"]').click(); await wait();
      out.yearAsc = { first: years()[0], min: minYear };
      // page size
      const size = document.getElementById('pageSize'); size.value = '50'; size.dispatchEvent(new Event('change')); await wait();
      out.size50 = rows().length;
      // column chooser: new column goes at the end
      const cb = [...document.querySelectorAll('.column-chooser input')].find(i => i.value === 'Primary Country');
      cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); await wait();
      out.lastColumn = tableColumns[tableColumns.length - 1];
      out.headerCount = document.querySelectorAll('#studyTable thead th').length === tableColumns.length;
      // DOI links and study details from the title button
      out.doiOk = [...document.querySelectorAll('#studyTable a')].every(a => /^https:\/\/doi\.org\/10\./.test(a.href));
      const btn = document.querySelector('#studyTable .open-details');
      btn.click(); await new Promise(r => setTimeout(r, 600));
      const study = csvData.find(r => r.__uid === btn.getAttribute('data-uid'));
      out.details = document.getElementById('abstractModalHeader').textContent.includes(study['Study ID']);
      $('#studyAbstractModal').modal('hide'); await new Promise(r => setTimeout(r, 500));
      // searching shows best matches first when no sort is chosen
      const sortBy = document.getElementById('sortBy'); sortBy.value = ''; sortBy.dispatchEvent(new Event('change')); await wait();
      document.getElementById('globalSearch').value = 'blind'; applyFilters(); await wait();
      out.searchFirst = rows()[0].getAttribute('data-uid') === filteredDataTmp[0].__uid;
      return out;
    });
    check('Data tab opens in Cards view by default', list.cardsByDefault > 0, `${list.cardsByDefault} cards`);
    check('Table view shows a page of rows and marks the button pressed', list.tableRows === 25 && list.tablePressed === 'true', `${list.tableRows} rows, aria-pressed=${list.tablePressed}`);
    check('Year header sorts newest first, then oldest first (aria-sort set)', list.yearDesc.first === list.yearDesc.max && list.yearDesc.ordered && list.yearDesc.ariaSort === 'descending' && list.yearAsc.first === list.yearAsc.min, JSON.stringify({ desc: list.yearDesc, asc: list.yearAsc }));
    check('"Per page" changes the number of rows', list.size50 === 50, `${list.size50} rows`);
    check('Columns chooser adds the column at the end', list.lastColumn === 'Primary Country' && list.headerCount, list.lastColumn);
    check('table DOI links go to doi.org; titles open the right study', list.doiOk && list.details);
    check('while searching, the table shows best matches first', list.searchFirst);
    if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE });
    const tableAxe = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] })).violations.map(v => `${v.id}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`));
    check('axe-core: 0 violations in Table view', tableAxe.length === 0, tableAxe.join('; '));
    await page.evaluate(() => { applyFilters('reset'); document.querySelector('.view-toggle [data-view="cards"]').click() });

    // -------------------------------------------------------------- gaps ----
    console.log('\ngaps (two-dimension heatmap)');
    await tab(page, 'Show-gaps');
    const gaps = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      applyFilters('reset'); await wait(50);
      const set = (r, c, mode = 'count', hide = true) => {
        document.getElementById('gapRows').value = r; document.getElementById('gapCols').value = c;
        document.getElementById('gapMode').value = mode; document.getElementById('gapHideNA').checked = hide;
        renderGaps();
      };
      const out = {};
      set('Community of focus', 'Study Method');
      // every cell equals an independent count from the raw data, and never exceeds its row/column totals
      const rows = gapLabels.rows, cols = gapLabels.cols;
      const has = (r, col, label) => splitValues(r[col]).some(v => displayLabel(v) === label);
      let wrong = [], over = 0;
      rows.forEach((a, i) => cols.forEach((b, j) => {
        const n = gapCells[i][j].length;
        const indep = csvData.filter(r => has(r, 'Community of focus', a) && has(r, 'Study Method', b)).length;
        if (n !== indep) wrong.push(a + ' x ' + b + ': ' + n + ' vs ' + indep);
      }));
      const trs = [...document.querySelectorAll('#gapTable tbody tr:not(.gap-total-row)')];
      trs.forEach((tr, i) => { const rowTotal = +tr.lastElementChild.textContent; gapCells[i].forEach(u => { if (u.length > rowTotal) over++ }) });
      out.cells = { checked: rows.length * cols.length, wrong: wrong.slice(0, 3), over };
      out.zeroCellsAccessible = [...document.querySelectorAll('#gapTable .gap-zero')].every(td => /no studies/.test(td.textContent));
      out.zeros = document.querySelectorAll('#gapTable .gap-zero').length;
      out.summaryMentionsZeros = new RegExp('^' + out.zeros + ' of ' + rows.length * cols.length).test(document.getElementById('gap-summary').textContent);
      // clicking a cell lists exactly its studies
      const btn = document.querySelector('#gapTable .gap-cell');
      btn.click(); await wait(700);
      out.clickList = { cell: gapCells[+btn.dataset.r][+btn.dataset.c].length, listed: document.querySelectorAll('.study-jump-item').length };
      $('#spectrumData').modal('hide'); await wait(500);
      // every framework answer is a row, even with no studies (empty rows are gaps)
      set('Skill vs. Chance', 'Social vs. Solo');
      const spec = Object.values(FILTER_SPECS.first['Skill vs. Chance']).map(displayLabel).filter(l => !GAP_HIDDEN.has(canon(l)));
      out.allAnswersShown = spec.every(l => gapLabels.rows.includes(l));
      // the checkbox brings back Not applicable / Undisclosed
      set('Skill vs. Chance', 'Social vs. Solo', 'count', false);
      out.naShown = gapLabels.rows.includes('Not Applicable');
      // filters apply
      set('Community of focus', 'Study Method');
      allFilters = { second: 'study_interview' }; applyFilters(); renderGaps(); await wait(50);
      out.filteredTotal = { shown: +document.querySelector('#gapTable .gap-total-row td:last-child').textContent, results: filteredDataTmp.length };
      applyFilters('reset');
      return out;
    });
    check('every Gaps cell equals an independent count from the data', gaps.cells.wrong.length === 0 && gaps.cells.over === 0, `${gaps.cells.checked} cells; ${gaps.cells.wrong.join('; ')}`);
    check('gap cells (0) are hatched and read "no studies"; summary counts them', gaps.zeroCellsAccessible && gaps.summaryMentionsZeros, `${gaps.zeros} gaps`);
    check('selecting a Gaps cell lists exactly its studies', gaps.clickList.cell === gaps.clickList.listed, JSON.stringify(gaps.clickList));
    check('every framework answer is shown, even with no studies', gaps.allAnswersShown);
    check('"Hide Not applicable…" can be switched off', gaps.naShown);
    check('Gaps follows the filters', gaps.filteredTotal.shown <= gaps.filteredTotal.results && gaps.filteredTotal.shown > 0, JSON.stringify(gaps.filteredTotal));

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
    for (const [m, s] of [['Show-plot'], ['Show-plot', 'Show-plot/table'], ['Show-data'], ['ratings-grid'], ['Show-grid'], ['Show-gaps']]) {
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
    // Wait until the menu has filtered down to the option (as a user would see
    // it) instead of a fixed pause — avoids a timing flake on slow CI machines.
    await a11y.waitForFunction(() => [...document.querySelectorAll('.secondDropdown .menu .item[data-value="study_interview"]')]
      .some(i => !i.classList.contains('filtered') && i.offsetParent !== null), { timeout: 5000 }).catch(() => {});
    await a11y.keyboard.press('Enter');
    await a11y.waitForFunction(() => /\d+ of \d+ studies match/.test(document.getElementById('sr-announcer').textContent), { timeout: 4000 }).catch(() => {});
    const said = await a11y.$eval('#sr-announcer', e => e.textContent);
    const picked = await a11y.evaluate(() => $('.secondDropdown').dropdown('get value'));
    check('keyboard filtering works and the result count is announced', /\d+ of \d+ studies match/.test(said) && picked === 'study_interview', `${JSON.stringify(said)} (selected: ${picked})`);
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
    for (const t of ['Show-grid', 'ratings-grid', 'Show-data', 'Show-gaps', 'Show-plot']) await tab(off, t);
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
