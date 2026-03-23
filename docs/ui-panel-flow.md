# UI Panel Flow

This is the current UI flow for the injected Metis panel.

## States

- `idle`: right-edge trigger only
- `mini`: compact panel for quick scanning
- `full`: expanded panel for detail and comparison

## Current Data Flow

1. `App.tsx` receives a fresh `RawScanSnapshot`.
2. `useMetisState.ts` stores the current snapshot, baseline snapshot, and visited-page snapshots.
3. `PhaseOneShell.tsx` renders:
   - single-page metrics
   - multipage metrics
   - baseline comparison
   - top offenders
   - roadmap status

## Phase 3 UI Goal

Keep the same panel structure, but replace the roadmap-heavy Phase 2 copy with:

- score at the top
- 3 to 5 issues in the middle
- short explanation of why each issue matters
- score breakdown and baseline compare below

The panel should still support both `Single Page` and `Multipage`.
