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
      out['grid: ' + tr.getAttribute('data-row')] = [...tr.querySelectorAll('td[data-column]:not([data-rest])')].map(td => +(td.getAttribute('data-count') || 0)).join(',');
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
  // Tests click the download buttons: never save files to the user's Downloads folder.
  await (await browser.target().createCDPSession()).send('Browser.setDownloadBehavior', { behavior: 'deny' });
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

    // Plot tab layout and labels (from a screenshot review)
    {
      const p = await browser.newPage();
      await p.setViewport({ width: 1920, height: 1080 });
      await p.evaluateOnNewDocument(() => localStorage.setItem('pht_lab_tour_seen', 'true'));
      await p.goto(base, { waitUntil: 'networkidle0' });
      await p.waitForFunction(() => window.plotState && plotState.chart);
      const r = await p.evaluate(() => {
        const c = plotState.chart;
        const cats = c.xAxis[0].categories;
        const years = [...new Set(csvData.map(r => +r.Year).filter(Boolean))];
        const lab = document.querySelector('#plotIt .highcharts-xaxis-labels').getBoundingClientRect();
        const btns = [...document.querySelectorAll('.buttons-container button')].map(b => ({ text: b.textContent.trim(), icon: b.querySelector('i')?.className || '' }));
        const label = document.getElementById('plotFilterLabel');
        const input = document.querySelector('#plotFilter input.search');
        return {
          xLabelsBottom: lab.bottom, vh: innerHeight,
          yearsContinuous: cats.length === Math.max(...years) - Math.min(...years) + 1 && cats.every((y, i) => +y === Math.min(...years) + i),
          sum: plotState.totals.reduce((a, b) => a + b, 0), n: csvData.length,
          yTitle: c.yAxis[0].options.title.text,
          btns,
          labelVisible: !!label && label.offsetWidth > 0 && /group bars by/i.test(label.textContent),
          inputName: input && input.getAttribute('aria-label'),
          stackOption: [...document.getElementById('stackBy').options].find(o => o.value === 'Participant Groups')?.textContent,
          legendTitle: c.legend.options.title.text
        };
      });
      check('1920×1080: the year labels under the chart are on screen', r.xLabelsBottom <= r.vh, `labels end at ${Math.round(r.xLabelsBottom)}px, window ${r.vh}px`);
      check('Year chart shows every year, including years with no studies', r.yearsContinuous && r.sum === r.n, `continuous ${r.yearsContinuous}, sum ${r.sum}/${r.n}`);
      check('stacked count axis says a study can count in more than one colour', /more than once/.test(r.yTitle), r.yTitle);
      check('sidebar tool buttons have visible names (Reset, Import, Export, Redraw)', r.btns.map(b => b.text).join() === 'Reset,Import,Export,Redraw', r.btns.map(b => b.text).join());
      check('Import shows an upload icon and Export a download icon', /upload/.test(r.btns[1].icon) && /download/.test(r.btns[2].icon) && !/trash/.test(r.btns[0].icon), r.btns.map(b => b.icon).join(' | '));
      check('the bar grouping selector has a visible label that matches its name', r.labelVisible && r.inputName === 'Group bars by', `visible ${r.labelVisible}, name "${r.inputName}"`);
      check('colour option and legend use the same wording', r.legendTitle === 'Colour: ' + r.stackOption, `"${r.stackOption}" vs "${r.legendTitle}"`);
      await p.close();
    }

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
    if (!(await page.evaluate(() => !!window.axe))) await page.evaluate(AXE);
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

    // ------------------------------------------------- deep-dive UI tests ----
    // Expected values are computed here from the raw data with simple, separate
    // logic (not by calling the app's own filter functions).
    console.log('\ntext filters, reset and paging');
    await tab(page, 'Show-data');
    const tf = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const setText = async (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); await wait(260) };
      const clearAll = async () => { applyFilters('reset'); await wait(60) };
      const n = () => filteredDataTmp.length;
      const has = (cell, ans) => String(cell ?? '').split(';').map(s => s.trim()).some(s => s === ans || s.startsWith(ans + ' ('));
      const out = {};
      await clearAll(); await setText('titleFilter', 'Tactile');
      out.title = { got: n(), want: csvData.filter(r => r.Title.toLowerCase().includes('tactile')).length };
      await clearAll(); await setText('YearFilter', '2015');
      out.yearSingle = { got: n(), want: csvData.filter(r => r.Year === 2015).length };
      await clearAll(); await setText('YearFilter', '2010-2012');
      out.yearRange = { got: n(), want: csvData.filter(r => r.Year >= 2010 && r.Year <= 2012).length };
      await clearAll(); await setText('YearFilter', '2010 - 2012');
      out.yearSpaced = n();
      await clearAll(); await setText('YearFilter', '2012-2010');
      out.yearReversed = n();
      await clearAll(); await setText('PagesFilter', '0-6');
      out.pages = { got: n(), want: csvData.filter(r => typeof r.Pages === 'number' && r.Pages <= 6).length };
      await clearAll(); await setText('authorFilter', 'Kamel, Ostiz-Blanco');
      out.authors = { got: n(), want: csvData.filter(r => /kamel|ostiz-blanco/i.test(r['Lead author contact details'])).length };
      const noteWord = (csvData.find(r => String(r['Notes (e.g., Why does the paper not fit the framework?)'] || '').length > 5)?.['Notes (e.g., Why does the paper not fit the framework?)'] || '').split(/\s+/).find(w => w.length > 4) || '';
      await clearAll(); await setText('NotesFilter', noteWord);
      out.notes = { got: n(), want: csvData.filter(r => String(r['Notes (e.g., Why does the paper not fit the framework?)'] || '').toLowerCase().includes(noteWord.toLowerCase())).length, word: noteWord };
      await clearAll(); await setText('YearFilter', '20x0');
      const yf = document.getElementById('YearFilter');
      out.invalid = { results: n(), ariaInvalid: yf.getAttribute('aria-invalid'), message: document.getElementById('YearFilter-error')?.textContent || '' };
      // combined: tag + year range + search must be the intersection
      await clearAll();
      allFilters = { second: 'study_interview' }; applyFilters();
      await setText('YearFilter', '2015-2023'); await setText('globalSearch', 'blind');
      const blindRe = /(^|[^a-z0-9])(blind|blv|visually impaired|visual impairment)/i;
      out.combined = { got: n(), want: csvData.filter(r => has(r['Study Method'], 'Interview') && r.Year >= 2015 && r.Year <= 2023 && Object.values(r).some(v => blindRe.test(String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '')))).length };
      // reset clears everything
      applyFilters('reset'); await wait(60);
      out.reset = { results: n(), texts: ['titleFilter', 'authorFilter', 'YearFilter', 'PagesFilter', 'NotesFilter', 'globalSearch'].map(id => document.getElementById(id).value).join(''), tags: ['.firstDropdown', '.secondDropdown', '.thirdDropdown'].map(s => $(s).dropdown('get value')).join(''), status: document.getElementById('globalSearch-status').textContent, error: document.getElementById('YearFilter-error')?.textContent || '' };
      // search with no results shows a message
      await setText('globalSearch', 'zzzqqqxx');
      out.noResults = { results: n(), message: document.querySelector('.secondUI')?.textContent.trim(), status: document.getElementById('globalSearch-status').textContent };
      applyFilters('reset'); await wait(60);
      // paging: page 2 = the next 5 studies, no overlap; page count and last page size
      const ids = () => [...document.querySelectorAll('.secondUI .divOuter')].map(c => c.getAttribute('data-uid'));
      const p1 = ids(); $('#pagination-container').pagination('selectPage', 2); await wait(60);
      const p2 = ids();
      const pages = $('#pagination-container').pagination('getPagesCount');
      $('#pagination-container').pagination('selectPage', pages); await wait(60);
      out.paging = { p1: p1.length, p2: p2.length, overlap: p1.filter(x => p2.includes(x)).length, inOrder: p2[0] === filteredDataTmp[5].__uid, pages, wantPages: Math.ceil(csvData.length / 5), last: ids().length, wantLast: csvData.length - 5 * (Math.ceil(csvData.length / 5) - 1) };
      $('#pagination-container').pagination('selectPage', 1);
      return out;
    });
    const same = (o) => o.got === o.want;
    check('Title filter = studies whose title contains the text', same(tf.title) && tf.title.want > 0, JSON.stringify(tf.title));
    check('Year filter, single year', same(tf.yearSingle) && tf.yearSingle.want > 0, JSON.stringify(tf.yearSingle));
    check('Year filter, range (inclusive)', same(tf.yearRange), JSON.stringify(tf.yearRange));
    check('Year range with spaces ("2010 - 2012") works', tf.yearSpaced === tf.yearRange.want, `${tf.yearSpaced}`);
    check('Year range typed backwards ("2012-2010") still works', tf.yearReversed === tf.yearRange.want, `${tf.yearReversed} (want ${tf.yearRange.want})`);
    check('Pages range filter', same(tf.pages), JSON.stringify(tf.pages));
    check('Author filter with two names finds either', same(tf.authors) && tf.authors.want >= 2, JSON.stringify(tf.authors));
    check('Notes filter', same(tf.notes) && tf.notes.want > 0, JSON.stringify(tf.notes));
    check('invalid year: visible message, aria-invalid, results not changed', tf.invalid.results === 216 && tf.invalid.ariaInvalid === 'true' && /4-digit year/.test(tf.invalid.message), JSON.stringify(tf.invalid));
    check('tag + year range + search combine as AND', same(tf.combined) && tf.combined.want > 0, JSON.stringify(tf.combined));
    check('Reset clears every text box, tag, search status and error', tf.reset.results === 216 && !tf.reset.texts && !tf.reset.tags && !tf.reset.status && !tf.reset.error, JSON.stringify(tf.reset));
    check('a search with no results says so', tf.noResults.results === 0 && /No studies/.test(tf.noResults.message) && /No studies found/.test(tf.noResults.status), JSON.stringify(tf.noResults));
    check('paging: page 2 continues page 1 with no overlap', tf.paging.p1 === 5 && tf.paging.p2 === 5 && tf.paging.overlap === 0 && tf.paging.inOrder, JSON.stringify(tf.paging));
    check('paging: page count and last page size are right', tf.paging.pages === tf.paging.wantPages && tf.paging.last === tf.paging.wantLast, JSON.stringify(tf.paging));

    console.log('\nexport, import and safety');
    const io = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      applyFilters('reset'); await wait(60);
      allFilters = { second: 'study_interview' }; document.getElementById('globalSearch').value = 'blind'; applyFilters(); await wait(60);
      const expectN = filteredDataTmp.length;
      let wb = null; const orig = XLSX.writeFile;
      XLSX.writeFile = w => { wb = w }; exportFilteredData(); XLSX.writeFile = orig;
      const rows = XLSX.utils.sheet_to_json(wb.Sheets['Filtered Data']);
      const settings = Object.fromEntries(XLSX.utils.sheet_to_json(wb.Sheets['Filter Settings']).map(r => [r['Filter Name'], r.Value]));
      const out = { sheets: wb.SheetNames, rows: rows.length, expectN, internal: Object.keys(rows[0] || {}).filter(k => k.startsWith('__')), doiBare: rows.every(r => !r.DOI || /^10\./.test(r.DOI)), settings: { second: settings.second, globalSearch: settings.globalSearch } };
      // import a workbook without a "Filter Settings" sheet -> refused, nothing changes
      const bad = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(bad, XLSX.utils.aoa_to_sheet([['x']]), 'Other');
      const bytes = XLSX.write(bad, { type: 'array', bookType: 'xlsx' });
      let alerted = ''; const oa = window.alert; window.alert = m => { alerted = m };
      handleDataImport({ target: { files: [new File([bytes], 'bad.xlsx')], value: '' } }); await wait(800);
      window.alert = oa;
      out.badImport = { alerted, resultsUnchanged: filteredDataTmp.length === expectN };
      // HTML in the search box is shown as text, never run
      applyFilters('reset'); await wait(60);
      window.__xss = 0;
      document.getElementById('globalSearch').value = '<img src=x onerror="window.__xss=1"> blind'; applyFilters(); await wait(300);
      out.xss = { ran: window.__xss, injectedImgs: document.querySelectorAll('.secondUI img, #studyTable img, #globalSearch-status img').length };
      applyFilters('reset'); await wait(60);
      return out;
    });
    check('Excel export: one row per filtered study, no internal columns, clean DOIs', io.rows === io.expectN && !io.internal.length && io.doiBare && io.sheets.join() === 'Filtered Data,Filter Settings', JSON.stringify({ rows: io.rows, want: io.expectN, internal: io.internal }));
    check('Excel export records the tags and the search', io.settings.second === 'study_interview' && io.settings.globalSearch === 'blind', JSON.stringify(io.settings));
    check('importing a file without saved settings is refused, nothing changes', /Invalid/.test(io.badImport.alerted) && io.badImport.resultsUnchanged, JSON.stringify(io.badImport));
    check('HTML typed into the search box is never run', io.xss.ran === 0 && io.xss.injectedImgs === 0, JSON.stringify(io.xss));

    console.log('\ngrids and chart totals');
    const gc = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      applyFilters('reset'); await wait(60);
      displaySpectrum();
      const out = { dropped: [], mismatch: [] };
      // every study is accounted for in each grid row: 5 cells + N/A + undisclosed + blank = all studies
      document.querySelectorAll('.type-2 tr[data-row]').forEach(tr => {
        const dim = tr.getAttribute('data-row');
        const cells = [...tr.querySelectorAll('td[data-column]:not([data-rest])')].reduce((a, td) => a + +(td.getAttribute('data-count') || 0), 0);
        const restShown = +(tr.querySelector('td[data-rest]')?.getAttribute('data-count') ?? -1);
        const rest = csvData.filter(r => { const v = String(r[dim] ?? '').trim().toLowerCase(); return !v || v.startsWith('not applicable') || v.startsWith('undisclosed') }).length;
        if (cells + rest !== csvData.length) out.dropped.push(`${dim}: ${cells}+${rest}≠${csvData.length}`);
        if (restShown !== rest) out.dropped.push(`${dim}: N/A cell shows ${restShown}, independent count ${rest}`);
      });
      // Ratings grid (dots) and Spectrum grid (numbers) agree cell by cell
      const counts = sel => [...document.querySelectorAll(sel + ' td[data-column]')].map(td => +(td.getAttribute('data-count') || 0));
      const a = counts('.type-1'), b = counts('.type-2');
      out.gridsAgree = a.length === 48 && a.join() === b.join();
      // Year chart: one study = one year, so distinct-study labels add up to all studies
      document.getElementById('stackBy').value = 'Participant Groups'; document.getElementById('plotMode').value = 'count';
      $('#plotFilter').dropdown('set selected', 'Year'); viewsDirty.plot = true; renderVisibleViews('Show-plot'); await wait(80);
      out.yearTotal = plotState.totals.reduce((x, y) => x + y, 0);
      const opts = [...document.querySelectorAll('#plotFilter .menu .item')].map(i => i.getAttribute('data-value'));
      out.plotMenu = { hasYear: opts.includes('Year'), banned: opts.filter(o => ['Title', 'DOI', 'Study ID', 'Lead author contact details'].includes(o)), emptyCols: opts.filter(o => !csvData.some(r => String(r[o] ?? '').trim())) };
      // Intensity slider changes the legend scale
      const slider = document.getElementById('type2Intensity'); const before = document.querySelector('.type-2 + .viridis-legend .viridis-legend-max')?.textContent;
      slider.value = 60; slider.dispatchEvent(new Event('input')); await wait(60);
      out.legend = { before, after: document.querySelector('.type-2 + .viridis-legend .viridis-legend-max')?.textContent };
      slider.value = 20; slider.dispatchEvent(new Event('input'));
      return out;
    });
    check('every grid row adds up to all studies; the N/A cell equals an independent count', !gc.dropped.length, gc.dropped.join('; '));
    check('Ratings and Spectrum grids show the same 48 counts (incl. N/A)', gc.gridsAgree);
    check('Year chart: distinct studies over all years = all studies', gc.yearTotal === 216, `${gc.yearTotal}`);
    check('chart menu offers Year, not identifiers or empty columns', gc.plotMenu.hasYear && !gc.plotMenu.banned.length && !gc.plotMenu.emptyCols.length, JSON.stringify(gc.plotMenu));
    check('intensity slider changes the colour scale legend', gc.legend.before && gc.legend.after && gc.legend.before !== gc.legend.after, JSON.stringify(gc.legend));

    console.log('\nkeyboard, theme and tour');
    // skip link moves focus to the main content
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await sleep(200);
    const skip = await page.evaluate(() => document.activeElement.id);
    check('skip link moves focus to the main content', skip === 'main-content', skip);
    // tab keyboard: ArrowRight / End / Home, roving tabindex
    await page.focus('#Show-plot');
    await page.keyboard.press('ArrowRight'); await sleep(250);
    const k1 = await page.evaluate(() => ({ focus: document.activeElement.id, selected: document.querySelector('#Show-data').getAttribute('aria-selected') }));
    await page.keyboard.press('End'); await sleep(250);
    const k2 = await page.evaluate(() => document.activeElement.id);
    await page.keyboard.press('Home'); await sleep(250);
    const k3 = await page.evaluate(() => ({ focus: document.activeElement.id, stops: [...document.querySelectorAll('#myTab [role=tab]')].filter(t => t.getAttribute('tabindex') === '0').map(t => t.id) }));
    check('tabs: Right/End/Home move between tabs; one tab stop', k1.focus === 'Show-data' && k1.selected === 'true' && k2 === 'Show-gaps' && k3.focus === 'Show-plot' && k3.stops.join() === 'Show-plot', JSON.stringify({ k1, k2, k3 }));
    // grid tooltip: shows on focus, Escape hides it
    await tab(page, 'Show-grid');
    await page.focus('.type-2 td[data-count]');
    await sleep(100);
    const tipShown = await page.$eval('#grid-tooltip', e => !e.hidden && /studies/.test(e.textContent));
    await page.keyboard.press('Escape');
    const tipHidden = await page.$eval('#grid-tooltip', e => e.hidden);
    check('grid tooltip appears on keyboard focus and Escape hides it', tipShown && tipHidden, JSON.stringify({ tipShown, tipHidden }));
    // theme
    await tab(page, 'Show-plot');
    const th = await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const bg = () => plotState.chart.options.chart.backgroundColor;
      const before = { theme: document.documentElement.getAttribute('data-theme'), bg: bg() };
      document.getElementById('theme').click(); await wait(200);
      const dark = { theme: document.documentElement.getAttribute('data-theme'), bg: bg(), label: document.getElementById('theme-text').textContent };
      document.getElementById('theme').click(); await wait(200);
      return { before, dark, after: { theme: document.documentElement.getAttribute('data-theme'), bg: bg(), label: document.getElementById('theme-text').textContent } };
    });
    check('dark mode switches the page and chart, and switches back', th.dark.theme === 'dark' && th.dark.bg !== th.before.bg && /Dark/.test(th.dark.label) && th.after.theme !== 'dark' && th.after.bg === th.before.bg, JSON.stringify(th));
    await page.close();
    // tour: starts on a first visit, cancelling remembers it
    const fresh = await browser.newPage();
    await fresh.setViewport({ width: 1440, height: 900 });
    await fresh.evaluateOnNewDocument(() => { if (!sessionStorage.getItem('reloaded')) localStorage.removeItem('pht_lab_tour_seen') });
    await fresh.goto(base, { waitUntil: 'networkidle0' });
    await fresh.waitForFunction(() => window.Shepherd && Shepherd.activeTour, { timeout: 8000 }).catch(() => {});
    const tour1 = await fresh.evaluate(() => ({ active: !!(window.Shepherd && Shepherd.activeTour), title: document.querySelector('.shepherd-title')?.textContent || '' }));
    await fresh.keyboard.press('Escape');
    await sleep(400);
    const tour2 = await fresh.evaluate(() => ({ active: !!(window.Shepherd && Shepherd.activeTour), seen: localStorage.getItem('pht_lab_tour_seen') }));
    check('guided tour starts on a first visit; Escape closes it and it is remembered', tour1.active && /Welcome/.test(tour1.title) && !tour2.active && tour2.seen === 'true', JSON.stringify({ tour1, tour2 }));
    await fresh.close();
    const page2 = await openPage(browser, base);
    const cardLinks = await page2.evaluate(() => {
      $('#myTab .item[data-tab="Show-data"]').trigger('click');
      return [...document.querySelectorAll('.secondUI .divOuter')].map(c => {
        const doi = [...c.querySelectorAll('.divInner')].find(d => d.querySelector('.spanLeft').textContent === 'DOI')?.querySelector('.spanRight').textContent.replace(' (opens paper in a new tab)', '');
        return { href: c.querySelector('.open-paper')?.href, doi, target: c.querySelector('.open-paper')?.target, rel: c.querySelector('.open-paper')?.rel };
      });
    });
    check('each card\'s "Open paper" link = doi.org + that card\'s DOI, new tab, noopener', cardLinks.length === 5 && cardLinks.every(l => l.href === 'https://doi.org/' + l.doi && l.target === '_blank' && /noopener/.test(l.rel)), JSON.stringify(cardLinks.find(l => l.href !== 'https://doi.org/' + l.doi) || ''));
    await page2.close();

    // -------------------------------------------------------------- a11y ----
    // ------------------------------------------------- share links, downloads ----
    console.log('\nshare links and downloads');
    {
      const origin = new URL(base).origin;
      await browser.defaultBrowserContext().overridePermissions(origin, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
      const A = await openPage(browser, base);
      // the default view keeps a clean address
      await A.evaluate(() => { applyFilters('reset'); document.body.click() });
      await sleep(500);
      const cleanHash = await A.evaluate(() => location.hash);
      // build a complex view through the real controls/state
      await A.evaluate(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        $('.secondDropdown').dropdown('set selected', 'study_interview'); await wait(50);
        $('.firstDropdown').dropdown('set selected', 'solo_entirely'); await wait(50);
        const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })) };
        set('globalSearch', 'blind'); set('YearFilter', '2005-2023'); await wait(300);
        $('#plotFilter').dropdown('set selected', 'Study Method');
        set('stackBy', 'Community of focus'); set('plotMode', 'percent');
        $('#myTab .item[data-tab="Show-data"]').trigger('click'); await wait(100);
        document.querySelector('.view-toggle [data-view="table"]').click(); await wait(50);
        document.querySelector('#studyTable .sort-button[data-col="Year"]').click(); await wait(50);
        set('pageSize', '50');
        set('gapRows', 'Technology Modality'); set('gapCols', 'Context'); set('gapMode', 'row');
        const hide = document.getElementById('gapHideNA'); hide.checked = false; hide.dispatchEvent(new Event('change', { bubbles: true }));
        $('#myTab .item[data-tab="Show-gaps"]').trigger('click'); await wait(100);
        document.body.click();
      });
      await sleep(600);
      const snap = p => p.evaluate(() => ({
        uids: filteredDataTmp.map(r => r.__uid).join(','), tab: document.querySelector('#myTab .item.active')?.getAttribute('data-tab'),
        filters: JSON.stringify(['first', 'second', 'third'].map(g => allFilters[g] || '')), search: document.getElementById('globalSearch').value, year: document.getElementById('YearFilter').value,
        x: $('#plotFilter').dropdown('get value'), stack: document.getElementById('stackBy').value, mode: document.getElementById('plotMode').value,
        view: dataView, sort: sortState.col + ' ' + sortState.dir, per: pageSizes[dataView],
        gaps: ['gapRows', 'gapCols', 'gapMode'].map(id => document.getElementById(id).value).concat(document.getElementById('gapHideNA').checked).join('|')
      }));
      const before = await snap(A);
      const url = await A.evaluate(() => location.href);
      // Copy link puts exactly this URL on the clipboard
      await A.click('#copyLink');
      await sleep(300);
      const copy = await A.evaluate(async () => ({ clip: await navigator.clipboard.readText().catch(e => 'ERR ' + e.message), href: location.href, label: document.querySelector('#copyLink .copy-label').textContent }));
      // downloads of the current (filtered, sorted) studies
      const dl = await A.evaluate(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        const rows = sortedRows();
        exportCsv(); const csv = downloadText.last;
        const parsed = XLSX.utils.sheet_to_json(XLSX.read(csv.text.replace(/^\uFEFF/, ''), { type: 'string' }).Sheets.Sheet1, { defval: '' });
        exportBibtex(); const bib = downloadText.last;
        const keys = [...bib.text.matchAll(/^@misc\{([^,]+),/gm)].map(m => m[1]);
        const dois = [...bib.text.matchAll(/doi = \{([^}]*)\}/g)].map(m => m[1].replace(/\\_/g, '_'));
        // nothing to export -> a message instead of an empty file
        document.getElementById('globalSearch').value = 'zzzqqqxx'; applyFilters(); await wait(50);
        let alerted = ''; const oa = window.alert; window.alert = m => { alerted = m }; downloadText.last = null; exportCsv(); window.alert = oa;
        return {
          csv: { name: csv.filename, bom: csv.text.charCodeAt(0) === 0xFEFF, rows: parsed.length, want: rows.length, sameOrder: parsed.map(r => r.Title).join('|') === rows.map(r => r.Title).join('|'), cols: Object.keys(parsed[0] || {}).length, wantCols: Object.keys(csvData[0]).length },
          bib: { name: bib.filename, entries: keys.length, unique: new Set(keys).size, want: rows.length, doisMatch: dois.join() === rows.filter(r => r.DOI).map(r => r.DOI).join() },
          empty: { alerted, wrote: !!downloadText.last }
        };
      });
      // open the link in a brand-new page: same studies, tab and settings
      const B = await browser.newPage();
      await B.setViewport({ width: 1440, height: 900 });
      const errsB = []; B.on('pageerror', e => errsB.push(e.message));
      await B.evaluateOnNewDocument(() => { localStorage.setItem('pht_lab_tour_seen', 'true'); localStorage.removeItem('pht_data_view') });
      await B.goto(url, { waitUntil: 'networkidle0' });
      await B.waitForFunction(() => window.plotState && document.querySelector('.currentRecords')?.textContent, { timeout: 30000 });
      await sleep(500);
      const after = await snap(B);
      const diff = Object.keys(before).filter(k => before[k] !== after[k]);
      // a link with bad values is handled safely
      await B.goto(base + '#f2=study_interview,not_a_token&x=NoSuchColumn&pp=999&tab=nope&cb=bogus', { waitUntil: 'networkidle0' });
      await B.reload({ waitUntil: 'networkidle0' });
      await sleep(500);
      const bad = await B.evaluate(() => ({ n: filteredDataTmp.length, tab: document.querySelector('#myTab .item.active')?.getAttribute('data-tab'), x: $('#plotFilter').dropdown('get value'), stack: document.getElementById('stackBy').value, per: pageSizes[dataView] }));
      const want92 = await B.evaluate(() => csvData.filter(r => String(r['Study Method']).split(';').map(x => x.trim()).includes('Interview')).length);
      // pasting another link into the same tab applies it
      await B.evaluate(() => { location.hash = 'q=autism' });
      await sleep(600);
      const pasted = await B.evaluate(() => ({ n: filteredDataTmp.length, box: document.getElementById('globalSearch').value }));
      check('default view keeps a clean address (no #…)', cleanHash === '', cleanHash);
      check('the address bar records tags, search, filters, chart, table, Gaps and tab', /f2=study_interview/.test(url) && /q=blind/.test(url) && /tab=gaps/.test(url) && /dv=table/.test(url) && /gr=Technology/.test(url), url.replace(/^[^#]*/, ''));
      check('opening the link in a new browser restores exactly the same view', diff.length === 0 && !errsB.length, diff.map(k => `${k}: ${before[k]} → ${after[k]}`).join('; ') + errsB.join('; '));
      check('"Copy link" copies the current view\'s link and confirms it', copy.clip === copy.href && /copied/i.test(copy.label), JSON.stringify(copy).slice(0, 200));
      check('a link with unknown values is handled safely (bad parts ignored)', bad.n === want92 && bad.tab === 'Show-plot' && bad.x === 'Year' && bad.stack === 'Participant Groups' && bad.per === 5, JSON.stringify(bad));
      check('pasting a new link into the tab applies it', pasted.box === 'autism' && pasted.n > 0 && pasted.n < 216, JSON.stringify(pasted));
      check('CSV download: every filtered study in display order, all columns, Excel-friendly', dl.csv.rows === dl.csv.want && dl.csv.want > 0 && dl.csv.sameOrder && dl.csv.cols === dl.csv.wantCols && dl.csv.bom && /\.csv$/.test(dl.csv.name), JSON.stringify(dl.csv));
      check('BibTeX download: one entry per filtered study, unique keys, matching DOIs', dl.bib.entries === dl.bib.want && dl.bib.unique === dl.bib.want && dl.bib.doisMatch && /\.bib$/.test(dl.bib.name), JSON.stringify(dl.bib));
      check('nothing to download -> a message, not an empty file', /No studies/.test(dl.empty.alerted) && !dl.empty.wrote, JSON.stringify(dl.empty));
      await A.close();
      await B.close();
    }

    // header control per tab, however the tab was opened (link or click)
    {
      const shown = p => p.evaluate(() => ({ chart: document.querySelector('.plotOptionsDiv').classList.contains('expand'), hider: document.querySelector('.plotFilterMultiSelect').classList.contains('expand') }));
      const results = [];
      for (const [hash, want] of [['#tab=data', { chart: false, hider: true }], ['#tab=data&dv=table', { chart: false, hider: false }], ['#tab=gaps', { chart: false, hider: false }], ['#tab=spectrum', { chart: false, hider: false }], ['', { chart: true, hider: false }]]) {
        const p = await openPage(browser, base + hash);
        await sleep(300);
        const got = await shown(p);
        results.push({ hash: hash || '(none)', ok: got.chart === want.chart && got.hider === want.hider, got });
        if (hash === '') {
          for (const [id, w] of [['#Show-data', { chart: false, hider: true }], ['#Show-gaps', { chart: false, hider: false }], ['#Show-plot', { chart: true, hider: false }]]) {
            await p.click(id); await sleep(300);
            const g = await shown(p);
            results.push({ hash: 'click ' + id, ok: g.chart === w.chart && g.hider === w.hider, got: g });
          }
        }
        await p.close();
      }
      check('header shows the right control for each tab, via links and clicks', results.every(r => r.ok), JSON.stringify(results.filter(r => !r.ok)));
    }

    // ---------------------------------------------- content security policy ----
    console.log('\nsecurity policy (CSP)');
    {
      const p = await browser.newPage();
      await p.setViewport({ width: 1440, height: 900 });
      const consoleCsp = [];
      p.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) consoleCsp.push(m.text().slice(0, 160)) });
      await p.evaluateOnNewDocument(() => {
        localStorage.setItem('pht_lab_tour_seen', 'true');
        window.__csp = [];
        document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + (e.blockedURI || '') + ' ' + (e.sample || '')));
      });
      await p.goto(base, { waitUntil: 'networkidle0' });
      await p.waitForFunction(() => window.plotState && plotState.chart);
      const policy = await p.evaluate(() => document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || '');
      // use every feature once
      await p.evaluate(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        const orig = XLSX.writeFile; XLSX.writeFile = () => {};
        const origDl = window.downloadText;
        document.querySelector('[data-action="export-xlsx"]').click();
        XLSX.writeFile = orig;
        for (const t of ['Show-data', 'ratings-grid', 'Show-grid', 'Show-gaps', 'Show-plot']) { $(`#myTab .item[data-tab="${t}"]`).trigger('click'); await wait(150) }
        document.getElementById('stackBy').value = 'Community of focus'; document.getElementById('plotMode').value = 'percent';
        document.getElementById('plotMode').dispatchEvent(new Event('change')); await wait(150);
        $('#myTab .item[data-tab="Show-data"]').trigger('click'); await wait(100);
        document.querySelector('.view-toggle [data-view="table"]').click(); await wait(100);
        document.querySelector('[data-action="export-csv"]').click(); document.querySelector('[data-action="export-bib"]').click();
        void origDl;
        document.getElementById('theme').click(); await wait(150); document.getElementById('theme').click();
        $('#myTab .item[data-tab="Show-gaps"]').trigger('click'); await wait(100);
        document.querySelector('#gapTable .gap-cell').click(); await wait(600); $('#spectrumData').modal('hide'); await wait(400);
        startGuidedTour(); await wait(300); Shepherd.activeTour && Shepherd.activeTour.cancel();
        document.querySelector('[data-action="reset"]').click(); await wait(100);
        location.hash = 'q=blind&tab=data'; await wait(400);
      });
      await sleep(500);
      const afterUse = await p.evaluate(() => window.__csp.slice());
      const consoleAfterUse = consoleCsp.slice(); // before the deliberate injection test below
      // an injected inline handler and eval must both be blocked
      const blocked = await p.evaluate(async () => {
        window.__inj = 0;
        const d = document.createElement('div');
        d.innerHTML = '<img src="data:," onerror="window.__inj=1"><a href="javascript:window.__inj=2" id="__jslink">x</a>';
        document.body.appendChild(d);
        d.querySelector('#__jslink').click();
        await new Promise(r => setTimeout(r, 300));
        let evalBlocked = false;
        try { eval('1 + 1') } catch (e) { evalBlocked = e instanceof EvalError || /unsafe-eval|Content Security/i.test(String(e)) }
        d.remove();
        return { injectedRan: window.__inj, evalBlocked, violationsSeen: window.__csp.length };
      });
      check('a strict Content-Security-Policy is set (own scripts only, no inline script, no eval)', /script-src 'self'(;|$)/.test(policy) && !/unsafe-eval/.test(policy) && /object-src 'none'/.test(policy), policy);
      check('using every feature causes no CSP violations', afterUse.length === 0 && consoleAfterUse.length === 0, afterUse.concat(consoleAfterUse).slice(0, 3).join(' | '));
      check('injected inline script is blocked by the policy', blocked.injectedRan === 0 && blocked.violationsSeen > 0, JSON.stringify(blocked));
      check('eval is blocked by the policy', blocked.evalBlocked, JSON.stringify(blocked));
      await p.close();
    }

    console.log('\naccessibility');
    const a11y = await openPage(browser, base);
    const violations = {};
    for (const [m, s] of [['Show-plot'], ['Show-plot', 'Show-plot/table'], ['Show-data'], ['ratings-grid'], ['Show-grid'], ['Show-gaps']]) {
      await tab(a11y, m);
      if (s) { await a11y.evaluate(s => $(`#show-plot-pane .menu .item[data-tab="${s}"]`).trigger('click'), s); await sleep(300) }
      if (!(await a11y.evaluate(() => !!window.axe))) await a11y.evaluate(AXE);
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
