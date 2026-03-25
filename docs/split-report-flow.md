# Split Report Flow

This is the current top-of-report shape in Phase 4.

Metis now treats the overview as two parallel reads:

- `Cost Risk`
- `Control`

That split matters because those two ideas answer different questions.

## Cost Risk

This is the waste-facing read.

It answers:

- how heavy is this route?
- how much cost pressure is visible?
- how likely is it that the current request, transfer, and vendor pattern will scale badly?

The existing issue detection and score pipeline drives this side.

## Control

This is the judgment read.

It answers:

- does this route look heavy for a good reason?
- is the current weight expected for the product shape?
- is the cost pressure partly justified, or mostly uncontrolled?

The control layer reads:

- route metrics
- duplicate and third-party waste
- stack context
- refinement answers

## Why the split exists

Before this change, Metis could sound too harsh.

A route with real AI work, a real SPA shell, or legitimate media weight could look "bad" even when the underlying cost profile was expected.

The split makes the product say:

- this route is expensive
- and this is how justified that expense looks

That is more believable than one flat score.

## Where it lives

- [src/app/components/figures/SplitScoreSummary.tsx](/Users/zech/Downloads/The-Big-One/Metis/src/app/components/figures/SplitScoreSummary.tsx)
- [src/app/components/figures/liveAdapter.ts](/Users/zech/Downloads/The-Big-One/Metis/src/app/components/figures/liveAdapter.ts)
- [src/features/control/control.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/control/control.ts)

## UI behavior

Mini panel:

- compact side-by-side summary
- no long explanation blocks

Full report:

- same split summary pattern
- quick insight and session cost remain nearby
- the report reads as `Cost Risk` first, then `Control`, instead of one mixed block

## Refresh behavior

The split summary is also the first place Metis now uses section-level refresh.

Instead of remounting the whole report body on every soft update, the score summary can animate independently while the rest of the report stays stable.
