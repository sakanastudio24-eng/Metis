# Flow Overview

This is the fastest way to understand how Metis works today.

If you only read one flow note after the root README, read this one first.

## The Short Version

Metis does four jobs in sequence:

1. scan the current route
2. normalize the noisy browser data into stable signals
3. turn those signals into issues, cost risk, control, stack context, and estimate language
4. map that output into the injected panel and report UI

In practice, the live path looks like this:

```text
Page
  -> scan snapshot
  -> normalized metrics + evidence
  -> detected issues
  -> score breakdown + control assessment
  -> insight + refinement output
  -> pricing context
  -> panel/report view model
```

## Where Each Part Lives

### Scan collection

- [src/features/scan](/Users/zech/Downloads/The-Big-One/Metis/src/features/scan)

This layer gathers what the page is already doing:

- resource timing entries
- DOM counts
- stack signals from hosts, paths, globals, and page markers

## Normalization

- [docs/normalization-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/normalization-flow.md)
- [src/features/scan](/Users/zech/Downloads/The-Big-One/Metis/src/features/scan)

This is where Metis turns raw browser noise into stable values like:

- duplicate requests
- third-party domain counts
- meaningful image weight
- normalized page keys

## Stack detection

- [docs/stack-fingerprint-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/stack-fingerprint-flow.md)
- [src/features/stack](/Users/zech/Downloads/The-Big-One/Metis/src/features/stack)

Metis now resolves stack context from evidence and fingerprints instead of brittle one-off checks.

That means it:

- collects evidence first
- scores fingerprints second
- only asks fallback questions when cost-relevant groups are still unresolved

## Detection, scoring, and insight

- [src/features/detection](/Users/zech/Downloads/The-Big-One/Metis/src/features/detection)
- [src/features/scoring](/Users/zech/Downloads/The-Big-One/Metis/src/features/scoring)
- [src/features/insights](/Users/zech/Downloads/The-Big-One/Metis/src/features/insights)
- [docs/phase-4-insight-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/phase-4-insight-flow.md)

This is the deterministic product core:

- detect problems
- assign weighted deductions
- summarize the result in plain language

## Control layer

- [src/features/control](/Users/zech/Downloads/The-Big-One/Metis/src/features/control)
- [docs/split-report-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/split-report-flow.md)

This layer answers the judgment question:

- is the route heavy?
- and does that heaviness look justified?

Metis now keeps `Cost Risk` and `Control` separate on purpose.

## Capture and cross-page history

- [docs/capture-save-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/capture-save-flow.md)
- [src/shared/lib/pageScanHistory.ts](/Users/zech/Downloads/The-Big-One/Metis/src/shared/lib/pageScanHistory.ts)

Metis keeps:

- same-page history by normalized page key
- the latest captured page for cross-page comparison

## Pricing reference layer

- [docs/pricing-reference-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/pricing-reference-flow.md)
- [src/config/pricing.ts](/Users/zech/Downloads/The-Big-One/Metis/src/config/pricing.ts)
- [src/features/pricing/index.ts](/Users/zech/Downloads/The-Big-One/Metis/src/features/pricing/index.ts)

This layer does not try to be a billing engine.

It exists to make estimates more believable by using:

- approved provider pricing assumptions
- normalized plan tiers
- provider-aware wording

## UI mapping

- [src/app/components/figures/liveAdapter.ts](/Users/zech/Downloads/The-Big-One/Metis/src/app/components/figures/liveAdapter.ts)
- [docs/design-system-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/design-system-flow.md)

The adapter is the translation layer between product logic and the visible UI.

It takes the current scan, score, stack, and refinement state and shapes them into the panel/report model.

## Runtime flow

- [docs/extension-runtime-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/extension-runtime-flow.md)

This explains how the extension mounts, when it scans, and how it behaves on route changes and live updates.

## Settings and export

- [docs/settings-export-flow.md](/Users/zech/Downloads/The-Big-One/Metis/docs/settings-export-flow.md)

This covers the new local settings surface, saved scan management, and the report-shaped export shell.
