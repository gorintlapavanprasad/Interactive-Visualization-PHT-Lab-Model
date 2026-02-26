const FILTER_SPECS = {
    "first": {
        "Fun-First vs. Utility-First (Initial Design Intention)": {
            "fun_totally": "Totally fun first (i.e., Entertainment game reappropriated)",
            "fun_mostly": "Mostly fun first (i.e., Design workshop with disabled stakeholders)",
            "fun_utility_both": "Both fun and utility first (i.e., Design workshop with diverse stakeholders)",
            "utility_mostly": "Mostly utility first (i.e., primary utilitarian mechanic designed first)",
            "utility_totally": "Totally utility first (i.e., made by clinicians, fun incorporated later)",
            "fun_utility_undisclosed": "Undisclosed/Unkown, but the paper does include a game/play system or experience",
            "fun_utility_na": "Not Applicable"
        },
        "Play vs. Game": {
            "play_unstructured": "Unstructured play (i.e., no rules, making art)",
            "play_semi_structured": "Semi-structured play (i.e., playground game)",
            "play_flexible_rules": "Flexible structure with rules (i.e., improv)",
            "game_flexible": "Flexible game (i.e., board game with house rules)",
            "game_rigid": "Game with rigid rules (i.e., video game)",
            "play_game_undisclosed": "Undisclosed/Unkown, but the paper does include a game/play system or experience",
            "play_game_na": "Not Applicable"
        },
        "Skill vs. Chance": {
            "skill_entirely": "Entirely skill-based (i.e., trivia, sports)",
            "skill_mostly": "Mostly skill-based (i.e., Mario Cart)",
            "skill_chance_equal": "Equally skill and chance based (i.e., Catan)",
            "chance_mostly": "Mostly chance-based (i.e., Uno)",
            "chance_entirely": "Entirely chance-based (i.e., all dice)",
            "skill_chance_undisclosed": "Undisclosed/Unkown, but the paper does include a game/play system or experience",
            "skill_chance_na": "Not Applicable"
        },
        "Social vs. Solo": {
            "solo_entirely": "Entirely Solo (i.e., Solitaire)",
            "solo_mostly_ai": "Mostly Solo, but can play against AI (i.e., Single player StarCraft)",
            "solo_social_mixed": "Mix of solo and social affordances (i.e., Animal Crossing)",
            "social_mostly": "Mostly social, but aspects are independent (i.e., House on Hill haunt transition)",
            "social_entirely": "Entirely social (i.e., Tag)",
            "social_solo_undisclosed": "Undisclosed/Unkown, but the paper does include a game/play system or experience",
            "social_solo_na": "Not Applicable"
        },
        "Sequential vs. Simultaneous": {
            "turn_based": "Entirely Turn-based (i.e., Tic Tak Toe)",
            "step_based": "Follows a set of steps (i.e., Viticulture's dynamic turn ordering)",
            "turn_plus_anytime": "Turns are taken, but some actions can be taken at anytime (i.e., Pandemic)",
            "mostly_simultaneous": "Most actions can be taken at any time, but there are some phases (i.e., PvP death reset timer)",
            "simultaneous_entirely": "Entirely Simultaneous (i.e., race)",
            "seq_sim_undisclosed": "Undisclosed/Unkown, but the paper does include a game/play system or experience",
            "seq_sim_na": "Not Applicable"
        },
        "Synchronous vs. Asynchronous": {
            "sync_entirely": "Entirely Synchronous (i.e., RTS game)",
            "sync_mostly": "Mostly Synchronous with few asynchronous affordances (i.e., League of Legends)",
            "sync_async_equal": "Equal mix of synchronous and asynchronous affordances (i.e., World of Warcraft)",
            "async_mostly": "Mostly asynchronous with few synchronous affordances (i.e., Scrabble Go)",
            "async_entirely": "Entirely asynchronous (i.e., postage mail)",
            "sync_async_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "sync_async_na": "Not Applicable"
        },
        "Competitive vs. Collaborative": {
            "competitive_entirely": "Entirely Competitive (i.e., Spit card game)",
            "competitive_mostly": "Mostly Competitive, but sometimes collaboration is important (i.e., Forbidden Island)",
            "competitive_collab_mixed": "Mix of competitive and collaborative (i.e., Mario party 2 vs 2 mini games)",
            "collaborative_mostly": "Mostly Collaborative (i.e., Animal Crossing)",
            "collaborative_entirely": "Entirely Collaborative (i.e., Pandemic)",
            "comp_collab_undisclosed": "Undisclosed/Unkown, but the paper does include a game/play system or experience",
            "comp_collab_na": "Not Applicable"
        },
        "Symmetrical vs. Asymmetrical": {
            "symmetrical_entirely": "Entirely Symetrical (i.e., Tik tac toe)",
            "symmetrical_mostly": "Mostly Symetrical (i.e., Uno)",
            "symmetrical_asym_mixed": "Both Symetrical and Asymetrical (i.e., Pandemic—similar turn structure with different character abilities)",
            "asymmetrical_mostly": "Mostly Asymetrical (i.e., Tag)",
            "asymmetrical_entirely": "Entirely Asymetrical (i.e., Keep talking nobody explodes)",
            "sym_asym_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "sym_asym_na": "Not Applicable"
        },
        "Experiential Play Value Classification": {
            "play_sensory": "Sensory (i.e., kaleidoscope)",
            "play_fantasy": "Fantasy (i.e., role playing)",
            "play_construction": "Construction (i.e., Music, painting, building)",
            "play_challenge": "Challenge (Testing physical or mental abilities against others or self)",
            "play_value_undisclosed": "Undisclosed/Unkown, but the paper does include a game/play system or experience",
            "play_value_na": "Not Applicable"
        }
    },
    "second": {
        "Study Method": {
            "study_interview": "Interview",
            "study_workshop": "Workshop or design session",
            "study_field": "Field study",
            "study_usability": "Usability testing",
            "study_case": "Case study",
            "study_focus_group": "Focus group",
            "study_controlled_experiment": "Controlled experiment",
            "study_survey": "Survey",
            "study_telemetry": "Telemetry / Big data / CSCW",
            "study_secondary_analysis": "Secondary Analysis",
            "study_no_data": "No data collected",
            "study_other": "Other"
        },
        "Interview methodology (Only if Interview selected above)": {
            "interview_structured": "Structured interview",
            "interview_semi_structured": "Semi-structured interview",
            "interview_contextual": "Contextual inquiry",
            "interview_na": "Not applicable",
            "interview_other": "Other"
        },
        "Workshop methodology (Only if workshop selected above)": {
            "workshop_action_research": "Action research",
            "workshop_cooperative_dev": "Cooperative method development",
            "workshop_speculative_design": "Speculative design",
            "workshop_persona": "Persona",
            "workshop_scenario": "Scenario",
            "workshop_role_playing": "Role playing",
            "workshop_affinity_diagram": "Affinity diagram",
            "workshop_ideation": "Ideation",
            "workshop_user_journey": "User journey",
            "workshop_brainstormming": "Brainstormming",
            "workshop_bodystormming": "Bodystormming",
            "workshop_design_probe": "Design probe",
            "workshop_prototyping": "Prototyping",
            "workshop_mockup": "Mock-up",
            "workshop_sketching": "Sketching",
            "workshop_wireframing": "Wireframing",
            "workshop_card_sorting": "Card sorting",
            "workshop_storyboarding": "Storyboarding",
            "workshop_use_case_theater": "Use case theater",
            "workshop_object_theater": "Object theater",
            "workshop_na": "Not Applicable",
            "workshop_other": "Other"
        },
        "Field study methodology (Only if field study selected above)": {
            "field_autoethnography": "Autoethnography",
            "field_ethnography": "Ethnography",
            "field_diary": "Diary study",
            "field_cultural": "Cultural",
            "field_wizard_of_oz": "Wizard of Oz",
            "field_na": "Not Applicable",
            "field_other": "Other"
        },
        "Usability methodology (Only if usability evaluation selected above)": {
            "usability_exert": "Exert analysis",
            "usability_think_aloud": "Think aloud",
            "usability_cognitive_walkthrough": "Cognitive walkthrough",
            "usability_heuristic": "Heuristic analysis",
            "usability_na": "Not Applicable",
            "usability_other": "Other"
        },
        "Technology Modality": {
            "tech_mobile": "Mobile",
            "tech_tablet": "Tablet",
            "tech_wearable": "Wearable",
            "tech_iot": "IoT",
            "tech_assistive_device": "Assistive Device",
            "tech_robot": "Robot",
            "tech_tangible": "Tangible Interface",
            "tech_pc": "PC",
            "tech_vr": "Virtual Reality",
            "tech_ar": "Augmented Reality",
            "tech_none": "No Technology",
            "tech_other": "Other"
        },
        "Context": {
            "context_clinic": "Clinic",
            "context_public_space": "Public space (i.e., Bowling alley)",
            "context_home": "Home",
            "context_school": "School",
            "context_research_lab": "Research lab",
            "context_social_media": "Social media",
            "context_disability_space": "Disability community space (i.e., Day program)",
            "context_remote": "Remote / Zoom",
            "context_unknown": "Unknown",
            "context_na": "Not applicable",
            "context_other": "Other"
        }
    },
    "third": {
        "Community of focus": {
            "community_blv": "Blind or low vision (BLV)",
            "community_dhh": "Deaf or hard of hearing (DHH)",
            "community_autism": "Autism",
            "community_idd": "Intellectual or developmental disability (IDD)",
            "community_motor_physical": "Motor of physical impairment",
            "community_communication_speech": "Communication / Speech",
            "community_cognitive": "Cognitive impairment",
            "community_older_adult": "Older adult",
            "community_general_disability": "General disability or accessibility",
            "community_other": "Other"
        },
        "Participant Groups": {
            "participants_pwd": "People with disabilities",
            "participants_older_adults": "Older adults",
            "participants_caregivers": "Caregivers",
            "participants_specialists": "Specialists (e.g., therapists, teachers)",
            "participants_without_disabilities": "People without disabilities",
            "participants_none": "No user involvement",
            "participants_other": "Other"
        },
        "User involvement": {
            "involvement_participatory_no_disability": "Participatory design with stakeholders without disabilities",
            "involvement_participatory_disability": "Participatory design with stakeholders with disabilities",
            "involvement_evaluation_no_disability": "User evaluation with stakeholders without disabilities",
            "involvement_evaluation_disability": "User evaluation with stakeholders with disabilities",
            "involvement_none": "No representative user involvement",
            "involvement_na": "Not applicable"
        },
        "Use of proxies": {
            "proxies_yes": "Yes",
            "proxies_no": "No",
            "proxies_no_users": "No user involvement"
        },
        "Method of recruitment of participants": {
            "recruit_phone": "Phone",
            "recruit_mail": "Mail",
            "recruit_email": "Email",
            "recruit_convenience": "Convienience sampling",
            "recruit_snowball": "Snowball",
            "recruit_word_of_mouth": "Word of mouth",
            "recruit_flier": "Flier",
            "recruit_social_media": "Social Media",
            "recruit_clinic": "Clinic",
            "recruit_none": "No user involvement",
            "recruit_undisclosed": "Undisclosed",
            "recruit_other": "Other"
        },
        "Issue addressed": {
            "issue_independence": "Increasing independence",
            "issue_digital_access": "Increasing digital access",
            "issue_physical_access": "Increasing physical access",
            "issue_user_understanding": "Increasing understanding of users",
            "issue_communication": "Supporting communication",
            "issue_personal_informatics": "Personal informatics and changing behavior",
            "issue_education": "Education",
            "issue_enrichment": "Increasing opportunities for enrichment",
            "issue_other": "Other"
        },
        "Contribution type": {
            "contribution_empirical": "Empirical",
            "contribution_artifact": "Artifact",
            "contribution_methodological": "Methodological",
            "contribution_theoretical": "Theoretical",
            "contribution_dataset": "Dataset",
            "contribution_survey": "Survey"
        }
    }
};
var LOOKUP_CACHE = {};
var csvData = window.myModule ? window.myModule.filteredModuleData.sort((a, b) => a.Year - b.Year) : [];
var filteredDataTmp = [];
var GLOBAL_HASH_MAP = {};
var allFilters = {};
var currentTheme = "dark";
var categoryWiseTemp = {};
var resizeTimeout;
var currentTourInstance = null;
var isRowDropdownInitialized = !1;
var isPlotDropdownInitialized = !1;
var columnIdMap = {};
var columnNameMap = {};

function initializeColumnDropdown(headerKeys) {
    if (isRowDropdownInitialized) return;
    const dynamicValues = headerKeys.filter(k => k && !["DOI", "Study ID", "Title", "Lead author contact details"].includes(k)).map((name, index) => {
        const id = `col_${index}`;
        columnIdMap[id] = name;
        columnNameMap[name] = id;
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
        transition: 'scale',
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
    fixDropdownAccessibility($("#removeColumns"), "Data Table Row Filters")
}

function generateHashID(str) {
    if (!str) return "null";
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
    }
    return (hash >>> 0).toString(16)
}

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
const parseRangeInput = (input) => {
    if (!input) return null;
    return input.includes('-') ? input.split('-').map(Number) : input
};
const checkRange = (range, val) => {
    if (!val) return !1;
    return Array.isArray(range) ? (range[0] <= Number(val) && range[1] >= Number(val)) : String(range) === String(val)
};

function setDataFilters(value, args) {
    allFilters[args] = value;
    applyFilters()
}
const debouncedFilterExecution = debounce(() => {

    applyFilters()
}, 500);

function validateAndApply() {
    const inputs = document.querySelectorAll(".inputFilters input");
    let allValid = !0;
    inputs.forEach(input => {
        const field = input.closest('.field');
        const isValid = input.checkValidity();
        if (!isValid) {
            allValid = !1;
            field.classList.add('error')
        } else {
            field.classList.remove('error')
        }
    });
    if (allValid) {
        debouncedFilterExecution()
    }
}

function applyFilters(args) {
    if (args === "reset") {
        document.querySelector(".recordsStatus").innerHTML = `Records `;
        ["YearFilter", "PagesFilter", "DOIFilter", "titleFilter", "authorFilter", "NotesFilter"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = ""
        });
        $('.firstDropdown').dropdown("clear");
        $('.secondDropdown').dropdown("clear");
        $('.thirdDropdown').dropdown("clear");
        $('#removeColumns').dropdown("clear");
        allFilters = {};
        filteredDataTmp = csvData;
        categoryWiseTemp = {};
        $('.delete.icon').click();
        applyColumnFilter([]);
        renderTable(filteredDataTmp);
        return
    }
    let activeCriteria = {};
    let selectedTokens = Object.values(allFilters).flatMap(v => v ? v.split(",") : []);
    selectedTokens.forEach(token => {
        const meta = LOOKUP_CACHE[token];
        if (meta) {
            if (!activeCriteria[meta.col]) activeCriteria[meta.col] = [];
            activeCriteria[meta.col].push(meta.val)
        }
    });
    const authorVal = getVal("authorFilter");
    const titleVal = getVal("titleFilter");
    const notesVal = getVal("NotesFilter");
    const doiVal = getVal("DOIFilter");
    const yearVal = parseRangeInput(getVal("YearFilter", !1));
    const pagesVal = parseRangeInput(getVal("PagesFilter", !1));
    let filteredData = csvData.filter(item => {
        if (authorVal && (!item["Lead author contact details"] || !item["Lead author contact details"].toLowerCase().includes(authorVal))) return !1;
        if (titleVal && (!item.Title || !item.Title.toLowerCase().includes(titleVal))) return !1;
        if (notesVal && (!item["Notes (e.g., Why does the paper not fit the framework?)"] || !item["Notes (e.g., Why does the paper not fit the framework?)"].toLowerCase().includes(notesVal))) return !1;
        if (doiVal && (!item.DOI || !item.DOI.toLowerCase().includes(doiVal))) return !1;
        if (yearVal && !checkRange(yearVal, item.Year)) return !1;
        if (pagesVal && !checkRange(pagesVal, item.Pages)) return !1;
        return Object.keys(activeCriteria).every(col => {
            const criterionValue = String(activeCriteria[col] || "").toLowerCase().trim();
            if (!criterionValue) return !0;
            const rawValue = item[col];
            const rowValue = rawValue !== null && rawValue !== undefined ? String(rawValue).toLowerCase().trim() : "";
            return criterionValue.includes(rowValue)
        })
    });
    filteredDataTmp = filteredData;
    renderTable(filteredData);
    const isActive = filteredData.length < csvData.length;
    document.querySelector(".recordsStatus").innerHTML = `Records ${isActive ? '<a class="ui green empty circular label" title="Filters Active"></a>' : ''}`
}

function updateFilterState(changedVal, key, action) {
    let current = allFilters[key] ? allFilters[key].split(",") : [];
    if (action === "add") current.push(changedVal);
    else if (action = "nuke_all_filters") current = [];
    else current = current.filter(v => v !== changedVal);

    setDataFilters(current.join(","), key)
}

function animateOptions(viewType) {
    if (viewType === 'plot') {
        $('.plotOptionsDiv').addClass('expand');
        $('.plotFilterMultiSelect').removeClass('expand')
    } else if (viewType === 'plotFilter') {
        $('.plotFilterMultiSelect').addClass('expand');
        $('.plotOptionsDiv').removeClass('expand')
    }
}
const getDSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function Drawplot(PlotFilter) {
    const plotEl = document.querySelector("#plotIt");
    const errorEl = document.querySelector(".plot-error");
    errorEl.innerHTML = "";
    plotEl.style.display = "block";
    const STACK_CATEGORIES = ["People with disabilities", "Older adults", "Caregivers", "Specialists (e.g., therapists, teachers)", "People without disabilities", "No user involvement", "Other"];
    const ds = {
        bgPanel: getDSVar('--ds-bg-panel'),
        textPrimary: getDSVar('--ds-text-primary'),
        textSecondary: getDSVar('--ds-text-secondary'),
        borderSubtle: getDSVar('--ds-border-subtle'),
        palette: [getDSVar('--ds-chart-blue'), getDSVar('--ds-chart-teal'), getDSVar('--ds-chart-gold'), getDSVar('--ds-chart-orange'), getDSVar('--ds-chart-red'), getDSVar('--ds-chart-slate')]
    };
    const stackMap = {};
    filteredDataTmp.forEach(study => {
        const xVal = String(study[PlotFilter]).trim();
        if (!xVal) return;
        if (!stackMap[xVal]) {
            stackMap[xVal] = {};
            STACK_CATEGORIES.forEach(c => stackMap[xVal][c] = 0)
        }
        const groups = String(study["Participant Groups"] || "");
        STACK_CATEGORIES.forEach(c => {
            if (groups.includes(c)) stackMap[xVal][c]++
        })
    });
    const categories = Object.keys(stackMap).sort();
    const series = STACK_CATEGORIES.map((c, index) => {
        return {
            name: c,
            data: categories.map(l => stackMap[l][c] || 0),
            color: ds.palette[index % ds.palette.length]
        }
    }).filter(s => s.data.some(v => v > 0));
    updateAccessibleTable(categories, series, PlotFilter);
    if (series.length === 0) {
        plotEl.style.display = "none";
        errorEl.innerHTML = `<div class="mx-auto"><img src="../../media/undraw_no_data_re_kwbl.svg" class="error-svg" alt="No data"><h5>No Data</h5></div>`;
        return
    }
    Highcharts.chart('plotIt', {
        colors: ds.palette,
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
                style: {
                    color: ds.textSecondary
                },
                y: 20,
                align: 'center'
            }
        },
        title: {
            text: `Studies by ${PlotFilter}`,
            align: 'left',
            style: {
                color: ds.textPrimary,
                fontSize: '18px'
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
                    return `${point.series.name}, ${point.y}. Year ${point.category}.`
                }
            }
        },
        yAxis: {
            min: 0,
            gridLineColor: ds.borderSubtle,
            title: {
                text: 'No. of studies',
                style: {
                    color: ds.textSecondary
                }
            },
            labels: {
                style: {
                    color: ds.textSecondary
                }
            },
            stackLabels: {
                enabled: !0,
                style: {
                    fontWeight: 'bold',
                    color: ds.textPrimary,
                    textOutline: 'none'
                }
            }
        },
        legend: {
            align: 'left',
            verticalAlign: 'top',
            itemStyle: {
                color: ds.textSecondary,
                fontWeight: 'normal',
                fontSize: '12px'
            },
            itemHoverStyle: {
                color: ds.accent
            },
            itemHiddenStyle: {
                color: ds.textDisabled
            },
            keyboardNavigation: {
                enabled: !0
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                borderWidth: 1,
                borderColor: ds.bgPanel,
                borderRadius: 2,
                cursor: 'pointer',
                // point: {
                //     events: {
                //         mouseOver: function () {
                //             if (this.sonify) {
                //                 this.sonify()
                //             }
                //         }
                //     }
                // }
                point: {
                    events: {
                        click: function () {
                            // Ensure the sonification module is loaded and ready
                            if (this.sonify) {
                                this.sonify();
                            }
                        }
                    }
                }
            },
        },
        tooltip: {
            enabled: !0, shared: true,
            backgroundColor: ds.bgPanel,
            style: {
                color: ds.textPrimary
            },
            // headerFormat: '<b>{point.x}</b><br/>',
            // pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
        },
        series: series
    })
}

function updateAccessibleTable(finalUniqueX, highchartsSeries, PlotFilter) {
    const headerRow = document.getElementById("sr-table-header-row");
    const tableBody = document.getElementById("sr-table-body");
    const tableTitle = document.getElementById("sr-plot-title");
    if (!headerRow || !tableBody) return;
    if (tableTitle) {
        tableTitle.innerText = `Data table for Studies by ${PlotFilter}`
    }
    headerRow.innerHTML = `<th scope="col">${PlotFilter}</th>`;
    tableBody.innerHTML = "";
    highchartsSeries.forEach(series => {
        const th = document.createElement("th");
        th.setAttribute("scope", "col");
        th.innerText = series.name;
        headerRow.appendChild(th)
    });
    const fragment = document.createDocumentFragment();
    finalUniqueX.forEach((label, index) => {
        const tr = document.createElement("tr");
        tr.setAttribute("role", "row");
        tr.setAttribute("tabindex", "-1");
        let rowTotal = 0;
        let details = "";
        highchartsSeries.forEach(series => {
            const point = series.data[index];
            const val = (point && typeof point === 'object') ? point.y : point || 0;
            rowTotal += val;
            if (val > 0) {
                details += `${val} ${series.name}, `
            }
        });
        const overview = `Data for ${label}. Total studies: ${rowTotal}. Composition: ${details}`;
        tr.setAttribute("aria-label", overview);
        tr.innerHTML = `<th scope="row">${label}</th>`;
        highchartsSeries.forEach(series => {
            const point = series.data[index];
            const val = (point && typeof point === 'object') ? point.y : point || 0;
            tr.innerHTML += `<td>${val}</td>`
        });
        fragment.appendChild(tr)
    });
    tableBody.appendChild(fragment)
}

function getPlot(providedValue) {
    const val = providedValue || $('#plotFilter').dropdown('get value');
    const finalVal = typeof val === 'string' ? val.trim() : val;
    if (finalVal) {
        Drawplot(finalVal)
    } else { }
}

function renderTable(data, innerEdit) {
    const ui = document.querySelector(".secondUI");
    if (!innerEdit) {
        if (!ui.classList.contains("initialized")) {
            ui.classList.add("initialized");
            ui.innerHTML = "";
            data.forEach(row => {
                let divOuter = document.createElement("div");
                divOuter.className = "divOuter divOuterVisible";
                if (row["Study ID"]) divOuter.setAttribute("data-id", row["Study ID"]);
                Object.keys(row).forEach(key => {
                    if (!key.trim()) return;
                    let divInner = document.createElement("div");
                    divInner.className = "divInner";
                    let span1 = document.createElement("span");
                    span1.className = "spanLeft";
                    span1.textContent = key;
                    let span2 = document.createElement("span");
                    span2.className = "spanRight";
                    span2.textContent = row[key];
                    if (!span2.textContent.trim()) return;
                    if (["DOI", "Title", "Study ID"].includes(key)) {
                        divInner.classList.add("clickable-row", "selectable");
                        divInner.setAttribute("tabindex", "0");
                        divInner.setAttribute("role", "button");
                        divInner.setAttribute("aria-label", `View details for ${key}`);
                        const handler = (e) => {
                            if (e.type === 'click' || e.key === 'Enter') {
                                e.preventDefault();
                                populateAndShowStudyDetails(divInner)
                            }
                        };
                        divInner.addEventListener('click', handler);
                        divInner.addEventListener('keydown', handler)
                    }
                    divInner.appendChild(span1);
                    divInner.appendChild(span2);
                    divOuter.appendChild(divInner)
                });
                ui.appendChild(divOuter)
            })
        } else {
            const visibleIDs = new Set(data.map(d => d["Study ID"]));
            document.querySelectorAll(".divOuter").forEach(row => {
                const id = row.getAttribute("data-id");
                const isVisible = visibleIDs.has(id);
                row.classList.toggle("divOuterHidden", !isVisible);
                row.classList.toggle("divOuterVisible", isVisible);
                row.querySelectorAll('.divInner').forEach(inner => {
                    const colName = inner.querySelector('.spanLeft').textContent;
                    const isActive = categoryWiseTemp[colName] ? !0 : !1;
                    inner.classList.toggle("category-match", isActive)
                })
            })
        }
        document.querySelector(".currentRecords").innerHTML = data.length;
        const items = $(".secondUI .divOuterVisible");
        const perPage = 2;
        items.slice(perPage).hide();
        $('#pagination-container').pagination({
            items: items.length,
            itemsOnPage: perPage,
            prevText: "Previous",
            nextText: "Next",
            onPageClick: (pg) => items.hide().slice(perPage * (pg - 1), perPage * pg).show()
        });
        $("#pagination-container").pagination('selectPage', 1)
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
        const plotOptions = headers.filter(k => k && !["DOI", "Study ID", "Title"].includes(k)).map((k, index) => ({
            name: k,
            value: k,
            selected: index === 1
        }));
        $plotFilter.dropdown({
            values: plotOptions,
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
        fixDropdownAccessibility($("#plotFilter"), "Graph Visualization Controls")
    }
    Drawplot($plotFilter.dropdown('get value'));
    displaySpectrum()
}

function applyColumnFilter(values) {
    document.querySelectorAll(".secondUI .divInner").forEach(row => {
        const col = row.querySelector(".spanLeft").textContent;
        row.classList.toggle("innerRow-hidden", values.includes(col))
    })
}

function displaySpectrum(param = 20) {

    const getDSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const errors = document.querySelectorAll(".spectrum-error");
    const rows = document.querySelectorAll(".spectrumRow");
    const ds = {
        accent: getDSVar('--ds-accent-primary'),
        bgPanel: getDSVar('--ds-bg-panel'),
        textPrimary: getDSVar('--ds-text-primary'),
        focusRing: getDSVar('--ds-focus-ring')
    };
    rows.forEach((r, i) => {
        r.style.display = "flex";
        errors[i].style.display = "none";
        if (filteredDataTmp.length === 0) {
            errors[i].style.display = "flex";
            errors[i].innerHTML = `<div class="mx-auto"><img src="../../media/undraw_no_data_re_kwbl.svg" class="error-svg" alt="No data available"><h5>No Data</h5></div>`;
            r.style.display = "none"
        }
    });
    spectrumDataTemp = {};
    const dims = ["Fun-First vs. Utility-First (Initial Design Intention)", "Play vs. Game", "Social vs. Solo", "Competitive vs. Collaborative", "Skill vs. Chance", "Symmetrical vs. Asymmetrical", "Sequential vs. Simultaneous", "Synchronous vs. Asynchronous"];
    dims.forEach(d => spectrumDataTemp[d] = {});
    filteredDataTmp.forEach(row => {
        dims.forEach(dim => {
            let val = row[dim];
            if (val && val.trim() && val !== 'Not Applicable') {
                let clean = val.replace(/\s*\(i\.e\.\s*.*\)$/i, "").trim().replace(/Symetrical/gi, "Symmetrical").replace(/Asymetrical/gi, "Asymmetrical").replace(/asychronous/gi, "asynchronous").replace(/time, but/gi, "time but");
                if (!spectrumDataTemp[dim][clean]) spectrumDataTemp[dim][clean] = [];
                spectrumDataTemp[dim][clean].push(row['Study ID'])
            }
        })
    });
    document.querySelectorAll('[data-column]').forEach(el => {
        el.style.boxShadow = "none";
        el.onclick = null;
        el.onkeydown = null;
        el.removeAttribute("data-count");
        el.setAttribute("tabindex", "-1");
        const pt = el.querySelector('.data-point');
        if (pt) pt.remove();
        $(el).popup('destroy')
    });
    Object.entries(spectrumDataTemp).forEach(([cat, obj]) => {
        Object.entries(obj).forEach(([key, ids]) => {
            document.querySelectorAll(`[data-column="${key}"]`).forEach(el => {
                const count = ids.length;
                const total = filteredDataTmp.length;
                const intensity = (count / total) * param;
                const shadowBase = currentTheme === "dark" ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)';
                const shadow = `inset 0 0 10px 100px ${shadowBase}`;
                const boxShadow = intensity ? Array(Math.ceil(intensity)).fill(shadow).join(', ') : 'none';
                // Apply Visual Styles
                // Apply Visual Styles
                if (el.closest('.type-1') && intensity) {
                    let pt = el.querySelector('.data-point') || document.createElement("div");
                    pt.className = "data-point";
                    pt.style.boxShadow = boxShadow;

                    // The calculated pixel size
                    const dotSize = Math.min(12 + (intensity * 1.5), 35);
                    pt.style.width = `${dotSize}px`;
                    pt.style.height = `${dotSize}px`;

                    // 🎯 THE NEW RESPONSIVE LOCKS:
                    // Forces the dot to never grow larger than 90% of its parent cell
                    pt.style.maxWidth = "90%";
                    pt.style.maxHeight = "90%";

                    // Keeps it perfectly round
                    pt.style.borderRadius = "50%";

                    el.appendChild(pt);
                } else {
                    el.style.boxShadow = boxShadow;
                }
                el.setAttribute("data-count", count);
                el.setAttribute("tabindex", "0");
                el.setAttribute("role", "button");
                el.setAttribute("aria-label", `${key}: ${count} studies`);
                el.onclick = () => {
                    const modal = document.querySelector(".spectrumCategoryData");
                    if (modal) {
                        modal.innerHTML = `
    <div class="ui middle aligned selection list" role="listbox">
        ${ids.map(id => `<div class="item study-jump-item selectable"
role="option"
tabindex="0"
onclick="jumpToStudyFromModal('${id}')"
onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); jumpToStudyFromModal('${id}'); }"
style="cursor: pointer; padding: 10px !important;"
aria-label="Jump to study ${id}"><i class="ph ph-arrow-square-out"></i><div class="content"><div class="header">Study ${id}</div><div class="description">Click or press Enter to view in Data Tab</div></div></div>`).join("")}
    </div>`
                    }
                    document.querySelector("#spectrumDataLabel").innerHTML = `Studies under ${key}`;
                    $("#spectrumData").modal('show')
                };
                el.onkeydown = (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        el.click()
                    }
                };
                $(el).popup({
                    html: `<div style="color: ${ds.textPrimary}"><h6>${key}</h6><p>Count: ${count}</p></div>`,
                    position: 'top center',
                    variation: 'inverted',
                    hoverable: !0
                })
            })
        })
    })
}

function jumpToStudyFromModal(studyId) {
    $("#spectrumData").modal('hide');
    const studyIndex = filteredDataTmp.findIndex(s => s["Study ID"] === studyId);
    if (studyIndex !== -1) {
        const perPage = 2;
        const targetPage = Math.floor(studyIndex / perPage) + 1;
        const dataTabTrigger = document.querySelector('#Show-data');
        if (dataTabTrigger) dataTabTrigger.click();
        $("#pagination-container").pagination('selectPage', targetPage);
        setTimeout(() => {
            const $targetRow = $(`.divOuter[data-id="${studyId}"]`);
            if ($targetRow.length) {
                $targetRow.addClass('jump-highlight');
                $targetRow[0].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
                $targetRow.attr('tabindex', '0').focus();
                setTimeout(() => $targetRow.removeClass('jump-highlight'), 3000)
            }
        }, 400)
    }
}

function changeSpectrumIntensity(e) {
    displaySpectrum(e.target.value);

}

function exportFilteredData() {
    if (!filteredDataTmp.length) return alert("No data to export.");
    const settings = {
        ...allFilters
    };
    ["YearFilter", "PagesFilter", "DOIFilter", "titleFilter", "authorFilter"].forEach(id => {
        const val = document.getElementById(id) ? document.getElementById(id).value : "";
        if (val) settings[id] = val
    });
    const plotVal = $('#plotFilter').dropdown('get value');

    if (plotVal) settings.plotFilter = plotVal;
    const removedColsVal = $('#removeColumns').dropdown('get value');

    if (removedColsVal) settings.removeColumns = removedColsVal;
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
        window.allFilters = imported;
        ["YearFilter", "PagesFilter", "DOIFilter", "titleFilter", "authorFilter"].forEach(id => {
            if (imported[id]) document.getElementById(id).value = imported[id]
        });
        Object.keys(imported).forEach(k => {
            if ($(`.${k}Dropdown`).length > 0) {
                $(`.${k}Dropdown`).dropdown('set exactly', imported[k].split(","))
            }
        });
        if (imported.plotFilter) {
            $('#plotFilter').dropdown('set selected', imported.plotFilter)
        }
        if (imported.removeColumns) {
            $('#removeColumns').dropdown('set exactly', imported.removeColumns.split(','))
        }
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

function populateAndShowStudyDetails(el) {
    const id = el.closest('.divOuter').getAttribute('data-id');
    const study = csvData.find(i => i["Study ID"] === id);
    if (study) {
        $('#abstractModalHeader').text(`Study Details: ${id}`);
        $('#abstractModalContent').html(`
            <div class="ui relaxed divided list">
                <div class="item"><div class="header">Title</div>${study["Title"]}</div>
                <div class="item"><div class="header">Authors</div>${study["Lead author contact details"]}</div>
                <div class="item"><div class="header">DOI</div><a href="https://doi.org/${study["DOI"]}" target="_blank">${study["DOI"]}</a></div>
            </div>
            <div class="ui divider"></div>
            <div class="ui segment">${study["Abstract"] || "No abstract available."}</div>
        `);
        $('#studyAbstractModal').modal('show')
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const willBeDark = currentTheme !== 'dark';
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
        palette: [getDSVar('--ds-chart-blue'), getDSVar('--ds-chart-teal'), getDSVar('--ds-chart-gold'), getDSVar('--ds-chart-orange'), getDSVar('--ds-chart-red'), getDSVar('--ds-chart-slate')]
    };
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
    let labelName = customLabel || $dropdown.attr('id') || $dropdown.attr('data-name') || "options";
    labelName = labelName.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase().trim();
    $searchInput.attr({
        'aria-label': `${labelName}. Has Popup.`,
    })
}

function doInitialization() {
    const trigger = document.querySelector('.hover-nav-trigger');
    const container = document.querySelector('.hover-nav-container');
    const openMenu = () => trigger.setAttribute('aria-expanded', 'true');
    const closeMenu = () => trigger.setAttribute('aria-expanded', 'false');
    container.addEventListener('mouseenter', openMenu);
    container.addEventListener('mouseleave', closeMenu);
    trigger.addEventListener('focus', openMenu);

    document.getElementById('type1Intensity').value = 20;
    document.getElementById('type2Intensity').value = 40;
    container.addEventListener('focusout', (e) => {
        if (!container.contains(e.relatedTarget)) {
            closeMenu()
        }
    });
    filteredDataTmp = csvData;
    const dropdownOptions = (type) => ({
        clearable: !0,
        useLabels: !1,
        allowAdditions: !1,
        transition: 'scale',
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
            $(this).find('input.search').focus()

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
                $(this).find('input.search').focus();
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
    fixDropdownAccessibility($(".firstDropdown"), "Select PHT Lab Framework tags");
    fixDropdownAccessibility($(".secondDropdown"), "Select Characteristics of Included Studies tags");
    fixDropdownAccessibility($(".thirdDropdown"), "Select Participants tags");
    document.querySelector(".totalRecords").innerHTML = csvData.length;
    renderTable(csvData);
    setTimeout(getPlot, 100);
    const hasSeenTour = localStorage.getItem('pht_lab_tour_seen');
    if (hasSeenTour === null || hasSeenTour === 'false') {
        startGuidedTour()
    }
}
document.addEventListener("DOMContentLoaded", () => {
    buildLookupCache();
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
    $('.ui.accordion .title').on('keydown', function (e) {
        if (e.which === 13 || e.which === 32) {
            e.preventDefault();
            $(this).click();
            const isOpen = $(this).hasClass('active');
            $(this).attr('aria-expanded', !isOpen)
        }
    });
    $('.ui.accordion').accordion({
        onClose: function () {
            $(this).find('input').attr('tabindex', '-1')
        },
        onOpen: function () {
            $(this).find('input').attr('tabindex', '0')
        }
    });
    const tabNames = {
        "Show-plot": "Plot",
        "Show-data": "Data",
        "ratings-grid": "Ratings",
        "Show-grid": "Spectrum",
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
            if (tabPath === 'Show-plot' && Highcharts.charts[0]) {
                Highcharts.charts[0].reflow()
            }
        }
    });
    $('#show-plot-pane .menu .item').tab({
        history: !1,
        onVisible: function (tabPath) {
            $('#show-plot-pane .menu .item').attr('aria-selected', 'false');
            $(`#show-plot-pane .menu .item[data-tab="${tabPath}"]`).attr('aria-selected', 'true');
            if (tabPath === 'Show-plot/visual') {
                Highcharts.charts.forEach(chart => {
                    if (chart) chart.reflow();
                })
            }
        }
    });
    const importBtn = document.getElementById('import-data-button');
    if (importBtn) importBtn.addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', handleDataImport);
    ["type1Intensity", "type2Intensity"].forEach(id => document.getElementById(id).addEventListener("input", changeSpectrumIntensity));
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(getPlot, 100)
    });
    const tabEl = document.querySelector('button[data-bs-toggle="tab"][data-bs-target="#Show-plot-pane"]');
    if (tabEl) tabEl.addEventListener('shown.bs.tab', () => Drawplot($plotFilter.dropdown('get value')));
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
    })
});

function handleTourNav(selector, dir) {
    if (selector) $(selector).trigger('click');
    $('.ui.modal').modal('hide');
    if (currentTourInstance) dir === 'next' ? currentTourInstance.next() : currentTourInstance.back();
}

function clickButtonAndAdvance(element) {
    if (element && $(element).length > 0) {
        $(element).trigger('click')
    }
    $('.ui.modal').modal('hide');
    if (currentTourInstance) currentTourInstance.next();
}

function clickButtonAndFallback(element) {
    if (element && $(element).length > 0) {
        $(element).trigger('click')
    }
    $('.ui.modal').modal('hide');
    if (currentTourInstance) currentTourInstance.back();
}

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
        text: 'Switch between <strong>Plot, Data Table, Ratings,</strong> and <strong>Spectrum</strong> views here. All visualizations update instantly based on your filters.',
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
$('.ui.tabular.menu .item').on('keydown', function (e) {
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
$('#import-data-button').on('keydown', function (e) {
    if (e.which === 13 || e.which === 32) {
        $('#import-file-input').trigger('click')
    }
});
const unlockAudio = () => {
    if (window.hoverSound && hoverSound.context && hoverSound.context.state === 'suspended') {
        hoverSound.context.resume().then(() => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio)
        })
    }
};
var lastFocusedOption = null;
document.addEventListener('focusin', () => {
    const activeEl = document.activeElement;
    if (activeEl.classList.contains('mbsc-scroller-wheel-item')) {
        lastFocusedOption = activeEl
    }
});
document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio)
