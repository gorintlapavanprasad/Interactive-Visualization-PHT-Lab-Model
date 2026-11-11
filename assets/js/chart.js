// chart.js — Plot tab: chart controls (colour by / show), the Highcharts bar chart and its data table.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

var plotState = { chart: null, totals: [], xLabel: '', configKey: '', mode: 'count', stackLabel: '' };

function chartControlState() {
    const s = document.getElementById('stackBy');
    const m = document.getElementById('plotMode');
    const pt = document.getElementById('plotPatterns');
    return { stackCol: s ? s.value : STACK_DEFAULT, mode: m && m.value === 'percent' ? 'percent' : 'count', patterns: !!(pt && pt.checked) }
}

// ---- Patterns (#19): an optional texture on each colour, so colour-blind users
// can match bar segments to the legend without relying on colour alone.
const PATTERN_KEY = 'pht_lab_patterns';
// 8x8 tile overlays (SVG path data); index 0 is plain.
const PATTERN_PATHS = [
    '',
    'M0,8 L8,0 M-2,2 L2,-2 M6,10 L10,6',          // diagonal /
    'M0,2 H8 M0,6 H8',                              // horizontal
    'M2,2 h.01 M6,6 h.01',                          // dots
    'M2,0 V8 M6,0 V8',                              // vertical
    'M0,0 L8,8 M-2,6 L2,10 M6,-2 L10,2',            // diagonal \
    'M0,8 L8,0 M0,0 L8,8',                          // cross-hatch
    'M0,4 H8 M4,0 V8',                              // grid
    'M4,4 h.01'                                     // big dot
];
const patternId = i => `pht-pat-${i}`;

function ensureChartPatterns(chart) {
    const defs = chart && chart.renderer && chart.renderer.defs && chart.renderer.defs.element;
    if (!defs) return;
    const NS = 'http://www.w3.org/2000/svg';
    (chart.series || []).forEach((s, i) => {
        const base = s.options.custom && s.options.custom.base;
        if (!base) return;
        const id = patternId(i);
        let pat = defs.querySelector('#' + id);
        if (pat && pat.getAttribute('data-base') === base) return;
        if (pat) pat.remove();
        pat = document.createElementNS(NS, 'pattern');
        pat.setAttribute('id', id);
        pat.setAttribute('data-base', base);
        pat.setAttribute('patternUnits', 'userSpaceOnUse');
        pat.setAttribute('width', '8');
        pat.setAttribute('height', '8');
        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('width', '8'); rect.setAttribute('height', '8'); rect.setAttribute('fill', base);
        pat.appendChild(rect);
        const d = PATTERN_PATHS[i % PATTERN_PATHS.length];
        if (d) {
            const rgb = [1, 3, 5].map(k => parseInt(base.slice(k, k + 2), 16));
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', bestTextColor(rgb));
            path.setAttribute('stroke-opacity', '0.7');
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('stroke-width', /h\.01/.test(d) ? (i % PATTERN_PATHS.length === 8 ? '3.5' : '2.5') : '1.5');
            pat.appendChild(path);
        }
        defs.appendChild(pat)
    });
    // Repair fills left mid-tween ("color-mix(..., url(#...))" is not a valid fill).
    (chart.series || []).forEach(s => {
        if (!String(s.color).startsWith('url(')) return;
        (s.points || []).forEach(p => { const g = p.graphic; if (g && g.element.getAttribute('fill') !== s.color) g.element.setAttribute('fill', s.color) })
    })
}

function initChartControls() {
    const sel = document.getElementById('stackBy');
    if (!sel || sel.options.length) return;
    const add = (value, text) => { const o = document.createElement('option'); o.value = value; o.textContent = text; sel.appendChild(o) };
    add('', 'None (one colour)');
    add(STACK_DEFAULT, shortLabel(STACK_DEFAULT));
    codedColumns().filter(c => c !== STACK_DEFAULT && csvData.some(r => String(r[c] ?? '').trim()))
        .forEach(c => add(c, shortLabel(c)));
    sel.value = STACK_DEFAULT;
    const redraw = () => { viewsDirty.plot = !0; renderVisibleViews() };
    sel.addEventListener('change', redraw);
    document.getElementById('plotMode').addEventListener('change', redraw);
    const pt = document.getElementById('plotPatterns');
    if (pt) {
        try { pt.checked = localStorage.getItem(PATTERN_KEY) === 'on' } catch (e) { /* storage blocked */ }
        pt.addEventListener('change', () => {
            try { localStorage.setItem(PATTERN_KEY, pt.checked ? 'on' : 'off') } catch (e) { /* storage blocked */ }
            announce(pt.checked ? 'Patterns added to chart colours.' : 'Patterns removed.');
            redraw()
        })
    }
}

function Drawplot(PlotFilter) {
    if (!PlotFilter) return;
    renderInsights();
    const plotEl = document.querySelector("#plotIt");
    const errorEl = document.querySelector(".plot-error");
    errorEl.innerHTML = "";
    plotEl.style.display = "block";
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const ds = {
        bgPanel: getDSVar('--ds-bg-panel'),
        textPrimary: getDSVar('--ds-text-primary'),
        textSecondary: getDSVar('--ds-text-secondary'),
        borderSubtle: getDSVar('--ds-border-subtle')
    };
    const { stackCol: chosenStack, mode, patterns } = chartControlState();
    // Colouring a column by itself adds nothing; treat it as "none".
    const stackCol = chosenStack && chosenStack !== PlotFilter ? chosenStack : '';
    const total = filteredDataTmp.length;

    const stackMap = {};
    const studyCount = {}; // distinct studies per bar
    const segSeen = new Set();
    filteredDataTmp.forEach(study => {
        // Multi-answer cells ("Interview; Survey") count toward each answer's bar.
        const xVals = [...new Set(splitValues(study[PlotFilter]).map(displayLabel))];
        let segs = ['Studies'];
        if (stackCol) {
            segs = [...new Set(splitValues(study[stackCol]).map(displayLabel))];
            if (!segs.length) segs = [NOT_RECORDED];
        }
        xVals.forEach(xVal => {
            if (!stackMap[xVal]) { stackMap[xVal] = {}; studyCount[xVal] = 0 }
            studyCount[xVal]++;
            segs.forEach(g => { segSeen.add(g); stackMap[xVal][g] = (stackMap[xVal][g] || 0) + 1 })
        })
    });
    let categories = orderValues(PlotFilter, Object.keys(stackMap));
    // Years form a timeline: show years with no studies as empty bars instead
    // of skipping them (skipping squeezed the gaps out of the trend).
    if (PlotFilter === 'Year' && categories.length && categories.every(c => /^\d{4}$/.test(c))) {
        const ys = categories.map(Number);
        categories = [];
        for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
            const c = String(y);
            if (!stackMap[c]) { stackMap[c] = {}; studyCount[c] = 0 }
            categories.push(c)
        }
    }
    const studyTotals = categories.map(c => studyCount[c]);
    const segNames = stackCol ? orderValues(stackCol, [...segSeen]) : ['Studies'];
    const nColours = segNames.filter(s => s !== NOT_RECORDED).length;
    const palette = chartPalette(Math.max(nColours, 1));
    const grey = dark ? '#9ca3af' : '#6b7280';
    let ci = 0;
    const series = segNames.map(name => ({
        id: name,
        name,
        color: name === NOT_RECORDED ? grey : palette[ci++ % palette.length],
        data: categories.map(c => {
            const count = stackMap[c][name] || 0;
            // Percent + no colouring: bar height = % of all filtered studies.
            return (!stackCol && mode === 'percent')
                ? { y: total ? Math.round(1000 * count / total) / 10 : 0, count }
                : { y: count, count }
        })
    })).filter(s => s.data.some(p => p.count > 0));
    // Patterns: each segment colour gets its own texture (legend too). The plain
    // colour is kept in custom.base for the tooltip and the pattern itself.
    const usePatterns = patterns && !!stackCol;
    if (usePatterns) series.forEach((s, i) => { s.custom = { base: s.color }; s.color = `url(#${patternId(i)})` });

    updateAccessibleTable(categories, series, PlotFilter, studyTotals);
    if (series.length === 0) {
        plotEl.style.display = "none";
        errorEl.innerHTML = noStudiesHtml();
        return
    }
    plotState.totals = studyTotals;
    plotState.xLabel = shortLabel(PlotFilter);
    plotState.mode = mode;
    plotState.stacked = !!stackCol;
    plotState.stackLabel = stackCol ? shortLabel(stackCol) : '';
    const title = `Studies by ${escapeHtml(plotState.xLabel)}`;
    const subtitle = stackCol
        ? (mode === 'percent'
            ? `Each bar = 100% of its studies' answers, split by ${escapeHtml(plotState.stackLabel)}. n under each bar = distinct studies.`
            : `Numbers above bars = distinct studies. Colours = ${escapeHtml(plotState.stackLabel)}; a study with several answers appears in several colours. Segments stack in legend order, first at the top.`)
        : (mode === 'percent'
            ? 'Bar height = % of the filtered studies that have this answer (studies with several answers count toward each).'
            : 'Number of studies with each answer (studies with several answers count toward each).');

    // Data-only changes (filters) do a light update; a change of colouring,
    // mode or theme applies the full options to the SAME chart (destroying and
    // re-creating it raced Highcharts' sonification audio: "AudioContext closed").
    const configKey = [stackCol, mode, dark, usePatterns].join('|');
    if (plotState.chart && plotState.chart.series && plotState.configKey === configKey) {
        plotState.chart.update({
            title: { text: title },
            subtitle: { text: subtitle },
            xAxis: { categories: categories },
            series: series
        }, !1, !0);
        plotState.chart.reflow();
        plotState.chart.redraw(reducedMotion() ? false : { duration: 200 });
        return
    }
    const opts = {
        colors: palette,
        chart: {
            // No growing bars for users who asked for reduced motion (#24).
            animation: !reducedMotion(),
            events: {
                render: function () { ensureChartPatterns(this) }
            },
            type: 'column',
            backgroundColor: ds.bgPanel,
            zooming: {
                type: 'x'
            },
            style: {
                fontFamily: 'inherit'
            }
        },
        xAxis: {
            categories: categories,
            lineColor: ds.borderSubtle,
            lineWidth: 1,
            tickmarkPlacement: 'between',
            gridLineWidth: 0,
            gridLineColor: ds.borderSubtle,
            startOnTick: !0,
            endOnTick: !0,
            tickLength: 35,
            tickColor: "#33415574",
            tickWidth: 1,
            labels: {
                // In percentage-stacked view every bar is 100% tall, so the study
                // count goes under the bar label instead of on top of the bar.
                formatter: function () {
                    if (plotState.mode === 'percent' && plotState.stacked) return `${escapeHtml(String(this.value))}<br/>n=${plotState.totals[this.pos]}`;
                    return escapeHtml(String(this.value))
                },
                style: {
                    color: ds.textSecondary
                },
                y: 20,
                align: 'center'
            }
        },
        title: {
            text: title,
            align: 'left',
            style: {
                color: ds.textPrimary,
                fontSize: '18px'
            }
        },
        subtitle: {
            text: subtitle,
            align: 'left',
            style: {
                color: ds.textSecondary,
                fontSize: '12px'
            }
        },
        exporting: {
            enabled: !0,
            sourceWidth: Math.max(plotEl.clientWidth, 800),
            accessibility: {
                enabled: !0
            },
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG']
                }
            }
        },
        accessibility: {
            enabled: !0,
            // One landmark for the chart, not one per series and legend (#17).
            landmarkVerbosity: 'one',
            keyboardNavigation: {
                enabled: !0,
                seriesNavigation: {
                    rememberPointFocus: !0
                }
            },
            // Off: it interrupted (assertive) the "N of 216 studies match"
            // announcement on every filter change and tab switch (#17).
            announceNewData: {
                enabled: !1
            },
            sonification: {
                enabled: true,
                defaultInstrumentOptions: {
                    instrument: 'basic1',
                    mapping: {
                        pitch: { mapTo: 'y', min: 'c2', max: 'c6' },
                        volume: { mapTo: 'y', min: 0.3, max: 0.9 }
                    }
                }
            },
            point: {
                descriptionFormatter: function (point) {
                    const n = point.options.count ?? point.y;
                    const pct = plotState.mode === 'percent'
                        ? (plotState.stacked ? `, ${Math.round(point.percentage || 0)}% of this bar` : `, ${point.y}% of filtered studies`)
                        : '';
                    const seg = plotState.stacked ? `${point.series.name}: ` : '';
                    return `${plotState.xLabel} ${point.category}: ${seg}${n} studies${pct}. ${plotState.totals[point.index]} distinct studies in this bar.`
                }
            }
        },
        yAxis: {
            min: 0,
            max: mode === 'percent' ? 100 : null,
            gridLineColor: ds.borderSubtle,
            title: {
                // Stacked counts: a study with several colour answers is in several
                // segments, so bar height can exceed the distinct-study number on top.
                text: mode === 'percent' ? (stackCol ? '% of answers in the bar' : '% of filtered studies')
                    : (stackCol ? 'Studies per colour (can count more than once)' : 'No. of studies'),
                style: {
                    color: ds.textSecondary
                }
            },
            labels: {
                format: mode === 'percent' ? '{value}%' : '{value}',
                style: {
                    color: ds.textSecondary
                }
            },
            stackLabels: {
                enabled: !(stackCol && mode === 'percent'),
                // Distinct studies, not the segment sum (a study with several
                // answers would otherwise be counted more than once).
                formatter: function () {
                    const n = plotState.totals[this.x];
                    return plotState.mode === 'percent' ? `n=${n}` : n
                },
                style: {
                    fontWeight: 'bold',
                    color: ds.textPrimary,
                    textOutline: 'none'
                }
            }
        },
        legend: {
            enabled: !!stackCol,
            align: 'left',
            verticalAlign: 'top',
            title: {
                text: stackCol ? `Colour: ${escapeHtml(plotState.stackLabel)}` : '',
                style: { color: ds.textPrimary, fontWeight: '600', fontSize: '13px' }
            },
            // Bigger legend entries with spacing: these are toggle buttons, so
            // they need comfortable targets (WCAG 2.5.8, 24px minimum).
            itemStyle: {
                color: ds.textSecondary,
                fontWeight: 'normal',
                fontSize: '14px'
            },
            symbolHeight: 14,
            symbolWidth: 14,
            itemMarginTop: 5,
            itemMarginBottom: 5,
            itemDistance: 24,
            keyboardNavigation: {
                enabled: !0
            }
        },
        plotOptions: {
            column: {
                stacking: (stackCol && mode === 'percent') ? 'percent' : 'normal',
                borderWidth: 1,
                borderColor: ds.bgPanel,
                borderRadius: 2,
                animation: !reducedMotion(),
                cursor: 'pointer',
                // Hover brightening can't be applied to a pattern fill.
                states: { hover: { enabled: !usePatterns } },
                point: {
                    events: {
                        click: function () {
                            if (this.sonify) this.sonify()
                        }
                    }
                }
            }
        },
        tooltip: {
            enabled: !0,
            shared: !0,
            backgroundColor: ds.bgPanel,
            style: {
                color: ds.textPrimary
            },
            formatter: function () {
                const pts = this.points || [this];
                const first = pts[0];
                const idx = first.point.index;
                let html = `<b>${escapeHtml(String(first.key ?? first.point.category))}</b> — ${plotState.totals[idx]} studies<br/>`;
                pts.forEach(p => {
                    const n = p.point.options.count ?? p.y;
                    const pct = plotState.mode === 'percent'
                        ? (plotState.stacked ? ` (${Math.round(p.percentage || 0)}%)` : ` (${p.y}% of filtered)`)
                        : '';
                    const name = plotState.stacked ? escapeHtml(p.series.name) : 'Studies';
                    html += `<span style="color:${(p.series.options.custom && p.series.options.custom.base) || p.color}">●</span> ${name}: <b>${n}</b>${pct}<br/>`
                });
                return html
            }
        },
        series: series
    };
    plotState.configKey = configKey;
    // No animation when patterns switch: Highcharts can't tween a colour into a pattern.
    const patternsChanged = !!plotState.patterns !== usePatterns;
    plotState.patterns = usePatterns;
    if (plotState.chart && plotState.chart.series) plotState.chart.update(opts, !0, !0, patternsChanged ? !1 : undefined);
    else plotState.chart = Highcharts.chart('plotIt', opts)
}

function updateAccessibleTable(finalUniqueX, highchartsSeries, PlotFilter, studyTotals = []) {
    const headerRow = document.getElementById("sr-table-header-row");
    const tableBody = document.getElementById("sr-table-body");
    const tableTitle = document.getElementById("sr-plot-title");
    if (!headerRow || !tableBody) return;
    if (tableTitle) {
        tableTitle.innerText = `Data table for Studies by ${PlotFilter}`
    }
    headerRow.innerHTML = `<th scope="col">${escapeHtml(PlotFilter)}</th>`;
    tableBody.innerHTML = "";
    highchartsSeries.forEach(series => {
        const th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.innerText = series.name;
        headerRow.appendChild(th)
    });
    const totalTh = document.createElement("th");
    totalTh.setAttribute("scope", "col");
    totalTh.innerText = "Distinct studies";
    headerRow.appendChild(totalTh);
    // A plain, semantic data table: screen readers navigate it cell by cell with
    // row/column headers. (Rows used to carry an aria-label that replaced the
    // real cells, and the table was role="grid" without grid keyboard support.)
    // Always the number of studies (also in percentage view, where y is a %).
    const valueOf = (point) => (point && typeof point === 'object') ? (point.count ?? point.y) : point || 0;
    tableBody.innerHTML = finalUniqueX.map((label, index) => {
        const vals = highchartsSeries.map(series => valueOf(series.data[index]));
        const distinct = studyTotals[index] ?? vals.reduce((a, b) => a + b, 0);
        return `<tr><th scope="row">${escapeHtml(label)}</th>${vals.map(v => `<td>${v}</td>`).join('')}<td><strong>${distinct}</strong></td></tr>`
    }).join('')
}

function getPlot(providedValue) {
    const val = providedValue || $('#plotFilter').dropdown('get value');
    const finalVal = typeof val === 'string' ? val.trim() : val;
    if (finalVal) Drawplot(finalVal)
}


// ---- "At a glance" (#27): a short, plain-language summary of the filtered studies.
// Plain text in a list (read well by screen readers); not a live region, so it
// never talks over the "N of 216 studies match" announcement.
const INSIGHT_SKIP = v => ['not applicable', 'undisclosed/unknown', 'undisclosed', 'other', canon(NOT_RECORDED)].includes(canon(v));

function topAnswers(rows, col) {
    const counts = new Map();
    rows.forEach(r => new Set(splitValues(r[col]).map(displayLabel)).forEach(v => { if (!INSIGHT_SKIP(v)) counts.set(v, (counts.get(v) || 0) + 1) }));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

function insightsItems(rows) {
    if (!rows.length) return [];
    const n = rows.length, plural = k => k === 1 ? 'study' : 'studies';
    const years = rows.map(r => +r.Year).filter(Boolean);
    const out = [];
    if (years.length) {
        const byYear = topAnswers(rows.filter(r => +r.Year), 'Year');
        out.push(`${n} ${plural(n)}, from ${Math.min(...years)} to ${Math.max(...years)}. Busiest year: ${byYear[0][0]} (${byYear[0][1]} ${plural(byYear[0][1])}).`)
    } else out.push(`${n} ${plural(n)}.`);
    [['Community of focus', 'Most studied community'], ['Study Method', 'Most used method'], ['Technology Modality', 'Most used technology']].forEach(([col, label]) => {
        const t = topAnswers(rows, col);
        if (t.length) out.push(`${label}: ${shortAnswer(t[0][0])} (${t[0][1]} ${plural(t[0][1])}).`)
    });
    const comm = topAnswers(rows, 'Community of focus');
    if (comm.length > 1) {
        const least = comm[comm.length - 1];
        out.push(`Least studied community: ${shortAnswer(least[0])} (${least[1]} ${plural(least[1])}).`)
    }
    return out
}

// "Blind or low vision (BLV)" stays; drop long "(e.g., ...)" examples.
const shortAnswer = v => String(v).replace(/\s*\((?:i\.e\.|e\.g\.)[^)]*\)\s*$/i, '');

function renderInsights() {
    const list = document.getElementById('insightsList');
    if (!list) return;
    const items = insightsItems(filteredDataTmp);
    list.innerHTML = items.map(t => `<li>${escapeHtml(t)}</li>`).join('');
    const box = list.closest('.insights');
    if (box) box.hidden = !items.length
}
