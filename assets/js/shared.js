// shared.js — Labels and colours shared by the chart, grids, study list and Gaps tab (answer labels and ordering, viridis palette, contrast).
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

// ---------------------------------------------------------------------------
// Chart controls: "Colour bars by" (any coded column, or none) and
// "Show" (number of studies / percentages). Native <select>s for accessibility.
// ---------------------------------------------------------------------------
const NOT_RECORDED = 'Not recorded';
const STACK_DEFAULT = 'Participant Groups';

const stripExample = v => String(v).replace(/\s*\((?:i\.e\.|e\.g\.)[^)]*\)\s*$/, '');
// Chart label for an answer: drop the (i.e., …) example, group free-text
// "Other: …" answers as "Other" (like the filters do), shorten the long
// "Undisclosed/Unknown, but the paper…" option.
function displayLabel(v) {
    const s = stripExample(v).trim();
    if (canon(s).startsWith('other')) return 'Other';
    if (/^undisclosed\/unknown/i.test(s)) return 'Undisclosed/Unknown';
    return s
}
const shortLabel = col => col === 'Year' ? 'Year' : String(col).replace(/\s*\(.*\)\s*:?$/, '');

// The coded columns (framework, methods, participants…) in FILTER_SPECS order.
function codedColumns() {
    const cols = [];
    for (const g of Object.values(FILTER_SPECS)) for (const c of Object.keys(g)) if (!cols.includes(c)) cols.push(c);
    return cols
}

// Order answers the way the framework lists them (Totally fun -> Totally utility),
// numbers numerically, anything else alphabetically; "Not recorded" last.
function orderValues(col, labels) {
    let spec = null;
    for (const g of Object.values(FILTER_SPECS)) if (g[col]) spec = Object.values(g[col]).map(canon);
    const nr = labels.filter(l => l === NOT_RECORDED);
    const rest = labels.filter(l => l !== NOT_RECORDED);
    if (rest.length && rest.every(k => k !== '' && !isNaN(Number(k)))) return rest.sort((a, b) => Number(a) - Number(b)).concat(nr);
    const idx = l => {
        if (!spec) return -1;
        const c = canon(l);
        let i = spec.indexOf(c);
        if (i < 0 && c.startsWith('other')) i = spec.indexOf('other');
        if (i < 0) i = spec.findIndex(x => x.startsWith(c)); // shortened labels
        return i
    };
    return rest.sort((a, b) => {
        const ia = idx(a), ib = idx(b);
        if (ia >= 0 && ib >= 0) return ia - ib;
        if (ia >= 0) return -1;
        if (ib >= 0) return 1;
        return a.localeCompare(b)
    }).concat(nr)
}

// --- Viridis (matplotlib/R viridis) -------------------------------------------
// 9 evenly spaced stops of viridis(9); linear interpolation between them.
const VIRIDIS_STOPS = ['#440154', '#472D7B', '#3B528B', '#2C728E', '#21908C', '#27AD81', '#5DC863', '#AADC32', '#FDE725']
    .map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));

function viridisRgb(t) {
    const x = Math.max(0, Math.min(1, t)) * (VIRIDIS_STOPS.length - 1);
    const i = Math.min(Math.floor(x), VIRIDIS_STOPS.length - 2);
    const f = x - i;
    return VIRIDIS_STOPS[i].map((c, k) => Math.round(c + (VIRIDIS_STOPS[i + 1][k] - c) * f))
}

// Categorical chart colours sampled from viridis, as in R's viridis(7).
// Dark theme uses viridis(7, begin = 0.25) so the darkest purple doesn't vanish
// into the dark background.
function chartPalette(n = 7) {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const begin = dark ? 0.25 : 0, end = 1;
    // One series: a single mid-viridis colour. Otherwise n evenly spaced stops.
    if (n <= 1) return ['#' + viridisRgb(dark ? 0.6 : 0.4).map(c => c.toString(16).padStart(2, '0')).join('')];
    return Array.from({ length: n }, (_, i) => {
        const rgb = viridisRgb(begin + (end - begin) * i / (n - 1));
        return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('')
    })
}

function relLuminance([r, g, b]) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function bestTextColor(rgb) {
    const L = relLuminance(rgb);
    const vsWhite = 1.05 / (L + 0.05), vsBlack = (L + 0.05) / 0.05;
    return vsWhite >= vsBlack ? '#ffffff' : '#000000'
}

function cssColorToRgb(color) {
    const probe = document.createElement('span');
    probe.style.color = color;
    document.body.appendChild(probe);
    const m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [255, 255, 255];
    probe.remove();
    return m.slice(0, 3).map(Number)
}


// ---- One Tab stop per table of cells (#20) --------------------------------
// Grids and the gap table have dozens of clickable cells. Instead of a Tab stop
// for each, the table gets one stop and the arrow keys move between cells
// (Home/End: row start/end; Ctrl+Home/End: first/last cell). The last cell
// used keeps the stop, so Tab returns to it.
function enableRovingCells(table, cellSelector) {
    if (!table) return;
    const cells = () => [...table.querySelectorAll(cellSelector)].filter(c => c.getAttribute('tabindex') !== null || c.tagName === 'BUTTON');
    const list = cells();
    if (!list.length) return;
    const current = list.find(c => c.dataset.rovingStop === '1') || list[0];
    list.forEach(c => { c.setAttribute('tabindex', c === current ? '0' : '-1'); c.dataset.rovingStop = c === current ? '1' : '' });
    if (!table.dataset.rovingHint) {
        table.dataset.rovingHint = '1';
        const hint = document.createElement('p');
        hint.className = 'sr-only';
        hint.id = (table.id || ('roving-' + Math.random().toString(36).slice(2, 8))) + '-keys';
        hint.textContent = 'Use the arrow keys to move between cells; Enter lists the studies.';
        table.insertAdjacentElement('beforebegin', hint);
        table.setAttribute('aria-describedby', hint.id)
    }
    if (table.dataset.rovingBound) return;
    table.dataset.rovingBound = '1';
    const pos = c => { const td = c.closest('td,th'); return { row: td.parentElement.rowIndex ?? [...td.parentElement.parentElement.children].indexOf(td.parentElement), col: td.cellIndex } };
    const moveTo = (from, to) => {
        if (!to) return;
        from.setAttribute('tabindex', '-1'); from.dataset.rovingStop = '';
        to.setAttribute('tabindex', '0'); to.dataset.rovingStop = '1';
        to.focus()
    };
    table.addEventListener('focusin', e => {
        const c = e.target.closest(cellSelector);
        if (!c || !table.contains(c)) return;
        cells().forEach(x => { const on = x === c; x.setAttribute('tabindex', on ? '0' : '-1'); x.dataset.rovingStop = on ? '1' : '' })
    });
    table.addEventListener('keydown', e => {
        const c = e.target.closest(cellSelector);
        if (!c || !table.contains(c)) return;
        const all = cells().map(x => ({ x, ...pos(x) }));
        const me = pos(c);
        const rows = [...new Set(all.map(a => a.row))].sort((a, b) => a - b);
        const inRow = r => all.filter(a => a.row === r).sort((a, b) => a.col - b.col);
        const nearest = (r) => { const rr = inRow(r); return rr.length ? rr.reduce((best, a) => Math.abs(a.col - me.col) < Math.abs(best.col - me.col) ? a : best).x : null };
        let target = null;
        if (e.key === 'ArrowRight') target = inRow(me.row).find(a => a.col > me.col)?.x;
        else if (e.key === 'ArrowLeft') target = inRow(me.row).reverse().find(a => a.col < me.col)?.x;
        else if (e.key === 'ArrowDown') { const r = rows.find(r => r > me.row); target = r !== undefined ? nearest(r) : null }
        else if (e.key === 'ArrowUp') { const r = [...rows].reverse().find(r => r < me.row); target = r !== undefined ? nearest(r) : null }
        else if (e.key === 'Home') target = e.ctrlKey ? all.sort((a, b) => a.row - b.row || a.col - b.col)[0].x : inRow(me.row)[0].x;
        else if (e.key === 'End') { if (e.ctrlKey) { const s = all.sort((a, b) => a.row - b.row || a.col - b.col); target = s[s.length - 1].x } else { const rr = inRow(me.row); target = rr[rr.length - 1].x } }
        else return;
        e.preventDefault();
        moveTo(c, target)
    })
}

// ---- Empty state (#22): say what happened and what to do next ---------------
// The Reset button uses the page's data-action handler (app.js).
function noStudiesHtml() {
    return '<div class="empty-state">' +
        '<p class="empty-title">No studies match your filters.</p>' +
        '<p>Try removing a filter or using fewer search words.</p>' +
        '<button type="button" class="ui button" data-action="reset"><i class="undo icon" aria-hidden="true"></i> Reset all filters</button>' +
        '</div>'
}

// ---- Reduced motion (#24) ---------------------------------------------------
// True when the user asked the system for less motion. CSS handles transitions;
// this covers motion started from script (chart animation, smooth scrolling).
function reducedMotion() {
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
}
const scrollBehavior = () => reducedMotion() ? 'auto' : 'smooth';
