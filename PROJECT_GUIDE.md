# PHT Lab Research Dashboard — Project Guide

_Last updated: 2026-11-09_

## 1. What this project is

An interactive, accessibility-focused web dashboard for exploring a **systematic literature review** of
games and play designed for, or with, people with disabilities. The review was coded in **Covidence**
(review #430680). Each of the **216 included studies** is rated along the **PHT Lab framework**:
eight two-sided "spectrum" dimensions such as Fun-first ↔ Utility-first and Solo ↔ Social, plus
study-characteristic and participant fields.

Researchers use it to:

- **Filter** studies by text (title, author, year range, pages, notes) and by framework and
  characteristic tags.
- **Plot** how many studies fall into each value of any column, stacked by participant group.
- **Browse** study cards (Data tab) and open study details.
- See **where studies sit on each spectrum**: the Ratings tab (dot grid) and the Spectrum tab (heat grid).
  Clicking a cell lists its studies and jumps to them.
- **Export** the filtered set plus filter settings to XLSX, and **import** a saved filter set back in.

**Data sensitivity:** published bibliographic metadata (titles, DOIs, lead-author names, coded ratings,
aggregate participant counts). No student records, health records or personal data beyond public
author names.

### The two folders

| Folder | What it is | Status |
|---|---|---|
| `PHT-Lab/` (repo `Interactive-Visualization-PHT-Lab-Model`) | **Current app.** Libraries vendored locally, ARIA work, Highcharts 12.5. | **Active — work here.** |
| `DataSpectra/` (repo `dua-fs/DataSpectra`) | Earlier prototype. Same `data.js` (identical 216 × 175), libraries from CDNs, extra experiments (`gpt.html`, `nordic.html`, `high-chart.html`, `index-old.html`, `optimized.js`), raw Covidence CSVs. | Superseded. Keep only for the raw CSVs and history. |

## 2. How to run it

It is a static site with no build step. Serve the folder over HTTP (opening `file://` mostly works,
but XLSX import and some browsers' security rules prefer HTTP):

```bash
cd PHT-Lab
npx http-server -p 8765 -c-1
```

Then open http://127.0.0.1:8765/. Any window width works; below 1024 px the filters stack above the
charts.

To update the data from a new Covidence export, see section 10. In short:

```bash
node tools/build-data.js data/raw/<covidence-export>.csv
```

That command also runs the audit. You can run the audit on its own with `node tools/audit-data.js`;
it exits with code 1 if anything would make the dashboard miscount.

## 3. Architecture

```
index.html                 All markup: sidebar filters (3 hard-coded tag menus), 4 tabs,
                           two hard-coded 8×5 grids (Ratings, Spectrum), 2 modals
assets/js/data.js          2 MB: one JS array of 216 study objects → window.myModule
assets/js/core.js          framework definitions, answer matching, DOIs, search engine (no DOM;
                           also used by the data tools)
assets/js/state.js         loads data.js, shared state, small utilities
assets/js/shared.js        answer labels/ordering, viridis colours, contrast
assets/js/filters.js       filtering, live option counts
assets/js/chart.js         Plot tab
assets/js/studies.js       Data tab (cards, table, details)
assets/js/grids.js         Ratings + Spectrum tabs (grids built from SPECTRUM_ROWS)
assets/js/gaps.js          Gaps tab
assets/js/io.js            Excel export / import
assets/js/app.js           start-up, theme, tabs, keyboard, tour (loaded last)
assets/js/pagination.js    simplePagination jQuery plugin
assets/css/style.css       Design tokens (--ds-*) for light/dark + all styling
assets/vendor/             Highcharts 12.5 (+ accessibility, exporting, sonification),
                           Fomantic/Semantic JS, jQuery 3.7.1, Shepherd (tour), SheetJS (XLSX)
tools/audit-data.js        Data-consistency check (added 2026-11)
```

### Data flow

1. `data.js` → `csvData`, sorted by Year. Each row gets a hidden, unique `__uid` key.
2. Filters → `allFilters` (dropdown tokens) plus the text inputs → `applyFilters()` → `filteredDataTmp`.
3. `renderTable(filteredDataTmp)` toggles the cards and pagination, then calls `Drawplot()` and `displaySpectrum()`.

### Matching rules (important)

- `FILTER_SPECS` (top of `script.js`) maps each dropdown token to a *data column* and *answer label*.
- Multi-select answers are stored as one string joined by `"; "`, so they are split with `splitValues()`.
- Labels are compared via `canon()`. It lowercases, drops trailing `(i.e., example)` text, collapses
  spaces and fixes known source misspellings (`Symetrical`, `asychronous`, `asynchrounous`, `Unkown`…).
- Filter logic: **AND across columns, OR within a column.** A free-text `Other: …` answer counts as "Other".

## 4. Understanding the data (216 studies, 1994–2023)

175 columns: identifiers, 8 framework spectra, Experiential Play Value, study characteristics,
participants, and about 140 demographic-count columns (most of them empty).

**Key patterns.** Percentages are of 216 studies. Multi-answer fields can total more than 100%.

- **Growth:** 1 study (1990–94) → 12 (2000–04) → 47 (2010–14) → 71 (2020–23).
- **Community of focus:** blind/low vision 36%, motor/physical 20%, IDD 14%, autism 13%,
  DHH 9%, communication/speech 9%, older adults 3%.
- **Design intention:** totally fun-first 25%, both 19%, mostly utility 19%, totally utility 14%;
  14% are not games/play at all (framework "Not Applicable").
- **Form of play:** rigid-rule games dominate (42%). They are mostly **solo** (45% entirely solo),
  **synchronous** (61%), **skill-based** (52%) and **symmetrical** (46%). No study is mostly or
  entirely chance-based (21 are equally skill and chance).
- **Play value:** Challenge 56%, Construction 25%, Sensory 12%, Fantasy 5%.
- **Methods:** interview 43%, usability testing 30%, workshop, survey, field study and controlled
  experiment each about 24%.
- **Technology:** PC 44%, tangible 19%, mobile 17%, tablet 14%, VR 6%, AR 3%.
- **Involvement:** only **15%** used participatory design *with* disabled stakeholders, and
  91% used no proxies.
- **Geography:** USA 46%, UK 9%, Canada 5%, Japan 5%.
- **Participants:** median 9 disabled participants per study (max 177). Gender is reported in
  under half the studies. Sexual orientation is never reported.

**Research gaps the data points to:** chance-based and asynchronous play, participatory design with
disabled people, older adults, and studies outside North America and Europe.

### Data-quality issues in the source export

| Issue | Effect | Handled? |
|---|---|---|
| Misspellings: `Symetrical`, `Asymetrical`, `asychronous`, `asycnronous`, `asynchrounous`, `Unkown`, double spaces | Broke filters and grid cells | Yes, normalised by `canon()` in the app. Fix at source too. |
| Duplicate Study IDs: Torrente 2012, Zhang 2023, Li 2022, Ostiz-Blanco 2018 are each **two different papers** | Study details opened the wrong paper | Yes, the app uses `__uid`. Suffix IDs (a/b) at source. |
| `O'Bryan 2012` (apostrophe) | Broke "jump to study" | Yes |
| Missing DOI: Abreu 2020. Empty symmetry rating: Madeo 2011 | Minor | Shown as "Not recorded" |
| Column-name typos: `Casegivers`, `Motor of physical impairment`, `Brainstormming`, `Convienience` | Cosmetic | No, fix in Covidence template |
| About 100 demographic columns entirely empty (e.g. all sexual-orientation columns) | Noise in plot menu | Hidden from the plot menu |

## 5. Evaluation: what was broken, and what was fixed (2026-11-09)

Every item was reproduced in the running app first, then re-verified after the fix. The counts were
cross-checked independently against the raw data.

| # | Problem | Impact (before → after) |
|---|---|---|
| 1 | Tag filter compared "does the label contain the whole cell", so multi-answer cells never matched and **empty cells always matched** | Study Method = Interview: **15 → 92**. Participant group "People with disabilities": 99 → 174 |
| 2 | `if (action = "nuke_all_filters")` (assignment instead of comparison) | Removing one tag silently cleared every tag in that dropdown; the UI still showed the rest |
| 3 | Spectrum clean-up regex turned `Asymetrical` into `ASymmetrical` | **53 studies missing** from the Symmetrical row; 6 missing from Synchronous |
| 4 | Pole labels swapped on the Play/Game and Solo/Social rows | Grid read backwards for 2 of the 8 dimensions |
| 5 | Study IDs not unique; lookups by ID | Details modal showed the wrong paper for 4 studies |
| 6 | Inline `onclick="jump('O'Bryan 2012')"` | JavaScript syntax error; that study couldn't be opened |
| 7 | Author input pattern `[a-zA-Z ]` | Hyphenated, apostrophe or accented names rejected; filter silently ignored |
| 8 | Hidden cards only `opacity:0` | 200+ invisible cards stayed keyboard-focusable and announced by screen readers |
| 9 | Plot used each unique combination as a bar | 73 Study Method bars → **11**. Numeric columns now sort numerically |
| 10 | Stack labels summed segments; a study with 2 groups counted twice | Labels now show **distinct studies**; subtitle explains the segments |
| 11 | 6-colour palette for 7 series | "Other" had the same blue as "People with disabilities" |
| 12 | "Study Details" modal showed a non-existent Abstract field | Now shows metadata plus the study's framework ratings, with an escaped, safe DOI link |
| 13 | Broken "No data" image path (`../../media`) | Fixed |
| 14 | Import ignored text filters; Notes filter not exported | Fixed; import also re-applies filters |
| 15 | Both intensity sliders shared one value; theme flag never updated | Each grid uses its own slider; heat colour follows the theme |
| 16 | Mobiscroll **trial** build loaded but unused (needs a licence, always online) | Removed from the page |
| 17 | Data values injected as HTML | Escaped (`escapeHtml`) |
| — | Plot menu offered 160+ columns, including empty and section-header columns | Trimmed to 65 plottable columns |

## 6. Still not working / known limitations

1. ~~Not fully offline~~ (fixed: every file is served from this repo; section 12).
2. ~~No data pipeline~~ (fixed: `tools/build-data.js`, section 10).
3. ~~Grids without a scale~~ (fixed: viridis scale, legend, counts in cells). Still open: "Undisclosed"
   and "Not applicable" answers aren't shown, so rows don't add up to N.
4. ~~Plot dropdown visible on grid tabs~~ (fixed).
5. ~~Desktop-only shield~~ (fixed: the layout reflows at 200% and 400% zoom). The phone layout is
   usable but not polished.
6. ~~Filter options without counts~~ (fixed: each option shows how many studies it would return,
   and zero-result options are greyed out; section 11).
7. ~~Chart always coloured by participant groups, no % view~~ (fixed: chart controls; section 15).
8. ~~Data tab only shows cards~~ (fixed: Cards/Table views, sorting, page size, column chooser; section 16).
9. Accessibility: axe now reports 0 WCAG 2.2 AA violations (section 8). Still open: manual testing
   with real NVDA, JAWS and VoiceOver users, a shorter tour, and Highcharts legend buttons that are
   17 px tall (they pass the spacing exception, but 24 px+ would be better).
10. ~~Code health~~ (fixed: split into 10 files, ESLint, jQuery 3.7.1, grids generated from one list; section 18).
11. **Licensing to confirm:** Highcharts needs a paid licence unless the use is non-commercial
    (Highsoft's terms cover personal, school and non-profit use). Check with Highsoft or your
    university that this project qualifies. The project itself has no LICENSE file yet (the owner
    decides). The old DataSpectra repo still contains a published paper PDF and Mobiscroll trial
    files that probably shouldn't be redistributed.
12. ~~AudioContext console error on load~~ (no longer occurs).
13. ~~Live site out of date~~ (fixed: https://gorintlapavanprasad.github.io/Interactive-Visualization-PHT-Lab-Model/
    runs the current code). The older https://phtvisialization.github.io/phtvisialization/ link is
    dead (404). That account was renamed to PhtDataVisualization, and its site is an old Chart.js
    prototype from April 2025, so don't share that link.

## 7. Roadmap and development tasks

Priority: **P0** = correctness or trust, **P1** = analysis value, **P2** = quality, accessibility or
infrastructure, **P3** = nice to have.

| ID | Pri | Task | Done when |
|---|---|---|---|
| T1 | P0 | ✅ **Done.** Fixes pushed to `main` and live | Live |
| T2 | P0 | ✅ **Done.** `tools/build-data.js` (section 10) | One command regenerates `data.js`; audit passes |
| T3 | P0 | Partly done: the pipeline now fixes answer spellings, DOIs and duplicate IDs automatically. Remaining: fix the column-name typos in the Covidence template (`Casegivers`, `Motor of physical impairment`, `Brainstormming`, `Convienience`) | Template typos gone |
| T4 | P1 | ✅ **Done** (section 11): live counts beside every filter option; zero-result options greyed out | Counts update with filters |
| T5 | P1 | ✅ Mostly done (viridis scale, legend, counts in cells). Remaining: a per-row "N/A / undisclosed" column | Rows sum to N |
| T6 | P1 | ✅ **Done** (section 15): "Colour bars by" any coded column or none; "Show" counts or percentages; framework order; "Not recorded" segment | — |
| T7 | P1 | ✅ **Done** (section 16): Cards/Table views, sortable columns, sort controls, page size, column chooser | — |
| T8 | P1 | ✅ **Done** (section 17): Gaps tab, a heatmap of any two dimensions with gaps highlighted | — |
| T9 | P2 | ✅ **Done** (section 12): no requests to other servers | Works with network off |
| T10 | P2 | ✅ Automated part done (0 axe violations; reflow at 400% zoom; see section 8). Remaining: sessions with real screen-reader users, shorter tour | Signed off by disabled testers |
| T11 | P2 | ✅ **Done** (section 13): GitHub Actions runs the data audit and 66 browser checks on every push and pull request | CI green on every push |
| T12 | P2 | ✅ **Done** (section 18): 10 focused script files, ESLint in CI, jQuery 3.7.1, grids from config | — |
| T13 | P2 | ✅ Mostly done (section 14): unused files and dead code removed, README added. Remaining (owner's decisions): choose a project LICENSE, confirm the Highcharts licence, archive the old DataSpectra repo | — |
| T14 | P2 | ✅ **Done.** Live on GitHub Pages | Public URL |
| T15 | P3 | Shareable URL with filter state; CSV and BibTeX export of the filtered studies; "insights" summary panel | — |

**Suggested order:** T1 (put the fixes live) → T2/T3 → T4 → T9 → T11 → T6–T8 → the rest.

## 8. Speed and accessibility testing (2026-11-09)

### Speed: time from a filter click to an updated screen, measured in headless Chrome

| | Original | Now |
|---|---|---|
| Add a tag (chart tab) | 223–259 ms | 121–139 ms |
| Add a tag (grid tab) | 352 ms | **18–28 ms** |
| Reset all filters | 746 ms | 198–211 ms |
| Page size (DOM elements) | 25,519 | **2,268** |
| Text-box delay before filtering | 500 ms | 150 ms |

Causes fixed:
- All 216 study cards were kept in the page. Now only the current page's 5 cards are rendered.
- The chart was rebuilt on every click, and old charts were never freed. It's now reused.
- The grids were redrawn even when hidden. Now only the visible view redraws.
- The grids used up to 100 stacked shadows per cell and 76 tooltip widgets. Now one colour per cell
  and one shared tooltip.
- Reset ran the whole pipeline several times. It now runs once.
- A dead loop touched ~13,000 rows on every change. Removed.

On the chart tab, about half of the remaining ~130 ms is the Highcharts accessibility module, which
screen-reader users need.

### Colour: viridis

The chart series and both grids use **viridis**, the perceptually uniform, colour-blind-safe palette
from the R/matplotlib `viridis` package. The chart uses `viridis(7)`, or `viridis(7, begin = 0.25)` in
dark mode so the darkest purple stays visible against the background. The grids use a continuous
viridis scale with a legend. Each Spectrum cell also prints its count, in black or white (whichever
has more contrast), so nothing depends on colour alone.

### Accessibility: one disability profile at a time

Run with `tools/a11y-persona-test.js`, which uses headless Chrome and axe-core 4.14 (WCAG 2.2 AA).

| Profile | Original | Now |
|---|---|---|
| **Automated WCAG scan (axe)** | 8 failing rules, 2 critical | **0** |
| **Blind, screen reader + keyboard** | Keyboard filtering gave the wrong count (15, should be 92); count changes not announced; the column-hide control hidden from screen readers; card buttons all named "View details for Title" | Correct counts; "92 of 216 studies match." announced once; arrow keys move between tabs; dialogs move focus in, trap it and return it; each grid cell reads "Totally fun first: 20 of 92 studies, 22 percent" |
| **Low vision (200% / 400% zoom)** | "Optimal on Desktop" screen **hid the whole app** | Layout reflows; no horizontal scrolling; all filters reachable |
| **Colour blindness** (deuteranopia, protanopia, tritanopia, achromatopsia) | Arbitrary blue/teal/gold palette; heat shown by colour only | Viridis; numbers in cells; legend |
| **Motor / keyboard or switch only** | 14 small targets; headings were extra Tab stops | Headings removed from the Tab order; bigger, spaced legend; no keyboard traps (250-Tab test) |
| **Cognitive** | Invalid year showed only a red border | Plain-language message ("Enter a 4-digit year (2020) or a range (2010-2020)."), announced; plain control names ("Filter by participants") |
| **Deaf / hard of hearing** | Fine: sound (sonification) is optional, and there's no audio or video content | Same |
| **Combined:** low vision + colour blind; Windows High Contrast + reduced motion | Not considered | Readable; cell counts survive High Contrast mode; animations off when reduced motion is requested |

Automated tools can't replace testing with disabled users. Before publishing any accessibility
claims, do a short session with at least one NVDA or JAWS user and one VoiceOver user.

Re-run everything with:

```bash
cd tools && npm install && npm run audit && npm run test:a11y
```

## 9. Search and paper links (2026-11-09)

### Search all fields
The **Search all fields** box, first in the sidebar, searches every column of every study: title,
authors, DOI, notes, every framework rating, methods, technology, context, country and so on.

| Type | Finds |
|---|---|
| `blind game` | studies containing both words (anywhere, any case) |
| `"virtual reality"` | the exact phrase |
| `blind OR deaf` | either word |
| `blind -game` | "blind" but not "game" |
| `musica` / `música` | the same; accents are ignored |
| `game` | also "games", "gameplay" (word starts) |
| `VR`, `AR`, `BLV`, `DHH`, `IDD`, `ASD`, `AAC` | expanded to the full terms, and the full terms to the abbreviations |

Results are **ranked**: title matches first, then author, Study ID or DOI, then notes, then other
fields. Studies matching in more fields come next, and ties keep year order. Matches are highlighted
in the study cards. The search combines with all other filters, and it is saved in XLSX export/import.

### Paper links
- 15 DOIs were stored as full URLs (`https://doi.org/10.1145/…`), and the old details link turned
  them into broken `https://doi.org/https://doi.org/…` URLs.
- One DOI (Alsaleem 2019) was corrupted: `http://dx.doi.org/10.1145/ 10.1145/3308561.3353775`.
- The app now normalises every DOI to its bare form.
- Each study card has an **Open paper** button and a clickable DOI. Both open
  `https://doi.org/<DOI>` in a new tab, which redirects to the paper's page in the ACM Digital Library.
- All 215 DOIs were checked against doi.org, and all 215 resolve. One study (Abreu 2020) has no DOI.
- `tools/audit-data.js` now flags unusable or messy DOIs.

## 10. Updating the data (pipeline)

`assets/js/data.js` is **generated**; don't edit it by hand. To publish new or changed studies:

1. In Covidence (review #430680), export the **extraction** data as CSV.
2. Save it in `data/raw/`. That folder is git-ignored, because the raw export contains each
   reviewer's individual coding and names. Only the Consensus rows are published.
3. Preview the changes without writing anything:
   ```bash
   node tools/build-data.js data/raw/<export>.csv --dry-run
   ```
   It reports how many studies were added, removed or changed compared with the live data, which
   fields changed, and any studies that have reviewer rows but **no Consensus row yet**. Those
   studies won't appear on the site until consensus is reached.
4. Build it for real. This writes `assets/js/data.js` and runs `tools/audit-data.js`:
   ```bash
   node tools/build-data.js data/raw/<export>.csv
   ```
5. Refresh the test reference values for the new data, then run the tests (section 13):
   ```bash
   cd tools && npm run test:update-golden && npm test
   ```
   Look at the values in `tools/tests/golden.json`. Do the changes make sense for the studies you
   added or changed?
6. Commit `assets/js/data.js` and `tools/tests/golden.json`, then push. GitHub Pages updates in
   about a minute.

What the pipeline does:
- Keeps only Consensus rows.
- Drops `Covidence #`, `Reviewer Name` and the duplicate `Title` column.
- Trims values and collapses repeated spaces.
- Turns numeric cells into numbers.
- Reduces DOIs to `10.xxxx/…`.
- Fixes known answer misspellings: Symetrical, Asymetrical, asychronous, asycnronous, asynchrounous, Unkown.
- Renames duplicate Study IDs to `Author Yeara/b`.

It stops with an error, writing nothing, if:
- a column the dashboard needs is missing (e.g. the extraction template was changed),
- rows are malformed or have the wrong number of cells,
- a study has two Consensus rows,
- a DOI is unusable,
- a year is implausible,
- the file isn't UTF-8.

**Checked on 2026-11-09** with `review_430680_20240910090236.csv`:
- Same 216 studies as before.
- All 190 filter options give identical counts on the old and new data.
- Searches, grid values and DOI links are unchanged.
- Rebuilding from the same export changes nothing.

Data corrections it made:
- 16 DOIs cleaned, including the corrupted Alsaleem 2019 DOI.
- 229 misspelled answers fixed.
- Torrente 2012, Zhang 2023, Li 2022 and Ostiz-Blanco 2018 became `a`/`b`.
- One title that the hand-made file had truncated was restored ("If you've gone straight, now, you must turn left" …).

## 11. Live option counts (faceted filtering)

Every option in the three tag menus (PHT Lab Framework, Characteristics of Included Studies,
Participants) shows a number: **how many studies you would get if you picked it**, given everything
else you've filtered on (search box, text fields and the other tag groups).

- Options in the **same group** are combined with OR, so a group's own selections don't change its
  own counts. For example, with *Interview* selected, *Survey* still shows how many Survey studies
  match the other filters.
- Options that would return **no studies** are greyed out (italic, dashed badge) and can't be picked
  with the mouse or keyboard. Already-selected options always stay removable.
- Screen readers hear the count as part of the option, e.g. "Study Method, Interview, 92 studies".
  Zero-result options are announced as dimmed.
- Updating all 190 counts takes about 8 ms.

Checked on 2026-11-09:
- From a clean start, all 174 non-zero options showed exactly the number of results you get after
  picking them.
- With *Interview* and the search "blind" active, all 79 options in the other groups matched exactly.
- At the start, 16 options have no studies (e.g. chance-based play, Mail recruitment), and they are
  greyed out.
- axe still reports 0 WCAG 2.2 AA violations.

## 12. Self-contained: no outside servers

The site loads **only files from this repository**. It used to load three things from other servers:

| Was loaded from | Now |
|---|---|
| Fomantic UI 2.9.3 stylesheet (jsDelivr) | `assets/vendor/cdn-local/css/semantic.min.css` (byte-identical copy), plus its Lato and icon fonts in `…/css/themes/default/assets/fonts/` |
| Phosphor Icons 2.1.1 (jsDelivr) | `assets/vendor/phosphor-icons-2.1.1/regular/` (CSS + font) |
| Checkmark icon (raw.githubusercontent.com) | `media/check-bold.svg` |

Why it matters:
- The site works on a laptop with no internet access, e.g. at a conference or in a classroom.
- It keeps working if a CDN is down or blocked, such as on university or hospital networks.
- Visitors' browsers no longer contact third-party servers, which is better for privacy.
- Chart downloads (PNG/JPEG/SVG) are generated in the browser; Highcharts' export server isn't used.

Checked on 2026-11-09 by loading the site in headless Chrome with every request to another host
blocked and then using filters, menus and all four tabs:
- 0 outside requests attempted and 0 failed requests.
- Lato, the Fomantic icons and the Phosphor icons all loaded, and the page looked identical.
- axe still reports 0 WCAG 2.2 AA violations.

Licences: Fomantic UI and Phosphor Icons are MIT (their licence files are kept next to the files),
and Lato is SIL Open Font License. Highcharts needs a licence for non-academic/commercial use.

The unused vendor files that used to be listed here were removed in the cleanup (section 14).

## 13. Automated tests (GitHub Actions)

Every push to `main` and every pull request runs **Tests** (`.github/workflows/tests.yml`) on GitHub's
servers. It takes about 2–3 minutes. The result shows as a ✓ or ✗ next to the commit, and the details
are in the repo's **Actions** tab.

Run the same tests on your own computer (needs Node 18+ and Google Chrome):

```bash
cd tools && npm ci && npm test
```

### What is checked (66 checks)

| Area | Checks |
|---|---|
| Data | The audit passes; `data.js` was generated by the pipeline; every DOI is a clean `10.xxxx/…` with a doi.org link; Study IDs are unique |
| Filter counts | All 190 option badges equal the actual results after selecting them, both from a clean start and with other filters active; zero-result options are greyed out |
| Real dropdowns | Add 2 tags, remove 1 → same as 1 tag; clearing tags shows every study |
| Known results | 25 reference values: filter results (Interview = 92, …), search results (blind = 78, …), the top search result, every grid row and the number of empty options |
| Logic | OR within a group never gives fewer studies; AND across groups never gives more; reset shows all |
| Study list | Cards by default; Table view rows and pressed state; Year header sorts newest/oldest first with `aria-sort`; "Per page" works; new columns are added at the end; DOI links and title → right study; search keeps best matches first; axe finds 0 violations in Table view |
| Gaps | Every cell equals an independent count from the data; gaps are hatched and read "no studies"; selecting a cell lists exactly its studies; every framework answer is shown; the hide option works; filters apply |
| Chart controls | % without colour = % of filtered studies; with colour every bar adds up to 100% with n under it; framework order; data table matches the chart; blanks shown as "Not recorded"; choices saved in the export; one chart instance |
| Accessibility | axe-core finds 0 WCAG 2.2 AA violations on every tab; every focusable control (including the settings menu) has a name a screen reader can read; keyboard filtering works and the count is announced; at 200% zoom the filters, the chart and its data table are usable with no horizontal scrolling |
| Offline | No requests to outside servers; no missing files; fonts and icons load |
| Speed and size | Page under 5,000 elements; a filter change on the chart tab under 1.5 s |

### Proof that the tests catch bugs
Each of these was put into the code on purpose, and the tests failed with a clear message:

| Injected bug | Caught by |
|---|---|
| The original "removing one tag clears all tags" bug | "add 2 tags, remove 1: after removing 1: 216" |
| The original multi-answer filter bug | "Study Method = Interview — expected 92, got 14", plus the option-count check |
| Icons loaded from a CDN again | "no requests to outside servers — https://cdn.jsdelivr.net/…" |
| Theme switch without an accessible name | "every focusable control has an accessible name — switch INPUT#theme" |
| All 216 cards rendered at once | "page stays small — 27,690 elements" |

### When the data changes
The reference values in `tools/tests/golden.json` belong to one specific `data.js`, identified by a
fingerprint. If `data.js` changes, the tests stop and tell you to refresh the values:

```bash
cd tools && npm run test:update-golden
```

Check the new values, then commit `tools/tests/golden.json` together with `assets/js/data.js`. All the
other checks (counts, logic, accessibility, offline, speed) work for any data, with no updates needed.

### Recommended next step (repository settings, not code)
GitHub Pages currently publishes `main` as soon as it's pushed, even if the tests fail. Two settings
changes would stop a broken version from going live:
1. **Settings → Branches → add a rule for `main`** that requires the "Tests" check to pass before a
   pull request can be merged. Then make changes on a branch and merge them through a PR.
2. Or switch **Settings → Pages → Source** to "GitHub Actions" and add a deploy job that runs only
   after Tests pass.

## 14. Repository cleanup (2026-11-09)

Removed 27 files (7.9 MB) that the site never loaded:
- Plotly (3.5 MB), Chart.js and Bootstrap
- the Mobiscroll trial build (licence-restricted)
- a duplicate copy of the Fomantic CSS and Lato fonts (`cdn-downloads/`)
- an unused stray `style.css`
- the Inter font
- `pagination.css`
- three old images

Also removed:
- commented-out HTML (CDN script tags, old logo, old buttons)
- dead JavaScript: an unused hash helper and globals, accordion and Bootstrap handlers for elements
  that don't exist, three unused tour helpers, and an audio-unlock and Mobiscroll focus tracker for
  objects that were never created

Bugs found during the cleanup:
- **Leftover CSS from the old "desktop only" screen hid the chart's data table below 1024 px**,
  which includes 200% zoom. That table is the chart's text alternative. It's fixed, and CI now checks
  that the table is shown at 200% zoom; the check fails on the old CSS.
- The Import button opened the file picker from both its keyboard and click handlers, so Enter could
  open it twice. The extra handler is removed (a `<button>` already handles Enter and Space).

Added:
- `README.md`: what the site is, the live link, a tests badge, how to run and update it, and the
  third-party licences.
- A clearer page description for search engines and link previews.

Now every file in the repo is used by the site, the tools or the docs. The remaining 45 checks all pass.

**Still for the owner to decide:**
- A **LICENSE** for the project's own code and data (e.g. MIT for code, CC BY 4.0 for data).
- Whether the **Highcharts** use is covered by its non-commercial terms.
- Whether to **archive** the old `dua-fs/DataSpectra` repository and the PhtDataVisualization site.

## 15. Chart controls (2026-11-09)

Above the chart (Plot tab → Visual) are two dropdowns:

- **Colour bars by:** *Participant groups* (the default, as before), *None (one colour)*, or any coded
  column: the eight framework spectra, Experiential Play Value, Study Method and its sub-methods,
  Technology, Context, Community of focus, User involvement, Use of proxies, Recruitment, Issue
  addressed or Contribution type.
- **Show:**
  - *Number of studies*.
  - *Percentages* with a colour chosen: each bar is 100%, split by the colour variable. The number
    of studies (n) is shown under each bar.
  - *Percentages* with no colour: bar height = % of the filtered studies that have that answer.

Details:
- Bars and colours for framework answers follow the **framework's order** (Totally fun first →
  Totally utility first), not alphabetical order. Numbers (years) are in numeric order.
- Studies with no answer in the colour column get a grey **"Not recorded"** segment, so every study
  is accounted for. Free-text "Other: …" answers are grouped as "Other", the same way the filters
  treat them. The long "Undisclosed/Unknown, but the paper does include…" label is shortened to
  "Undisclosed/Unknown".
- Colours are viridis with as many shades as there are answers (up to 12). "Not recorded" is grey.
- The tooltip, the screen-reader description of each bar segment and the data table all follow the
  chosen view (e.g. "Blind or low vision: 37 studies, 36% of this bar. 92 distinct studies in this
  bar"). The data table always shows study counts.
- Both choices are saved in the Excel export and restored on import (round trip checked).
- Changing the options updates the existing chart instead of re-creating it. This avoids a flash and
  an "AudioContext closed" error from Highcharts' sound feature.

Checked on 2026-11-09:
- Interview = 92 of 216 studies = 42.6% in the no-colour percentage view.
- Every percentage-stacked bar adds up to exactly 100%.
- Framework order, "Not recorded", the export/import round trip, dark mode and the one-chart
  instance all behave as described.
- No errors.
- CI now runs 52 checks.

## 16. Study list: Cards or Table (2026-11-09)

The Data tab has a toolbar:

- **View: Cards | Table.** Cards (one study per card, every field) is the default. The table shows
  one study per row with chosen columns. The choice is remembered on this device.
- **Sort by and Order** work in both views: Year, Title, Study ID, Lead author, Pages, Primary
  Country or any table column. *Default* means year order, or **best match** while a search is
  active. Blanks always go last, and leading quote marks are ignored when sorting titles.
- **Per page:** Cards 5/10/25; Table 10/25/50/100/All.
- **Columns (table only):** tick any column that has data. New columns are added at the end, so
  your order is kept. At least one column always stays.

In the table:
- Each **column header is a button**. Click it, or press Enter or Space, to sort; press again to
  reverse. Numeric columns such as Year sort newest/largest first on the first click. The header
  carries `aria-sort`, and screen readers hear "Sorted by Year, descending."
- The first column (Study ID) is the **row header**. The table has a caption with the current sort
  and page.
- **Title** is a button that opens the study details, and focus returns to it when the dialog
  closes. **DOI** links straight to the paper. Search matches are highlighted.
- Wide tables scroll sideways inside a keyboard-focusable region.

Also:
- "Jump to study" from the Ratings and Spectrum grids works in both views and with any sort or
  page size.
- View, sort, page size and table columns are saved in the Excel export and restored on import.
  The column list is stored with "|" separators because column names can contain commas.
- The card-only "Hide fields" control in the header is hidden while the table is shown.
- The Columns panel closes when you click outside it or press Escape. Before this fix it could
  cover the first rows and block clicks.

Checked on 2026-11-09:
- Keyboard sorting, aria-sort and announcements work.
- Page sizes 25, 50, 100 and All behave correctly.
- Opening details from the table works, with focus returning to the title.
- Search keeps best matches first, and jump-to-study works from the grid.
- The Excel round trip of all view settings works.
- axe reports 0 violations in Table view, and there are no errors.
- CI now runs 60 checks.

### Bug found by CI: Enter in the filter menus was often ignored
After the T7 push, GitHub Actions caught a keyboard bug that had been in the site all along. Typing
in a tag menu (e.g. "Interview") and pressing Enter quickly **often selected nothing**. Fomantic
ignores Enter while the menu's 200 ms opening animation runs. Quick keyboard and screen-reader users
lost their choice without any message: in 8 repeated tries, only 1 worked (the version before T7
behaved the same). The menus now open instantly (`duration: 0`), and 8 of 8 tries work. The CI check
now waits for the option to appear and confirms the selection, so it reports this bug instead of
passing by chance.

## 17. Gaps tab: research-gap heatmap (2026-11-09)

A fifth tab, **Gaps**, answers: *which combinations of two dimensions have (not) been studied?*

- **Rows and Columns:** any two of participant groups, the eight framework spectra, play value,
  study methods, technology, context, community of focus, user involvement, proxies, recruitment,
  issue addressed, contribution type and primary country. The default is *Community of focus ×
  Study Method*. A **Swap** button flips the two.
- Each cell = the studies matching your filters that have **both** answers. A study with several
  answers counts in each matching cell.
- **Gaps (0)** are hatched and show "0", so they're visible without colour, in greyscale and in High
  Contrast mode. Screen readers hear "Cognitive impairment and Field study: no studies".
- **Every possible answer** from the framework is listed, even one no study has (e.g. *Mostly/Entirely
  chance-based*), because an empty row is a gap too.
- **Show:** number of studies, or % of row. The colour follows what is shown (viridis).
- **Hide "Not applicable", "Undisclosed" and "Not recorded"** (on by default), so they don't crowd
  out real answers. Untick the box to include them.
- Row and column totals count distinct studies. A summary line gives the number of empty
  combinations and the most-studied pair, e.g. "39 of 120 combinations have no studies. Most studied:
  Blind or low vision × Interview (37)."
- **Select a cell** to list its studies, then jump to any of them in the Data tab.
- It's an accessible HTML table: column headers, row headers, a caption, sticky headers while
  scrolling, and one button per non-empty cell with a full description.
- All settings are saved in the Excel export and restored on import.

Checked on 2026-11-09:
- All 120 cells of *Community × Study Method* equal an independent count from the raw data.
- Selecting a cell listed exactly its 37 studies.
- Chance-based rows appear even with no studies, and the hide option and filters work.
- The Excel round trip works.
- axe reports 0 violations, and the offline check covers the tab.
- CI now runs 66 checks.

Some gaps visible straight away in the full data set:
- No study is mostly or entirely chance-based.
- Cognitive impairment and older adults are barely combined with most study methods.
- No study recorded "Other" as its community of focus.

## 18. Code health (2026-11-10)

**One script → ten.** The 2,600-line `script.js` is split into ten files by job (see the layout in
section 3). They are still plain scripts with no build step, loaded in a fixed order by
`index.html`. They share one global scope, so nothing changed for the page.

How the split was done:
- A script cut `script.js` into its 133 top-level pieces (each function or statement with its comment).
- It assigned each piece to a file by name, keeping the original order inside each file.
- It refused to write unless every one of the 2,602 lines landed in exactly one file.

The data tools now read the pure helpers from `core.js`. Adding a feature now usually touches one
or two files.

**ESLint** (`eslint.config.js` at the repo root, `cd tools && npm run lint`):
- It uses the recommended rules, plus `===` instead of `==`. It runs in CI before the tests.
- It knows about each file's top-level names, so it still flags names that are defined nowhere.
- First run: one empty `else { }` block in the app, and an invisible byte-order-mark character
  typed literally into a regular expression in `build-data.js`. Both are fixed. There were no
  undefined variables and no `==` comparisons.
- Note: ESLint had at first silently skipped the app folder (a config-location quirk). That was
  caught and fixed, so the app files are checked now.

**jQuery 3.1.1 → 3.7.1**, the latest 3.x release, with the security fixes:
- It was fetched with `npm pack` (integrity checked against the npm registry).
- The 3.5 change to self-closing tags affects none of our code or plugins.
- jQuery 4 was not used because Fomantic UI 2.9 targets 3.x.

**Grids from one list.** The Ratings and Spectrum tables used to be two identical hand-written copies
(about 160 lines). Both are now built from `SPECTRUM_ROWS` in `grids.js`, which also defines the
dimension order. `index.html` went from 1,054 to 892 lines. The data audit reads `SPECTRUM_ROWS`
too, and it was shown to catch a broken label (a test edit to "Entirely Solo" was flagged for 98
studies).

Verified:
- 66/66 CI checks pass.
- The persona accessibility suite passes, with 0 axe violations.
- The chart, table and Gaps feature scripts give the same results as before.
- The data pipeline dry run shows 0 changes, and the lint is clean.
