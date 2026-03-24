# Normalization Flow

This document explains how Metis turns noisy browser resource data into a stable scoring input.

## Why Normalization Exists

Raw browser resource timing data is too noisy to score directly.

Different pages can include:

- cached requests with zero transfer size
- tiny assets that do not matter to cost risk
- duplicate URLs with query strings or tracking noise
- mixed initiator types that are not useful in raw form

Metis normalizes this data before detection and scoring so the score stays explainable.

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
4. Parse each resource URL.
5. Normalize URLs to `origin + pathname`.
6. Classify each resource into a stable category.
7. Mark whether the resource is third-party.
8. Mark whether an image is meaningful enough to count toward page-weight issues.
9. Aggregate the cleaned resources into metrics.
10. Build the final `RawScanSnapshot`.

## Current Normalized Metrics

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

## Current Rule

Detection and scoring should read only normalized metrics and issue metadata.

They should not re-interpret raw Performance API entries on their own.
