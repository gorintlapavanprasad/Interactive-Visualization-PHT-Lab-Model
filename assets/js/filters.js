// filters.js — Filtering: render scheduling, applyFilters, live option counts and the header controls per tab.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

// ---------------------------------------------------------------------------
// Render scheduling
// Several UI events can fire for one user action (e.g. "clear" fires a change
// per tag). scheduleApply() coalesces them into a single filter+render on the
// next animation frame, and suppressApply silences them during bulk resets.
// ---------------------------------------------------------------------------
var suppressApply = false;
var applyQueued = false;

function scheduleApply() {
    if (suppressApply || applyQueued) return;
    applyQueued = true;
    // Microtask: runs right after the current burst of synchronous events.
    // (requestAnimationFrame would stall while the tab is in the background.)
    Promise.resolve().then(() => {
        applyQueued = false;
        applyFilters()
    })
}

function setDataFilters(value, args) {
    allFilters[args] = value;
    scheduleApply()
}
// Short debounce: filtering itself takes a few ms, this only avoids
// re-rendering on every keystroke while someone is mid-word.
const debouncedFilterExecution = debounce(() => {
    applyFilters()
}, 150);

function validateAndApply() {
    const inputs = document.querySelectorAll(".inputFilters input");
    let allValid = !0;
    inputs.forEach(input => {
        const field = input.closest('.field');
        const isValid = input.checkValidity();
        if (!isValid) allValid = !1;
        field.classList.toggle('error', !isValid);
        // Visible + programmatic error text, not just a red border (WCAG 3.3.1).
        input.setAttribute('aria-invalid', isValid ? 'false' : 'true');
        const errId = input.getAttribute('aria-describedby');
        if (errId) {
            let msg = document.getElementById(errId);
            if (!msg) {
                msg = document.createElement('div');
                msg.id = errId;
                msg.className = 'field-error';
                field.appendChild(msg)
            }
            msg.textContent = isValid ? '' : (input.getAttribute('title') || 'Check the format of this value.')
        }
    });
    if (allValid) {
        debouncedFilterExecution()
    }
}

function applyFilters(args) {
    if (args === "reset") {
        document.querySelector(".recordsStatus").innerHTML = `Records `;
        TEXT_FILTER_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = "";
                el.closest('.field')?.classList.remove('error')
            }
        });
        // Clear every dropdown without triggering a render (and a focus jump into
        // the last dropdown) per removed tag; render exactly once afterwards.
        suppressApply = true;
        try {
            $('.firstDropdown, .secondDropdown, .thirdDropdown, #removeColumns').dropdown("clear")
        } finally {
            suppressApply = false
        }
        allFilters = {};
        filteredDataTmp = csvData;
        currentSearch = null;
        const status = document.getElementById('globalSearch-status');
        if (status) status.textContent = ''; // the old "N studies found" line must go too
        applyColumnFilter([]);
        renderTable(filteredDataTmp);
        updateFilterCounts(csvData, {});
        announceResults();
        return
    }
    let activeCriteria = {};
    let selectedTokens = Object.values(allFilters).flatMap(v => v ? v.split(",") : []);
    selectedTokens.forEach(token => {
        const meta = LOOKUP_CACHE[token];
        if (meta) {
            if (!activeCriteria[meta.col]) activeCriteria[meta.col] = [];
            activeCriteria[meta.col].push(canon(meta.val))
        }
    });
    // Several authors may be typed, separated by "," or ";" — any one may match.
    const authorTerms = getVal("authorFilter").split(/[,;]/).map(s => s.trim()).filter(Boolean);
    const titleVal = getVal("titleFilter");
    const notesVal = getVal("NotesFilter");
    const doiVal = getVal("DOIFilter");
    const yearVal = parseRangeInput(getVal("YearFilter", !1));
    const pagesVal = parseRangeInput(getVal("PagesFilter", !1));
    const searchRaw = getVal("globalSearch", !1);
    const parsed = searchRaw ? parseSearchQuery(searchRaw) : null;
    currentSearch = parsed && (parsed.groups.length || parsed.negatives.length) ? parsed : null;
    const scores = new Map();
    // For the option counts: per active column, the studies that pass every
    // OTHER filter (so a group's own selections don't shrink its own counts).
    const activeCols = Object.keys(activeCriteria);
    const facetBase = {};
    activeCols.forEach(c => facetBase[c] = []);
    let filteredData = csvData.filter(item => {
        if (currentSearch) {
            const sc = searchScore(item, currentSearch);
            if (!sc) return !1;
            scores.set(item, sc)
        }
        if (authorTerms.length) {
            const author = String(item["Lead author contact details"] || "").toLowerCase();
            if (!authorTerms.some(t => author.includes(t))) return !1
        }
        if (titleVal && (!item.Title || !item.Title.toLowerCase().includes(titleVal))) return !1;
        if (notesVal && (!item["Notes (e.g., Why does the paper not fit the framework?)"] || !item["Notes (e.g., Why does the paper not fit the framework?)"].toLowerCase().includes(notesVal))) return !1;
        if (doiVal && (!item.DOI || !item.DOI.toLowerCase().includes(doiVal))) return !1;
        if (yearVal && !checkRange(yearVal, item.Year)) return !1;
        if (pagesVal && !checkRange(pagesVal, item.Pages)) return !1;
        // AND across columns, OR within a column. (The old check tested whether
        // the selected label *contained the whole cell*, so multi-answer cells
        // like "Interview; Survey" never matched and empty cells always did.)
        const failed = activeCols.filter(col => !rowMatchesLabels(item[col], activeCriteria[col]));
        if (failed.length === 1) facetBase[failed[0]].push(item);
        if (failed.length) return !1;
        activeCols.forEach(c => facetBase[c].push(item));
        return !0
    });
    // Best matches first while searching (ties keep year order).
    if (currentSearch && currentSearch.groups.length) {
        filteredData = filteredData
            .map((r, i) => [r, i])
            .sort((a, b) => (scores.get(b[0]) - scores.get(a[0])) || (a[1] - b[1]))
            .map(x => x[0])
    }
    filteredDataTmp = filteredData;
    // Visible summary under the search box, updated immediately.
    const status = document.getElementById('globalSearch-status');
    if (status) {
        const n = filteredData.length;
        status.textContent = currentSearch
            ? (n ? `${n} ${n === 1 ? 'study' : 'studies'} found${currentSearch.groups.length ? ', best matches first' : ''}` : 'No studies found. Try fewer words, or OR (e.g. blind OR deaf).')
            : ''
    }
    renderTable(filteredData);
    updateFilterCounts(filteredData, facetBase);
    const isActive = filteredData.length < csvData.length;
    document.querySelector(".recordsStatus").innerHTML = `Records ${isActive ? '<span class="ui green empty circular label" role="img" aria-label="Filters active"></span>' : ''}`;
    announceResults()
}

// ---------------------------------------------------------------------------
// Live option counts (faceted search)
// Each option in the three tag dropdowns shows how many studies you would get
// if you picked it, given everything else that is filtered. Options that would
// return nothing are greyed out and can't be picked (selected tags always stay
// removable). Screen readers hear e.g. "Study Method Interview, 92 studies".
// ---------------------------------------------------------------------------
var optionItems = null; // token -> menu item element

// Cached set of normalised answers per study and column ("Other: …" also adds "other").
function canonSet(row, col) {
    let cache = row.__canonCache;
    if (!cache) {
        cache = new Map();
        Object.defineProperty(row, '__canonCache', { value: cache })
    }
    let set = cache.get(col);
    if (!set) {
        set = new Set();
        splitValues(row[col]).forEach(v => {
            const c = canon(v);
            set.add(c);
            if (c.startsWith('other')) set.add('other')
        });
        cache.set(col, set)
    }
    return set
}

function initOptionCounts() {
    optionItems = {};
    document.querySelectorAll('.firstDropdown .menu .item[data-value], .secondDropdown .menu .item[data-value], .thirdDropdown .menu .item[data-value]').forEach(item => {
        const token = item.getAttribute('data-value');
        // Keep the plain label for Fomantic (selected-tag text and menu search),
        // so the count never ends up inside a tag like "Interview92".
        const text = item.textContent.replace(/\s+/g, ' ').trim();
        item.setAttribute('data-text', text);
        $(item).data('text', text);
        const badge = document.createElement('span');
        badge.className = 'option-count';
        badge.setAttribute('aria-hidden', 'true');
        const sr = document.createElement('span');
        sr.className = 'sr-only option-count-sr';
        item.append(badge, sr);
        optionItems[token] = item
    })
}

function updateFilterCounts(results, facetBase) {
    if (!optionItems) initOptionCounts();
    for (const [token, item] of Object.entries(optionItems)) {
        const meta = LOOKUP_CACHE[token];
        if (!meta) continue;
        if (!meta.canonVal) meta.canonVal = canon(meta.val);
        const rows = facetBase[meta.col] || results;
        let n = 0;
        for (let i = 0; i < rows.length; i++) if (canonSet(rows[i], meta.col).has(meta.canonVal)) n++;
        item.querySelector('.option-count').textContent = n;
        item.querySelector('.option-count-sr').textContent = `, ${n} ${n === 1 ? 'study' : 'studies'}`;
        const zero = n === 0 && !item.classList.contains('active');
        item.classList.toggle('disabled', zero);
        item.classList.toggle('zero-count', n === 0);
        if (zero) item.setAttribute('aria-disabled', 'true');
        else item.removeAttribute('aria-disabled')
    }
}

// One concise, debounced screen-reader message per filter change, e.g.
// "92 of 216 studies match." (Debounced so typing doesn't produce a stream.)
const announceResults = debounce(() => {
    const el = document.getElementById('sr-announcer');
    if (!el) return;
    const n = filteredDataTmp.length;
    el.textContent = '';
    setTimeout(() => {
        el.textContent = n === 0
            ? 'No studies match these filters.'
            : `${n} of ${csvData.length} studies match.${currentSearch && currentSearch.groups.length ? ' Best matches first.' : ''}`
    }, 50)
}, 600);

function updateFilterState(changedVal, key, action) {
    let current = allFilters[key] ? allFilters[key].split(",") : [];
    if (action === "add") {
        if (!current.includes(changedVal)) current.push(changedVal)
    }
    // Was `action = "nuke_all_filters"` (assignment, always truthy): removing ONE
    // tag silently cleared every filter in that dropdown while the other tags stayed visible.
    else if (action === "nuke_all_filters") current = [];
    else current = current.filter(v => v !== changedVal);

    setDataFilters(current.join(","), key)
}

// Show the control that belongs to the current tab: chart-type picker (Plot),
// column hider (Data), nothing (Ratings/Spectrum). Hidden ones are also
// aria-hidden + inert so screen readers and Tab skip them; the visible one is
// exposed (the column hider used to stay aria-hidden even when shown).
function animateOptions(viewType) {
    const toggle = (el, on) => {
        if (!el) return;
        el.classList.toggle('expand', on);
        el.setAttribute('aria-hidden', on ? 'false' : 'true');
        el.toggleAttribute('inert', !on)
    };
    toggle(document.querySelector('.plotOptionsDiv'), viewType === 'plot');
    toggle(document.querySelector('.plotFilterMultiSelect'), viewType === 'plotFilter')
}
