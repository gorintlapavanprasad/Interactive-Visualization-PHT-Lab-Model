// studies.js — Data tab: study cards and the sortable table, paging, column chooser, study details; plus which view needs redrawing.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

function initializeColumnDropdown(headerKeys) {
    if (isRowDropdownInitialized) return;
    const dynamicValues = headerKeys.filter(k => k && !["DOI", "Study ID", "Title", "Lead author contact details"].includes(k)).map((name, index) => {
        const id = `col_${index}`;
        columnIdMap[id] = name;
        return {
            name: name,
            value: id
        }
    });
    $('#removeColumns').dropdown({
        values: dynamicValues,
        clearable: !0,
        placeholder: 'choose filters or search...',
        useLabels: !1,
        allowAdditions: !1,
        // Open instantly: while the old 200 ms 'scale' animation ran, Fomantic
        // ignored Enter, so quick keyboard and screen-reader users lost their pick.
        duration: 0,
        fullTextSearch: !0,
        onChange: function (value, text, $selectedItems) {
            const selectedIds = value.split(',').filter(id => id !== "");
            const columnsToHide = selectedIds.map(id => columnIdMap[id]);
            if (typeof applyColumnFilter === "function") {
                applyColumnFilter(columnsToHide)
            }
        },
        onShow: function () {
            $(this).find('.menu').attr('aria-hidden', 'false');
            $(this).find('.item').attr('tabindex', '0')
        },
        onHide: function () {
            $(this).find('.menu').attr('aria-hidden', 'true');
            $(this).find('.item').attr('tabindex', '-1');
            const $dropdown = $(this);
            const $searchInput = $dropdown.find('input.search');
            setTimeout(() => {
                const currentActive = document.activeElement;
                const isFocusLost = currentActive === document.body;
                const isFocusStillOnMe = $dropdown[0].contains(currentActive);
                if (!isFocusLost && !isFocusStillOnMe) {
                    return
                }
                if ($searchInput.length > 0) {
                    $searchInput.focus()
                } else {
                    $dropdown.focus()
                }
            }, 320)
        }
    });
    isRowDropdownInitialized = !0;
    fixDropdownAccessibility($("#removeColumns"), "Hide fields in the study cards")
}

// ---------------------------------------------------------------------------
// Data tab: study cards
// Only the cards on the current page exist in the DOM. Previously all 216 cards
// (~25,000 elements) were kept in the page and hidden with CSS, which made every
// layout — and so every chart redraw — take hundreds of milliseconds, and gave
// screen-reader users a huge, mostly hidden document.
// ---------------------------------------------------------------------------
var hiddenColumns = [];
var currentPage = 1;

function buildStudyCard(row) {
    const card = document.createElement("div");
    card.className = "divOuter divOuterVisible";
    card.setAttribute("role", "listitem");
    card.setAttribute("aria-label", `${row["Study ID"] || "Study"}: ${row.Title || ""}`);
    if (row["Study ID"]) card.setAttribute("data-id", row["Study ID"]);
    card.setAttribute("data-uid", row.__uid);
    // Direct link to the paper (publisher page via doi.org), first thing in the card.
    if (row.DOI) {
        const bar = document.createElement("div");
        bar.className = "card-actions";
        const a = document.createElement("a");
        a.className = "open-paper";
        a.href = doiUrl(row.DOI);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.innerHTML = `<i class="ph ph-arrow-square-out" aria-hidden="true"></i> Open paper<span class="sr-only">: ${escapeHtml(row.Title || row["Study ID"])} (opens in a new tab)</span>`;
        bar.appendChild(a);
        card.appendChild(bar)
    }
    Object.keys(row).forEach(key => {
        if (!key.trim()) return;
        const value = String(row[key] ?? "");
        if (!value.trim()) return;
        const divInner = document.createElement("div");
        divInner.className = "divInner";
        if (hiddenColumns.includes(key)) divInner.classList.add("innerRow-hidden");
        const span1 = document.createElement("span");
        span1.className = "spanLeft";
        span1.textContent = key;
        const span2 = document.createElement("span");
        span2.className = "spanRight";
        if (key === "DOI") {
            // The DOI itself is a real link to the paper.
            const a = document.createElement("a");
            a.href = doiUrl(value);
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = value;
            const hint = document.createElement("span");
            hint.className = "sr-only";
            hint.textContent = " (opens paper in a new tab)";
            a.appendChild(hint);
            span2.appendChild(a);
            divInner.appendChild(span1);
            divInner.appendChild(span2);
            card.appendChild(divInner);
            return
        }
        highlightInto(span2, value);
        if (["Title", "Study ID"].includes(key)) {
            divInner.classList.add("clickable-row", "selectable");
            divInner.setAttribute("tabindex", "0");
            divInner.setAttribute("role", "button");
            // Unique, descriptive name (was "View details for Title" on every card).
            const handler = (e) => {
                if (e.type === 'click' || e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    populateAndShowStudyDetails(divInner)
                }
            };
            divInner.addEventListener('click', handler);
            divInner.addEventListener('keydown', handler)
        }
        divInner.appendChild(span1);
        divInner.appendChild(span2);
        if (divInner.classList.contains("clickable-row")) {
            const hint = document.createElement("span");
            hint.className = "sr-only";
            hint.textContent = " (open study details)";
            divInner.appendChild(hint)
        }
        card.appendChild(divInner)
    });
    return card
}

// Write `text` into `el`, wrapping current search terms in <mark> (safe: no innerHTML).
function highlightInto(el, text) {
    const terms = currentSearch ? currentSearch.terms.filter(t => t.length > 1) : [];
    if (!terms.length) { el.textContent = text; return }
    const re = new RegExp('(' + terms.sort((a, b) => b.length - a.length)
        .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
    let last = 0, m;
    while ((m = re.exec(text))) {
        if (m.index > last) el.appendChild(document.createTextNode(text.slice(last, m.index)));
        const mark = document.createElement('mark');
        mark.textContent = m[0];
        el.appendChild(mark);
        last = m.index + m[0].length;
        if (!m[0].length) re.lastIndex++
    }
    if (last < text.length) el.appendChild(document.createTextNode(text.slice(last)))
}

// ---------------------------------------------------------------------------
// Data tab: Cards or Table view, sorting, page size, table columns.
// Only the current page is rendered (keeps the page light).
// ---------------------------------------------------------------------------
const PAGE_SIZES = { cards: [5, 10, 25], table: [10, 25, 50, 100, 0] }; // 0 = all
const DEFAULT_TABLE_COLUMNS = ['Study ID', 'Year', 'Title', 'Lead author contact details', 'Community of focus', 'Study Method', 'Technology Modality', 'DOI'];
const SORTABLE_ALWAYS = ['Year', 'Title', 'Study ID', 'Lead author contact details', 'Pages', 'Primary Country'];
var dataView = (() => { try { return localStorage.getItem('pht_data_view') === 'table' ? 'table' : 'cards' } catch { return 'cards' } })();
var pageSizes = { cards: 5, table: 25 };
var sortState = { col: '', dir: 'asc' }; // col '' = default order (year, or relevance while searching)
var tableColumns = DEFAULT_TABLE_COLUMNS.slice();

const columnLabel = col => ({ 'Lead author contact details': 'Lead author' }[col] || shortLabel(col));

function pageSize() {
    const n = pageSizes[dataView];
    return n > 0 ? n : Math.max(1, filteredDataTmp.length)
}

function compareValues(a, b) {
    const ea = a === '' || a == null, eb = b === '' || b == null;
    if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1; // blanks last in both directions
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const key = v => String(v).replace(/^[^\p{L}\p{N}]+/u, '');
    return key(a).localeCompare(key(b), undefined, { numeric: !0, sensitivity: 'base' })
}

// Rows in display order: the filter/search order unless a sort is chosen.
function sortedRows() {
    if (!sortState.col) return filteredDataTmp;
    const col = sortState.col, sign = sortState.dir === 'desc' ? -1 : 1;
    return filteredDataTmp.map((r, i) => [r, i])
        .sort((x, y) => {
            const c = compareValues(x[0][col], y[0][col]);
            const blank = v => v === '' || v == null;
            if (blank(x[0][col]) || blank(y[0][col])) return c || x[1] - y[1]; // keep blanks last
            return sign * c || x[1] - y[1]
        })
        .map(x => x[0])
}

const cellText = (row, col) => {
    const v = row[col];
    if (v === '' || v == null) return '';
    if (typeof v === 'number') return String(v);
    return splitValues(v).map(stripExample).join('; ')
};

function renderTablePage(rows) {
    const table = document.querySelector('#studyTable');
    const sortIcon = col => sortState.col !== col ? '↕' : (sortState.dir === 'asc' ? '▲' : '▼');
    const ariaSort = col => sortState.col !== col ? 'none' : (sortState.dir === 'asc' ? 'ascending' : 'descending');
    table.querySelector('thead').innerHTML = '<tr>' + tableColumns.map(col =>
        `<th scope="col" aria-sort="${ariaSort(col)}"><button type="button" class="sort-button" data-col="${escapeHtml(col)}">${escapeHtml(columnLabel(col))}<span class="sort-icon" aria-hidden="true">${sortIcon(col)}</span></button></th>`
    ).join('') + '</tr>';
    const tbody = table.querySelector('tbody');
    tbody.replaceChildren(...rows.map(row => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-uid', row.__uid);
        tableColumns.forEach((col, ci) => {
            const cell = document.createElement(ci === 0 ? 'th' : 'td');
            cell.className = 'col-' + col.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            if (ci === 0) cell.setAttribute('scope', 'row');
            const text = cellText(row, col);
            if (col === 'DOI' && text) {
                const a = document.createElement('a');
                a.href = doiUrl(text); a.target = '_blank'; a.rel = 'noopener noreferrer';
                a.textContent = text;
                const hint = document.createElement('span'); hint.className = 'sr-only'; hint.textContent = ' (opens paper in a new tab)';
                a.appendChild(hint);
                cell.appendChild(a)
            } else if (col === 'Title' && text) {
                const b = document.createElement('button');
                b.type = 'button'; b.className = 'link-button open-details'; b.setAttribute('data-uid', row.__uid);
                highlightInto(b, text);
                const hint = document.createElement('span'); hint.className = 'sr-only'; hint.textContent = ' (open study details)';
                b.appendChild(hint);
                cell.appendChild(b)
            } else {
                highlightInto(cell, text)
            }
            tr.appendChild(cell)
        });
        return tr
    }));
    if (!rows.length) tbody.innerHTML = `<tr><td colspan="${tableColumns.length}">No studies match these filters.</td></tr>`;
    const pages = Math.max(1, Math.ceil(filteredDataTmp.length / pageSize()));
    table.querySelector('caption').textContent = `Studies${sortState.col ? `, sorted by ${columnLabel(sortState.col)} ${sortState.dir === 'asc' ? 'ascending' : 'descending'}` : ''}; page ${currentPage} of ${pages}, ${filteredDataTmp.length} studies`
}

function renderDataPage(page) {
    const rows = sortedRows();
    const pages = Math.max(1, Math.ceil(rows.length / pageSize()));
    currentPage = Math.min(Math.max(1, page), pages);
    const slice = rows.slice(pageSize() * (currentPage - 1), pageSize() * currentPage);
    const ui = document.querySelector(".secondUI");
    const tableWrap = document.querySelector(".table-view");
    ui.hidden = dataView !== 'cards';
    tableWrap.hidden = dataView !== 'table';
    if (dataView === 'table') {
        ui.replaceChildren();
        renderTablePage(slice)
    } else {
        document.querySelector('#studyTable tbody').replaceChildren();
        ui.replaceChildren(...slice.map(buildStudyCard));
        if (!slice.length) ui.innerHTML = '<p class="no-results" role="status">No studies match these filters.</p>'
    }
}

// Kept for older callers.
function renderCardsPage(page) { renderDataPage(page) }

function setupPagination() {
    $('#pagination-container').pagination({
        items: filteredDataTmp.length,
        itemsOnPage: pageSize(),
        prevText: "Previous",
        nextText: "Next",
        onPageClick: (pg) => renderDataPage(pg)
    })
}

function refreshDataView(page = 1) {
    syncDataToolbar();
    renderDataPage(page);
    setupPagination();
    if (page > 1) $('#pagination-container').pagination('drawPage', currentPage)
}

// Keep the toolbar controls in step with the state.
function syncDataToolbar() {
    document.querySelectorAll('.view-toggle [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === dataView)));
    const size = document.getElementById('pageSize');
    if (size) {
        size.innerHTML = PAGE_SIZES[dataView].map(n => `<option value="${n}">${n === 0 ? 'All' : n}</option>`).join('');
        size.value = String(pageSizes[dataView])
    }
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        const cols = [...new Set([...SORTABLE_ALWAYS, ...tableColumns])];
        sortBy.innerHTML = `<option value="">${currentSearch && currentSearch.groups.length ? 'Best match (search)' : 'Default (year)'}</option>` +
            cols.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(columnLabel(c))}</option>`).join('');
        sortBy.value = sortState.col
    }
    const dir = document.getElementById('sortDir');
    if (dir) { dir.value = sortState.dir; dir.disabled = !sortState.col }
    const chooser = document.querySelector('.column-chooser');
    if (chooser) chooser.hidden = dataView !== 'table';
    document.querySelectorAll('.column-chooser input[type=checkbox]').forEach(cb => { cb.checked = tableColumns.includes(cb.value) });
    // The card field hider in the header only applies to cards.
    if (document.querySelector('#Show-data-pane.active')) animateOptions(dataView === 'cards' ? 'plotFilter' : 'hide')
}

function initDataToolbar() {
    // Column chooser: every column that has data, in data order.
    const fs = document.querySelector('.column-chooser fieldset');
    if (fs && !fs.querySelector('input')) {
        const cols = Object.keys(csvData[0] || {}).filter(c => c.trim() && !c.trim().endsWith(':') && csvData.some(r => String(r[c] ?? '').trim()));
        cols.forEach((c, i) => {
            const id = 'tablecol-' + i;
            const wrap = document.createElement('div');
            wrap.className = 'column-option';
            wrap.innerHTML = `<input type="checkbox" id="${id}" value="${escapeHtml(c)}"><label for="${id}">${escapeHtml(columnLabel(c))}</label>`;
            fs.appendChild(wrap)
        })
    }
    $(document).on('click', '.view-toggle [data-view]', function () {
        dataView = this.getAttribute('data-view');
        try { localStorage.setItem('pht_data_view', dataView) } catch { }
        refreshDataView(1);
        announce(`${dataView === 'table' ? 'Table' : 'Cards'} view, ${filteredDataTmp.length} studies.`)
    });
    document.getElementById('pageSize').addEventListener('change', e => {
        pageSizes[dataView] = Number(e.target.value);
        refreshDataView(1)
    });
    const applySort = (col, dir) => {
        sortState = { col, dir: col ? dir : 'asc' };
        refreshDataView(1);
        announce(col ? `Sorted by ${columnLabel(col)}, ${dir === 'asc' ? 'ascending' : 'descending'}.` : 'Default order.')
    };
    document.getElementById('sortBy').addEventListener('change', e => applySort(e.target.value, sortState.col ? sortState.dir : (e.target.value === 'Year' ? 'desc' : 'asc')));
    document.getElementById('sortDir').addEventListener('change', e => applySort(sortState.col, e.target.value));
    // Table header buttons: first click ascending (numbers: newest/largest first), next click flips.
    $(document).on('click', '#studyTable .sort-button', function () {
        const col = this.getAttribute('data-col');
        const numeric = filteredDataTmp.some(r => typeof r[col] === 'number');
        const dir = sortState.col === col ? (sortState.dir === 'asc' ? 'desc' : 'asc') : (numeric ? 'desc' : 'asc');
        applySort(col, dir);
        const again = document.querySelector(`#studyTable .sort-button[data-col="${CSS.escape(col)}"]`);
        if (again) again.focus()
    });
    $(document).on('click', '#studyTable .open-details', function () { showStudyDetails(this.getAttribute('data-uid')) });
    const chooser = document.querySelector('.column-chooser');
    document.addEventListener('click', e => { if (chooser.open && !chooser.contains(e.target)) chooser.open = !1 }, !0);
    chooser.addEventListener('keydown', e => {
        if (e.key === 'Escape' && chooser.open) { chooser.open = !1; chooser.querySelector('summary').focus() }
    });
    $(document).on('change', '.column-chooser input[type=checkbox]', function () {
        const checked = [...document.querySelectorAll('.column-chooser input[type=checkbox]')].filter(cb => cb.checked).map(cb => cb.value);
        if (!checked.length) { this.checked = !0; return } // keep at least one column
        // Keep the current order; newly ticked columns are added at the end.
        tableColumns = tableColumns.filter(c => checked.includes(c)).concat(checked.filter(c => !tableColumns.includes(c)));
        if (sortState.col && !tableColumns.includes(sortState.col) && !SORTABLE_ALWAYS.includes(sortState.col)) sortState = { col: '', dir: 'asc' };
        refreshDataView(currentPage)
    });
    syncDataToolbar()
}

function renderTable(data, innerEdit) {
    if (!innerEdit) {
        document.querySelector(".currentRecords").textContent = data.length;
        refreshDataView(1)
    }
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const $plotFilter = $('#plotFilter');
    if (!isRowDropdownInitialized) {
        const colSelect = document.getElementById("removeColumns");
        if (colSelect) {
            initializeColumnDropdown(headers);
            isRowDropdownInitialized = !0
        }
    }
    if (!isPlotDropdownInitialized) {
        isPlotDropdownInitialized = !0;
        // Only offer columns that can make a meaningful bar chart: skip identifiers,
        // free text, section-header columns ("Gender (number of participants):")
        // and columns that are empty for every study.
        const NOT_PLOTTABLE = ["DOI", "Study ID", "Title", "Lead author contact details", "Notes (e.g., Why does the paper not fit the framework?)"];
        const plotOptions = headers
            .filter(k => k && !NOT_PLOTTABLE.includes(k) && !k.trim().endsWith(':'))
            .filter(k => csvData.some(r => String(r[k] ?? '').trim() !== ''))
            .map(k => ({
                name: k,
                value: k,
                selected: k === 'Year'
            }));
        $plotFilter.dropdown({
            values: plotOptions,
            duration: 0,
            action: 'activate',
            fullTextSearch: !0,
            onChange: (value) => getPlot(value),
            onShow: function () {
                $(this).find('.menu').attr('aria-hidden', 'false');
                $(this).find('.item').attr('tabindex', '0')
            },
            onHide: function () {
                $(this).find('.menu').attr('aria-hidden', 'true');
                $(this).find('.item').attr('tabindex', '-1');
                const $dropdown = $(this);
                const $searchInput = $dropdown.find('input.search');
                setTimeout(() => {
                    const currentActive = document.activeElement;
                    const isFocusLost = currentActive === document.body;
                    const isFocusStillOnMe = $dropdown[0].contains(currentActive);
                    if (!isFocusLost && !isFocusStillOnMe) {
                        return
                    }
                    if ($searchInput.length > 0) {
                        $searchInput.focus()
                    } else {
                        $dropdown.focus()
                    }
                }, 320)
            }
        });
        fixDropdownAccessibility($("#plotFilter"), "Group bars by")
    }
    // Charts are expensive; only redraw the view the user can actually see.
    // Hidden views are marked dirty and redrawn when their tab is opened.
    viewsDirty.plot = !0;
    viewsDirty.grid = !0;
    viewsDirty.gaps = !0;
    renderVisibleViews()
}

var viewsDirty = { plot: !0, grid: !0, gaps: !0 };

// `tabPath` is passed by the tab's onVisible callback, which fires before the
// tab menu item gets its "active" class.
function renderVisibleViews(tabPath) {
    const tab = tabPath || document.querySelector('#myTab .item.active')?.getAttribute('data-tab') || 'Show-plot';
    if (tab === 'Show-plot' && viewsDirty.plot) {
        viewsDirty.plot = !1;
        Drawplot($('#plotFilter').dropdown('get value'))
    }
    if ((tab === 'ratings-grid' || tab === 'Show-grid') && viewsDirty.grid) {
        viewsDirty.grid = !1;
        displaySpectrum()
    }
    if (tab === 'Show-gaps' && viewsDirty.gaps) {
        viewsDirty.gaps = !1;
        renderGaps()
    }
}

function applyColumnFilter(values) {
    hiddenColumns = values.slice();
    document.querySelectorAll(".secondUI .divInner").forEach(row => {
        const col = row.querySelector(".spanLeft").textContent;
        row.classList.toggle("innerRow-hidden", hiddenColumns.includes(col))
    })
}

function populateAndShowStudyDetails(el) {
    showStudyDetails(el.closest('[data-uid]').getAttribute('data-uid'))
}

function showStudyDetails(uid) {
    // Look up by the unique row key: "Study ID" repeats (e.g. two "Zhang 2023"
    // papers), so find-by-ID opened the wrong paper for the second of each pair.
    const study = csvData.find(i => i.__uid === uid);
    if (!study) return;
    const field = (label, value) => String(value ?? '').trim()
        ? `<div class="item"><div class="header">${escapeHtml(label)}</div>${escapeHtml(value)}</div>` : '';
    const doi = normalizeDoi(study["DOI"]);
    const doiHtml = doi
        ? `<a href="${doiUrl(doi)}" target="_blank" rel="noopener noreferrer">${escapeHtml(doi)}<span class="sr-only"> (opens in a new tab)</span></a>`
        : 'Not recorded';
    // The export has no abstract column (the old modal always said "No abstract
    // available"), so show the study's framework ratings instead.
    const framework = SPECTRUM_DIMS.concat(["Experiential Play Value Classification"])
        .map(dim => field(dim, splitValues(study[dim]).map(v => v.replace(/\s*\((?:i\.e\.|e\.g\.)[^)]*\)\s*$/, '')).join('; ')))
        .join('');
    $('#abstractModalHeader').text(`Study Details: ${study["Study ID"]}`);
    $('#abstractModalContent').html(`
        <div class="ui relaxed divided list">
            ${field('Title', study["Title"])}
            ${field('Lead author', study["Lead author contact details"])}
            ${field('Year', study["Year"])}
            <div class="item"><div class="header">DOI</div>${doiHtml}</div>
            ${field('Community of focus', study["Community of focus"])}
            ${field('Study method', study["Study Method"])}
            ${field('Primary country', study["Primary Country"])}
        </div>
        <div class="ui divider"></div>
        <h4 class="ui header">PHT Lab framework ratings</h4>
        <div class="ui relaxed divided list">${framework}</div>
    `);
    $('#studyAbstractModal').modal('show')
}

