# Split Report Flow

This is the current top-of-report shape in Phase 4.

Metis now treats the overview as three parallel reads:

- `Cost Risk`
- `Control`
- `Confidence`

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
- fairness answers
- deeper refinement answers

The fairness layer now starts with two lightweight questions:

- what type of page is this
- is this representative of the main public experience

Those answers help Metis judge a route more fairly without pretending the raw scan changed.

There is also a light-route safeguard in the insight layer.

If a route stays under 50 retained requests, under 500 KB, and clear of duplicate waste, Metis should not describe it as a heavy route just because the page type is marketing.

## Confidence

This is the trust read.

It answers:

- how complete is the current route picture
- how much of the result comes from strong page evidence
- whether Metis should sound firm or more careful

The confidence layer reads:

- retained request volume
- meaningful asset weight
- stack coverage
- missing cost groups
- warming or sparse scan state

## Why the split exists

Before this change, Metis could sound too harsh.

A route with real AI work, a real SPA shell, or legitimate media weight could look "bad" even when the underlying cost profile was expected.

The split makes the product say:

- this route is expensive
- and this is how justified that expense looks
- and this is how complete the current read is

That is more believable than one flat score.

## Free and Plus

Free and Plus must read from the same base report truth.

That means both modes share:

- score
- control
- confidence
- estimate range
- top issue order
- main insight

Plus only adds depth:

- route context
- fix order
- scale simulation
- recommendation detail

The fairness questions are shared across Free and Plus.

That means:

- Free gets a fairer read
- Plus gets the same fairer read plus more depth
- neither mode gets a different truth

Plus must not replace the base read with a different story.

## Where it lives

- [src/app/components/figures/SplitScoreSummary.tsx](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/src/app/components/figures/SplitScoreSummary.tsx)
- [src/app/components/figures/liveAdapter.ts](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/src/app/components/figures/liveAdapter.ts)
- [src/features/control/control.ts](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/src/features/control/control.ts)
- [src/features/confidence/index.ts](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/src/features/confidence/index.ts)

## UI behavior

Mini panel:

- compact side-by-side summary
- no long explanation blocks

Full report:

- same split summary pattern
- confidence sits with the score and control summary
- quick insight and session cost remain nearby
- page context questions sit below the summary once the first scan is ready
- the report reads as `Cost Risk`, `Control`, and `Confidence`, instead of one mixed block

## Refresh behavior

The split summary is also the first place Metis now uses section-level refresh.

Instead of remounting the whole report body on every soft update, the score summary can animate independently while the rest of the report stays stable.
