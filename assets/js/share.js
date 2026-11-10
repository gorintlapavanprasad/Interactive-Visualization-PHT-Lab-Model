// share.js — Shareable links: the address bar always describes the current view
// (tab, filters, search, chart, study list and Gaps settings), so it can be copied,
// bookmarked or put in a paper. Opening such a link restores that view.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

// Short keys keep links readable, e.g.  #tab=gaps&q=blind&f2=study_interview
const SHARE_TABS = { 'Show-plot': 'plot', 'Show-data': 'data', 'ratings-grid': 'ratings', 'Show-grid': 'spectrum', 'Show-gaps': 'gaps' };
const SHARE_TEXT = { q: 'globalSearch', ti: 'titleFilter', au: 'authorFilter', yr: 'YearFilter', pg: 'PagesFilter', no: 'NotesFilter' };
const SHARE_SELECTS = { cb: 'stackBy', sh: 'plotMode', gr: 'gapRows', gc: 'gapCols', gm: 'gapMode' };
var applyingShareState = false;

function currentTabPath() {
    return document.querySelector('#myTab .item.active')?.getAttribute('data-tab') || 'Show-plot'
}

// Current view -> URLSearchParams (defaults are left out, so the default view has a clean URL).
function shareState() {
    const p = new URLSearchParams();
    const tab = SHARE_TABS[currentTabPath()];
    if (tab && tab !== 'plot') p.set('tab', tab);
    ['first', 'second', 'third'].forEach((g, i) => { if (allFilters[g]) p.set('f' + (i + 1), allFilters[g]) });
    for (const [k, id] of Object.entries(SHARE_TEXT)) { const v = document.getElementById(id)?.value.trim(); if (v) p.set(k, v) }
    const x = $('#plotFilter').dropdown('get value');
    if (x && x !== 'Year') p.set('x', x);
    for (const [k, id] of Object.entries(SHARE_SELECTS)) {
        const el = document.getElementById(id);
        if (el && el.dataset.default !== undefined && el.value !== el.dataset.default) p.set(k, el.value === '' ? 'none' : el.value)
    }
    if (!document.getElementById('gapHideNA')?.checked) p.set('gn', '0');
    if (dataView !== 'cards') p.set('dv', dataView);
    if (sortState.col) { p.set('sb', sortState.col); p.set('sd', sortState.dir) }
    if (pageSizes[dataView] !== (dataView === 'table' ? 25 : 5)) p.set('pp', String(pageSizes[dataView]));
    if (dataView === 'table' && tableColumns.join('|') !== DEFAULT_TABLE_COLUMNS.join('|')) p.set('cols', tableColumns.join('|'));
    return p
}

function shareUrl() {
    const p = shareState().toString();
    return location.href.replace(/#.*$/, '') + (p ? '#' + p : '')
}

// Keep the address bar in step without adding browser-history entries.
const syncUrl = debounce(() => {
    if (applyingShareState) return;
    const url = shareUrl();
    if (url !== location.href) history.replaceState(null, '', url)
}, 300);

// Apply a link's state (on load, or when someone pastes a new link into the tab).
function applyShareState(hash) {
    const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
    if (![...p.keys()].length) return false;
    applyingShareState = true;
    suppressApply = true;
    try {
        ['first', 'second', 'third'].forEach((g, i) => {
            const tokens = (p.get('f' + (i + 1)) || '').split(',').filter(t => LOOKUP_CACHE[t]);
            if (tokens.length) $(`.${g}Dropdown`).dropdown('set exactly', tokens);
            allFilters[g] = tokens.join(',')
        });
        for (const [k, id] of Object.entries(SHARE_TEXT)) { const el = document.getElementById(id); if (el && p.has(k)) el.value = p.get(k) }
        const x = p.get('x');
        if (x && csvData.length && x in csvData[0]) $('#plotFilter').dropdown('set selected', x);
        for (const [k, id] of Object.entries(SHARE_SELECTS)) {
            const el = document.getElementById(id);
            if (!el || !p.has(k)) continue;
            const v = p.get(k) === 'none' ? '' : p.get(k);
            if ([...el.options].some(o => o.value === v)) el.value = v
        }
        if (p.get('gn') === '0') document.getElementById('gapHideNA').checked = !1;
        if (p.get('dv') === 'table' || p.get('dv') === 'cards') dataView = p.get('dv');
        if (p.has('cols')) {
            const known = Object.keys(csvData[0] || {});
            const cols = p.get('cols').split('|').filter(c => known.includes(c));
            if (cols.length) tableColumns = cols
        }
        if (p.has('sb') && (p.get('sb') in (csvData[0] || {}))) sortState = { col: p.get('sb'), dir: p.get('sd') === 'desc' ? 'desc' : 'asc' };
        if (p.has('pp')) { const n = Number(p.get('pp')); if (PAGE_SIZES[dataView].includes(n)) pageSizes[dataView] = n }
    } finally {
        suppressApply = false
    }
    viewsDirty.plot = viewsDirty.grid = viewsDirty.gaps = !0;
    applyFilters();
    const tab = Object.entries(SHARE_TABS).find(([, v]) => v === p.get('tab'))?.[0];
    if (tab) $(`#myTab .item[data-tab="${tab}"]`).trigger('click');
    applyingShareState = false;
    return true
}

async function copyShareLink() {
    const url = shareUrl();
    history.replaceState(null, '', url);
    let copied = false;
    try { await navigator.clipboard.writeText(url); copied = true } catch { }
    if (!copied) {
        // Fallback for browsers without clipboard access: show the link to copy by hand.
        window.prompt('Copy this link to share the current view:', url);
        return
    }
    const btn = document.getElementById('copyLink');
    if (btn) {
        btn.classList.add('copied');
        btn.querySelector('.copy-label').textContent = 'Link copied';
        setTimeout(() => { btn.classList.remove('copied'); btn.querySelector('.copy-label').textContent = 'Copy link' }, 2500)
    }
    announce('Link to this view copied.')
}

function initShareLinks() {
    // Remember each select's default so the URL only lists real changes.
    Object.values(SHARE_SELECTS).forEach(id => { const el = document.getElementById(id); if (el) el.dataset.default = el.value });
    document.getElementById('copyLink')?.addEventListener('click', copyShareLink);
    // Any interaction may change the view; syncUrl is debounced and cheap.
    ['change', 'input', 'click', 'keyup'].forEach(ev => document.addEventListener(ev, () => syncUrl(), !0));
    window.addEventListener('hashchange', () => applyShareState(location.hash))
}
