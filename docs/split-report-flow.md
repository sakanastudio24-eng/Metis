# Split Report Flow

This is the current top-of-report shape in Phase 4.

Metis now treats the overview as three parallel reads:

- `Score`
- `Control`
- `Confidence`

That split matters because these ideas answer different questions.

## Score

This is the waste-facing read.

It answers:

- how much avoidable cost pressure is visible
- whether the route is doing work that looks unnecessary
- how likely it is that the current request, transfer, and vendor pattern will scale badly

The score pipeline should penalize waste hard and complexity softly.

Strong waste signals:

- duplicate endpoints and repeated loading
- oversized images
- analytics or vendor sprawl

Softer context signals:

- request volume
- payload weight
- hosting or CDN presence

## Control

This is the judgment read.

It answers:

- does this route look complex for a good reason
- is the current weight expected for the product shape
- does the route seem intentional, or mostly avoidable

The control layer reads:

- route metrics
- duplicate and third-party waste
- stack context
- fairness answers
- deeper refinement answers

The fairness layer now starts with two lightweight questions:

- what type of page is this route on
- is this the main public page

Those answers help Metis judge a route more fairly without pretending the raw scan changed.

The page-type answer is stored by normalized page key. The main-page answer also starts from the current route, but once one route is marked as the main page, other routes should be treated as separate routes from it instead of asking that question again.

There is also a light-route safeguard in the insight layer.

If a route stays under 50 retained requests, under 500 KB, and clear of duplicate waste, Metis should not describe it as a heavy route just because the page type is marketing.

Hosting and CDN should stay supporting context unless they are paired with heavier transfer or repeated work. They should not read like the main problem by themselves.

Modern framework routes should also soften duplicate interpretation a little. Chunk-heavy routes can legitimately replay assets, but duplicate API work should still read as stronger waste than repeated script loading.

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

If the route returns only a tiny amount of network activity, confidence should read `Limited` instead of `Moderate`.

That state means:

- Metis saw very little network activity
- the route may be cached or idle
- the read can still be useful, but it should sound more careful

## Why the split exists

Before this change, Metis could sound too harsh.

A route with real AI work, a real SPA shell, or legitimate media weight could look "bad" even when the underlying cost profile was expected.

The split makes the product say:

- this route may be creating unnecessary cost pressure
- and this is how justified the complexity looks
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

When the user is in the local upgraded state, the fullscreen report should also expose `Degrade to free`.

That control only changes presentation tier. It must not change:

- score
- control
- confidence
- issue order
- cost direction

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
- `Single Page` and `Multipage Scan (beta)` live in the Combined Score card
- `Single Page` is the default read
- confidence sits with the score and control summary
- quick insight and session cost remain nearby
- tiny positive monthly projections should not round down to `$0/month`
- page context questions sit below the summary once the first scan is ready
- the report reads as `Score`, `Control`, and `Confidence`, instead of one mixed block
- when `Multipage Scan (beta)` is selected, Metis adds sampled-page evidence only

Multipage scan:

- never changes score, control, confidence, top issues, or cost estimate
- shows sampled-page count and a short comparison note
- can add one recurring-pattern note like duplicate requests appearing across sampled pages
- exists to add credibility and route-pattern context, not to average the site

Known stack:

- if hosting or CDN is the only resolved group, keep the grouped stack block hidden
- hosting can still appear in chips and supporting context

## Refresh behavior

The split summary is also the first place Metis now uses section-level refresh.

Instead of remounting the whole report body on every soft update, the score summary can animate independently while the rest of the report stays stable.
