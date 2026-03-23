# Phase 2 Plan

Phase 2 is where Metis stops being only a UI shell and starts collecting real page data.

The implementation target for this phase is a real `RawScanSnapshot` built inside the content script context from:

- Performance API resource entries
- lightweight DOM inspection
- URL/domain parsing

This phase should stop at data collection. It should not implement issue detection, scoring, or insight copy yet.

## Scope

Build these three functions:

- `src/features/scan/performance.ts`
- `src/features/scan/dom.ts`
- `src/features/scan/url.ts`

Then compose them into the first real scan snapshot shape from [src/shared/types/audit.ts](/Users/zech/Downloads/The-Big-One/Metis/src/shared/types/audit.ts).

## Research Findings

### 1. Content script is the right execution surface

Metis is already mounted as a content script, and Chrome documents that content scripts run in web pages, can use the DOM, and can exchange messages with the rest of the extension.

Implication for Metis:

- keep Phase 2 scanning in the content script
- do not move scan collection into the background service worker
- only message the background later if cross-context coordination becomes necessary

Source:

- Chrome content scripts docs: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts

### 2. `performance.getEntriesByType("resource")` is a snapshot, not a live stream

`getEntriesByType()` returns the entries that already exist in the performance timeline at call time. It does not notify about new entries.

Implication for Metis:

- the first implementation can safely use a one-shot snapshot scan
- if later phases need live updates after the panel opens, add `PerformanceObserver`

Sources:

- MDN `getEntriesByType()`: https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntriesByType
- MDN `PerformanceObserver.observe()`: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/observe

### 3. Resource timing buffer size can matter on busy pages

The resource timing buffer is finite. MDN notes the initial size is required to be 250 or greater, and it can be expanded with `performance.setResourceTimingBufferSize()`.

Implication for Metis:

- call `performance.setResourceTimingBufferSize(1000)` before collecting resource entries
- do not clear the buffer in Phase 2
- avoid adding a buffer-full listener until live observation is needed

Source:

- MDN `setResourceTimingBufferSize()`: https://developer.mozilla.org/en-US/docs/Web/API/Performance/setResourceTimingBufferSize

### 4. Cross-origin size data is often incomplete

For cross-origin resources, `transferSize` and `encodedBodySize` can be `0` unless the response includes `Timing-Allow-Origin`.

Implication for Metis:

- do not treat `0` as “small” by default
- treat `0` as “unknown or cached or cross-origin restricted”
- build Phase 2 summaries so later detection logic can distinguish known size from unknown size

Sources:

- MDN `transferSize`: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize
- MDN `encodedBodySize`: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/encodedBodySize
- MDN `Timing-Allow-Origin`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Timing-Allow-Origin

### 5. URL parsing should use the platform `URL` API

The `URL` interface is the correct way to parse, normalize, and read URL components like `href`, `origin`, `hostname`, and `pathname`.

Implication for Metis:

- use `new URL(href)` inside `parsePageContext()`
- use the parsed hostname later for first-party vs third-party comparisons

Source:

- MDN `URL`: https://developer.mozilla.org/en-US/docs/Web/API/URL

## Phase 2 Deliverable

By the end of this phase, the extension should be able to build a real `RawScanSnapshot` with:

- `scannedAt`
- `page`
- `resources`
- `dom`

The UI does not need to show final issue cards yet. A simple “scan captured” debug block or console output is enough for this phase.

## Implementation Plan

### Step 1. Finish `parsePageContext()`

File:

- [src/features/scan/url.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/scan/url.ts)

Implement:

- `const url = new URL(href)`
- return `href`, `origin`, `hostname`, `pathname`

Guardrail:

- keep the function pure
- only parse one input string and return a typed object

### Step 2. Finish `inspectDomSurface()`

File:

- [src/features/scan/dom.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/scan/dom.ts)

Implement:

- `document.querySelectorAll("script").length`
- `document.querySelectorAll("img").length`
- `document.querySelectorAll("iframe").length`

Guardrail:

- keep this intentionally shallow in Phase 2
- no mutation observers yet
- no expensive traversal yet

### Step 3. Finish `collectResourceSummaries()`

File:

- [src/features/scan/performance.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/scan/performance.ts)

Implement:

- call `performance.setResourceTimingBufferSize(1000)`
- read `performance.getEntriesByType("resource")`
- narrow entries to `PerformanceResourceTiming`
- map each entry into:
  - `name`
  - `initiatorType`
  - `transferSize`
  - `encodedBodySize`
  - `duration`

Guardrail:

- keep the raw resource list intact for now
- do not aggregate yet
- do not classify yet

### Step 4. Add a scan composer

Recommended new file:

- `src/features/scan/index.ts`

Implement a small function like:

```ts
export function collectRawScanSnapshot(): RawScanSnapshot
```

It should:

- call `parsePageContext(window.location.href)`
- call `collectResourceSummaries()`
- call `inspectDomSurface()`
- stamp `new Date().toISOString()`

### Step 5. Surface the data for validation

Phase 2 validation should stay simple:

- `console.log(snapshot)`
- optionally render counts in the Phase 1 panel

Recommended first UI output:

- page hostname
- number of resource entries
- number of scripts
- number of images
- number of iframes

That is enough to confirm the real scan path works before building detection rules.

## Data Shape Notes

The current `ResourceSummary` type is acceptable for the first pass, but a later expansion is likely.

Likely future additions:

- `decodedBodySize`
- `responseStatus`
- `protocol`
- derived `domain`
- `isCrossOrigin`

For Phase 2, do not expand the shared types unless implementation pressure requires it.

## Risks To Handle Explicitly

### Cross-origin resource sizes

Do not assume missing size means small resource usage. Many cross-origin resources will report `0`.

### Buffer truncation on heavy pages

If a very heavy page exceeds the default buffer before Metis reads it, resource counts can be incomplete. Increasing the buffer early reduces this risk.

### Timing variance by when the user opens the panel

Because `getEntriesByType("resource")` is a snapshot, results depend on when the scan is triggered.

Inference:

For Metis v1, the most stable behavior is to collect once when the content script initializes, then refresh later only when the user explicitly asks or when a later phase adds live observation.

## Recommended Build Order

1. Implement `url.ts`
2. Implement `dom.ts`
3. Implement `performance.ts`
4. Add `scan/index.ts`
5. Log the snapshot in the content script
6. Add a minimal debug readout in the panel

## Definition Of Done For Phase 2

Metis can open on a normal webpage and produce a real scan snapshot that includes:

- parsed page context
- real resource entries from the browser performance timeline
- basic DOM counts

No scoring or issue language is required yet.

## Sources

- Chrome content scripts: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- MDN `Performance.getEntriesByType()`: https://developer.mozilla.org/en-US/docs/Web/API/Performance/getEntriesByType
- MDN `PerformanceObserver.observe()`: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/observe
- MDN Resource timing overview: https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing
- MDN `Performance.setResourceTimingBufferSize()`: https://developer.mozilla.org/en-US/docs/Web/API/Performance/setResourceTimingBufferSize
- MDN `PerformanceResourceTiming.transferSize`: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize
- MDN `PerformanceResourceTiming.encodedBodySize`: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/encodedBodySize
- MDN `Timing-Allow-Origin`: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Timing-Allow-Origin
- MDN `URL`: https://developer.mozilla.org/en-US/docs/Web/API/URL
