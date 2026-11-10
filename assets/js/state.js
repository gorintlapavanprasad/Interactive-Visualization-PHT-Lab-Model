// state.js — Loads the study data and holds shared app state and small utilities.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

var LOOKUP_CACHE = {};
var csvData = window.myModule ? window.myModule.filteredModuleData.sort((a, b) => a.Year - b.Year) : [];
// "Study ID" (author + year) is NOT unique: e.g. two different "Zhang 2023" papers.
// Give each row a hidden, stable key. Non-enumerable so it never shows up in the
// cards, the plot options or the XLSX export.
csvData.forEach((row, i) => {
    Object.defineProperty(row, '__uid', { value: String(i) });
    if ('DOI' in row) row.DOI = normalizeDoi(row.DOI)
});
buildSearchIndex(csvData);
var currentSearch = null; // parsed query while a search is active (for ranking + highlighting)
var filteredDataTmp = [];
var allFilters = {};
var currentTheme = "light";
var resizeTimeout;
var currentTourInstance = null;
var isRowDropdownInitialized = !1;
var isPlotDropdownInitialized = !1;
var columnIdMap = {};

function buildLookupCache() {
    for (const group in FILTER_SPECS) {
        for (const colHeader in FILTER_SPECS[group]) {
            for (const token in FILTER_SPECS[group][colHeader]) {
                LOOKUP_CACHE[token] = {
                    col: colHeader,
                    val: FILTER_SPECS[group][colHeader][token]
                }
            }
        }
    }
}
const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay)
    }
};
const getVal = (id, lower = !0) => {
    const el = document.getElementById(id);
    return el ? (lower ? el.value.trim().toLowerCase() : el.value.trim()) : ""
};
// "2010-2020" -> [2010, 2020]; also accepts the range typed backwards ("2020-2010").
const parseRangeInput = (input) => {
    if (!input) return null;
    if (!input.includes('-')) return input.trim();
    const [a, b] = input.split('-').map(Number);
    return [Math.min(a, b), Math.max(a, b)]
};
const checkRange = (range, val) => {
    if (!val) return !1;
    return Array.isArray(range) ? (range[0] <= Number(val) && range[1] >= Number(val)) : String(range) === String(val)
};

const getDSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function announce(msg) {
    const el = document.getElementById('sr-announcer');
    if (!el) return;
    el.textContent = '';
    setTimeout(() => { el.textContent = msg }, 50)
}

