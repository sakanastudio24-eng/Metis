# UI Panel Flow

This is the current UI flow for the injected Metis panel.

## States

- `idle`: right-edge trigger only
- `mini`: compact panel for quick scanning
- `full`: expanded panel for detail and comparison

## Current Data Flow

1. `App.tsx` receives a fresh `RawScanSnapshot`.
2. `useMetisState.ts` stores the current snapshot, baseline snapshot, and visited-page snapshots.
3. `PhaseOneShell.tsx` selects either:
   - the single-page snapshot
   - or a multipage snapshot reshaped from visited pages
4. `detection/index.ts` turns the active snapshot into issues.
5. `scoring/index.ts` converts those issues into deductions and a score.
6. `PhaseOneShell.tsx` renders:
   - score at the top
   - surfaced issues next
   - breakdown, offenders, and baseline comparison below

## Current Panel Rule

The panel should keep the scoring story clear:

- score first
- issues second
- diagnostics third

The panel still supports both `Single Page` and `Multipage`.
