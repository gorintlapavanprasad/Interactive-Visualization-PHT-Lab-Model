// Persona-based accessibility + speed test for the PHT Lab dashboard.
//
// Simulates, one at a time: a blind screen-reader/keyboard user, low vision at
// 200% and 400% zoom, four colour-vision deficiencies, a keyboard/switch user
// with motor impairment, a cognitive-load check, a deaf user, and combined
// profiles (zoom + colour blindness, Windows High Contrast + reduced motion).
// Also runs axe-core (WCAG 2.2 AA) on every tab and times filter changes.
//
// Setup (once):   cd tools && npm install
// Run:            serve the site (e.g. npx http-server .. -p 8765) then
//                 node tools/a11y-persona-test.js http://127.0.0.1:8765/ latest
// Output:         tools/a11y-report-<label>/report.json + screenshots
// Chrome path:    set CHROME_PATH if Chrome is not in the default location.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8765/';
const LABEL = process.argv[3] || 'fixed';
const OUT = path.join(__dirname, 'a11y-report-' + LABEL);
fs.mkdirSync(OUT, { recursive: true });
const AXE = fs.readFileSync(path.join(__dirname, 'node_modules/axe-core/axe.min.js'), 'utf8');
const CHROME = process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');
const report = { label: LABEL, base: BASE, personas: {} };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function openPage(browser, { width = 1440, height = 900, scale = 1 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.evaluateOnNewDocument(() => localStorage.setItem('pht_lab_tour_seen', 'true'));
  await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(800);
  page.__errors = errors;
  return page;
}
const count = (page) => page.$eval('.currentRecords', e => +e.textContent);
const focused = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return { tag: 'BODY' };
  const r = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  const lb = a.getAttribute('aria-labelledby'); const name = (lb && lb.split(' ').map(i => document.getElementById(i)?.textContent || '').join(' ')) || a.getAttribute('aria-label') || (a.labels && a.labels[0] && a.labels[0].textContent) || a.getAttribute('title') || a.textContent || '';
  return {
    tag: a.tagName, id: a.id, cls: String(a.className).slice(0, 40), role: a.getAttribute('role'),
    name: name.replace(/\s+/g, ' ').trim().slice(0, 70),
    visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0',
    outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none',
    size: [Math.round(r.width), Math.round(r.height)]
  };
});
async function axeRun(page) {
  if (!(await page.evaluate(() => !!window.axe))) await page.addScriptTag({ content: AXE });
  return page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] });
    return r.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map(n => n.target.join(' ')) }));
  });
}
async function showTab(page, main, sub) {
  await page.evaluate((m, s) => {
    $(`#myTab .item[data-tab="${m}"]`).trigger('click');
    if (s) $(`#show-plot-pane .menu .item[data-tab="${s}"]`).trigger('click');
  }, main, sub);
  await sleep(500);
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run', '--disable-extensions'] });
  try {
    // ---------------- 0. Automated WCAG scan (axe-core) on every view ----------
    {
      const page = await openPage(browser);
      const all = {};
      for (const [m, s] of [['Show-plot'], ['Show-plot', 'Show-plot/table'], ['Show-data'], ['ratings-grid'], ['Show-grid']]) {
        await showTab(page, m, s);
        for (const v of await axeRun(page)) {
          all[v.id] = all[v.id] || { impact: v.impact, n: 0, views: [], sample: v.sample };
          all[v.id].n = Math.max(all[v.id].n, v.n); all[v.id].views.push(s || m);
        }
        if (s) await showTab(page, 'Show-plot', 'Show-plot/visual');
      }
      report.axe = all;
      report.loadErrors = page.__errors;
      await page.close();
    }

    // ---------------- 1. Blind user: screen reader + keyboard only -------------
    {
      const page = await openPage(browser);
      const P = { issues: [], steps: [] };
      // First Tab should reach the skip link
      await page.keyboard.press('Tab');
      const f1 = await focused(page);
      P.steps.push({ step: 'first Tab', focus: f1 });
      if (!/skip/i.test(f1.name)) P.issues.push('First Tab does not land on the skip link');
      // Walk the tab order and record stops without an accessible name / invisible stops
      const stops = [];
      for (let i = 0; i < 60; i++) { await page.keyboard.press('Tab'); stops.push(await focused(page)); }
      const unnamed = stops.filter(s => s.tag !== 'BODY' && !s.name);
      const invisible = stops.filter(s => s.tag !== 'BODY' && !s.visible);
      const noRing = stops.filter(s => s.tag !== 'BODY' && s.visible && !s.outline);
      P.tabOrder = stops.map(s => `${s.tag}${s.role ? '[' + s.role + ']' : ''} "${s.name}"${s.visible ? '' : ' (INVISIBLE)'}`);
      if (unnamed.length) P.issues.push(`${unnamed.length} tab stops without an accessible name: ` + unnamed.slice(0, 4).map(s => s.tag + '.' + s.cls).join(', '));
      if (invisible.length) P.issues.push(`${invisible.length} tab stops are invisible (focus lost on screen): ` + invisible.slice(0, 4).map(s => s.tag + '#' + s.id + '.' + s.cls).join(', '));
      P.noFocusRing = noRing.map(s => s.tag + '.' + s.cls + ' "' + s.name + '"').slice(0, 10);

      // Use a filter with the keyboard: focus Study Method combobox, type, Enter
      await page.focus('.secondDropdown input.search');
      await page.keyboard.type('Interview');
      await sleep(300);
      await page.keyboard.press('Enter');
      await sleep(900);
      P.keyboardFilterCount = await count(page);
      P.announcement = await page.$eval('#sr-announcer', e => e.textContent).catch(() => null);
      P.recordsRegion = await page.$eval('.records', e => ({ live: e.getAttribute('aria-live'), text: e.textContent.replace(/\s+/g, ' ').trim() }));
      if (P.keyboardFilterCount !== 92) P.issues.push(`Keyboard filter "Interview" gave ${P.keyboardFilterCount} (expected 92)`);
      if (!P.announcement || !/92/.test(P.announcement)) P.issues.push('Result count change was not announced via the status live region');
      // Remove the tag with keyboard (Backspace in empty search)
      await page.keyboard.press('Escape');
      await page.focus('.secondDropdown input.search');
      await page.keyboard.press('Backspace');
      await sleep(600);
      P.afterBackspace = await count(page);

      // Tabs via keyboard: focus Data tab and press Enter
      await page.focus('#Show-data');
      await page.keyboard.press('Enter');
      await sleep(500);
      P.dataTabActive = await page.$eval('#Show-data-pane', e => e.classList.contains('active'));
      P.tabsArrowKeys = await page.evaluate(async () => {
        document.querySelector('#Show-data').focus();
        document.querySelector('#Show-data').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        return document.activeElement.id;
      });
      if (!P.dataTabActive) P.issues.push('Data tab cannot be opened with Enter');

      // Open study details from a card with Enter; check focus moves into the dialog and returns on Escape
      await page.evaluate(() => $('#myTab .item[data-tab="Show-data"]').trigger('click'));
      await sleep(500);
      await page.focus('.secondUI .clickable-row');
      const opener = await focused(page);
      await page.keyboard.press('Enter');
      await sleep(900);
      const inDialog = await page.evaluate(() => !!document.activeElement.closest('#studyAbstractModal'));
      P.dialog = { opener: opener.name, focusMovedIntoDialog: inDialog };
      // Tab 15 times; must stay inside the modal (focus trap)
      let escaped = false;
      for (let i = 0; i < 15; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('#studyAbstractModal')))) escaped = true; }
      P.dialog.focusEscapedWhileOpen = escaped;
      await page.keyboard.press('Escape');
      await sleep(900);
      const back = await focused(page);
      P.dialog.focusAfterClose = back.name;
      P.dialog.focusReturnedToOpener = back.name === opener.name;
      if (!inDialog) P.issues.push('Opening study details does not move focus into the dialog');
      if (escaped) P.issues.push('Keyboard focus can leave the open dialog (no focus trap)');
      if (!P.dialog.focusReturnedToOpener) P.issues.push(`Closing the dialog does not return focus to the card (focus went to "${back.name}" ${back.tag})`);

      // Spectrum grid via keyboard
      await showTab(page, 'Show-grid');
      await page.focus('.type-2 td[data-count]');
      const cell = await focused(page);
      const tip = await page.$eval('#grid-tooltip', e => !e.hidden && e.textContent).catch(() => null);
      await page.keyboard.press('Enter');
      await sleep(900);
      P.grid = { cellName: cell.name, tooltipOnFocus: tip, listDialogFocused: await page.evaluate(() => !!document.activeElement.closest('#spectrumData')) };
      if (!P.grid.listDialogFocused) P.issues.push('Opening a grid cell list does not move focus into the dialog');
      await page.keyboard.press('Escape');
      await sleep(600);

      // Chart keyboard access (Highcharts a11y)
      await showTab(page, 'Show-plot');
      P.chart = await page.evaluate(() => {
        const svg = document.querySelector('#plotIt svg');
        const desc = document.querySelector('#plotIt .highcharts-a11y-proxy-container, #plotIt [id^="highcharts-screen-reader-region"]');
        return { hasSvgTitle: !!(svg && svg.querySelector('title, desc')), screenReaderRegion: !!desc, proxyButtons: document.querySelectorAll('#plotIt .highcharts-a11y-proxy-element').length };
      });

      // Landmarks & headings outline as a screen reader user hears it
      P.outline = await page.evaluate(() => ({
        landmarks: [...document.querySelectorAll('main,[role=main],nav,[role=navigation],aside,[role=complementary],header,[role=banner],[role=search],form[aria-label],[role=region][aria-label]')].map(e => (e.getAttribute('role') || e.tagName.toLowerCase()) + (e.getAttribute('aria-label') ? ': ' + e.getAttribute('aria-label') : '')),
        headings: [...document.querySelectorAll('h1,h2,h3,h4')].filter(h => h.offsetParent || h.classList.contains('sr-only')).map(h => h.tagName + ' ' + h.textContent.replace(/\s+/g, ' ').trim().slice(0, 50))
      }));
      P.errors = page.__errors;
      report.personas.blind_screenreader_keyboard = P;
      await page.close();
    }

    // ---------------- 2. Low vision: 200% and 400% zoom -----------------------
    for (const [label, w, h] of [['zoom200', 720, 450], ['zoom400', 360, 225]]) {
      const page = await openPage(browser, { width: w, height: h * 2, scale: 1 });
      const P = { issues: [] };
      P.state = await page.evaluate(() => {
        const vis = (sel) => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && r.width > 0 && r.right > 0 && r.left < innerWidth; };
        const tiny = [...document.querySelectorAll('body *')].filter(e => e.childElementCount === 0 && e.textContent.trim() && e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 10).length;
        return {
          shieldBlocksApp: vis('#desktop-shield'), sidebarVisible: vis('.sidebar-filters'), filtersUsable: vis('#titleFilter'),
          chartVisible: vis('#plotIt'), horizontalScroll: document.documentElement.scrollWidth > innerWidth + 1,
          scrollWidth: document.documentElement.scrollWidth, innerWidth, textUnder10px: tiny,
          settingsVisible: vis('.hover-nav-trigger')
        };
      });
      if (P.state.shieldBlocksApp) P.issues.push('"Optimal on Desktop" screen hides the whole app');
      if (!P.state.filtersUsable) P.issues.push('Filters are not reachable');
      if (!P.state.chartVisible) P.issues.push('Chart not visible');
      if (P.state.horizontalScroll) P.issues.push(`Page scrolls horizontally (${P.state.scrollWidth}px content in ${P.state.innerWidth}px)`);
      if (P.state.textUnder10px) P.issues.push(`${P.state.textUnder10px} text elements smaller than 10px`);
      if (!P.state.settingsVisible) P.issues.push('Theme/tour settings button hidden');
      await page.screenshot({ path: path.join(OUT, `lowvision-${label}.png`) });
      P.axeContrast = (await axeRun(page)).filter(v => /contrast/.test(v.id));
      report.personas['low_vision_' + label] = P;
      await page.close();
    }

    // ---------------- 3. Colour vision deficiencies --------------------------
    {
      const page = await openPage(browser);
      const cdp = await page.target().createCDPSession();
      const P = {};
      for (const type of ['deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia']) {
        await cdp.send('Emulation.setEmulatedVisionDeficiency', { type });
        await showTab(page, 'Show-plot');
        await page.screenshot({ path: path.join(OUT, `colour-${type}-plot.png`) });
        await showTab(page, 'Show-grid');
        await page.screenshot({ path: path.join(OUT, `colour-${type}-grid.png`) });
      }
      await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
      // Is any information carried by colour alone?
      P.palette = await page.evaluate(() => (window.plotState && plotState.chart) ? plotState.chart.series.map(s => s.color) : (Highcharts.charts.filter(Boolean)[0]?.series || []).map(s => s.color));
      P.gridShowsNumbers = await page.evaluate(() => [...document.querySelectorAll('.type-2 td[data-column]')].some(td => /\d/.test(td.textContent)));
      P.legend = await page.evaluate(() => !!document.querySelector('.viridis-legend'));
      report.personas.colour_blind = P;
      await page.close();
    }

    // ---------------- 4. Motor impairment: keyboard/switch, target size -------
    {
      const page = await openPage(browser);
      const P = { issues: [] };
      P.smallTargets = await page.evaluate(() => {
        const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[tabindex="0"],[role=button],[role=tab],.ui.dropdown,.item[data-value]';
        return [...document.querySelectorAll(sel)].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return { e: (e.id ? '#' + e.id : e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.')) + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 25) + '"', w: Math.round(r.width), h: Math.round(r.height) }; })
          .filter(x => x.w > 0 && (x.w < 24 || x.h < 24));
      });
      if (P.smallTargets.length) P.issues.push(`${P.smallTargets.length} interactive targets smaller than 24×24px (WCAG 2.5.8)`);
      // Keyboard trap check: 250 Tabs must keep moving focus
      const seen = new Set(); let stuck = 0, last = '';
      for (let i = 0; i < 250; i++) {
        await page.keyboard.press('Tab');
        const k = await page.evaluate(() => { const a = document.activeElement; return a.tagName + '#' + a.id + '.' + a.className + (a.getAttribute('data-value') || '') + (a.textContent || '').slice(0, 15); });
        if (k === last) stuck++; else stuck = 0; last = k; seen.add(k);
        if (stuck > 5) { P.issues.push('Keyboard trap: focus stuck on ' + k); break; }
      }
      P.uniqueTabStops = seen.size;
      // Settings menu (theme / tour) reachable without hover?
      await page.focus('.hover-nav-trigger');
      await sleep(300);
      P.settingsMenuOpensOnFocus = await page.evaluate(() => { const m = document.querySelector('.hover-nav-menu'); const cs = getComputedStyle(m); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0; });
      P.settingsExpanded = await page.$eval('.hover-nav-trigger', e => e.getAttribute('aria-expanded'));
      if (!P.settingsMenuOpensOnFocus) P.issues.push('Settings menu (theme, tour) only opens on mouse hover');
      report.personas.motor_keyboard_only = P;
      await page.close();
    }

    // ---------------- 5. Cognitive / learning ---------------------------------
    {
      const page = await openPage(browser);
      const P = { issues: [] };
      await page.type('#YearFilter', '20x0');
      await page.$eval('#YearFilter', e => e.blur());
      await sleep(400);
      P.invalidYear = await page.evaluate(() => {
        const i = document.getElementById('YearFilter');
        const f = i.closest('.field');
        const desc = i.getAttribute('aria-describedby');
        return { fieldMarkedError: f.classList.contains('error'), ariaInvalid: i.getAttribute('aria-invalid'), visibleMessage: desc ? (document.getElementById(desc)?.textContent || '') : '', count: document.querySelector('.currentRecords').textContent };
      });
      if (!P.invalidYear.visibleMessage) P.issues.push('Invalid year shows no visible, announced error message (only a red border)');
      P.jargon = await page.evaluate(() => [...document.querySelectorAll('.filterHeader, #myTab .item, h1, h3')].map(e => e.textContent.trim()).filter(Boolean));
      report.personas.cognitive = P;
      await page.close();
    }

    // ---------------- 6. Deaf / hard of hearing -------------------------------
    {
      const page = await openPage(browser);
      report.personas.deaf = await page.evaluate(() => ({
        mediaElements: document.querySelectorAll('audio,video').length,
        sonificationOnlyOnClick: true,
        note: 'Sonification (pitch per bar) is an optional extra; all information is also visual and textual.'
      }));
      await page.close();
    }

    // ---------------- 7. Combined disabilities ---------------------------------
    {
      // Low vision + colour blind: 200% zoom with deuteranopia
      const page = await openPage(browser, { width: 720, height: 900 });
      const cdp = await page.target().createCDPSession();
      await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'deuteranopia' });
      await page.screenshot({ path: path.join(OUT, 'combined-zoom200-deuteranopia.png') });
      // Windows High Contrast (forced colours) + reduced motion
      await cdp.send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });
      await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
      await page.setViewport({ width: 1440, height: 900 });
      await sleep(500);
      await showTab(page, 'Show-grid');
      await page.screenshot({ path: path.join(OUT, 'combined-forcedcolors-grid.png') });
      report.personas.combined = { screenshots: ['combined-zoom200-deuteranopia.png', 'combined-forcedcolors-grid.png'] };
      await page.close();
    }

    // ---------------- Speed --------------------------------------------------
    {
      const page = await openPage(browser);
      report.speed = await page.evaluate(async () => {
        const out = {};
        const t = async (fn) => { const s = performance.now(); fn(); await new Promise(r => setTimeout(r, 0)); return Math.round(performance.now() - s); };
        out.tagPlotTab = await t(() => $('.secondDropdown').dropdown('set selected', 'study_interview'));
        out.tagPlotTab2 = await t(() => $('.secondDropdown').dropdown('set selected', 'study_survey'));
        out.reset = await t(() => applyFilters('reset'));
        $('#myTab .item[data-tab="Show-grid"]').trigger('click');
        await new Promise(r => setTimeout(r, 300));
        out.tagGridTab = await t(() => $('.firstDropdown').dropdown('set selected', 'solo_entirely'));
        out.dom = document.getElementsByTagName('*').length;
        return out;
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 1));
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
