# UI Panel Flow

This is the current UI flow for the live Metis surfaces.

## States

- `hover`: narrow attached launcher on the right edge
- `panel`: compact Chrome side panel
- `report`: fullscreen DOM report opened from the panel

## Current Data Flow

1. `PageBridgeApp.tsx` collects the current `RawScanSnapshot` and sends it into the tab session.
2. `App.tsx` reads the active tab session in the side panel.
3. `buildCurrentSnapshot()` chooses either:
   - the single-page snapshot
   - or a multipage snapshot reshaped from visited pages.
4. `detection/index.ts` turns the active snapshot into issues.
5. `control/control.ts` interprets how justified that heaviness looks.
6. `scoring/index.ts` converts issues into the cost-risk score.
7. `insights/index.ts` converts the score and issue stack into the Phase 4 insight.
8. `buildPlusOptimizationReport()` optionally sharpens that insight when refinement answers exist.
9. `buildMetisDesignViewModel()` maps the live scan, score, insight, and refinement output into the display model used by the compact panel and fullscreen report.

## Current Presentation Rule

The live UI now follows one shared hierarchy:

- branded header first
- score ring and risk badge next
- quick insight and session cost card next
- issues next
- stack/context after that
- guided refinement and deeper report content in the fullscreen report

The shell still supports both `Single Page` and `Multipage`, but that switch now lives in the full report rather than leading the panel body.
