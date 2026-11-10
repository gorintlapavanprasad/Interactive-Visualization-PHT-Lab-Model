// core.js — Framework definitions and pure helpers: answer matching, DOI handling and the all-fields search engine. No DOM access; also used by tools/audit-data.js and tools/build-data.js.
// Part of the PHT Lab dashboard; loaded as a plain script by index.html (see the order there).

const FILTER_SPECS = {
    "first": {
        "Fun-First vs. Utility-First (Initial Design Intention)": {
            "fun_totally": "Totally fun first (i.e., Entertainment game reappropriated)",
            "fun_mostly": "Mostly fun first (i.e., Design workshop with disabled stakeholders)",
            "fun_utility_both": "Both fun and utility first (i.e., Design workshop with diverse stakeholders)",
            "utility_mostly": "Mostly utility first (i.e., primary utilitarian mechanic designed first)",
            "utility_totally": "Totally utility first (i.e., made by clinicians, fun incorporated later)",
            "fun_utility_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "fun_utility_na": "Not Applicable"
        },
        "Play vs. Game": {
            "play_unstructured": "Unstructured play (i.e., no rules, making art)",
            "play_semi_structured": "Semi-structured play (i.e., playground game)",
            "play_flexible_rules": "Flexible structure with rules (i.e., improv)",
            "game_flexible": "Flexible game (i.e., board game with house rules)",
            "game_rigid": "Game with rigid rules (i.e., video game)",
            "play_game_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "play_game_na": "Not Applicable"
        },
        "Skill vs. Chance": {
            "skill_entirely": "Entirely skill-based (i.e., trivia, sports)",
            "skill_mostly": "Mostly skill-based (i.e., Mario Cart)",
            "skill_chance_equal": "Equally skill and chance based (i.e., Catan)",
            "chance_mostly": "Mostly chance-based (i.e., Uno)",
            "chance_entirely": "Entirely chance-based (i.e., all dice)",
            "skill_chance_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "skill_chance_na": "Not Applicable"
        },
        "Social vs. Solo": {
            "solo_entirely": "Entirely Solo (i.e., Solitaire)",
            "solo_mostly_ai": "Mostly Solo, but can play against AI (i.e., Single player StarCraft)",
            "solo_social_mixed": "Mix of solo and social affordances (i.e., Animal Crossing)",
            "social_mostly": "Mostly social, but aspects are independent (i.e., House on Hill haunt transition)",
            "social_entirely": "Entirely social (i.e., Tag)",
            "social_solo_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "social_solo_na": "Not Applicable"
        },
        "Sequential vs. Simultaneous": {
            "turn_based": "Entirely Turn-based (i.e., Tic Tak Toe)",
            "step_based": "Follows a set of steps (i.e., Viticulture's dynamic turn ordering)",
            "turn_plus_anytime": "Turns are taken, but some actions can be taken at anytime (i.e., Pandemic)",
            "mostly_simultaneous": "Most actions can be taken at any time, but there are some phases (i.e., PvP death reset timer)",
            "simultaneous_entirely": "Entirely Simultaneous (i.e., race)",
            "seq_sim_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
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
            "comp_collab_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "comp_collab_na": "Not Applicable"
        },
        "Symmetrical vs. Asymmetrical": {
            "symmetrical_entirely": "Entirely Symmetrical (i.e., Tik tac toe)",
            "symmetrical_mostly": "Mostly Symmetrical (i.e., Uno)",
            "symmetrical_asym_mixed": "Both Symmetrical and Asymmetrical (i.e., Pandemic—similar turn structure with different character abilities)",
            "asymmetrical_mostly": "Mostly Asymmetrical (i.e., Tag)",
            "asymmetrical_entirely": "Entirely Asymmetrical (i.e., Keep talking nobody explodes)",
            "sym_asym_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
            "sym_asym_na": "Not Applicable"
        },
        "Experiential Play Value Classification": {
            "play_sensory": "Sensory (i.e., kaleidoscope)",
            "play_fantasy": "Fantasy (i.e., role playing)",
            "play_construction": "Construction (i.e., Music, painting, building)",
            "play_challenge": "Challenge (Testing physical or mental abilities against others or self)",
            "play_value_undisclosed": "Undisclosed/Unknown, but the paper does include a game/play system or experience",
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

