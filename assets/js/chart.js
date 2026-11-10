// chart.js — Plot tab: chart controls (colour by / show), the Highcharts bar chart and its data table.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

var plotState = { chart: null, totals: [], xLabel: '', configKey: '', mode: 'count', stackLabel: '' };

function chartControlState() {
    const s = document.getElementById('stackBy');
    const m = document.getElementById('plotMode');
    return { stackCol: s ? s.value : STACK_DEFAULT, mode: m && m.value === 'percent' ? 'percent' : 'count' }
}

function initChartControls() {
    const sel = document.getElementById('stackBy');
    if (!sel || sel.options.length) return;
    const add = (value, text) => { const o = document.createElement('option'); o.value = value; o.textContent = text; sel.appendChild(o) };
    add('', 'None (one colour)');
    add(STACK_DEFAULT, 'Participant groups');
    codedColumns().filter(c => c !== STACK_DEFAULT && csvData.some(r => String(r[c] ?? '').trim()))
        .forEach(c => add(c, shortLabel(c)));
    sel.value = STACK_DEFAULT;
    const redraw = () => { viewsDirty.plot = !0; renderVisibleViews() };
    sel.addEventListener('change', redraw);
    document.getElementById('plotMode').addEventListener('change', redraw)
}

function Drawplot(PlotFilter) {
    if (!PlotFilter) return;
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
    const { stackCol: chosenStack, mode } = chartControlState();
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
    const categories = orderValues(PlotFilter, Object.keys(stackMap));
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

    updateAccessibleTable(categories, series, PlotFilter, studyTotals);
    if (series.length === 0) {
        plotEl.style.display = "none";
        errorEl.innerHTML = `<div class="mx-auto"><img src="media/undraw_no_data_re_kwbl.svg" class="error-svg" alt="No data"><h5>No Data</h5></div>`;
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
            : `Numbers above bars = distinct studies. Colours = ${escapeHtml(plotState.stackLabel)}; a study with several answers appears in several colours.`)
        : (mode === 'percent'
            ? 'Bar height = % of the filtered studies that have this answer (studies with several answers count toward each).'
            : 'Number of studies with each answer (studies with several answers count toward each).');

    // Data-only changes (filters) do a light update; a change of colouring,
    // mode or theme applies the full options to the SAME chart (destroying and
    // re-creating it raced Highcharts' sonification audio: "AudioContext closed").
    const configKey = [stackCol, mode, dark].join('|');
    if (plotState.chart && plotState.chart.series && plotState.configKey === configKey) {
        plotState.chart.update({
            title: { text: title },
            subtitle: { text: subtitle },
            xAxis: { categories: categories },
            series: series
        }, !1, !0);
        plotState.chart.reflow();
        plotState.chart.redraw({ duration: 200 });
        return
    }
    const opts = {
        colors: palette,
        chart: {
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
            keyboardNavigation: {
                enabled: !0,
                seriesNavigation: {
                    rememberPointFocus: !0
                }
            },
            announceNewData: {
                enabled: !0,
                interruptUser: !0
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
                text: mode === 'percent' ? (stackCol ? '% of answers in the bar' : '% of filtered studies') : 'No. of studies',
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
                cursor: 'pointer',
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
                    html += `<span style="color:${p.color}">●</span> ${name}: <b>${n}</b>${pct}<br/>`
                });
                return html
            }
        },
        series: series
    };
    plotState.configKey = configKey;
    if (plotState.chart && plotState.chart.series) plotState.chart.update(opts, !0, !0);
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

