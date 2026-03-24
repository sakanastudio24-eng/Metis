# UI Panel Flow

This is the current zip-authoritative UI flow for the injected Metis panel.

## States

- `idle`: narrow attached launcher on the right edge
- `mini`: 288px quick-look panel
- `full`: 410px floating panel
- `report`: centered modal report opened from the panel

## Current Data Flow

1. `App.tsx` receives a fresh `RawScanSnapshot`.
2. `useMetisState.ts` stores the current snapshot, baseline snapshot, visited-page snapshots, and Plus answers.
3. `PhaseOneShell.tsx` selects either:
   - the single-page snapshot
   - or a multipage snapshot reshaped from visited pages.
4. `detection/index.ts` turns the active snapshot into issues.
5. `scoring/index.ts` converts those issues into deductions and a score.
6. `insights/index.ts` converts the score and issue stack into the Phase 4 insight.
7. `buildPlusOptimizationReport()` optionally sharpens that insight when refinement answers exist.
8. `buildMetisDesignViewModel()` maps the live scan, score, insight, and refinement output into the prototype-shaped display model used by the panel and report components.

## Current Presentation Rule

The shell now follows the zip-backed hierarchy instead of the older diagnostics-first layout:

- branded header first
- score ring and risk badge next
- quick insight and session cost card next
- issues next
- stack/context after that
- guided refinement and deeper report content in the modal

The shell still supports both `Single Page` and `Multipage`, but that switch now lives in the full report rather than leading the panel body.
