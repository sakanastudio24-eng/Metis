# Metis

Metis is a Chrome extension that surfaces cost-risk signals directly on a webpage.

The v1 product goal is simple:

- open any site
- click Metis
- see a cost risk score
- see 3 to 5 real issues
- see a rough cost insight

V1 is intentionally constrained:

- no auth
- no backend
- no AI dependency

## Current Status

Phase 4 logic is complete. The deterministic insight layer, scan-hardening pass, and logic tests are now implemented, with UI polish and store-readiness cleanup still remaining.

What is working now:

- Chrome Extension Manifest V3 setup
- React + TypeScript + Tailwind extension scaffold
- content script injection on normal webpages
- floating Metis trigger
- live mini panel and full panel with score-first Phase 3 UI
- filtered resource pipeline with duplicate, third-party, and top-offender signals
- per-origin baseline comparison
- multipage accumulation across visited pages
- page-change rescans and temporary polling during Phase 2
- guaranteed post-load rescan for pages that are still settling
- issue detection from normalized metrics
- score labels and deduction breakdowns
- deterministic insight generation from score + issue output
- optional Plus report refinement questions and stack-aware guidance
- logic tests for normalization, scoring, and insights
- local visual test pages for layout checks
- public threshold, weighting, and scoring flow docs

What is not finished yet:

- final copy tuning across more sites
- estimate refinement beyond qualitative labels
- store-ready polish and review

## Stack

- React
- TypeScript
- Tailwind CSS
- Vite
- Chrome Extension Manifest V3

## Product Direction

Metis should feel like a lightweight layer on top of a site, not a separate dashboard.

The current implementation uses:

- a content script to inject the UI
- a Shadow DOM mount to isolate extension styles from host page styles
- local React state for the panel flow
- a completed scan pipeline feeding detection, scoring, and insight output
- public flow docs for normalization, scoring, insights, and runtime isolation

## Repo Structure

```text
src/
  app/                  Extension UI shell and panel state
  background/           Manifest V3 service worker
  content/              Content script bootstrap and DOM mount
  features/
    scan/               Implemented Phase 2 scan pipeline
    detection/          Phase 3 issue detection
    scoring/            Phase 3 scoring
    insights/           Phase 4 cost insight output
    refinement/         Plus question-based report refinement
  shared/
    types/              Shared contracts
  styles/               Tailwind entry and design tokens

visual-test/            Local pages for extension UI checks
docs/                   Architecture and testing notes
```

The repo now uses named flow docs in [docs](/Users/zech/Downloads/The-Big-One/Metis/docs)
instead of nested generic `README.md` files.

## Setup

```bash
pnpm install
pnpm build
```

## Load In Chrome

1. Run `pnpm build`
2. Open `chrome://extensions`
3. Turn on `Developer mode`
4. Click `Load unpacked`
5. Select [dist](/Users/zech/Downloads/The-Big-One/Metis/dist)

Important:

- load `dist/`, not the repo root
- reload the extension after code changes
- refresh the webpage after reloading so the content script runs again
- content scripts do not run on Chrome-internal pages like `chrome://`

## Development Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm visual:test:extension
pnpm visual:test
```

What they do:

- `pnpm dev` watches and rebuilds the extension into `dist/`
- `pnpm build` creates a fresh production build in `dist/`
- `pnpm typecheck` runs TypeScript checks
- `pnpm test:logic` runs the deterministic Phase 4 logic suite
- `pnpm visual:test:extension` rebuilds the extension for UI testing
- `pnpm visual:test` serves the local visual fixture pages at `http://127.0.0.1:4173`

## Visual Testing

Use the local fixtures to validate the injected UI against stable layouts:

- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/sites/marketing/`
- `http://127.0.0.1:4173/sites/dashboard/`
- `http://127.0.0.1:4173/sites/media-heavy/`

Recommended loop:

1. Run `pnpm visual:test`
2. Run `pnpm build`
3. Reload the unpacked extension in `chrome://extensions`
4. Refresh one of the local test pages
5. Check the idle button, mini panel, full panel, overlap, and mobile width behavior

See [docs/visual-testing.md](/Users/zech/Downloads/The-Big-One/Metis/docs/visual-testing.md)
and [docs/visual-test-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/visual-test-flow.md).

## Manifest Notes

Current manifest values:

- name: `Metis`
- version: `0.0.0.21`
- description: `Surface cost-risk signals directly on the page.`

The extension currently requests:

- `activeTab`
- `storage`
- `host_permissions: <all_urls>`

These permissions support the planned scanning model, but should be reviewed again before store submission.

## Roadmap

Phase 1

- extension setup
- UI injection
- static panel flow

Phase 2

- real page scanning
- Performance API resource collection
- DOM inspection
- URL and domain parsing
- filtering, normalization, and stable signal aggregation

Phase 3

- issue detection
- score system
- score-first panel UI

Phase 4

- insight generation
- scan hardening
- logic tests
- plus report refinement layer
- estimate refinement
- polish and ship prep

See [docs/architecture.md](/Users/zech/Downloads/The-Big-One/Metis/docs/architecture.md).

Phase 2 notes live in:

- [docs/phase-2-plan.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-2-plan.md)
- [docs/phase-2-review.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-2-review.md)
- [docs/scan-signal-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/scan-signal-flow.md)
- [docs/normalization-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/normalization-flow.md)
- [docs/extension-runtime-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/extension-runtime-flow.md)

## Next Step

The next implementation milestone after the current Phase 4 logic pass is:

- compare the automated logic suite against manual site tests
- tune the insight copy against more real sites
- fix the remaining layout drift across real host sites
- add estimate refinement without fake precision
- tighten ship-readiness, permissions review, and store-facing polish

Phase 3 planning now lives in:

- [docs/phase-3-logic-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-3-logic-flow.md)
- [docs/phase-3-ui-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-3-ui-flow.md)
- [docs/scoring-config-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/scoring-config-flow.md)
- [docs/ui-panel-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/ui-panel-flow.md)

Phase 4 planning now lives in:

- [docs/phase-4-research-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-4-research-flow.md)
- [docs/phase-4-implementation-plan.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-4-implementation-plan.md)
- [docs/phase-4-insight-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-4-insight-flow.md)
- [docs/plus-refinement-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/plus-refinement-flow.md)
