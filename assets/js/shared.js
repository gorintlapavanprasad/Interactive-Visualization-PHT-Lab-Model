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

