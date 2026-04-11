# Metis Postmortem and Design History

This document is the short operational memory for Metis.

Use it when a behavior regresses, when a product choice starts looking arbitrary, or when a new tuning pass needs historical context before changing the system again.

## Core Product Rules

- scan the current route
- keep the side panel as the compact working view
- keep the fullscreen report in the page DOM
- treat `Score` as avoidable cost pressure
- treat `Control` as whether the route complexity looks justified
- keep Free and Plus on the same numeric truth
- keep multipage scan as supporting context, not scoring

## Launcher Method

The launcher method that proved stable is:

1. manifest-mounted content script on normal `http` and `https` pages
2. fixed Shadow DOM edge clip on the page edge
3. user click on the launcher starts the tab session
4. the same click asks the background worker to open Chrome's native side panel
5. the scan begins after activation, not before

Launcher design rule:

- keep the injected surface as a draggable edge clip with a lightweight preview
- keep the native Chrome side panel as the real workspace
- do not let the page launcher grow into a second full report surface

Important lesson:

- the scanner can be healthy while the panel launch path is broken
- page logs showing `scan summary` do not prove the panel is working
- `chrome.sidePanel.open(...)` is the fragile step

## Native Side Panel Failure

Problem:

- Metis was scanning correctly
- the side panel was not opening
- logs showed live scan updates, visited snapshots, and page comparisons
- user experience looked broken because nothing surfaced in the compact workspace

Root cause:

- the side-panel open call drifted behind extra async work in the background flow
- for Chrome's side panel API, that can lose the user-gesture context needed for the native panel open
- the result was a silent launch failure even though the content bridge and scan pipeline were healthy

What fixed it:

- move `METIS_OPEN_SIDE_PANEL` onto the fastest native path
- keep the open request at the front of the runtime handoff
- prefer native Chrome side panel only
- configure `openPanelOnActionClick` as a secondary native path

What not to do again:

- do not hide panel failures behind scan success
- do not treat a detached tab or popup as the product unless the user explicitly wants it
- do not add extra async worker work ahead of `chrome.sidePanel.open(...)` without retesting the gesture path

## Bridge Deployment Control

Problem:

- the extension bridge can look broken even when the runtime code is correct
- the website branch, commit, and env settings can all look right in preproduction while `https://metis.zward.studio` still serves an older production deployment

Cause:

- preview and production are separate deployment states
- the extension only cares about the public hostname the user lands on
- if the public hostname is not aliased to the intended production deployment, the extension will connect to stale website code and stale bridge behavior

What fixed it operationally:

- verify the production hostname, not just the preview deployment
- confirm the production deployment is built from the intended branch and commit
- confirm production env values match the bridge contract

Control rule:

- treat passed branch and preview success as insufficient proof
- treat the production alias on `https://metis.zward.studio` as the only bridge source of truth
- before changing extension bridge code again, verify that production and preview are not diverging on bridge-critical values

Known production reference at the time this lesson was recorded:

- production source branch: `codex/perf-client-islands`
- production commit: `d24037a`
- public hostname: `https://metis.zward.studio`

## Scan and Session Hurdles

### Scan hydration gap

Problem:

- scans completed in the page bridge
- the panel and fullscreen report sometimes stayed empty

Cause:

- the UI was waiting for rebroadcast timing instead of hydrating from the first successful scan write

Fix:

- hydrate from the `METIS_SCAN_UPDATE` response immediately
- keep a brief retry for active sessions missing their first snapshot

### Sampled pages stuck at 1

Problem:

- sampled page count did not grow across same-site routes

Cause:

- route history and saved snapshots were too tied to raw URL noise and too heavy to store well

Fix:

- key sampled pages by normalized route
- keep stored visited snapshots compact

### Main-page question repeated on every route

Problem:

- once the user marked one route as the main public page, Metis still kept asking the same question elsewhere

Cause:

- fairness context was too page-local and lacked a site-level main-route inheritance rule

Fix:

- one route can hold the `main page` role
- other routes inherit `specific route` by default

## Score Model Hurdles

### Free and Plus contradicted each other

Problem:

- Free and Plus could describe the same route with completely different realities

Cause:

- Plus had drifted into overriding the base report read instead of extending it

Fix:

- unify the base pipeline
- keep one truth for score, control, confidence, issue order, and cost direction
- let Plus add depth only

### Complexity was being punished like waste

Problem:

- modern marketing pages and app routes were scoring too harshly
- heavy but justified routes looked broken

Cause:

- request count, payload, chunking, and framework complexity were acting like primary negatives

Fix:

- lock `Score` to avoidable cost pressure
- add `Control` to express justified complexity
- penalize waste hard
- penalize complexity softly
- credit justified complexity modestly

### Refine changed copy more than numbers

Problem:

- route context answers were improving wording but not visibly changing the read

Cause:

- context inputs were too weak or too late in the scoring path

Fix:

- normalize route context into shared scoring and control logic
- make refinement visibly change score and control
- keep the raw scan unchanged

## Why Features Were Added

### Control

Why it exists:

- one score was not enough
- users needed a way to distinguish expensive and justified from expensive and wasteful

What it solves:

- a complex route can still be controlled
- a light route can still be sloppy
- the product can talk about fairness without hiding waste

### Confidence

Why it exists:

- low-activity or warming scans can look falsely certain

What it solves:

- tells the user how complete the read is
- softens the wording when the scan is sparse
- does not change the underlying score

Important lesson:

- repeated confidence helper copy reduces trust
- the confidence explanation should appear once, not everywhere

### Multipage scan

Why it exists:

- users needed context beyond a single route
- credibility improves when Metis can say it has seen more than one page

What it should not do:

- it must not average or override the current route
- it must not change score, control, confidence, top issues, or cost estimate

What it should do:

- show sampled page count
- show whether patterns are similar or worse elsewhere
- highlight repeated cross-route signals like duplicate requests

### Context fairness questions

Why they exist:

- route type matters
- a marketing homepage, dashboard, docs route, and AI surface should not be judged the same way

What they should do:

- help Metis judge the route more fairly
- adjust interpretation and control modestly

What they should not do:

- rewrite the raw scan
- flip reality

## Permission and Settings Hurdles

### Versioning cutover

Problem:

- the repo was using a `0.0.0.x` stream that did not communicate release intent well

Fix:

- move normal work to minor releases starting at `0.1.0`
- reserve patch releases for smaller fixes
- document the historical trail in `docs/updates.md`

### Broad host access

Problem:

- `"<all_urls>"` was too broad for comfort and review posture

Fix:

- narrow to normal `http` and `https` pages
- explain permissions in product copy

### Permission toggles versus real Chrome permissions

Problem:

- users wanted permission control inside Metis

What we shipped:

- local capability toggles for Metis behavior

Important boundary:

- these toggles change extension behavior
- they do not uninstall Chrome's base MV3 permissions from the browser

## Practical Checks Before Changing Metis Again

Ask these first:

1. Is the report describing waste, or just describing complexity?
2. Did the scan break, or did the UI fail to surface a healthy scan?
3. Does this change keep Free and Plus on the same numeric truth?
4. Does multipage stay contextual instead of becoming a second scoring path?
5. Does the launcher still open the real Chrome side panel on a live page?

## Related Docs

- [docs/approved-score-model-v1.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/approved-score-model-v1.md)
- [docs/updates.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/updates.md)
- [docs/extension-runtime-flow.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/extension-runtime-flow.md)
- [docs/split-report-flow.md](/Users/zech/Downloads/The-Big-One/Metis-Full/Metis/docs/split-report-flow.md)
