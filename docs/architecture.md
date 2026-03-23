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

Reserved for Phase 2. It will combine:

- `performance.getEntriesByType("resource")`
- DOM inspection
- URL and domain parsing

### Analysis pipeline

Reserved for later phases and kept separate on purpose:

- `src/features/scan`
- `src/features/detection`
- `src/features/scoring`
- `src/features/insights`

This separation prevents the early UI work from getting mixed into the cost-risk logic.

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
Page -> Scan snapshot -> Detection signals -> Score breakdown -> User-facing insights
```

## Section-by-Section Build Order

1. Extension setup and build output
2. UI injection and static shell
3. Fake data for interaction feel
4. Real page scanning
5. Detection rules
6. Score system
7. Insight language
8. Refine estimate inputs
9. Polish
10. Final testing
