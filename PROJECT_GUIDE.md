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
assets/js/script.js        All logic (~1.7k lines, globals, jQuery + Fomantic UI)
assets/js/pagination.js    simplePagination jQuery plugin
assets/css/style.css       Design tokens (--ds-*) for light/dark + all styling
assets/vendor/             Highcharts 12.5 (+ accessibility, exporting, sonification),
                           Fomantic/Semantic JS, jQuery 3.1.1, Shepherd (tour), SheetJS (XLSX)
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

1. **Not fully offline.** Fomantic UI CSS and Phosphor icons load from jsDelivr, and a checkmark
   icon in `style.css` loads from raw.githubusercontent.com. Offline, the layout and icons break.
2. ~~No data pipeline~~ (fixed: `tools/build-data.js`, section 10).
3. ~~Grids without a scale~~ (fixed: viridis scale, legend, counts in cells). Still open: "Undisclosed"
   and "Not applicable" answers aren't shown, so rows don't add up to N.
4. ~~Plot dropdown visible on grid tabs~~ (fixed).
5. ~~Desktop-only shield~~ (fixed: the layout reflows at 200% and 400% zoom). The phone layout is
   usable but not polished.
6. **16 filter options match 0 studies** (e.g. chance-based, Mail recruitment). They are offered
   with no counts, so users can pick empty filters.
7. **The chart always stacks by Participant Groups**; there's no choice of stack variable and no % view.
8. The Data tab shows only cards (5 per page). There's no sortable table and no page-size choice.
9. Accessibility: axe now reports 0 WCAG 2.2 AA violations (section 8). Still open: manual testing
   with real NVDA, JAWS and VoiceOver users, a shorter tour, and Highcharts legend buttons that are
   17 px tall (they pass the spacing exception, but 24 px+ would be better).
10. **Code health:** one global 1.7k-line script, duplicated grid markup, jQuery 3.1.1 (2016, has
    known CVEs), no linter, no automated UI tests.
11. **Licensing to confirm:** Highcharts is free for non-commercial/academic use only. The DataSpectra
    repo contains a published paper PDF and Mobiscroll trial files that probably shouldn't be
    redistributed.
12. ~~AudioContext console error on load~~ (no longer occurs).
13. **The live site is out of date.** https://gorintlapavanprasad.github.io/Interactive-Visualization-PHT-Lab-Model/
    is byte-for-byte the *original* code, so every bug in section 5 is live. The older
    https://phtvisialization.github.io/phtvisialization/ link is dead (404). That account was renamed
    to PhtDataVisualization, and its site is an even older Chart.js prototype from April 2025.

## 7. Roadmap and development tasks

Priority: **P0** = correctness or trust, **P1** = analysis value, **P2** = quality, accessibility or
infrastructure, **P3** = nice to have.

| ID | Pri | Task | Done when |
|---|---|---|---|
| T1 | P0 | Push these fixes to the real GitHub repo (needs repo access) as a reviewed PR | PR merged |
| T2 | P0 | ✅ **Done.** `tools/build-data.js` (section 10) | One command regenerates `data.js`; audit passes |
| T3 | P0 | Partly done: the pipeline now fixes answer spellings, DOIs and duplicate IDs automatically. Remaining: fix the column-name typos in the Covidence template (`Casegivers`, `Motor of physical impairment`, `Brainstormming`, `Convienience`) | Template typos gone |
| T4 | P1 | Show live counts beside every filter option; grey out zero-count options | Counts update with filters |
| T5 | P1 | ✅ Mostly done (viridis scale, legend, counts in cells). Remaining: a per-row "N/A / undisclosed" column | Rows sum to N |
| T6 | P1 | Chart controls: choose the stack-by variable, count or % view; hide the plot menu on grid tabs | — |
| T7 | P1 | Data tab: sortable table view, page-size selector, column chooser | — |
| T8 | P1 | Cross-tab heatmap: any two dimensions (e.g. Community × Study Method) to show research gaps | — |
| T9 | P2 | Fully offline: vendor the Fomantic CSS, icon fonts and Phosphor; inline the checkmark SVG | Works with network off |
| T10 | P2 | ✅ Automated part done (0 axe violations; reflow at 400% zoom; see section 8). Remaining: sessions with real screen-reader users, shorter tour | Signed off by disabled testers |
| T11 | P2 | Tests: Playwright smoke tests for filter counts (Interview = 92, Interview OR Survey = 119, …) plus the audit in CI | CI green on every push |
| T12 | P2 | Code health: split `script.js` into modules, ESLint, upgrade jQuery, generate grid rows from config | — |
| T13 | P2 | Repo hygiene: archive the DataSpectra prototypes, remove the PDF and Mobiscroll trial, add LICENSE and README, confirm the Highcharts licence | — |
| T14 | P2 | Deploy to GitHub Pages | Public URL |
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
5. Check the site locally, then commit `assets/js/data.js` and push. GitHub Pages updates in about a minute.

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
