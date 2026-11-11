// app.js — Start-up and page-wide behaviour: theme, dropdown setup, initialisation, tabs and keyboard support, guided tour. Loaded last.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

function toggleTheme() {
    const html = document.documentElement;
    const themeAttr = html.getAttribute('data-theme');
    const willBeDark = themeAttr !== 'dark';
    if (willBeDark) {
        html.setAttribute('data-theme', 'dark');
        document.body.setAttribute('data-theme', 'dark')
    } else {
        html.removeAttribute('data-theme');
        document.body.removeAttribute('data-theme')
    }
    const ds = {
        bgPanel: getDSVar('--ds-bg-panel'),
        textPrimary: getDSVar('--ds-text-primary'),
        textSecondary: getDSVar('--ds-text-secondary'),
        borderSubtle: getDSVar('--ds-border-subtle'),
        palette: chartPalette()
    };
    currentTheme = willBeDark ? "dark" : "light";
    viewsDirty.grid = !0;
    viewsDirty.plot = !0; // series colours come from chartPalette(), which is theme-aware
    viewsDirty.gaps = !0;
    renderVisibleViews();
    Highcharts.charts.forEach(chart => {
        if (chart) {
            chart.update({
                colors: ds.palette,
                chart: {
                    backgroundColor: ds.bgPanel
                },
                title: {
                    style: {
                        color: ds.textPrimary
                    }
                },
                xAxis: {
                    labels: {
                        style: {
                            color: ds.textSecondary
                        }
                    },
                    lineColor: ds.borderSubtle,
                    tickColor: "#cbd5e166"
                },
                yAxis: {
                    labels: {
                        style: {
                            color: ds.textSecondary
                        }
                    },
                    gridLineColor: ds.borderSubtle,
                    title: {
                        style: {
                            color: ds.textSecondary
                        }
                    },
                    stackLabels: {
                        style: {
                            color: ds.textPrimary,
                            textOutline: 'none'
                        }
                    }
                },
                legend: {
                    itemStyle: {
                        color: ds.textSecondary
                    }
                },
                plotOptions: {
                    column: {
                        borderColor: ds.bgPanel
                    }
                },
                tooltip: {
                    backgroundColor: ds.bgPanel,
                    style: {
                        color: ds.textPrimary
                    }
                },
                exporting: {
                    buttons: {
                        contextButton: {
                            symbolStroke: ds.textSecondary,
                            theme: {
                                fill: 'transparent'
                            }
                        }
                    }
                }
            }, !0)
        }
    });
    if (document.querySelector(".theme-label")) {
        document.querySelector(".theme-label").textContent = willBeDark ? "Dark Mode" : "Light Mode"
    }
}

function fixDropdownAccessibility($dropdown, customLabel) {
    const $searchInput = $dropdown.find('input.search');
    // Use the label as written ("PHT Lab framework" used to be read out as
    // "p h t lab framework ... Has Popup."); the combobox role already conveys the popup.
    const labelName = customLabel || $dropdown.attr('aria-label') || $dropdown.attr('id') || "Options";
    $searchInput.attr({
        'aria-label': labelName,
        'autocomplete': 'off' // Fomantic sets an invalid "fomantic-search" token
    })
}

function doInitialization() {
    const trigger = document.querySelector('.hover-nav-trigger');
    const container = document.querySelector('.hover-nav-container');
    // Opens on hover, focus or click; Escape closes it and returns focus to the
    // gear (voice / switch / keyboard users, #21).
    const openMenu = () => { container.classList.remove('dismissed'); trigger.setAttribute('aria-expanded', 'true') };
    const closeMenu = () => trigger.setAttribute('aria-expanded', 'false');
    container.addEventListener('mouseenter', openMenu);
    container.addEventListener('mouseleave', () => { container.classList.remove('dismissed'); closeMenu() });
    trigger.addEventListener('focus', () => { if (!container.classList.contains('dismissed')) openMenu() });
    trigger.addEventListener('click', openMenu);
    container.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        container.classList.add('dismissed');
        closeMenu();
        trigger.focus()
    });

    document.getElementById('type1Intensity').value = 20;
    document.getElementById('type2Intensity').value = 20;
    container.addEventListener('focusout', (e) => {
        if (!container.contains(e.relatedTarget)) {
            container.classList.remove('dismissed');
            closeMenu()
        }
    });
    filteredDataTmp = csvData;
    const dropdownOptions = (type) => ({
        clearable: !0,
        useLabels: !1,
        allowAdditions: !1,
        // Open instantly: while the old 200 ms 'scale' animation ran, Fomantic
        // ignored Enter, so quick keyboard and screen-reader users lost their pick.
        duration: 0,
        onAdd: function (value, text, $selectedItem) {
            setTimeout(() => {
                const $label = $(this).find(`a.ui.label[data-value="${value}"]`);
                if ($label.length) {
                    $label.attr({
                        'tabindex': '0',
                        'role': 'button',
                        'aria-label': `Remove ${text} filter`
                    });
                    $label.find('.delete.icon').attr('aria-hidden', 'true')
                }
            }, 100);
            updateFilterState(value, type, "add")
        },
        onRemove: function (value, text, $removedItem) {
            updateFilterState(value, type, "remove");
            // Don't steal focus during a programmatic reset/import.
            if (!suppressApply) $(this).find('input.search').focus()
        },
        onShow: function () {
            $(this).find('.menu').attr('aria-hidden', 'false');
            $(this).find('.item').attr('tabindex', '0')
        },

        // 🎯 THE FIX: Catch the bulk "Clear All" action
        onChange: function (value, text, $choice) {
            // If the value is completely empty, the 'X' clear icon was clicked
            if (!value || value.trim() === "") {
                // Directly wipe this specific filter category from global state
                updateFilterState("", type, "nuke_all_filters");

                // Return focus to the search input so keyboard users aren't lost
                // (but not when the Reset button cleared everything).
                if (!suppressApply) $(this).find('input.search').focus();
            }

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
        },
    });
    $('.firstDropdown').dropdown(dropdownOptions("first"));
    $('.secondDropdown').dropdown(dropdownOptions("second"));
    $('.thirdDropdown').dropdown(dropdownOptions("third"));
    fixDropdownAccessibility($(".firstDropdown"), "PHT Lab Framework filters");
    fixDropdownAccessibility($(".secondDropdown"), "Characteristics of Included Studies filters");
    fixDropdownAccessibility($(".thirdDropdown"), "Participants filters");
    document.querySelector(".totalRecords").innerHTML = csvData.length;
    initChartControls();
    initDataToolbar();
    initGapControls();
    renderTable(csvData);
    updateFilterCounts(csvData, {});
    initShareLinks();
    setTimeout(getPlot, 100);
    const hasSeenTour = localStorage.getItem('pht_lab_tour_seen');
    if (hasSeenTour === null || hasSeenTour === 'false') {
        startGuidedTour()
    }
}
document.addEventListener("DOMContentLoaded", () => {
    buildLookupCache();
    buildSpectrumTables();
    initGridTooltip();
    doInitialization();
    const plotContainer = document.querySelector('.plotOptionsDiv');
    if (plotContainer) {
        plotContainer.addEventListener('keydown', function (e) {
            if ((e.key === 'Enter' || e.key === ' ') && this.classList.contains('expand')) {
                e.preventDefault();
                $(this).find('.ui.dropdown').dropdown('toggle')
            }
        })
    }
    $('.infoIcon.standalone').popup();
    const tabNames = {
        "Show-plot": "Plot",
        "Show-data": "Data",
        "ratings-grid": "Ratings",
        "Show-grid": "Spectrum",
        "Show-gaps": "Gaps",
        "Show-plot/visual": "Visual",
        "Show-plot/table": "Table"
    };

    function affirmByPath(path) {
        const announcer = document.getElementById('sr-announcer');
        const readableName = tabNames[path];
        if (announcer && readableName) {
            announcer.textContent = "";
            announcer.textContent = `${readableName} active.`
        } else {
            console.warn(`[Announcer Warning] Path "${path}" not found in tabNames mapping.`)
        }
    }
    $('#myTab .item').tab({
        history: !1,
        onVisible: function (tabPath) {
            $('#myTab .item').attr('aria-selected', 'false');
            $(`#myTab .item[data-tab="${tabPath}"]`).attr('aria-selected', 'true');
            // Draw whatever became stale while this tab was hidden.
            renderVisibleViews(tabPath);
            if (tabPath === 'Show-plot' && plotState.chart) plotState.chart.reflow();
            // Header control for the visible tab: chart picker on Plot, card field
            // hider on Data (Cards view only), nothing elsewhere. Decided here only,
            // so it is right however the tab was opened (click, keyboard, shared link).
            animateOptions(tabPath === 'Show-plot' ? 'plot' : (tabPath === 'Show-data' && dataView === 'cards') ? 'plotFilter' : 'hide');
            affirmByPath(tabPath)
        }
    });
    $('#show-plot-pane .menu .item').tab({
        history: !1,
        onVisible: function (tabPath) {
            $('#show-plot-pane .menu .item').attr('aria-selected', 'false');
            $(`#show-plot-pane .menu .item[data-tab="${tabPath}"]`).attr('aria-selected', 'true');
            if (tabPath === 'Show-plot/visual' && plotState.chart) plotState.chart.reflow();
            affirmByPath(tabPath)
        }
    });
    const importBtn = document.getElementById('import-data-button');
    if (importBtn) importBtn.addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', handleDataImport);
    ["type1Intensity", "type2Intensity"].forEach(id => document.getElementById(id).addEventListener("input", changeSpectrumIntensity));
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        // Resize only needs a reflow, not a full rebuild of the chart.
        resizeTimeout = setTimeout(() => plotState.chart && plotState.chart.reflow(), 100)
    });
    $('#restartTourButton').on('click keydown', function (e) {
        if (e.type === 'keydown') {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                startGuidedTour()
            }
            return
        }
        startGuidedTour()
    });
    $('#theme').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.checked = !this.checked;
            toggleTheme();
            $(this).attr('aria-checked', this.checked)
        }
    });
    document.querySelector(".close-sidebar").addEventListener("click", () => document.querySelector(".sidebar-filters").classList.remove("show"));
    document.querySelectorAll(".inputFilters input").forEach(input => {
        input.addEventListener("input", validateAndApply);
        input.addEventListener("blur", () => {
            if (!input.checkValidity() && input.value.length > 0) {
                input.reportValidity()
            }
        })
    });
    // Buttons (no inline onclick: the Content-Security-Policy forbids inline script)
    const actions = {
        'reset': () => applyFilters('reset'),
        'export-xlsx': () => exportFilteredData(),
        'refresh-chart': () => getPlot(),
        'export-csv': () => exportCsv(),
        'export-bib': () => exportBibtex()
    };
    document.addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        if (el && actions[el.getAttribute('data-action')]) actions[el.getAttribute('data-action')]()
    });
    document.getElementById('theme').addEventListener('change', () => toggleTheme());
    // Opened from a shared link? Apply it last, once the tabs are set up.
    applyShareState(location.hash)
});

function startGuidedTour() {
    if (currentTourInstance && currentTourInstance.isActive()) return;
    currentTourInstance = new Shepherd.Tour({
        useModalOverlay: !0,
        defaultStepOptions: {
            classes: 'shadow-md pht-tour-theme',
            cancelIcon: {
                enabled: !0
            },
            scrollTo: {
                behavior: 'smooth',
                block: 'center'
            }
        }
    });
    currentTourInstance.addSteps([{
        id: 'welcome',
        title: 'Welcome to PHT LAB! 🎯',
        text: 'A quick overview of how to filter, visualize, and export research data.',
        buttons: [{
            text: 'Skip',
            action: currentTourInstance.cancel
        }, {
            text: 'Start',
            action: currentTourInstance.next
        }]
    }, {
        id: 'sidebar',
        title: 'Unified Filtering 🔍',
        text: 'Use this sidebar to refine your dataset. Use <strong>General Information</strong> for text search and <strong>Dropdowns</strong> for bulk criteria.',
        attachTo: {
            element: '.sidebar-filters',
            on: 'right'
        },
        buttons: [{
            text: 'Back',
            action: currentTourInstance.back
        }, {
            text: 'Next',
            action: currentTourInstance.next
        }]
    }, {
        id: 'visual-tabs',
        title: 'Switch Your View 📊',
        text: 'Switch between <strong>Plot, Data, Ratings, Spectrum</strong> and <strong>Gaps</strong> (which combinations have never been studied). Everything updates instantly with your filters.',
        attachTo: {
            element: '#myTab',
            on: 'bottom'
        },
        buttons: [{
            text: 'Back',
            action: currentTourInstance.back
        }, {
            text: 'Next',
            action: currentTourInstance.next
        }]
    }, {
        id: 'share',
        title: 'Share and cite 🔗',
        text: '<strong>Copy link</strong> copies a link to exactly what you see (filters, search, tab, chart). The <strong>Data</strong> tab can download the filtered studies as <strong>CSV</strong> or <strong>BibTeX</strong>.',
        attachTo: {
            element: '#copyLink',
            on: 'bottom'
        },
        buttons: [{
            text: 'Back',
            action: currentTourInstance.back
        }, {
            text: 'Next',
            action: currentTourInstance.next
        }]
    }, {
        id: 'main-content',
        title: 'Data & Insights 📈',
        text: 'The central area displays your current findings. You can interact with chart elements or table rows to see specific study details.',
        attachTo: {
            element: '.box',
            on: 'left'
        },
        buttons: [{
            text: 'Back',
            action: currentTourInstance.back
        }, {
            text: 'Next',
            action: currentTourInstance.next
        }]
    }, {
        id: 'global-actions',
        title: 'Export & Management 🛠️',
        text: 'Reset your view, or <strong>Import/Export</strong> your filtered datasets using these actions. Monitor the <strong>Active Record Count</strong> to see your current sample size.',
        attachTo: {
            element: '.sidebar-row-3',
            on: 'top'
        },
        scrollTo: !1,
        buttons: [{
            text: 'Back',
            action: currentTourInstance.back
        }, {
            text: 'Next',
            action: currentTourInstance.next
        }]
    }, {
        id: 'finish',
        title: 'Ready to Explore! 🏁',
        text: 'The tour is complete. You can restart this guide anytime from the settings menu.',
        buttons: [{
            text: 'Finish',
            action: currentTourInstance.complete
        }]
    }]);
    currentTourInstance.on('complete', () => handleTourEnd());
    currentTourInstance.on('cancel', () => handleTourEnd());
    currentTourInstance.start()
}

function handleTourEnd() {
    localStorage.setItem('pht_lab_tour_seen', 'true');
    const restartBtn = document.getElementById('restartTourButton');
    if (restartBtn) restartBtn.focus();
}
document.querySelector('.skip-link').addEventListener('click', function () {
    const announcer = document.getElementById('navigation-announcer');
    announcer.textContent = 'Navigated to research dashboard charts and data table.'
});
// WAI-ARIA tabs pattern: Enter/Space activate; Left/Right/Home/End move between
// tabs; only the selected tab is in the Tab order (roving tabindex).
function syncTabStops($menu) {
    $menu.children('[role="tab"]').each(function () {
        this.setAttribute('tabindex', this.classList.contains('active') ? '0' : '-1')
    })
}
$('.ui.tabular.menu').each(function () { syncTabStops($(this)) });
$('.ui.tabular.menu .item').on('click', function () {
    const $menu = $(this).parent();
    setTimeout(() => syncTabStops($menu), 0)
});
$('.ui.tabular.menu .item').on('keydown', function (e) {
    const $tabs = $(this).parent().children('[role="tab"]');
    const i = $tabs.index(this);
    let next = null;
    if (e.key === 'ArrowRight') next = $tabs.get((i + 1) % $tabs.length);
    else if (e.key === 'ArrowLeft') next = $tabs.get((i - 1 + $tabs.length) % $tabs.length);
    else if (e.key === 'Home') next = $tabs.get(0);
    else if (e.key === 'End') next = $tabs.get($tabs.length - 1);
    if (next) {
        e.preventDefault();
        next.focus();
        $(next).click();
        return
    }
    if (e.which === 13 || e.which === 32) {
        e.preventDefault();
        $(this).click()
    }
});
$(document).on('keydown', '.ui.label[data-value]', function (e) {
    if (e.which === 13 || e.which === 8 || e.which === 32) {
        e.preventDefault();
        $(this).find('.delete.icon').click()
    }
});
$('.ui.dropdown .menu').each(function () {
    const $menu = $(this);
    let currentHeaderId = '';
    $menu.children().each(function (index) {
        const $el = $(this);
        if ($el.hasClass('header')) {
            currentHeaderId = 'header-' + Math.random().toString(36).substr(2, 9);
            $el.attr('id', currentHeaderId)
        } else if ($el.hasClass('item') && currentHeaderId !== '') {
            const itemId = 'item-' + Math.random().toString(36).substr(2, 9);
            $el.attr({
                'id': itemId,
                'role': 'option',
                'aria-labelledby': `${currentHeaderId} ${itemId}`
            })
        }
    })
});
