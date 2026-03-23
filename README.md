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

The repo is currently at Phase 2.

What is working now:

- Chrome Extension Manifest V3 setup
- React + TypeScript + Tailwind extension scaffold
- content script injection on normal webpages
- floating Metis trigger
- live mini panel and full panel with normalized scan totals
- filtered resource pipeline with duplicate, third-party, and top-offender signals
- local visual test pages for layout checks

What is not built yet:

- issue detection
- score calculation from real data
- cost insight from real data

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
- reserved feature modules for later scan, detection, scoring, and insight work

## Repo Structure

```text
src/
  app/                  Extension UI shell and panel state
  background/           Manifest V3 service worker
  content/              Content script bootstrap and DOM mount
  features/
    scan/               Reserved for real scanning
    detection/          Reserved for issue detection
    scoring/            Reserved for scoring
    insights/           Reserved for cost insight output
  shared/
    types/              Shared contracts
  styles/               Tailwind entry and design tokens

visual-test/            Local pages for extension UI checks
docs/                   Architecture and testing notes
```

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

See [docs/visual-testing.md](/Users/zech/Downloads/The-Big-One/Metis/docs/visual-testing.md).

## Manifest Notes

Current manifest values:

- name: `Metis`
- version: `0.0.0.9`
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

Phase 3

- issue detection
- score system

Phase 4

- insight generation
- estimate refinement
- polish and ship prep

See [docs/architecture.md](/Users/zech/Downloads/The-Big-One/Metis/docs/architecture.md).

Phase 2 implementation prep lives in [docs/phase-2-plan.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-2-plan.md).

## Next Step

The next implementation milestone is Phase 2:

- collect `performance.getEntriesByType("resource")`
- summarize page resources
- inspect basic DOM counts
- build the first real scan snapshot contract
