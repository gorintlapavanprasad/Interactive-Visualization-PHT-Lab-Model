// gaps.js — Gaps tab: two-dimension research-gap heatmap.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

// ---------------------------------------------------------------------------
// Gaps tab: cross-tabulate any two dimensions to show where research is
// missing. Every possible answer (from the framework) is listed, even with no
// studies, because empty rows/columns are gaps too. Cells = studies (matching
// the filters) that have BOTH answers; multi-answer studies count in each cell.
// ---------------------------------------------------------------------------
const GAP_DEFAULT = { rows: 'Community of focus', cols: 'Study Method' };
// Only what the checkbox names: Not applicable, Undisclosed/Unknown, Not recorded.
const GAP_HIDDEN = new Set(['not applicable', 'undisclosed/unknown', canon(NOT_RECORDED)]);
var gapCells = []; // [rowIndex][colIndex] -> study uids (for the click-through)
var gapLabels = { rows: [], cols: [] };

function gapDimensions() {
    return [STACK_DEFAULT, ...codedColumns().filter(c => c !== STACK_DEFAULT), 'Primary Country']
        .filter(c => csvData.some(r => String(r[c] ?? '').trim()))
}

function initGapControls() {
    const rows = document.getElementById('gapRows'), cols = document.getElementById('gapCols');
    if (!rows || rows.options.length) return;
    const html = gapDimensions().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c === STACK_DEFAULT ? 'Participant groups' : shortLabel(c))}</option>`).join('');
    rows.innerHTML = html;
    cols.innerHTML = html;
    rows.value = GAP_DEFAULT.rows;
    cols.value = GAP_DEFAULT.cols;
    const redraw = () => { renderGaps(); announceGaps() };
    [rows, cols, document.getElementById('gapMode'), document.getElementById('gapHideNA')].forEach(el => el.addEventListener('change', redraw));
    document.getElementById('gapSwap').addEventListener('click', () => {
        const r = rows.value;
        rows.value = cols.value;
        cols.value = r;
        redraw()
    });
    $(document).on('click', '#gapTable .gap-cell', function () {
        const i = +this.getAttribute('data-r'), j = +this.getAttribute('data-c');
        showSpectrumStudies(`${gapLabels.rows[i]} × ${gapLabels.cols[j]}`, gapCells[i][j])
    })
}

// All answers a column can have: the framework's options plus anything seen in the data.
function gapAllLabels(col, seen) {
    let spec = [];
    for (const g of Object.values(FILTER_SPECS)) if (g[col]) spec = Object.values(g[col]).map(displayLabel);
    return orderValues(col, [...new Set([...spec, ...seen])])
}

function gapValues(row, col) {
    const v = [...new Set(splitValues(row[col]).map(displayLabel))];
    return v.length ? v : [NOT_RECORDED]
}

function renderGaps() {
    const table = document.getElementById('gapTable');
    if (!table) return;
    let rowCol = document.getElementById('gapRows').value || GAP_DEFAULT.rows;
    let colCol = document.getElementById('gapCols').value || GAP_DEFAULT.cols;
    const mode = document.getElementById('gapMode').value;
    const hide = document.getElementById('gapHideNA').checked;
    const keep = v => !hide || !GAP_HIDDEN.has(canon(v));
    const summary = document.getElementById('gap-summary');
    if (rowCol === colCol) {
        table.querySelector('thead').innerHTML = '';
        table.querySelector('tbody').innerHTML = '';
        table.querySelector('caption').textContent = '';
        summary.textContent = 'Choose two different dimensions for rows and columns.';
        return
    }
    // count
    const cell = new Map(), rowSets = new Map(), colSets = new Map(), all = new Set();
    const seenR = new Set(), seenC = new Set();
    filteredDataTmp.forEach(r => {
        const rv = gapValues(r, rowCol).filter(keep), cv = gapValues(r, colCol).filter(keep);
        rv.forEach(a => seenR.add(a));
        cv.forEach(b => seenC.add(b));
        if (!rv.length || !cv.length) return;
        all.add(r.__uid);
        rv.forEach(a => {
            (rowSets.get(a) || rowSets.set(a, new Set()).get(a)).add(r.__uid);
            cv.forEach(b => { const k = a + '\u0000' + b; (cell.get(k) || cell.set(k, []).get(k)).push(r.__uid) })
        });
        cv.forEach(b => (colSets.get(b) || colSets.set(b, new Set()).get(b)).add(r.__uid))
    });
    const rows = gapAllLabels(rowCol, seenR).filter(keep);
    const cols = gapAllLabels(colCol, seenC).filter(keep);
    gapLabels = { rows, cols };
    gapCells = rows.map(a => cols.map(b => cell.get(a + '\u0000' + b) || []));
    const max = Math.max(1, ...gapCells.flat().map(u => u.length));
    const maxRowShare = Math.max(0.01, ...rows.map((a, i) => { const rt = rowSets.get(a)?.size || 0; return rt ? Math.max(...gapCells[i].map(u => u.length / rt)) : 0 }));
    const rLabel = rowCol === STACK_DEFAULT ? 'Participant groups' : shortLabel(rowCol);
    const cLabel = colCol === STACK_DEFAULT ? 'Participant groups' : shortLabel(colCol);

    // header
    table.querySelector('thead').innerHTML = `<tr><th scope="col" class="gap-corner"><span class="gap-axis">${escapeHtml(rLabel)} ↓</span><span class="gap-axis">${escapeHtml(cLabel)} →</span></th>` +
        cols.map(c => `<th scope="col">${escapeHtml(c)}</th>`).join('') + '<th scope="col" class="gap-total">All</th></tr>';
    // body
    let zeros = 0, best = { n: 0 };
    const bodyHtml = rows.map((a, i) => {
        const rowTotal = rowSets.get(a)?.size || 0;
        const tds = cols.map((b, j) => {
            const n = gapCells[i][j].length;
            const pct = rowTotal ? Math.round(100 * n / rowTotal) : 0;
            if (!n) {
                zeros++;
                return `<td class="gap-zero"><span aria-hidden="true">0</span><span class="sr-only">${escapeHtml(a)} and ${escapeHtml(b)}: no studies</span></td>`
            }
            if (n > best.n) best = { n, a, b };
            // Colour follows what is shown: counts, or the row percentage.
            const t = mode === 'row' ? (rowTotal ? n / rowTotal : 0) / maxRowShare : n / max;
            const rgb = viridisRgb(0.08 + 0.92 * t);
            const shown = mode === 'row' ? `${pct}%` : n;
            const label = `${a} and ${b}: ${n} ${n === 1 ? 'study' : 'studies'}${rowTotal ? `, ${pct}% of ${a}` : ''}. Select to list them.`;
            return `<td style="background-color:rgb(${rgb.join(',')})"><button type="button" class="gap-cell" data-r="${i}" data-c="${j}" style="color:${bestTextColor(rgb)}" aria-label="${escapeHtml(label)}">${shown}</button></td>`
        }).join('');
        return `<tr><th scope="row">${escapeHtml(a)}</th>${tds}<td class="gap-total">${rowTotal}</td></tr>`
    }).join('');
    const footer = `<tr class="gap-total-row"><th scope="row">All</th>${cols.map(b => `<td class="gap-total">${colSets.get(b)?.size || 0}</td>`).join('')}<td class="gap-total">${all.size}</td></tr>`;
    table.querySelector('tbody').innerHTML = bodyHtml + footer;
    const combos = rows.length * cols.length;
    table.querySelector('caption').textContent = `${rLabel} by ${cLabel}: number of studies${mode === 'row' ? ' (as % of each row)' : ''}. ${all.size} studies.`;
    const filtered = filteredDataTmp.length < csvData.length ? ' with the current filters' : '';
    summary.textContent = combos
        ? `${zeros} of ${combos} combinations have no studies${filtered}.` + (best.n ? ` Most studied: ${best.a} × ${best.b} (${best.n}).` : '')
        : 'No studies match these filters.'
}

const announceGaps = debounce(() => {
    const s = document.getElementById('gap-summary');
    if (s && s.textContent) announce(s.textContent)
}, 400);

