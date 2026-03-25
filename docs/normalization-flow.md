# Normalization Flow

This document explains the cleanup step between “the browser saw a lot of requests” and “Metis can explain what that means.”

If scan collection is the raw intake, normalization is the part that makes the rest of the product trustworthy.

## Why It Exists

Browser timing data is useful, but not in its raw form.

Real pages include a lot of noise:

- cached requests with zero transfer size
- tiny assets that do not matter to cost risk
- duplicate URLs with query strings or tracking noise
- mixed initiator types that are not useful in raw form

Metis cleans that up first so the score can stay stable and the explanations can stay human.

## Source Files

- `src/features/scan/performance.ts`
- `src/features/scan/url.ts`
- `src/features/scan/dom.ts`
- `src/features/scan/index.ts`
- `src/shared/types/audit.ts`

## Flow

1. Read browser resource entries from `performance.getEntriesByType("resource")`.
2. Drop zero-transfer entries.
3. Drop tiny resources below the minimum byte threshold.
4. Skip malformed or missing URLs before counting.
5. Parse each resource URL.
6. Normalize URLs to `origin + pathname`.
7. Classify each resource into a stable category.
8. Mark whether the resource is third-party.
9. Mark whether an image is meaningful enough to count toward page-weight issues.
10. Aggregate the cleaned resources into metrics.
11. Build the final `RawScanSnapshot`.
12. Feed the snapshot into detection, scoring, and deterministic insights.

## What That Produces

After normalization, Metis has a much calmer view of the page.

It knows:

- `requestCount`
- `uniqueRequestCount`
- `duplicateRequestCount`
- `duplicateEndpointCount`
- `scriptRequestCount`
- `imageRequestCount`
- `apiRequestCount`
- `thirdPartyRequestCount`
- `thirdPartyDomainCount`
- `totalEncodedBodySize`
- `meaningfulImageCount`
- `meaningfulImageBytes`
- `largeAssetCount`
- `topOffenders`
- `topMeaningfulImages`

These are the numbers the rest of the app should trust.

## Rule

Detection, scoring, and insights should read only normalized metrics, issue metadata,
and score output.

They should not re-interpret raw Performance API entries on their own.
