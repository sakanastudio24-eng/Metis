# Metis

Metis is a Chrome extension that keeps a lightweight bridge on the page and moves the main product workspace into Chrome's side panel.

The product goal is still simple:

- open a site
- click the Metis hover
- stream the current route into the side panel
- see a score, issues, stack context, and a rough waste read

This repo keeps one project `README.md` at the root. Everything else in `docs/` is a named flow or reference note, not another project README.

## Current Status

Phase 4 is functionally in place.

The live path now covers:

- scan collection
- normalization
- issue detection
- score breakdowns
- deterministic insight copy
- stack fingerprint resolution
- provider-aware pricing assumptions
- capture history
- Plus refinement
- side panel workspace rendering

What is working now:

- Chrome Extension Manifest V3 setup
- React + TypeScript + Tailwind extension scaffold
- always-visible on-page hover on normal web pages
- on-demand Metis scan after the page hover is clicked
- Chrome side panel workspace for the compact panel
- split `Cost Risk` and `Control` summaries in both panel and full report
- tab-session bridge between page state and the side panel
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
- public flow docs for scanning, normalization, stack detection, pricing, capture, and UI mapping
- internal pricing reference layer for provider-aware estimate wording
- local settings for scan behavior, motion, layout, and saved-scan management
- export document shell for future PDF/report output

What is not finished yet:

- final copy tuning across more sites
- estimate calibration across more provider and traffic shapes
- store-ready polish and review

## Stack

- React
- TypeScript
- Tailwind CSS
- Vite
- Chrome Extension Manifest V3

## Product Direction

Metis should feel like a lightweight layer on top of a site, with the stable compact workspace living in the browser side panel and the fullscreen report opening back inside the page DOM.

The live implementation uses:

- an always-mounted hover bridge on normal web pages
- a Shadow DOM mount to isolate extension styles from host page styles
- a content-script bridge for scan lifecycle and route awareness
- a side panel app for the stable compact Metis workspace
- a page-owned fullscreen report overlay for deeper reading
- a deterministic scan -> detect -> score -> insight pipeline
- a parallel control layer so heaviness and justification are shown separately
- a fingerprint-based stack detector for cost-relevant vendors
- a local pricing reference layer for estimate framing
- local-only settings and save management

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

The repo uses named flow docs in [docs](/Users/zech/Downloads/The-Big-One/Metis/docs) instead of nested generic `README.md` files.

## Start Here

If you want the shortest path through the repo:

1. read [docs/flow-overview.md](/Users/zech/Downloads/The-Big-One/Metis/docs/flow-overview.md)
2. read [docs/extension-runtime-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/extension-runtime-flow.md)
3. read [docs/sidepanel-session-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/sidepanel-session-flow.md)
4. read [docs/stack-fingerprint-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/stack-fingerprint-flow.md)
5. read [docs/pricing-reference-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/pricing-reference-flow.md)
6. read [docs/split-report-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/split-report-flow.md)
7. read [docs/settings-export-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/settings-export-flow.md)
8. read [docs/design-system-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/design-system-flow.md)

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
- after reloading, refresh the target page so the hover bridge mounts again
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
- version: see [package.json](/Users/zech/Downloads/The-Big-One/Metis/package.json) and [manifest.json](/Users/zech/Downloads/The-Big-One/Metis/manifest.json)
- description: `Surface cost-risk signals directly on the page.`

The extension currently requests:

- `activeTab`
- `storage`
- `scripting`
- `sidePanel`
- `host_permissions: <all_urls>`
- `content_scripts.matches: <all_urls>`

This is the current hover-plus-side-panel permission model:

- `storage` for captures, history, and refinement state
- `host_permissions` and `content_scripts` so the Metis hover stays visible on normal pages
- `sidePanel` so the main Metis workspace lives in extension context
- `activeTab` and `scripting` as a fallback if the toolbar action needs to re-establish the bridge for the current tab

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

## Flows

If you want to understand the product quickly, these are the best docs to start with:

- [docs/flow-overview.md](/Users/zech/Downloads/The-Big-One/Metis/docs/flow-overview.md)
- [docs/architecture.md](/Users/zech/Downloads/The-Big-One/Metis/docs/architecture.md)
- [docs/scan-signal-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/scan-signal-flow.md)
- [docs/normalization-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/normalization-flow.md)
- [docs/extension-runtime-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/extension-runtime-flow.md)
- [docs/sidepanel-session-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/sidepanel-session-flow.md)
- [docs/capture-save-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/capture-save-flow.md)
- [docs/design-system-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/design-system-flow.md)
- [docs/stack-fingerprint-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/stack-fingerprint-flow.md)
- [docs/pricing-reference-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/pricing-reference-flow.md)
- [docs/split-report-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/split-report-flow.md)
- [docs/settings-export-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/settings-export-flow.md)

Phase-based references live in:

- [docs/phase-2-plan.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-2-plan.md)
- [docs/phase-2-review.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-2-review.md)
- [docs/phase-3-logic-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-3-logic-flow.md)
- [docs/phase-3-ui-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-3-ui-flow.md)
- [docs/scoring-config-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/scoring-config-flow.md)
- [docs/ui-panel-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/ui-panel-flow.md)

Phase 4 planning now lives in:

- [docs/phase-4-research-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-4-research-flow.md)
- [docs/phase-4-implementation-plan.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-4-implementation-plan.md)
- [docs/phase-4-insight-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-4-insight-flow.md)
- [docs/plus-refinement-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/plus-refinement-flow.md)

## Next Step

The next cleanup pass after the current Phase 4 logic work is:

- compare logic output against more real-site manual tests
- keep tightening copy and estimate framing
- reduce remaining UI drift across host pages
- review permissions and bundle size before store submission
