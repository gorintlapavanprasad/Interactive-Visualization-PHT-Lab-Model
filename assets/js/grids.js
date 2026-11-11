// grids.js — Ratings and Spectrum tabs: the viridis grids, legend, shared tooltip, cell study lists and jump-to-study.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

// Ratings (type-1, dots) and Spectrum (type-2, heat) grids.
// Each grid cell carries data-column="<answer label>" inside a row with
// data-row="<framework dimension>". Cells are matched to data through canon(),
// so spelling variants in the export ("Symetrical", "asynchrounous") still land
// in the right cell. Previously the clean-up regex turned "Asymetrical" into
// "ASymmetrical", which silently dropped 53 studies from the Symmetrical row.
// The eight framework spectra shown on the Ratings and Spectrum tabs, in row
// order: left pole, the five answers from left to right, right pole. Both grids
// are generated from this one list (they used to be two hand-written copies).
const SPECTRUM_ROWS = [
    { dim: "Fun-First vs. Utility-First (Initial Design Intention)", left: "Fun-First", right: "Utility-First",
      cells: ["Totally fun first","Mostly fun first","Both fun and utility first","Mostly utility first","Totally utility first"] },
    { dim: "Play vs. Game", left: "Play", right: "Game",
      cells: ["Unstructured play","Semi-structured play","Flexible structure with rules","Flexible game","Game with rigid rules"] },
    { dim: "Social vs. Solo", left: "Solo", right: "Social",
      cells: ["Entirely Solo","Mostly Solo, but can play against AI","Mix of solo and social affordances","Mostly social, but aspects are independent","Entirely social"] },
    { dim: "Competitive vs. Collaborative", left: "Competitive", right: "Collaborative",
      cells: ["Entirely Competitive","Mostly Competitive, but sometimes collaboration is important","Mix of competitive and collaborative","Mostly Collaborative","Entirely Collaborative"] },
    { dim: "Skill vs. Chance", left: "Skill", right: "Chance",
      cells: ["Entirely skill-based","Mostly skill-based","Equally skill and chance based","Mostly chance-based","Entirely chance-based"] },
    { dim: "Symmetrical vs. Asymmetrical", left: "Symmetrical", right: "Asymmetrical",
      cells: ["Entirely Symmetrical","Mostly Symmetrical","Both Symmetrical and Asymmetrical","Mostly Asymmetrical","Entirely Asymmetrical"] },
    { dim: "Sequential vs. Simultaneous", left: "Sequential", right: "Simultaneous",
      cells: ["Entirely Turn-based","Follows a set of steps","Turns are taken, but some actions can be taken at anytime","Most actions can be taken at any time, but there are some phases","Entirely Simultaneous"] },
    { dim: "Synchronous vs. Asynchronous", left: "Synchronous", right: "Asynchronous",
      cells: ["Entirely Synchronous","Mostly Synchronous with few asynchronous affordances","Equal mix of synchronous and asynchronous affordances","Mostly asynchronous with few synchronous affordances","Entirely asynchronous"] }
];
const SPECTRUM_DIMS = SPECTRUM_ROWS.map(r => r.dim);
const SPECTRUM_SCALE = ['Totally', 'Mostly', 'Both', 'Mostly', 'Totally'];

// Each row ends with an "N/A or not stated" cell: studies in none of the five
// answer cells (Not applicable, Undisclosed, or not rated), so every row adds
// up to all the filtered studies.
const SPECTRUM_REST_LABEL = 'N/A or not stated';

function buildSpectrumTables() {
    const header = '<tr class="ratings"><td></td>' + SPECTRUM_SCALE.map(s => `<th scope="col">${s}</th>`).join('') +
        `<td></td><th scope="col" class="rest-col">${SPECTRUM_REST_LABEL}</th></tr>`;
    const body = SPECTRUM_ROWS.map(r => `<tr data-row="${escapeHtml(r.dim)}"><th scope="row">${escapeHtml(r.left)}</th>` +
        r.cells.map(c => `<td data-column="${escapeHtml(c)}"></td>`).join('') + `<th>${escapeHtml(r.right)}</th>` +
        `<td class="rest-cell" data-rest="1" data-column="${SPECTRUM_REST_LABEL}"></td></tr>`).join('');
    document.querySelectorAll('.spectrumTable').forEach(t => { t.innerHTML = `<tbody>${header}${body}</tbody>` })
}

function spectrumIntensityFor(el) {
    const sliderId = el.closest('.type-1') ? 'type1Intensity' : 'type2Intensity';
    const v = Number(document.getElementById(sliderId)?.value);
    return v > 0 ? v : 20
}

function displaySpectrum() {
    const errors = document.querySelectorAll(".spectrum-error");
    const rows = document.querySelectorAll(".spectrumRow");
    rows.forEach((r, i) => {
        r.style.display = "flex";
        errors[i].style.display = "none";
        if (filteredDataTmp.length === 0) {
            errors[i].style.display = "flex";
            errors[i].innerHTML = noStudiesHtml();
            r.style.display = "none"
        }
    });

    // dimension -> canon(answer) -> [row uid]
    const buckets = {};
    SPECTRUM_DIMS.forEach(d => buckets[d] = {});
    filteredDataTmp.forEach(row => {
        SPECTRUM_DIMS.forEach(dim => {
            splitValues(row[dim]).forEach(v => {
                const key = canon(v);
                if (!key || key === 'not applicable') return;
                (buckets[dim][key] = buckets[dim][key] || []).push(row.__uid)
            })
        })
    });

    const total = filteredDataTmp.length;
    document.querySelectorAll('.spectrumTable tr[data-row]').forEach(tr => {
        const dim = tr.getAttribute('data-row');
        // studies that land in one of the five answer cells of this row
        const inCells = new Set();
        tr.querySelectorAll('td[data-column]:not([data-rest])').forEach(td => ((buckets[dim] || {})[canon(td.getAttribute('data-column'))] || []).forEach(u => inCells.add(u)));
        const restUids = filteredDataTmp.filter(r => !inCells.has(r.__uid)).map(r => r.__uid);
        tr.querySelectorAll('[data-column]').forEach(el => {
            // reset previous render (cheap: no per-cell popup widgets any more)
            el.style.boxShadow = "";
            el.style.backgroundColor = "";
            el.style.color = "";
            el.onclick = null;
            el.onkeydown = null;
            el.removeAttribute("data-count");
            el.removeAttribute("role");
            el.setAttribute("tabindex", "-1");
            el.textContent = "";

            const label = el.getAttribute('data-column');
            const isRest = el.hasAttribute('data-rest');
            const uids = isRest ? restUids : ((buckets[dim] && buckets[dim][canon(label)]) || []);
            const count = uids.length;
            const pct = total ? Math.round(100 * count / total) : 0;
            el.setAttribute("data-label", label);
            if (isRest) {
                // neutral grey, never part of the colour scale; always shows its number
                el.innerHTML = `<span class="cell-count" aria-hidden="true">${count}</span>`;
                el.setAttribute("aria-label", `${dim}: not applicable or not stated, ${count} of ${total} studies, ${pct} percent`);
                el.setAttribute("data-count", count);
                if (!count) return;
                el.setAttribute("tabindex", "0");
                el.setAttribute("role", "button");
                el.onclick = () => showSpectrumStudies(`${SPECTRUM_DIMS.includes(dim) ? dim.replace(/\s*\(.*\)$/, '') : dim}: ${SPECTRUM_REST_LABEL}`, uids);
                el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click() } };
                return
            }
            el.setAttribute("data-pct", pct);
            el.setAttribute("aria-label", `${label}: ${count} of ${total} studies, ${pct} percent`);
            if (!count || !total) {
                if (el.closest('.type-2')) {
                    const zero = viridisRgb(0);
                    el.style.backgroundColor = `rgb(${zero.join(',')})`;
                    el.style.color = bestTextColor(zero);
                    el.innerHTML = '<span class="cell-count" aria-hidden="true">0</span>'
                }
                return
            }

            // Viridis sequential scale: t = share of filtered studies x slider gain.
            // (Was up to 100 stacked inset box-shadows per cell — slow to paint
            // and not a perceptually uniform or colour-blind-safe scale.)
            const t = Math.min(1, (count / total) * spectrumIntensityFor(el) / 20);
            const rgb = viridisRgb(0.08 + 0.92 * t);
            const fill = `rgb(${rgb.join(',')})`;
            if (el.closest('.type-1')) {
                const pt = document.createElement("div");
                pt.className = "data-point";
                pt.style.backgroundColor = fill;
                const dotSize = Math.min(12 + 23 * t, 35);
                pt.style.width = `${dotSize}px`;
                pt.style.height = `${dotSize}px`;
                pt.style.maxWidth = "90%"; // never larger than the cell
                pt.style.maxHeight = "90%";
                pt.style.borderRadius = "50%";
                pt.setAttribute('aria-hidden', 'true');
                el.appendChild(pt)
            } else {
                el.style.backgroundColor = fill;
                // Print the count so the grid is readable without colour (WCAG 1.4.1),
                // in whichever of black/white has the higher contrast on this fill.
                el.style.color = bestTextColor(rgb);
                el.innerHTML = `<span class="cell-count" aria-hidden="true">${count}</span>`
            }
            el.setAttribute("data-count", count);
            el.setAttribute("tabindex", "0");
            el.setAttribute("role", "button");
            el.onclick = () => showSpectrumStudies(label, uids);
            el.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click()
                }
            }
        })
    });
    document.querySelectorAll('.spectrumTable').forEach(t => enableRovingCells(t, 'td[data-column][role=button]'));
    updateSpectrumLegends()
}

// A small gradient legend under each grid, labelled with what the colour means.
function updateSpectrumLegends() {
    document.querySelectorAll('.spectrumTable').forEach(table => {
        const sliderId = table.classList.contains('type-1') ? 'type1Intensity' : 'type2Intensity';
        const gain = Number(document.getElementById(sliderId)?.value) || 20;
        const maxPct = Math.min(100, Math.round(100 * 20 / gain));
        let legend = table.parentElement.querySelector('.viridis-legend');
        if (!legend) {
            legend = document.createElement('div');
            legend.className = 'viridis-legend';
            const stops = Array.from({ length: 11 }, (_, i) => `rgb(${viridisRgb(0.08 + 0.092 * i).join(',')}) ${i * 10}%`).join(',');
            legend.innerHTML = `<span class="viridis-legend-min"></span><span class="viridis-legend-bar" style="background:linear-gradient(to right, ${stops})" aria-hidden="true"></span><span class="viridis-legend-max"></span>`;
            table.insertAdjacentElement('afterend', legend)
        }
        legend.setAttribute('aria-label', `Colour scale: darker purple means fewer studies, bright yellow means ${maxPct} percent or more of the filtered studies.`);
        legend.setAttribute('role', 'img');
        legend.querySelector('.viridis-legend-min').textContent = '0%';
        legend.querySelector('.viridis-legend-max').textContent = `${maxPct === 100 ? '' : '≥ '}${maxPct}% of studies`
    })
}

// One shared tooltip for every grid cell (replaces 76 Fomantic popup widgets
// that were destroyed and rebuilt on every filter change). Shows on hover AND
// keyboard focus, and Escape dismisses it (WCAG 1.4.13).
function initGridTooltip() {
    const tip = document.createElement('div');
    tip.className = 'grid-tooltip';
    tip.id = 'grid-tooltip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = !0;
    document.body.appendChild(tip);
    const show = (cell) => {
        if (!cell.hasAttribute('data-label')) return;
        const n = cell.getAttribute('data-count') || 0;
        tip.innerHTML = `<strong>${escapeHtml(cell.getAttribute('data-label'))}</strong><br>${n} of ${filteredDataTmp.length} studies (${cell.getAttribute('data-pct')}%)${n > 0 ? '<br><em>Click or press Enter to list them. Arrow keys move between cells.</em>' : ''}`;
        tip.hidden = !1;
        const r = cell.getBoundingClientRect();
        const top = r.top + window.scrollY - tip.offsetHeight - 8;
        tip.style.top = `${top < window.scrollY ? r.bottom + window.scrollY + 8 : top}px`;
        tip.style.left = `${Math.max(8, Math.min(r.left + window.scrollX + r.width / 2 - tip.offsetWidth / 2, document.documentElement.clientWidth - tip.offsetWidth - 8))}px`
    };
    const hide = () => { tip.hidden = !0 };
    $(document)
        .on('mouseenter focusin', '.spectrumTable [data-column]', function () { show(this) })
        .on('mouseleave focusout', '.spectrumTable [data-column]', hide)
        .on('keydown', (e) => { if (e.key === 'Escape') hide() })
}

// List the studies behind a grid cell. Uses data-uid + one delegated handler
// instead of inline onclick="jump('${id}')", which broke on IDs such as "O'Bryan 2012".
function showSpectrumStudies(label, uids) {
    const modal = document.querySelector(".spectrumCategoryData");
    if (!modal) return;
    const byUid = new Map(csvData.map(r => [r.__uid, r]));
    modal.innerHTML = `<div class="ui middle aligned selection list" role="listbox">${uids.map(uid => {
        const s = byUid.get(uid) || {};
        return `<div class="item study-jump-item selectable" role="option" tabindex="0" data-uid="${escapeHtml(uid)}"
            style="cursor: pointer; padding: 10px !important;" aria-label="Jump to study ${escapeHtml(s["Study ID"])}: ${escapeHtml(s.Title)}">
            <i class="ph ph-arrow-square-out"></i><div class="content"><div class="header">${escapeHtml(s["Study ID"])}</div>
            <div class="description">${escapeHtml(s.Title)}</div></div></div>`
    }).join("")}</div>`;
    document.querySelector("#spectrumDataLabel").textContent = `${uids.length} studies: ${label}`;
    $("#spectrumData").modal('show')
}

$(document).on('click keydown', '.study-jump-item[data-uid]', function (e) {
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    jumpToStudyFromModal(this.getAttribute('data-uid'))
});

function jumpToStudyFromModal(uid) {
    $("#spectrumData").modal('hide');
    const idx = sortedRows().findIndex(r => r.__uid === uid);
    if (idx === -1) return;
    const dataTabTrigger = document.querySelector('#Show-data');
    if (dataTabTrigger) dataTabTrigger.click();
    const page = Math.floor(idx / pageSize()) + 1;
    $("#pagination-container").pagination('selectPage', page);
    if (currentPage !== page) renderDataPage(page);
    setTimeout(() => {
        const $target = $(`.divOuter[data-uid="${uid}"], #studyTable tr[data-uid="${uid}"]`);
        if (!$target.length) return;
        $target.addClass('jump-highlight');
        $target[0].scrollIntoView({
            behavior: scrollBehavior(),
            block: 'nearest'
        });
        $target.attr('tabindex', '-1').focus();
        setTimeout(() => $target.removeClass('jump-highlight'), 3000)
    }, 400)
}

function changeSpectrumIntensity() {
    displaySpectrum()
}

