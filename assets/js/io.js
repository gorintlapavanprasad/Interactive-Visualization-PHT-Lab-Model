// io.js — Excel export of the filtered studies + all settings, and import of saved settings.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

// Includes NotesFilter, which export/import previously dropped.
const TEXT_FILTER_IDS = ["globalSearch", "YearFilter", "PagesFilter", "DOIFilter", "titleFilter", "authorFilter", "NotesFilter"];

function exportFilteredData() {
    if (!filteredDataTmp.length) return alert("No data to export.");
    const settings = {
        ...allFilters
    };
    TEXT_FILTER_IDS.forEach(id => {
        const val = document.getElementById(id) ? document.getElementById(id).value : "";
        if (val) settings[id] = val
    });
    const plotVal = $('#plotFilter').dropdown('get value');

    if (plotVal) settings.plotFilter = plotVal;
    const removedColsVal = $('#removeColumns').dropdown('get value');

    if (removedColsVal) settings.removeColumns = removedColsVal;
    const cc = chartControlState();
    settings.chartColourBy = cc.stackCol || "none";
    settings.chartShow = cc.mode;
    // Study list view (column names can contain commas, so columns use "|")
    settings.dataView = dataView;
    settings.sortBy = sortState.col || 'default';
    settings.sortOrder = sortState.dir;
    settings.perPage = pageSizes[dataView] || 'all';
    settings.tableColumns = tableColumns.join('|');
    settings.gapRows = document.getElementById('gapRows').value;
    settings.gapColumns = document.getElementById('gapCols').value;
    settings.gapShow = document.getElementById('gapMode').value;
    settings.gapHideNA = document.getElementById('gapHideNA').checked ? 'yes' : 'no';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filteredDataTmp), "Filtered Data");
    const filterRows = [
        ['Filter Name', 'Value']
    ];
    Object.keys(settings).forEach(k => settings[k] && filterRows.push([k, Array.isArray(settings[k]) ? settings[k].join(',') : settings[k]]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filterRows), "Filter Settings");
    XLSX.writeFile(wb, `pht-lab-data-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function handleDataImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const wb = XLSX.read(new Uint8Array(event.target.result), {
            type: 'array'
        });
        if (!wb.SheetNames.includes("Filter Settings")) return alert("Invalid File.");
        const imported = {};
        XLSX.utils.sheet_to_json(wb.Sheets["Filter Settings"]).forEach(row => imported[row["Filter Name"]] = row.Value);
        TEXT_FILTER_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = imported[id] != null ? String(imported[id]) : ""
        });
        // Rebuild dropdown state from the file. Dropdowns absent from the file are
        // cleared, so the UI and the applied filters can't drift apart.
        allFilters = {};
        ["first", "second", "third"].forEach(k => {
            const tokens = imported[k] ? String(imported[k]).split(",").filter(Boolean) : [];
            if (tokens.length) $(`.${k}Dropdown`).dropdown('set exactly', tokens);
            else $(`.${k}Dropdown`).dropdown('clear');
            allFilters[k] = tokens.join(",")
        });
        if (imported.plotFilter) {
            $('#plotFilter').dropdown('set selected', imported.plotFilter)
        }
        if (imported.chartColourBy) {
            const sel = document.getElementById("stackBy");
            const v = imported.chartColourBy === "none" ? "" : String(imported.chartColourBy);
            if ([...sel.options].some(o => o.value === v)) sel.value = v
        }
        if (imported.chartShow) document.getElementById("plotMode").value = imported.chartShow === "percent" ? "percent" : "count";
        viewsDirty.plot = !0;
        if (imported.dataView === 'table' || imported.dataView === 'cards') dataView = imported.dataView;
        if (imported.tableColumns) {
            const known = Object.keys(csvData[0] || {});
            const cols = String(imported.tableColumns).split('|').filter(c => known.includes(c));
            if (cols.length) tableColumns = cols
        }
        if (imported.sortBy) sortState = { col: imported.sortBy === 'default' ? '' : String(imported.sortBy), dir: imported.sortOrder === 'desc' ? 'desc' : 'asc' };
        if (imported.perPage != null) {
            const n = imported.perPage === 'all' ? 0 : Number(imported.perPage);
            if (PAGE_SIZES[dataView].includes(n)) pageSizes[dataView] = n
        }
        const setSel = (id, v) => { const el = document.getElementById(id); if (v != null && [...el.options].some(o => o.value === String(v))) el.value = String(v) };
        setSel('gapRows', imported.gapRows);
        setSel('gapCols', imported.gapColumns);
        setSel('gapMode', imported.gapShow);
        if (imported.gapHideNA) document.getElementById('gapHideNA').checked = imported.gapHideNA !== 'no';
        viewsDirty.gaps = !0;
        if (imported.removeColumns) {
            $('#removeColumns').dropdown('set exactly', imported.removeColumns.split(','))
        }
        // Text inputs were filled in but never applied after an import.
        applyFilters();
        document.getElementById('import-file-input').value = '';
        e.target.value = '';
        $('#import-data-button').focus();
        $('#filtered-count-value').attr('aria-label', 'Import successful. Filters updated.')
    };
    setTimeout(() => {
        $('#filtered-count-value').removeAttr('aria-label')
    }, 5000);
    reader.readAsArrayBuffer(file)
}

