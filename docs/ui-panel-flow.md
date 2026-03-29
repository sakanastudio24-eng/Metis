# UI Panel Flow

This is the current UI flow for the live Metis surfaces.

## States

- `hover`: narrow attached launcher on the right edge
- `panel`: compact Chrome side panel
- `report`: fullscreen DOM report opened from the panel

## Current Data Flow

1. `PageBridgeApp.tsx` collects the current `RawScanSnapshot` and sends it into the tab session.
2. `App.tsx` reads the active tab session in the side panel.
3. `buildCurrentSnapshot()` now always returns the current-route snapshot for the main report path.
4. `buildMultipageEvidence()` turns visited pages into sampled-page context without changing the current-route score.
5. `detection/index.ts` turns the active snapshot into issues.
6. `control/control.ts` interprets how justified that heaviness looks.
7. `scoring/index.ts` converts issues into the cost-risk score.
8. `insights/index.ts` converts the score and issue stack into the Phase 4 insight.
9. `buildPlusOptimizationReport()` optionally sharpens that insight when refinement answers exist.
10. `buildMetisDesignViewModel()` maps the live scan, score, insight, refinement output, and sampled-page context into the display model used by the compact panel and fullscreen report.

## Current Presentation Rule

The live UI now follows one shared hierarchy:

- branded header first
- score ring and risk badge next
- quick insight and session cost card next
- issues next
- stack/context after that
- guided refinement and deeper report content in the fullscreen report

The shell still supports both `Single Page` and `Multipage Scan (beta)`, but that switch now lives in the full report rather than leading the panel body.

`Multipage Scan (beta)` is supporting context only.

It can add:

- sampled-page count
- similar or higher-cost comparison text
- one recurring-pattern note

It must not change:

- score
- control
- confidence
- top issues
- cost estimate
