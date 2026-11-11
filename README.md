# PHT Lab — Accessible Research Dashboard

[![Tests](https://github.com/gorintlapavanprasad/Interactive-Visualization-PHT-Lab-Model/actions/workflows/tests.yml/badge.svg)](https://github.com/gorintlapavanprasad/Interactive-Visualization-PHT-Lab-Model/actions/workflows/tests.yml)

**Live site:** https://gorintlapavanprasad.github.io/Interactive-Visualization-PHT-Lab-Model/

An interactive, accessible dashboard for a systematic literature review of **216 studies (1994–2023)**
on games and play designed for, or with, people with disabilities. Each study is coded in Covidence
against the **PHT Lab framework**: eight two-sided spectra (Fun-first ↔ Utility-first, Play ↔ Game,
Solo ↔ Social, Competitive ↔ Collaborative, Skill ↔ Chance, Symmetrical ↔ Asymmetrical,
Sequential ↔ Simultaneous, Synchronous ↔ Asynchronous), plus study methods, technology, context and
participants.

## What you can do

- **Search all fields:** phrases (`"virtual reality"`), `OR`, `-exclude`, accent-insensitive, and
  abbreviations such as VR, BLV, DHH, IDD and ASD. Results are ranked, with matches highlighted.
- **Filter** by any of 190 framework and characteristic options. Each option shows how many studies
  it would return, and options with no results are greyed out.
- **Plot** any column. Colour the bars by any coded column (or none), show counts or percentages,
  and get a data-table view.
- **Gaps:** a heatmap of any two dimensions (e.g. Community of focus × Study Method). Combinations
  no study has looked at are highlighted.
- **Ratings and Spectrum grids** show where studies sit on each spectrum (viridis colour scale with
  counts in the cells). Click a cell to list its studies.
- **Browse studies** as cards or as a sortable table: choose columns, sort order and page size.
- **Open each paper** directly through its DOI.
- **Share** the exact view: the address always describes it (tab, filters, search, chart, table,
  Gaps), and **Copy link** puts it on the clipboard.
- **Download** the filtered studies as **CSV** or **BibTeX**, or export them with all settings to
  Excel and import them again later.

## Accessibility

Designed and tested for screen-reader, keyboard-only, low-vision (up to 400% zoom), colour-blind,
motor-impaired and cognitive accessibility. Automated tests check WCAG 2.2 AA with axe-core on every
push. Testing with disabled users is still recommended; see `PROJECT_GUIDE.md` §8.

## Run it locally

It's a static site with no build step:

```bash
npx http-server -p 8765 -c-1
```

Then open http://127.0.0.1:8765/. Everything is served from this repository; the site makes no
requests to outside servers, and a strict Content-Security-Policy only lets its own scripts run.

## Update the data (from a Covidence export)

```bash
node tools/build-data.js data/raw/<covidence-export>.csv --dry-run
node tools/build-data.js data/raw/<covidence-export>.csv
cd tools && npm ci && npm run test:update-golden && npm test
```

The first command previews the changes; the second builds the data file and runs the audit; the third
updates the test values and runs the tests. Then commit `assets/js/data.js` and
`tools/tests/golden.json`. Raw exports stay in the git-ignored `data/raw/` folder. Details are in
`PROJECT_GUIDE.md` §10.

## Tests

```bash
cd tools && npm ci && npm test
```

Lint, the data audit, 102 unit tests and 153 browser checks (255 tests): filter counts, known results, accessibility, offline loading,
page size and speed. They run automatically in GitHub Actions. Details are in `PROJECT_GUIDE.md` §13.

## Project layout

```
index.html                 the page
assets/js/core.js          framework definitions, answer matching, DOIs, search engine (no DOM;
                           also used by the data tools)
assets/js/state.js         loads data.js, shared state, small utilities
assets/js/shared.js        answer labels/ordering, viridis colours, contrast
assets/js/filters.js       filtering, live option counts
assets/js/chart.js         Plot tab
assets/js/studies.js       Data tab (cards, table, details)
assets/js/grids.js         Ratings + Spectrum tabs (grids built from SPECTRUM_ROWS)
assets/js/gaps.js          Gaps tab
assets/js/io.js            Excel export / import, CSV and BibTeX downloads
assets/js/share.js         shareable links (view state in the address) and Copy link
assets/js/app.js           start-up, theme, tabs, keyboard, tour (loaded last)
assets/js/data.js          GENERATED study data — don't edit; use tools/build-data.js
assets/css/style.css       styles (light/dark design tokens)
assets/vendor/             Highcharts 12.5, Fomantic UI 2.9.3, Phosphor Icons 2.1.1,
                           jQuery 3.7.1, Shepherd.js, SheetJS
media/                     images
tools/                     data pipeline, audit, tests
PROJECT_GUIDE.md           full documentation: data, decisions, history, roadmap
```

## Third-party software and licences

| Component | Licence |
|---|---|
| [Highcharts](https://www.highcharts.com/) 12.5 | **Commercial licence required** except for qualifying non-commercial use. Confirm that this project's use is covered (see `PROJECT_GUIDE.md` §6). |
| [Fomantic UI](https://fomantic-ui.com/) 2.9.3 | MIT (`assets/vendor/cdn-local/css/FOMANTIC-LICENSE.md`) |
| [Phosphor Icons](https://phosphoricons.com/) 2.1.1 | MIT (`assets/vendor/phosphor-icons-2.1.1/LICENSE`) |
| Lato font | SIL Open Font License 1.1 |
| jQuery 3.7.1, Shepherd.js 10.0.1 | MIT |
| SheetJS Community Edition (xlsx) | Apache-2.0 |
| [axe-core](https://github.com/dequelabs/axe-core), puppeteer-core (tests only) | MPL-2.0 / Apache-2.0 |
