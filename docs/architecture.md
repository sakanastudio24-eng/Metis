# Metis Architecture

## Guiding Constraints

- No backend
- No auth
- No AI dependency in v1
- One-click value on any site
- Build the product section by section against the roadmap

## Core Decisions

### Extension shell

- Manifest V3
- Content script injects a React app into a Shadow DOM
- Background service worker stays minimal until extension events need coordination

### UI layer

- React + local component state first
- Tailwind for layout and utility styling
- CSS variables define the initial brand tokens:
  - dark blue
  - orange
  - white

### Scanning layer

Implemented in Phase 2. It combines:

- `performance.getEntriesByType("resource")`
- DOM inspection
- URL and domain parsing
- resource filtering and URL normalization
- request classification and duplicate tracking
- top-offender aggregation for user-facing trust

### Analysis pipeline

Separated on purpose so each phase can evolve cleanly:

- `src/features/scan`
- `src/features/detection`
- `src/features/scoring`
- `src/features/insights`

This separation prevents scan cleanup, issue logic, and scoring heuristics from getting mixed together.

## Current Phase 3 Configuration

Phase 3 is now driven by public config files:

- `src/features/detection/config.ts`
- `src/features/scoring/config.ts`

This keeps:

- thresholds
- score penalties
- category multipliers
- label thresholds

out of the engine code so tuning stays mechanical and reviewable.

## Phase 4 Direction

Phase 4 remains deterministic and local-first.

The current implemented flow is:

```text
Normalized snapshot -> detected issues -> weighted score -> plain-language insight
```

That means `src/features/insights` consumes Phase 3 outputs rather than re-reading raw browser data.

The runtime now also guarantees:

- an immediate scan for fast UI population
- a one-shot post-load rescan for pages that are still settling
- console-only debug summaries per scan pass

## Planned Source Layout

```text
src/
  app/                  React shell and local UI state
  background/           MV3 service worker
  content/              content script bootstrap and DOM mounting
  features/
    scan/               raw data collection from the page
    detection/          issue detection from raw scan data
    scoring/            score and severity calculation
    insights/           user-facing language and cost summaries
  shared/
    lib/                shared helpers
    types/              shared data contracts
  styles/               Tailwind entry and design tokens
```

## Expected Data Flow

```text
Page -> Normalized scan snapshot -> Detection signals -> Score breakdown -> User-facing insight
```

## Section-by-Section Build Order

1. Extension setup and build output
2. UI injection and static shell
3. Fake data for interaction feel
4. Real page scanning
5. Scan-signal cleanup and trust pass
6. Detection rules
7. Score system
8. Insight language
9. Refine estimate inputs
10. Polish
11. Final testing
