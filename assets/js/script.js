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
// ---------------------------------------------------------------------------
// Data-matching helpers
// The Covidence export contains spelling/spacing variants of the same answer
// ("Symetrical", "asychronous", "asynchrounous", "Unkown", double spaces) and
// stores multi-select answers as one string separated by ";". Every comparison
// between a filter/grid label and a data value goes through canon() so those
// variants compare equal, and through splitValues() so multi-select answers match.
// ---------------------------------------------------------------------------
const SPELLING_FIXES = [
    [/asymetrical/g, 'asymmetrical'],
    [/symetrical/g, 'symmetrical'],
    [/asy(?:ch|cn)ronous|asynchrounous/g, 'asynchronous'],
    [/unkown/g, 'unknown'],
    [/time, but/g, 'time but']
];

function canon(label) {
    let s = String(label ?? '').toLowerCase()
        .replace(/\s*\((?:i\.e\.|e\.g\.)[^)]*\)\s*$/, '') // drop trailing "(i.e., example)"
        .replace(/\s+/g, ' ')
        .trim();
    SPELLING_FIXES.forEach(([re, to]) => { s = s.replace(re, to) });
    return s
}

function splitValues(raw) {
    return String(raw ?? '').split(';').map(v => v.trim()).filter(Boolean)
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// A row matches a column criterion when ANY of its ";"-separated answers equals
// ANY selected label. Free-text "Other: ..." answers count as "Other".
function rowMatchesLabels(rawValue, wantedCanon) {
    return splitValues(rawValue).some(v => {
        const c = canon(v);
        return wantedCanon.includes(c) || (c.startsWith('other') && wantedCanon.includes('other'))
    })
}

// ---------------------------------------------------------------------------
// DOIs
// The export stores DOIs inconsistently: "10.1145/…", "https://doi.org/10.1145/…"
// (15 studies) and one corrupted "http://dx.doi.org/10.1145/ 10.1145/…".
// Keep the bare DOI ("10.xxxx/…") and build links from it, so every link goes
// straight to the paper (the old modal produced https://doi.org/https://doi.org/…).
// ---------------------------------------------------------------------------
function normalizeDoi(raw) {
    const matches = String(raw ?? '').match(/10\.\d{4,9}\/[^\s"<>]+/g);
    return matches ? matches[matches.length - 1].replace(/[.,;)]+$/, '') : ''
}

function doiUrl(doi) {
    return doi ? 'https://doi.org/' + doi.split('/').map(encodeURIComponent).join('/') : ''
}

// ---------------------------------------------------------------------------
// "Search all fields" — one box that searches every column of every study.
//   blind game            → studies containing BOTH words (any field, any case)
//   "virtual reality"     → exact phrase
//   -autism               → exclude studies containing the word
//   blind OR deaf         → either word
// Accents are ignored (Jesús = Jesus), words match prefixes/plurals (game → games),
// and common accessibility abbreviations are expanded (VR, BLV, DHH, IDD, AR…).
// Results are ranked: title matches first, then authors/ID, then framework ratings.
// ---------------------------------------------------------------------------
const SEARCH_SYNONYMS = {
    'vr': ['virtual reality'], 'virtual reality': ['vr'],
    'ar': ['augmented reality'], 'augmented reality': ['ar'],
    'blv': ['blind', 'low vision', 'visually impaired', 'visual impairment'],
    'blind': ['blv', 'visually impaired', 'visual impairment'],
    'low vision': ['blv'], 'visually impaired': ['blind', 'blv'],
    'dhh': ['deaf', 'hard of hearing'], 'deaf': ['dhh', 'hard of hearing'], 'hard of hearing': ['dhh', 'deaf'],
    'idd': ['intellectual', 'developmental disab'], 'intellectual': ['idd'],
    'asd': ['autism', 'autistic'], 'autism': ['autistic', 'asd'], 'autistic': ['autism', 'asd'],
    'older adult': ['elderly', 'older people', 'aging', 'ageing'], 'elderly': ['older adult'],
    'wheelchair': ['motor', 'mobility'], 'motor': ['physical impairment', 'mobility'],
    'aac': ['augmentative', 'communication'], 'speech': ['communication'],
    'exergame': ['exergam', 'exercise game', 'physical activity'],
    'serious game': ['serious gam', 'educational game'], 'tangible': ['tangible interface'],
    'haptic': ['haptics', 'vibrotactile', 'tactile'], 'audio game': ['audio gam', 'sound-based', 'audio-based']
};

function foldText(s) {
    return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ')
}

// Parse the query into groups of alternatives (AND between groups, OR inside).
function parseSearchQuery(q) {
    const tokens = [];
    const re = /(-?)"([^"]+)"|(\S+)/g;
    let m;
    const src = foldText(q);
    while ((m = re.exec(src))) {
        if (m[2] !== undefined) tokens.push({ text: m[2].trim(), neg: m[1] === '-' });
        else if (m[3]) tokens.push({ text: m[3].replace(/^-/, ''), neg: m[3].startsWith('-') && m[3].length > 1 });
    }
    // Treat known multi-word terms as phrases even without quotes
    // ("virtual reality" -> also finds "VR"; "hard of hearing" -> also "DHH").
    for (let i = 0; i < tokens.length; i++) {
        for (const len of [3, 2]) {
            const slice = tokens.slice(i, i + len);
            if (slice.length === len && slice.every(t => !t.neg)) {
                const phrase = slice.map(t => t.text).join(' ');
                if (SEARCH_SYNONYMS[phrase]) { tokens.splice(i, len, { text: phrase, neg: !1 }); break }
            }
        }
    }
    const groups = [];
    const negatives = [];
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (!t.text || t.text === 'or') continue;
        if (t.neg) { negatives.push(t.text); continue }
        const alts = [t.text, ...(SEARCH_SYNONYMS[t.text] || [])];
        if (groups.length && tokens[i - 1] && tokens[i - 1].text === 'or' && !tokens[i - 1].neg) {
            groups[groups.length - 1].push(...alts)
        } else {
            groups.push(alts)
        }
    }
    return { groups, negatives, terms: groups.flat() }
}

// Field weights for ranking.
const SEARCH_WEIGHTS = { 'Title': 6, 'Study ID': 4, 'Lead author contact details': 4, 'DOI': 3, 'Notes (e.g., Why does the paper not fit the framework?)': 2 };

function buildSearchIndex(rows) {
    rows.forEach(row => {
        // Index values only: column names like "Play vs. Game" would otherwise make
        // "game" match every study.
        const fields = Object.keys(row).filter(k => String(row[k] ?? '').trim() !== '')
            .map(k => ({ key: k, text: foldText(row[k]), weight: SEARCH_WEIGHTS[k] || 1 }));
        Object.defineProperty(row, '__search', { value: { all: fields.map(f => f.text).join(' | '), fields }, configurable: !0 })
    })
}

// Short terms (≤ 3 chars, e.g. "vr", "ar") must match a whole word so "ar"
// doesn't hit every "game" or "research"; longer terms match word starts.
function termRegex(term) {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return term.length <= 3 ? new RegExp('(^|[^a-z0-9])' + esc + '($|[^a-z0-9])') : new RegExp('(^|[^a-z0-9])' + esc)
}

// Returns 0 when the row doesn't match, otherwise a relevance score > 0.
function searchScore(row, parsed) {
    const idx = row.__search;
    if (!idx) return 0;
    for (const n of parsed.negatives) if (termRegex(n).test(idx.all)) return 0;
    let score = 0;
    for (const group of parsed.groups) {
        let best = 0, hits = 0;
        for (const alt of group) {
            const re = termRegex(alt);
            for (const f of idx.fields) {
                if (re.test(f.text)) {
                    hits++;
                    best = Math.max(best, f.weight + (alt.includes(' ') ? 1 : 0))
                }
            }
        }
        if (!best) return 0;
        // Best field decides the rank; matching in more fields breaks ties.
        score += best + Math.min(hits, 10) * 0.05
    }
    return score
}

const PER_PAGE = 5;
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
var GLOBAL_HASH_MAP = {};
var allFilters = {};
var currentTheme = "light";
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
    fixDropdownAccessibility($("#removeColumns"), "Hide fields in the study cards")
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
        categoryWiseTemp = {};
        applyColumnFilter([]);
        renderTable(filteredDataTmp);
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
        return Object.keys(activeCriteria).every(col => rowMatchesLabels(item[col], activeCriteria[col]))
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
    const isActive = filteredData.length < csvData.length;
    document.querySelector(".recordsStatus").innerHTML = `Records ${isActive ? '<span class="ui green empty circular label" role="img" aria-label="Filters active"></span>' : ''}`;
    announceResults()
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
const getDSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

var plotState = { chart: null, totals: [], xLabel: '' };

function Drawplot(PlotFilter) {
    if (!PlotFilter) return;
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
        // Viridis (perceptually uniform, colour-blind safe), 7 colours for 7 series
        palette: chartPalette()
    };
    const stackMap = {};
    const studyCount = {}; // distinct studies per bar (segments can double-count, see subtitle)
    const groupKey = {};
    STACK_CATEGORIES.forEach(c => groupKey[canon(c)] = c);
    filteredDataTmp.forEach(study => {
        // Multi-select answers ("Interview; Survey") count toward each answer's bar
        // instead of creating one bar per unique combination (73 bars for Study Method).
        const xVals = [...new Set(splitValues(study[PlotFilter]).map(v => v.replace(/\s*\((?:i\.e\.|e\.g\.)[^)]*\)\s*$/, '')))];
        const groups = [...new Set(splitValues(study["Participant Groups"]).map(g => groupKey[canon(g)] || "Other"))];
        xVals.forEach(xVal => {
            if (!stackMap[xVal]) {
                stackMap[xVal] = {};
                STACK_CATEGORIES.forEach(c => stackMap[xVal][c] = 0);
                studyCount[xVal] = 0
            }
            studyCount[xVal]++;
            groups.forEach(g => stackMap[xVal][g]++)
        })
    });
    const keys = Object.keys(stackMap);
    const allNumeric = keys.length && keys.every(k => k !== '' && !isNaN(Number(k)));
    const categories = allNumeric ? keys.sort((a, b) => Number(a) - Number(b)) : keys.sort((a, b) => a.localeCompare(b));
    const studyTotals = categories.map(c => studyCount[c]);
    const series = STACK_CATEGORIES.map((c, index) => {
        return {
            name: c,
            data: categories.map(l => stackMap[l][c] || 0),
            color: ds.palette[index % ds.palette.length]
        }
    }).filter(s => s.data.some(v => v > 0));
    updateAccessibleTable(categories, series, PlotFilter, studyTotals);
    if (series.length === 0) {
        plotEl.style.display = "none";
        errorEl.innerHTML = `<div class="mx-auto"><img src="media/undraw_no_data_re_kwbl.svg" class="error-svg" alt="No data"><h5>No Data</h5></div>`;
        return
    }
    plotState.totals = studyTotals;
    plotState.xLabel = PlotFilter === 'Year' ? 'Year' : PlotFilter.replace(/\s*\(.*\)\s*:?$/, '');
    series.forEach(s => s.id = s.name);
    // Re-use the existing chart: rebuilding it on every filter click took
    // 0.4–0.85 s and leaked one Highcharts instance per click.
    if (plotState.chart && plotState.chart.series) {
        plotState.chart.update({
            title: { text: `Studies by ${escapeHtml(PlotFilter)}` },
            xAxis: { categories: categories },
            series: series
        }, !1, !0);
        plotState.chart.reflow();
        plotState.chart.redraw({ duration: 200 });
        return
    }
    plotState.chart = Highcharts.chart('plotIt', {
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
            text: `Studies by ${escapeHtml(PlotFilter)}`,
            align: 'left',
            style: {
                color: ds.textPrimary,
                fontSize: '18px'
            }
        },
        subtitle: {
            text: 'Numbers above bars = distinct studies. Colours = participant groups; a study with several groups appears in several colours, and multi-answer studies count toward each answer.',
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
                    return `${plotState.xLabel} ${point.category}: ${point.series.name}, ${point.y} studies. ${plotState.totals[point.index]} distinct studies in this bar.`
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
                // Show distinct studies, not the segment sum (which double-counts
                // studies with several participant groups).
                formatter: function () {
                    return plotState.totals[this.x]
                },
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
    const valueOf = (point) => (point && typeof point === 'object') ? point.y : point || 0;
    tableBody.innerHTML = finalUniqueX.map((label, index) => {
        const vals = highchartsSeries.map(series => valueOf(series.data[index]));
        const distinct = studyTotals[index] ?? vals.reduce((a, b) => a + b, 0);
        return `<tr><th scope="row">${escapeHtml(label)}</th>${vals.map(v => `<td>${v}</td>`).join('')}<td><strong>${distinct}</strong></td></tr>`
    }).join('')
}

function getPlot(providedValue) {
    const val = providedValue || $('#plotFilter').dropdown('get value');
    const finalVal = typeof val === 'string' ? val.trim() : val;
    if (finalVal) {
        Drawplot(finalVal)
    } else { }
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

function renderCardsPage(page) {
    const ui = document.querySelector(".secondUI");
    const pages = Math.max(1, Math.ceil(filteredDataTmp.length / PER_PAGE));
    currentPage = Math.min(Math.max(1, page), pages);
    const slice = filteredDataTmp.slice(PER_PAGE * (currentPage - 1), PER_PAGE * currentPage);
    ui.replaceChildren(...slice.map(buildStudyCard));
    if (!slice.length) ui.innerHTML = '<p class="no-results" role="status">No studies match these filters.</p>'
}

function renderTable(data, innerEdit) {
    if (!innerEdit) {
        document.querySelector(".currentRecords").textContent = data.length;
        renderCardsPage(1);
        $('#pagination-container').pagination({
            items: data.length,
            itemsOnPage: PER_PAGE,
            prevText: "Previous",
            nextText: "Next",
            onPageClick: (pg) => renderCardsPage(pg)
        })
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
        fixDropdownAccessibility($("#plotFilter"), "Chart: group studies by")
    }
    // Charts are expensive; only redraw the view the user can actually see.
    // Hidden views are marked dirty and redrawn when their tab is opened.
    viewsDirty.plot = !0;
    viewsDirty.grid = !0;
    renderVisibleViews()
}

var viewsDirty = { plot: !0, grid: !0 };

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
}

function applyColumnFilter(values) {
    hiddenColumns = values.slice();
    document.querySelectorAll(".secondUI .divInner").forEach(row => {
        const col = row.querySelector(".spanLeft").textContent;
        row.classList.toggle("innerRow-hidden", hiddenColumns.includes(col))
    })
}

// Ratings (type-1, dots) and Spectrum (type-2, heat) grids.
// Each grid cell carries data-column="<answer label>" inside a row with
// data-row="<framework dimension>". Cells are matched to data through canon(),
// so spelling variants in the export ("Symetrical", "asynchrounous") still land
// in the right cell. Previously the clean-up regex turned "Asymetrical" into
// "ASymmetrical", which silently dropped 53 studies from the Symmetrical row.
const SPECTRUM_DIMS = ["Fun-First vs. Utility-First (Initial Design Intention)", "Play vs. Game", "Social vs. Solo", "Competitive vs. Collaborative", "Skill vs. Chance", "Symmetrical vs. Asymmetrical", "Sequential vs. Simultaneous", "Synchronous vs. Asynchronous"];

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
            errors[i].innerHTML = `<div class="mx-auto"><img src="media/undraw_no_data_re_kwbl.svg" class="error-svg" alt="No data available"><h5>No Data</h5></div>`;
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
            const uids = (buckets[dim] && buckets[dim][canon(label)]) || [];
            const count = uids.length;
            const pct = total ? Math.round(100 * count / total) : 0;
            el.setAttribute("data-label", label);
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
    updateSpectrumLegends()
}

// --- Viridis (matplotlib/R viridis) -------------------------------------------
// 9 evenly spaced stops of viridis(9); linear interpolation between them.
const VIRIDIS_STOPS = ['#440154', '#472D7B', '#3B528B', '#2C728E', '#21908C', '#27AD81', '#5DC863', '#AADC32', '#FDE725']
    .map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));

function viridisRgb(t) {
    const x = Math.max(0, Math.min(1, t)) * (VIRIDIS_STOPS.length - 1);
    const i = Math.min(Math.floor(x), VIRIDIS_STOPS.length - 2);
    const f = x - i;
    return VIRIDIS_STOPS[i].map((c, k) => Math.round(c + (VIRIDIS_STOPS[i + 1][k] - c) * f))
}

// Categorical chart colours sampled from viridis, as in R's viridis(7).
// Dark theme uses viridis(7, begin = 0.25) so the darkest purple doesn't vanish
// into the dark background.
function chartPalette() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const begin = dark ? 0.25 : 0, end = 1, n = 7;
    return Array.from({ length: n }, (_, i) => {
        const rgb = viridisRgb(begin + (end - begin) * i / (n - 1));
        return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('')
    })
}

function relLuminance([r, g, b]) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function bestTextColor(rgb) {
    const L = relLuminance(rgb);
    const vsWhite = 1.05 / (L + 0.05), vsBlack = (L + 0.05) / 0.05;
    return vsWhite >= vsBlack ? '#ffffff' : '#000000'
}

function cssColorToRgb(color) {
    const probe = document.createElement('span');
    probe.style.color = color;
    document.body.appendChild(probe);
    const m = getComputedStyle(probe).color.match(/\d+(\.\d+)?/g) || [255, 255, 255];
    probe.remove();
    return m.slice(0, 3).map(Number)
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
        tip.innerHTML = `<strong>${escapeHtml(cell.getAttribute('data-label'))}</strong><br>${n} of ${filteredDataTmp.length} studies (${cell.getAttribute('data-pct')}%)${n > 0 ? '<br><em>Click or press Enter to list them</em>' : ''}`;
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
    const idx = filteredDataTmp.findIndex(r => r.__uid === uid);
    if (idx === -1) return;
    const dataTabTrigger = document.querySelector('#Show-data');
    if (dataTabTrigger) dataTabTrigger.click();
    const page = Math.floor(idx / PER_PAGE) + 1;
    $("#pagination-container").pagination('selectPage', page);
    if (currentPage !== page) renderCardsPage(page);
    setTimeout(() => {
        const $target = $(`.divOuter[data-uid="${uid}"]`);
        if (!$target.length) return;
        $target.addClass('jump-highlight');
        $target[0].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
        $target.attr('tabindex', '-1').focus();
        setTimeout(() => $target.removeClass('jump-highlight'), 3000)
    }, 400)
}

function changeSpectrumIntensity() {
    displaySpectrum()
}


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

function populateAndShowStudyDetails(el) {
    // Look up by the unique row key: "Study ID" repeats (e.g. two "Zhang 2023"
    // papers), so find-by-ID opened the wrong paper for the second of each pair.
    const uid = el.closest('.divOuter').getAttribute('data-uid');
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
    const openMenu = () => trigger.setAttribute('aria-expanded', 'true');
    const closeMenu = () => trigger.setAttribute('aria-expanded', 'false');
    container.addEventListener('mouseenter', openMenu);
    container.addEventListener('mouseleave', closeMenu);
    trigger.addEventListener('focus', openMenu);

    document.getElementById('type1Intensity').value = 20;
    document.getElementById('type2Intensity').value = 20;
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
    fixDropdownAccessibility($(".firstDropdown"), "Filter by PHT Lab framework");
    fixDropdownAccessibility($(".secondDropdown"), "Filter by study characteristics");
    fixDropdownAccessibility($(".thirdDropdown"), "Filter by participants");
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
            // Draw whatever became stale while this tab was hidden.
            renderVisibleViews(tabPath);
            if (tabPath === 'Show-plot' && plotState.chart) plotState.chart.reflow();
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
